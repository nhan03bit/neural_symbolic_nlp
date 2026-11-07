/**
 * Neural-symbolic trainer: cross-entropy plus semantic loss, run separately from the baseline.
 *
 * train-transformer/train.ts stays the CE-only baseline, with its own route, page and weight
 * files. This trainer shares its corpus, tokeniser, model code, Adam and hyperparameters, so any
 * difference between the two models comes from the loss. At λ = 0 it reproduces the baseline's
 * weights, which is what makes it a valid CE-only control at the seeds the baseline does not offer.
 *
 * It only applies the semantic loss at corpus positions, where the KB fires rarely and the target
 * is allowed. A small or null effect is a possible outcome, and it should be reported as one.
 */
import type { EpochResult, InitResult, TransformerTrainResult } from "../train-transformer/train.js";
import type { TransformerConfig } from "../train-transformer/transformer.js";
import type { SemMask } from "./semantic-loss.js";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { buildSync } from "esbuild";
import { resetRand } from "../train-transformer/matrix.js";
import {
  baselineWeightsFilename,
  buildVocabulary,
  corpusHash,
  MODEL_VERSION,
  serializeModel,
  TRAIN_TEXTS,
  tryLoadWeights,
} from "../train-transformer/train.js";
import {
  adamUpdate,
  countParams,
  crossEntropyLoss,
  forward,
  generateText,
  initAdam,
  initWeights,
  zeroGrads,
} from "../train-transformer/transformer.js";
import {
  computeLayout,
  copyWeightsFromSab,
  createWeightViews,
  packWeightsToSab,
  sumGradsFromWorkers,
} from "../train-transformer/weigth-layout.js";
import type { LiftedCandidate } from "./lift.js";
import { LIFT_MIN_P, makeLifter } from "./lift.js";
import { semanticLoss } from "./semantic-loss.js";
import {
  allowed,
  buildTokenIndex,
  KnowledgeBase,
  NOT_ENFORCED,
  RULES,
  SURFACE,
  TRIGGERS,
  TRIPLES,
} from "./symbolic.js";

export type NeuralSymbolicOpts = {
  epochs: number;
  temperature: number;
  topP: number;
  numLayers: number;
  maxTokens: number;
  lambdaS: number;
  seed: number;
  /** Stops training at the next epoch, for example when the client disconnects. */
  signal?: AbortSignal;
};

export type NeuralSymbolicMeta = {
  lambdaS: number;
  seed: number;
  kbHash: string;
  constrainedPositions: number;
  totalPositions: number;
  corpusConflicts: string[];
};

/** A trigger pattern seen in the corpus, and the KB rules it applies. These never change during a run. */
export type TriggerPattern = {
  /** The frame with its role filled in, such as "claimant is the person who". */
  pattern: string;
  template: string;
  role: string;
  /** Windows that contain this pattern. */
  positions: number;
  rules: { rule: string; fact: string; word: string; mode: "ban" | "support" }[];
  /** Facts the pattern reached that NOT_ENFORCED keeps out of the mask. */
  heldBack: string[];
};

export type NeuralSymbolicInit = InitResult & NeuralSymbolicMeta & {
  epochs: number;
  triggers: TriggerPattern[];
  /** The same model without the rule, so a rise in semantic loss can be read against it. */
  control: { semLoss: number[] } | null;
};

/** What each trigger pattern did at one epoch, in the same order as `init.triggers`. */
export type TriggerEpochStat = { semLoss: number; bannedMass: number };

/** A blocked word the network still favoured at a trigger pattern, with its mean probability there. */
export type Violation = { pattern: string; role: string; rule: string; word: string; p: number };

/** `loss` is cross-entropy only, so it can be read directly against the baseline's loss. */
export type NeuralSymbolicEpoch = EpochResult & {
  semLoss: number;
  /** Probability of a blocked word, averaged over every constrained position. */
  bannedMass: number;
  violated: Violation[];
  triggerStats: TriggerEpochStat[];
  /** Read from the weights this epoch's losses came from. Reported only, never added to the KB. */
  lifted: LiftedCandidate[];
};
export type NeuralSymbolicDone = TransformerTrainResult & {
  finalSemLoss: number;
  weightsFile: string;
  baselineFile: string;
  lambdaS: number;
  seed: number;
};

type WorkerResult = { loss: number; groupSem: Float64Array; groupMass: Float64Array; groupRuleMass: Float64Array[] };

const roundLoss = (v: number) => Math.round(v * 1000000) / 1000000;
// Semantic loss is averaged over mostly unconstrained windows, so it needs more digits.
const roundSem = (v: number) => Math.round(v * 1e10) / 1e10;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Raise this when the saved per-epoch history changes shape, so old files are not replayed. */
const HISTORY_FORMAT = "n3";

/** Same architecture as the baseline trainer, so the two models can be compared. */
export function neuralSymbolicConfig(vocabSize: number, numLayers: number): TransformerConfig {
  return { vocabSize, contextLen: 32, embDim: 32, numHeads: 2, ffDim: 128, numLayers };
}

/** Changes whenever the knowledge the loss was trained against changes. */
export function kbHash(): string {
  const knowledge = { TRIPLES, RULES, TRIGGERS, SURFACE, NOT_ENFORCED: [...NOT_ENFORCED] };
  return createHash("sha256").update(JSON.stringify(knowledge)).digest("hex").slice(0, 8);
}

/** λ, seed and KB hash are all in the name, so one arm is never reloaded for another. */
export function neuralSymbolicWeightsFilename(
  epochs: number,
  cfg: TransformerConfig,
  lambdaS: number,
  seed: number,
): string {
  return `neural-symbolic-weights-e${epochs}-l${cfg.numLayers}-d${cfg.embDim}-h${cfg.numHeads}-ff${cfg.ffDim}-ctx${cfg.contextLen}-c${corpusHash()}-k${kbHash()}-ls${lambdaS}-s${seed}-${HISTORY_FORMAT}-${MODEL_VERSION}.json`;
}

const banRules = (trigger: TriggerPattern) => trigger.rules.filter((rule) => rule.mode === "ban");

/**
 * Softmax leaves every blocked word some probability, so a rule counts as violated once its word's
 * mean p at the pattern reaches the cut-off lifting uses. `ruleMass[g][r]` is the total p of ban rule
 * r of trigger g over that trigger's positions.
 */
export function findViolations(triggers: TriggerPattern[], ruleMass: ArrayLike<number>[], minP = LIFT_MIN_P): Violation[] {
  return triggers
    .flatMap((trigger, g) =>
      banRules(trigger).map(({ rule, word }, r) => ({
        pattern: trigger.pattern,
        role: trigger.role,
        rule,
        word,
        p: ruleMass[g][r] / trigger.positions,
      })))
    .filter((violation) => violation.p >= minP)
    .map((violation) => ({ ...violation, p: roundLoss(violation.p) }))
    .sort((a, b) => b.p - a.p);
}

/** One banned-token list per window position, or null where the KB has nothing to say. */
export function buildSemMasks(
  sequences: { input: number[]; target: number[] }[],
  indexToWord: string[],
) {
  const kb = new KnowledgeBase(TRIPLES, RULES);
  const tokenIndex = buildTokenIndex(indexToWord);
  let constrainedPositions = 0;
  let totalPositions = 0;
  const corpusConflicts: string[] = [];
  const triggers: TriggerPattern[] = [];
  const groupOf = new Map<string, number>();
  const semGroups: (number | null)[][] = [];

  const semMasks: SemMask[] = sequences.map((seq) => {
    const groups: (number | null)[] = [];
    semGroups.push(groups);
    return seq.input.map((_, t) => {
      totalPositions++;
      const ctx = seq.input.slice(0, t + 1);
      const { banned, matches, heldBack } = allowed(kb, ctx, indexToWord, tokenIndex);
      if (banned.length === 0) {
        groups.push(null);
        return null;
      }

      constrainedPositions++;
      const first = matches.find((m) => m.mode === "ban")!;
      let group = groupOf.get(first.pattern);
      if (group === undefined) {
        group = triggers.length;
        groupOf.set(first.pattern, group);
        triggers.push({
          pattern: first.pattern,
          template: first.template,
          role: first.role,
          positions: 0,
          rules: matches.map(({ rule, fact, word, mode }) => ({ rule, fact, word, mode })),
          heldBack,
        });
      }
      triggers[group].positions++;
      groups.push(group);

      if (banned.includes(seq.target[t])) {
        const tail = ctx.slice(-6).map((i) => indexToWord[i]).join("");
        corpusConflicts.push(`${tail} → ${indexToWord[seq.target[t]]}`);
      }
      return banned;
    });
  });

  // Each trigger's ban rules as token ids, so a worker can total the probability of each rule's word.
  const ruleTokens = triggers.map((trigger) =>
    banRules(trigger).map(({ word }) => word.split("/").flatMap((form) => tokenIndex.get(form) ?? [])));

  return { semMasks, semGroups, ruleTokens, triggers, constrainedPositions, totalPositions, corpusConflicts };
}

/**
 * The saved λ = 0 file covering the most epochs, final or checkpoint. The epoch count only sets
 * where training stops, so a run of any length is a valid control for the epochs it covers.
 */
export function findControlFile(files: string[], cfg: TransformerConfig, seed: number): string | null {
  const settings = neuralSymbolicWeightsFilename(0, cfg, 0, seed).replace(/^neural-symbolic-weights-e0-|\.json$/g, "");
  let best: { file: string; covered: number } | null = null;
  for (const file of files) {
    const match = /^neural-symbolic-weights-e(\d+)-(.+?)(?:-at(\d+))?\.json$/.exec(file);
    if (match?.[2] !== settings) continue;
    const covered = Number(match[3] ?? match[1]);
    if (!best || covered > best.covered) best = { file, covered };
  }
  return best?.file ?? null;
}

/** The control's semantic loss, or null if this run is λ = 0 or no matching run has been saved. */
async function readControl(dataDir: string, cfg: TransformerConfig, seed: number, lambdaS: number): Promise<NeuralSymbolicInit["control"]> {
  if (lambdaS === 0) return null;
  try {
    const file = findControlFile(await readdir(dataDir), cfg, seed);
    if (!file) return null;
    const { history } = JSON.parse(await readFile(join(dataDir, file), "utf-8")) as { history: { semLoss: number }[] };
    return { semLoss: history.map((entry) => entry.semLoss) };
  } catch {
    return null;
  }
}

function buildWorkerBundle(): string {
  // From the project root, for the same reason as the baseline: once bundled, this module has no
  // .ts source beside it.
  const workerDir = join(process.cwd(), "src/routes/neural-symbolic");
  const outfile = join(workerDir, ".train-worker.mjs");
  buildSync({
    entryPoints: [join(workerDir, "train-worker.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    write: true,
  });
  return outfile;
}

export async function* trainNeuralSymbolic(
  opts: NeuralSymbolicOpts,
): AsyncGenerator<NeuralSymbolicInit | NeuralSymbolicEpoch | NeuralSymbolicDone> {
  const { epochs, temperature, topP, numLayers, maxTokens, lambdaS, seed } = opts;
  resetRand(seed);

  const { bpeMerges, tokenize, indexToWord, wordToIndex } = buildVocabulary();
  const vocabSize = indexToWord.length;
  const cfg = neuralSymbolicConfig(vocabSize, numLayers);

  const allTokenIds: number[] = [];
  for (const sentence of TRAIN_TEXTS) {
    for (const tok of tokenize(sentence)) {
      const idx = wordToIndex.get(tok);
      if (idx !== undefined) allTokenIds.push(idx);
    }
  }

  const seedIds = allTokenIds.slice(0, 3);
  const seqLen = Math.min(cfg.contextLen, 16);
  const sequences: { input: number[]; target: number[] }[] = [];
  for (let i = 0; i <= allTokenIds.length - seqLen - 1; i++) {
    sequences.push({
      input: allTokenIds.slice(i, i + seqLen),
      target: allTokenIds.slice(i + 1, i + seqLen + 1),
    });
  }

  const { semMasks, semGroups, ruleTokens, triggers, constrainedPositions, totalPositions, corpusConflicts } = buildSemMasks(sequences, indexToWord);
  // A KB that never fires would train identically to the baseline and look like a null result.
  if (constrainedPositions === 0) throw new Error("The KB fires at no training position, so there is nothing to compare.");

  const meta: NeuralSymbolicMeta = {
    lambdaS,
    seed,
    kbHash: kbHash(),
    constrainedPositions,
    totalPositions,
    corpusConflicts,
  };

  const kb = new KnowledgeBase(TRIPLES, RULES);
  const encode = (text: string) => tokenize(text).flatMap((tok) => wordToIndex.get(tok) ?? []);
  const lift = makeLifter(kb, cfg, indexToWord, encode, seqLen);

  const weightsFile = neuralSymbolicWeightsFilename(epochs, cfg, lambdaS, seed);
  const dataDir = join(process.cwd(), ".data");
  const weightsPath = join(dataDir, weightsFile);
  const checkpointPath = (epoch: number) => join(dataDir, weightsFile.replace(/\.json$/, `-at${epoch}.json`));
  const baselineFile = baselineWeightsFilename(epochs, cfg);
  const control = await readControl(dataDir, cfg, seed, lambdaS);

  const initEvent = (totalParams: number): NeuralSymbolicInit => ({
    vocabSize,
    contextLen: cfg.contextLen,
    embeddingDim: cfg.embDim,
    numHeads: cfg.numHeads,
    ffDim: cfg.ffDim,
    numLayers: cfg.numLayers,
    totalParams,
    temperature,
    topP,
    corpusSentences: TRAIN_TEXTS.length,
    trainingSequences: sequences.length,
    ...meta,
    epochs,
    triggers,
    control,
  });

  const measure = (w: ReturnType<typeof initWeights>) => {
    let ce = 0;
    let sem = 0;
    sequences.forEach((seq, k) => {
      const { probs } = forward(seq.input, w, cfg);
      ce += crossEntropyLoss(probs, seq.target, seqLen, vocabSize);
      sem += semanticLoss(probs, semMasks[k], seqLen, vocabSize);
    });
    return { finalLoss: roundLoss(ce / sequences.length), finalSemLoss: roundSem(sem / sequences.length) };
  };

  const doneEvent = (architecture: string, w: ReturnType<typeof initWeights>, samples: { epoch: number; text: string }[]): NeuralSymbolicDone => ({
    architecture,
    ...measure(w),
    samples,
    weightsFile,
    baselineFile,
    lambdaS,
    seed,
  });

  const describe = `Neural-Symbolic Transformer (${cfg.numLayers} layers, ${cfg.embDim}d, ${cfg.numHeads}h, ${cfg.ffDim}ff, λ=${lambdaS}, seed ${seed})`;

  const cached = await tryLoadWeights(weightsPath);
  if (cached) {
    yield initEvent(countParams(cached.weights));

    // Saved samples used the settings of the original run. Only the final weights are loaded here,
    // so the last sample follows this request and the earlier ones stay as they were.
    const lastEpoch = cached.history.at(-1)?.epoch;
    const samples: { epoch: number; text: string }[] = [];
    for (const saved of cached.history as NeuralSymbolicEpoch[]) {
      const sample = saved.epoch === lastEpoch
        ? generateText(cached.weights, cfg, seedIds, maxTokens, indexToWord, temperature, topP, seqLen)
        : saved.sample;
      if (sample !== undefined) samples.push({ epoch: saved.epoch, text: sample });
      yield { ...saved, sample };
    }

    yield doneEvent(`${describe} — cached`, cached.weights, samples);
    return;
  }

  const w = initWeights(cfg);
  const adamBuf = initAdam(w);
  yield initEvent(countParams(w));

  const lr = 0.001;
  const serializedMerges = bpeMerges.map((m) => ({ pair: m.pair, merged: m.merged }));
  const collectedSamples: { epoch: number; text: string }[] = [];
  const history: NeuralSymbolicEpoch[] = [];
  const saveAs = (path: string, saved: EpochResult[]) =>
    writeFile(
      path,
      // Not indented: per-epoch history makes these files far larger than a baseline's.
      `${JSON.stringify({ ...serializeModel(w, cfg, indexToWord, serializedMerges, saved), neuralSymbolic: meta })}\n`,
    );
  // Nothing replays a checkpoint's history, and it would grow with every epoch reported.
  const checkpointHistory = () =>
    history.map(({ epoch, loss, semLoss, sample }) => ({ epoch, loss, semLoss, sample }));

  const { layout, totalFloats } = computeLayout(cfg);
  const weightSab = packWeightsToSab(w, layout, totalFloats);
  const workerPath = buildWorkerBundle();

  // The same split as the baseline: float addition depends on order, so this keeps λ = 0 identical.
  const numWorkers = Math.max(1, cpus().length - 2);
  const seqsPerWorker = Math.ceil(sequences.length / numWorkers);
  const workerGradSabs: SharedArrayBuffer[] = [];
  const workers: Worker[] = [];

  try {
    for (let i = 0; i < numWorkers; i++) {
      const from = i * seqsPerWorker;
      const to = (i + 1) * seqsPerWorker;
      const gradSab = new SharedArrayBuffer(totalFloats * 4);
      workerGradSabs.push(gradSab);
      workers.push(
        new Worker(workerPath, {
          workerData: {
            weightSab,
            gradSab,
            layout,
            cfg,
            sequences: sequences.slice(from, to),
            seqLen,
            semMasks: semMasks.slice(from, to),
            semGroups: semGroups.slice(from, to),
            ruleTokens,
            lambdaS,
          },
        }),
      );
    }

    // A crashed worker would otherwise leave the epoch waiting forever.
    const crashed = new Promise<never>((_, reject) => {
      for (const worker of workers) worker.once("error", reject);
    });
    crashed.catch(() => {});

    await Promise.race([
      crashed,
      Promise.all(
        workers.map(
          (worker) =>
            new Promise<void>((resolve) => {
              worker.once("message", (msg: { type: string }) => {
                if (msg.type === "ready") resolve();
              });
            }),
        ),
      ),
    ]);

    const grads = zeroGrads(cfg);
    const wShared = createWeightViews(weightSab, layout, cfg.numLayers);

    for (let epoch = 0; epoch <= epochs; epoch++) {
      if (opts.signal?.aborted) return;

      const results = await Promise.race([
        crashed,
        Promise.all(
          workers.map(
            (worker) =>
              new Promise<WorkerResult>((resolve) => {
                worker.once("message", (msg: WorkerResult & { type: string }) => {
                  if (msg.type === "done") resolve(msg);
                });
                worker.postMessage({ type: "compute" });
              }),
          ),
        ),
      ]);

      let totalLoss = 0;
      const groupSem = new Float64Array(triggers.length);
      const groupMass = new Float64Array(triggers.length);
      const groupRuleMass = ruleTokens.map((rules) => new Float64Array(rules.length));
      for (const r of results) {
        totalLoss += r.loss;
        for (let g = 0; g < triggers.length; g++) {
          groupSem[g] += r.groupSem[g];
          groupMass[g] += r.groupMass[g];
          groupRuleMass[g].forEach((_, i) => {
            groupRuleMass[g][i] += r.groupRuleMass[g][i];
          });
        }
      }

      // Before the update, so this reads the same weights the epoch's losses came from. Forward
      // uses no random numbers, so this can't change training or the samples.
      const lifted = lift(wShared);

      sumGradsFromWorkers(grads, workerGradSabs, layout);
      adamUpdate(wShared, grads, adamBuf, lr, epoch + 1);

      let sample: string | undefined;
      if (epoch % 10 === 0 || epoch === epochs) {
        copyWeightsFromSab(weightSab, layout, w);
        sample = generateText(w, cfg, seedIds, maxTokens, indexToWord, temperature, topP, seqLen);
        collectedSamples.push({ epoch, text: sample });
      }

      const entry: NeuralSymbolicEpoch = {
        epoch,
        loss: roundLoss(totalLoss / sequences.length),
        semLoss: roundSem(groupSem.reduce((a, v) => a + v, 0) / sequences.length),
        bannedMass: roundSem(groupMass.reduce((a, v) => a + v, 0) / constrainedPositions),
        violated: findViolations(triggers, groupRuleMass),
        triggerStats: triggers.map((trigger, g) => ({
          semLoss: roundSem(groupSem[g] / sequences.length),
          bannedMass: roundSem(groupMass[g] / trigger.positions),
        })),
        lifted,
        sample,
      };
      history.push(entry);
      yield entry;
      await tick();

      if (epoch > 0 && epoch % 100 === 0) {
        copyWeightsFromSab(weightSab, layout, w);
        await saveAs(checkpointPath(epoch), checkpointHistory());
      }
    }
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()));
  }

  copyWeightsFromSab(weightSab, layout, w);
  await saveAs(weightsPath, history);
  yield doneEvent(describe, w, collectedSamples);
}
