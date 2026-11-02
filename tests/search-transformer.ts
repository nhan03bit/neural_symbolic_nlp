/**
 * Search for the transformer config that best predicts civil-law stories it has not seen.
 *
 *   bun tests/search-transformer.ts round A    (then B, C, D; each builds on the last)
 *   bun tests/search-transformer.ts summary
 *
 * Refuses to start until the verification gates pass. Results are appended to
 * reports/transformer-search.jsonl, and a finished run is never repeated, so an interrupted
 * round continues when started again.
 *
 * Rounds A-C choose on a fixed set of dev stories. Round D is the score to report: 4-fold over
 * the stories, where each test fold plays no part in training or in choosing the stopping step.
 *
 * Known limits: BPE and the vocabulary are fitted on the whole corpus, as in the training route,
 * so the vocabulary has seen test words (the bigram baseline shares the same vocabulary, so the
 * comparison stays fair). unseenShare reports how many scored tokens this affects: those tokens
 * have ids but untrained embeddings. Stories used for choosing in rounds A-C also appear in round D's folds.
 */
import type {
  TransformerConfig,
  TransformerWeights,
} from "../src/routes/train-transformer/transformer.js";
import { spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import {
  CIVIL_LAW_DEFINITIONS,
  STORIES,
} from "../src/routes/train-embed/corpus.js";
import { resetRand } from "../src/routes/train-transformer/matrix.js";
import { buildVocabulary } from "../src/routes/train-transformer/train.js";
import {
  adamUpdate,
  backward,
  countParams,
  crossEntropyLoss,
  forward,
  initAdam,
  initWeights,
  zeroGrads,
} from "../src/routes/train-transformer/transformer.js";
import { mulberry32 } from "../src/server/lib/rng.js";

const RESULTS_PATH = "reports/transformer-search.jsonl";
const SEQ_LEN = 16;
const BATCH_SIZE = 32;
const EVAL_EVERY = 100;
const PATIENCE_EVALS = 6;
const MAX_WORKERS = 8;
const DEFAULT_MAX_STEPS = Number(process.env.SEARCH_MAX_STEPS ?? 8000);
const STEP_LIMIT_CEILING = DEFAULT_MAX_STEPS * 2;

type Arch = { layers: number; dim: number; heads: number; ff: number };
type Job = Arch & {
  round: string;
  lr: number;
  weightDecay: number;
  merges: number;
  seed: number;
  /** -1 selects the fixed dev split used by rounds A-C; 0-3 select a round D test fold. */
  fold: number;
  maxSteps: number;
};
type Score = { natsPerToken: number; natsPerChar: number };
type Baseline = { unigram: Score; bigram: Score; lambda: number };
type Row = Job & {
  params: number;
  steps: number;
  bestStep: number;
  hitLimit: boolean;
  seconds: number;
  trainLoss: number;
  dev: Score;
  test: Score | null;
  devBaseline: Baseline;
  testBaseline: Baseline | null;
  lnV: number;
  /** Share of scored dev and test tokens that never occur in training (see "Known limits"). */
  unseenShare: number;
};

// ─── Data ────────────────────────────────────────────────────────────────────

function splitStories(fold: number) {
  const train: number[] = [];
  const dev: number[] = [];
  const test: number[] = [];
  STORIES.forEach((_, i) => {
    if (fold < 0) {
      (i % 8 === 3 ? dev : train).push(i);
    } else if (i % 4 === fold) {
      test.push(i);
    } else {
      // Every fourth remaining story chooses the stopping step.
      const position = train.length + dev.length;
      (position % 4 === 3 ? dev : train).push(i);
    }
  });
  return { train, dev, test };
}

function loadData(merges: number, fold: number) {
  const { tokenize, indexToWord, wordToIndex } = buildVocabulary(merges);
  const encode = (text: string) =>
    tokenize(text).flatMap((tok) => {
      const id = wordToIndex.get(tok);
      return id === undefined ? [] : [id];
    });

  const split = splitStories(fold);
  const trainIds = CIVIL_LAW_DEFINITIONS.flatMap((d) => encode(`${d}.`));
  for (const i of split.train) trainIds.push(...encode(STORIES[i]));

  return {
    vocab: indexToWord,
    trainIds,
    dev: split.dev.map((i) => encode(STORIES[i])),
    test: split.test.map((i) => encode(STORIES[i])),
  };
}

/** Share of scored tokens (all but each story's first) that never occur in training. */
function unseenShare(trainIds: number[], stories: number[][]): number {
  const seen = new Set(trainIds);
  const scored = stories.flatMap((ids) => ids.slice(1));
  return scored.filter((id) => !seen.has(id)).length / scored.length;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Score every token after a story's first exactly once. Windows overlap by half, and after the
 * first window only the second half is scored, so each prediction has at least SEQ_LEN / 2
 * tokens of context where the story allows it.
 */
function scoreModel(
  stories: number[][],
  w: TransformerWeights,
  cfg: TransformerConfig,
  vocab: string[],
): Score {
  const half = SEQ_LEN / 2;
  let nats = 0;
  let tokens = 0;
  let chars = 0;
  for (const ids of stories) {
    for (let start = 0; start < ids.length - 1; start += half) {
      const end = Math.min(start + SEQ_LEN, ids.length - 1);
      const input = ids.slice(start, end);
      const { probs } = forward(input, w, cfg);
      for (let pos = start === 0 ? 0 : half; pos < input.length; pos++) {
        const target = ids[start + pos + 1];
        nats -= Math.log(probs[pos * cfg.vocabSize + target] + 1e-10);
        tokens++;
        chars += vocab[target].length;
      }
      if (end === ids.length - 1) break;
    }
  }
  return { natsPerToken: nats / tokens, natsPerChar: nats / chars };
}

function countBigrams(ids: number[], vocabSize: number) {
  const unigram = new Float64Array(vocabSize);
  const bigram = new Map<number, Map<number, number>>();
  ids.forEach((id, i) => {
    unigram[id]++;
    if (i === 0) return;
    let row = bigram.get(ids[i - 1]);
    if (!row) bigram.set(ids[i - 1], (row = new Map()));
    row.set(id, (row.get(id) ?? 0) + 1);
  });
  return { unigram, bigram, total: ids.length };
}

/** Smoothed unigram and bigram/unigram mix, scored on exactly the tokens scoreModel scores. */
function scoreBaseline(
  counts: ReturnType<typeof countBigrams>,
  stories: number[][],
  vocab: string[],
  lambda: number,
): { unigram: Score; bigram: Score } {
  const V = vocab.length;
  const pUnigram = (id: number) =>
    (counts.unigram[id] + 0.1) / (counts.total + 0.1 * V);
  let uni = 0;
  let bi = 0;
  let tokens = 0;
  let chars = 0;
  for (const ids of stories) {
    for (let i = 1; i < ids.length; i++) {
      const row = counts.bigram.get(ids[i - 1]);
      let rowTotal = 0;
      if (row) for (const c of row.values()) rowTotal += c;
      const pBigram = rowTotal > 0 ? (row?.get(ids[i]) ?? 0) / rowTotal : 0;
      uni -= Math.log(pUnigram(ids[i]));
      bi -= Math.log(lambda * pBigram + (1 - lambda) * pUnigram(ids[i]));
      tokens++;
      chars += vocab[ids[i]].length;
    }
  }
  return {
    unigram: { natsPerToken: uni / tokens, natsPerChar: uni / chars },
    bigram: { natsPerToken: bi / tokens, natsPerChar: bi / chars },
  };
}

/**
 * Baselines trained on the same tokens as the model. The mixing weight is fitted on the last
 * tenth of the training tokens, never on the stories being scored, so it cannot flatter the
 * baseline or be flattered by it.
 */
function baselines(
  trainIds: number[],
  stories: number[][],
  vocab: string[],
): Baseline {
  const cut = Math.floor(trainIds.length * 0.9);
  const fitCounts = countBigrams(trainIds.slice(0, cut), vocab.length);
  const fitStories = [trainIds.slice(cut)];
  let lambda = 0;
  let best = Infinity;
  for (const candidate of [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95]) {
    const { bigram } = scoreBaseline(fitCounts, fitStories, vocab, candidate);
    if (bigram.natsPerToken < best) {
      best = bigram.natsPerToken;
      lambda = candidate;
    }
  }
  const scored = scoreBaseline(
    countBigrams(trainIds, vocab.length),
    stories,
    vocab,
    lambda,
  );
  return { ...scored, lambda };
}

// ─── One training run ────────────────────────────────────────────────────────

/** Decoupled weight decay: shrink weight matrices after the Adam step. Biases and LayerNorm are left alone. */
function applyWeightDecay(w: TransformerWeights, amount: number) {
  if (amount === 0) return;
  const keep = 1 - amount;
  const matrices = [w.tokEmb, w.posEmb, w.headW];
  for (const b of w.blocks)
    matrices.push(b.wQ, b.wK, b.wV, b.wO, b.ff1W, b.ff2W);
  for (const m of matrices) for (let i = 0; i < m.length; i++) m[i] *= keep;
}

function runJob(job: Job): Row {
  const { vocab, trainIds, dev, test } = loadData(job.merges, job.fold);
  const cfg: TransformerConfig = {
    vocabSize: vocab.length,
    contextLen: SEQ_LEN,
    embDim: job.dim,
    numHeads: job.heads,
    ffDim: job.ff,
    numLayers: job.layers,
  };

  resetRand(job.seed);
  const w = initWeights(cfg);
  const adam = initAdam(w);
  const pick = mulberry32(job.seed + 1000);
  const lastStart = trainIds.length - SEQ_LEN - 1;

  const trainLoss = () => {
    let total = 0;
    for (let k = 0; k < 60; k++) {
      const start = Math.floor((k * lastStart) / 60);
      const { probs } = forward(trainIds.slice(start, start + SEQ_LEN), w, cfg);
      total += crossEntropyLoss(
        probs,
        trainIds.slice(start + 1, start + SEQ_LEN + 1),
        SEQ_LEN,
        cfg.vocabSize,
      );
    }
    return total / 60;
  };

  const startedAt = Date.now();
  let best: {
    dev: Score;
    test: Score | null;
    step: number;
    train: number;
  } | null = null;
  let step = 0;
  let stoppedEarly = false;

  while (step < job.maxSteps) {
    const grads = zeroGrads(cfg);
    for (let b = 0; b < BATCH_SIZE; b++) {
      const start = Math.floor(pick() * (lastStart + 1));
      const input = trainIds.slice(start, start + SEQ_LEN);
      const target = trainIds.slice(start + 1, start + SEQ_LEN + 1);
      backward(forward(input, w, cfg), target, w, cfg, grads);
    }
    step++;
    adamUpdate(w, grads, adam, job.lr, step);
    applyWeightDecay(w, job.lr * job.weightDecay);

    if (step % EVAL_EVERY === 0) {
      const devScore = scoreModel(dev, w, cfg, vocab);
      if (!best || devScore.natsPerChar < best.dev.natsPerChar) {
        best = {
          dev: devScore,
          // Read only at the step dev chose, so the test fold cannot influence stopping.
          test: test.length > 0 ? scoreModel(test, w, cfg, vocab) : null,
          step,
          train: trainLoss(),
        };
      } else if (step - best.step >= PATIENCE_EVALS * EVAL_EVERY) {
        stoppedEarly = true;
        break;
      }
    }
  }

  if (!best)
    throw new Error(
      `no evaluation ran: maxSteps ${job.maxSteps} < ${EVAL_EVERY}`,
    );

  return {
    ...job,
    params: countParams(w),
    steps: step,
    bestStep: best.step,
    hitLimit: !stoppedEarly,
    seconds: Math.round((Date.now() - startedAt) / 1000),
    trainLoss: best.train,
    dev: best.dev,
    test: best.test,
    devBaseline: baselines(trainIds, dev, vocab),
    testBaseline: test.length > 0 ? baselines(trainIds, test, vocab) : null,
    lnV: Math.log(vocab.length),
    unseenShare: unseenShare(trainIds, [...dev, ...test]),
  };
}

// ─── Results ─────────────────────────────────────────────────────────────────

const configKey = (j: Job) =>
  `l${j.layers} d${j.dim} h${j.heads} ff${j.ff} lr${j.lr} wd${j.weightDecay} m${j.merges}`;
const runKey = (j: Job) => `${j.round} ${configKey(j)} s${j.seed} f${j.fold}`;

/** All finished runs. A run repeated with a higher step limit replaces the earlier row. */
function loadRows(): Row[] {
  if (!existsSync(RESULTS_PATH)) return [];
  const latest = new Map<string, Row>();
  for (const line of readFileSync(RESULTS_PATH, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Row;
    const previous = latest.get(runKey(row));
    if (!previous || row.maxSteps > previous.maxSteps)
      latest.set(runKey(row), row);
  }
  return [...latest.values()];
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const spread = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};

/** Configs of one round, best first by mean dev nats per character. */
function ranked(round: string) {
  const groups = new Map<string, Row[]>();
  for (const row of loadRows().filter((r) => r.round === round)) {
    const key = configKey(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()]
    .map(([key, rows]) => ({
      key,
      rows,
      dev: mean(rows.map((r) => r.dev.natsPerChar)),
    }))
    .sort((a, b) => a.dev - b.dev);
}

function top(round: string, count: number): Row[] {
  const list = ranked(round);
  if (list.length === 0)
    throw new Error(`Round ${round} has no results; run it first.`);
  // Weight decay shrinks the weights by about 2% at most before early stopping, so configs that
  // differ only in decay score within noise. Keeping both would leave later rounds comparing a
  // model with itself, so only the best of each is kept.
  const distinct = new Map<string, Row>();
  for (const { rows } of list) {
    const key = configKey({ ...rows[0], weightDecay: 0 });
    if (!distinct.has(key)) distinct.set(key, rows[0]);
  }
  return [...distinct.values()].slice(0, count);
}

// ─── Rounds ──────────────────────────────────────────────────────────────────

function buildRound(round: string): Job[] {
  const base = {
    round,
    weightDecay: 0,
    merges: 2000,
    fold: -1,
    maxSteps: DEFAULT_MAX_STEPS,
  };
  const from = (r: Row) => ({
    layers: r.layers,
    dim: r.dim,
    heads: r.heads,
    ff: r.ff,
    lr: r.lr,
    weightDecay: r.weightDecay,
    merges: r.merges,
  });

  if (round === "A") {
    const archs: Arch[] = [
      { layers: 2, dim: 32, heads: 2, ff: 128 },
      { layers: 2, dim: 64, heads: 4, ff: 256 },
      { layers: 4, dim: 32, heads: 2, ff: 128 },
      { layers: 6, dim: 32, heads: 2, ff: 128 },
      { layers: 4, dim: 64, heads: 4, ff: 256 },
    ];
    return archs.flatMap((arch) =>
      [1e-4, 3e-4].flatMap((lr) =>
        [42, 1].map((seed) => ({ ...base, ...arch, lr, seed })),
      ),
    );
  }
  if (round === "B") {
    return top("A", 3).flatMap((r) =>
      [0, 0.01, 0.1].flatMap((weightDecay) =>
        [42, 1].map((seed) => ({ ...base, ...from(r), weightDecay, seed })),
      ),
    );
  }
  if (round === "C") {
    return top("B", 2).flatMap((r) =>
      [1000, 1500, 2000].flatMap((merges) =>
        [42, 1].map((seed) => ({ ...base, ...from(r), merges, seed })),
      ),
    );
  }
  if (round === "D") {
    return top("C", 2).flatMap((r) =>
      [0, 1, 2, 3].flatMap((fold) =>
        [42, 1, 2, 3].map((seed) => ({ ...base, ...from(r), fold, seed })),
      ),
    );
  }
  throw new Error(`Unknown round "${round}". Use A, B, C or D.`);
}

function runChild(job: Job): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [import.meta.path, "job", JSON.stringify(job)],
      {
        stdio: ["ignore", "pipe", "inherit"],
      },
    );
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Run failed (${runKey(job)}), exit code ${code}`));
        return;
      }
      appendFileSync(RESULTS_PATH, `${output.trim()}\n`);
      const row = JSON.parse(output) as Row;
      console.log(
        `${runKey(job)}: dev ${row.dev.natsPerToken.toFixed(3)} @${row.bestStep}, train ${row.trainLoss.toFixed(2)}, ${row.seconds}s${row.hitLimit ? ", HIT STEP LIMIT" : ""}`,
      );
      resolve();
    });
  });
}

async function runPool(jobs: Job[]) {
  const queue = [...jobs];
  const failures: string[] = [];
  await Promise.all(
    Array.from({ length: Math.min(MAX_WORKERS, queue.length) }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        // One failed run must not throw away the others still in progress.
        await runChild(job).catch((error: Error) =>
          failures.push(error.message),
        );
      }
    }),
  );
  if (failures.length > 0) throw new Error(failures.join("\n"));
}

async function runRound(round: string) {
  const gates = spawnSync("bun", ["test", "tests/train-transformer.test.ts"], {
    encoding: "utf-8",
  });
  if (gates.status !== 0) {
    console.error(
      "Verification gates are failing, so a search would measure broken code. Not starting.\nRun: bun test tests/train-transformer.test.ts",
    );
    process.exit(1);
  }

  mkdirSync("reports", { recursive: true });
  const jobs = buildRound(round);
  const finished = new Set(loadRows().map(runKey));
  const pending = jobs.filter((job) => !finished.has(runKey(job)));
  console.log(`Round ${round}: ${jobs.length} runs, ${pending.length} to do.`);
  await runPool(pending);

  // A run still improving at its limit has not been measured yet, so it is run again for longer.
  const unfinished = loadRows().filter(
    (r) =>
      r.round === round && r.hitLimit && r.maxSteps * 2 <= STEP_LIMIT_CEILING,
  );
  if (unfinished.length > 0) {
    console.log(`Repeating ${unfinished.length} runs that hit the step limit.`);
    await runPool(
      unfinished.map((r) => {
        const job: Job = {
          round: r.round,
          layers: r.layers,
          dim: r.dim,
          heads: r.heads,
          ff: r.ff,
          lr: r.lr,
          weightDecay: r.weightDecay,
          merges: r.merges,
          seed: r.seed,
          fold: r.fold,
          maxSteps: r.maxSteps * 2,
        };
        return job;
      }),
    );
  }
  printSummary();
}

function printSummary() {
  for (const round of ["A", "B", "C", "D"]) {
    const list = ranked(round);
    if (list.length === 0) continue;
    console.log(
      `\nRound ${round}, best first (nats per token unless marked; mean ± spread)`,
    );
    for (const { key, rows, dev } of list) {
      const devTok = rows.map((r) => r.dev.natsPerToken);
      const stuck = rows.filter((r) => r.hitLimit).length;
      console.log(
        `  ${key.padEnd(38)} dev ${mean(devTok).toFixed(3)} ± ${spread(devTok).toFixed(3)}  ` +
          `per char ${dev.toFixed(4)}  bigram ${mean(rows.map((r) => r.devBaseline.bigram.natsPerToken)).toFixed(3)}  ` +
          `train ${mean(rows.map((r) => r.trainLoss)).toFixed(2)}  ` +
          `step ${Math.round(mean(rows.map((r) => r.bestStep)))}  ` +
          `unseen ${(100 * rows[0].unseenShare).toFixed(1)}%  ` +
          `params ${rows[0].params}  n=${rows.length}${stuck > 0 ? `  ${stuck} HIT STEP LIMIT` : ""}`,
      );
      const tested = rows.filter((r) => r.test && r.testBaseline);
      if (tested.length > 0) {
        const gaps = tested.map(
          (r) =>
            (r.testBaseline as Baseline).bigram.natsPerChar -
            (r.test as Score).natsPerChar,
        );
        const testTok = tested.map((r) => (r.test as Score).natsPerToken);
        console.log(
          `    TEST ${mean(testTok).toFixed(3)} ± ${spread(testTok).toFixed(3)}, ` +
            `unigram ${mean(tested.map((r) => (r.testBaseline as Baseline).unigram.natsPerToken)).toFixed(3)}, ` +
            `bigram ${mean(tested.map((r) => (r.testBaseline as Baseline).bigram.natsPerToken)).toFixed(3)}, ` +
            `ln V ${tested[0].lnV.toFixed(3)}; ` +
            `lead over bigram per char ${mean(gaps).toFixed(4)} ± ${spread(gaps).toFixed(4)} ` +
            `(${mean(gaps) > spread(gaps) ? "clear win" : "no clear win"})`,
        );
      }
    }
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const [command, argument] = process.argv.slice(2);
if (command === "job") {
  console.log(JSON.stringify(runJob(JSON.parse(argument) as Job)));
} else if (command === "round" && argument) {
  await runRound(argument);
} else if (command === "summary") {
  printSummary();
} else {
  console.error(
    "Usage: bun tests/search-transformer.ts round <A|B|C|D> | summary",
  );
  process.exit(1);
}
