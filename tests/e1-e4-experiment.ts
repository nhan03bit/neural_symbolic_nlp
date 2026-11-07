/**
 * E1 (seed sensitivity) and E4 (semantic loss × mask), chapter 05 §2, on the runs that
 * tests/e1-e4-train.ts trains. Runs on whatever weights exist and lists the ones missing.
 *
 *   bun tests/e1-e4-experiment.ts
 *
 * Protocol, fixed before the runs finished:
 * - Models: the neural-symbolic trainer at 2000 epochs, 2 layers, λ_s ∈ {0, 2}, training seeds
 *   42, 1, 2, 3. λ_s = 0 is the CE-only model (it matches the baseline trainer at seed 42,
 *   which this script checks).
 * - E1 (P4), λ_s = 0: final cross-entropy per seed; for each seed pair the L2 distance and cosine
 *   of the flattened weights, and on the next-token distribution after each prompt: cosine of the
 *   centred logits (softmax ignores a shift), Jensen–Shannon divergence (bits) and top-1
 *   agreement. Held-out prompts are the 16 role/frame prompts not in the training text; there
 *   is no held-out text, so this is the only held-out set. The 8 trained prompts are reported too.
 * - E4, every (λ_s, seed):
 *   - Violations as in E2 (mask off as `bias` with λ = 0, mask on), 24 prompts × 50 sampling
 *     seeds × 20 tokens, at T 0.8 / top-p 0.9 and T 1 / top-p 1.
 *   - P5: mean banned mass P_B = 1 − P_A with no mask, at the training positions where a rule
 *     fires (as in training), and at the 24 prompt contexts against a frequency-matched token
 *     set of the same size, so a fall in banned mass can be told from a general fall.
 *   - P6, across seed pairs within each λ_s, at constrained training positions: mean JS of
 *     (P_A, 1 − P_A), mean JS of q_A (p renormalised over allowed tokens), mean H(q_A), and
 *     the weight cosine from E1.
 *   - P7: perplexity at training positions where no rule fires. This is fit on training text,
 *     not held-out perplexity, which needs a held-out split the trainer does not have.
 *   Not measured: violations of a held-out KB (none is written).
 *
 * Writes reports/e1-e4.json and prints the tables.
 */
import type { StepTrace } from "../src/routes/neural-symbolic/constraints.js";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeProcessor } from "../src/routes/neural-symbolic/constraints.js";
import { loadModel } from "../src/routes/neural-symbolic/model.js";
import {
  allowed,
  buildTokenIndex,
  FRAMES,
  KnowledgeBase,
  RULES,
  TRIPLES,
} from "../src/routes/neural-symbolic/symbolic.js";
import {
  buildSemMasks,
  neuralSymbolicConfig,
  neuralSymbolicWeightsFilename,
} from "../src/routes/neural-symbolic/train.js";
import { verify } from "../src/routes/neural-symbolic/verify.js";
import { resetRand } from "../src/routes/train-transformer/matrix.js";
import {
  baselineWeightsFilename,
  buildVocabulary,
  TRAIN_TEXTS,
} from "../src/routes/train-transformer/train.js";
import {
  forward,
  generateText,
} from "../src/routes/train-transformer/transformer.js";
import {
  computeLayout,
  packWeightsToSab,
} from "../src/routes/train-transformer/weigth-layout.js";

const EPOCHS = 2000;
const SEEDS = [42, 1, 2, 3];
const LAMBDAS = [0, 2];
const N = Number(process.env.N ?? 50);
const MAX_TOKENS = 20;
const SETTINGS = [
  { name: "T 0.8, top-p 0.9", temperature: 0.8, topP: 0.9 },
  { name: "T 1, top-p 1", temperature: 1, topP: 1 },
];
const DATA = join(process.cwd(), ".data");

type Model = NonNullable<Awaited<ReturnType<typeof loadModel>>>;
type Setting = (typeof SETTINGS)[number];
type Run = { lambdaS: number; seed: number; file: string; model: Model };

// ---------- corpus, KB and prompts, built exactly as training builds them ----------
const { tokenize, indexToWord, wordToIndex } = buildVocabulary();
const V = indexToWord.length;
const cfg = neuralSymbolicConfig(V, 2);
const seqLen = Math.min(cfg.contextLen, 16);
const allTokenIds = TRAIN_TEXTS.flatMap((s) =>
  tokenize(s).flatMap((t) => wordToIndex.get(t) ?? []),
);
const sequences: { input: number[]; target: number[] }[] = [];
for (let i = 0; i <= allTokenIds.length - seqLen - 1; i++) {
  sequences.push({
    input: allTokenIds.slice(i, i + seqLen),
    target: allTokenIds.slice(i + 1, i + seqLen + 1),
  });
}
const { semMasks, constrainedPositions, totalPositions } = buildSemMasks(
  sequences,
  indexToWord,
);

const kb = new KnowledgeBase(TRIPLES, RULES);
const tokenIndex = buildTokenIndex(indexToWord);
const roles = [...kb.facts.values()]
  .filter(({ t }) => t.rel === "defined_by")
  .map(({ t }) => t.a);
const prompts = roles.flatMap((role) =>
  FRAMES.map(
    (frame) => `the ${frame.map((p) => (p === "?x" ? role : p)).join(" ")}`,
  ),
);
const corpus = TRAIN_TEXTS.join(" ").toLowerCase().replace(/\s+/g, " ");
const trainedPrompt = (prompt: string) => corpus.includes(prompt);
const GROUPS = {
  all: () => true,
  trained: trainedPrompt,
  untrained: (p: string) => !trainedPrompt(p),
};
type Group = keyof typeof GROUPS;
const GROUP_NAMES = Object.keys(GROUPS) as Group[];

// A same-size token set matched on corpus frequency, for each prompt's banned set. It excludes the
// banned and the KB-supported tokens, so it measures mass on tokens the rules say nothing about.
const counts = new Float64Array(V);
for (const id of allTokenIds) counts[id]++;
function frequencyMatched(banned: number[], supported: number[]): number[] {
  const taken = new Set([...banned, ...supported]);
  return [...banned]
    .sort((a, b) => counts[b] - counts[a] || a - b)
    .map((b) => {
      let best = -1;
      for (let t = 0; t < V; t++) {
        if (taken.has(t)) continue;
        if (
          best < 0 ||
          Math.abs(counts[t] - counts[b]) < Math.abs(counts[best] - counts[b])
        )
          best = t;
      }
      taken.add(best);
      return best;
    });
}
const probes = prompts.map((prompt) => {
  const ids = encodeWith(prompt);
  const { banned, supported } = allowed(kb, ids, indexToWord, tokenIndex);
  return {
    prompt,
    ids,
    banned,
    matched: frequencyMatched(banned, supported),
    trained: trainedPrompt(prompt),
  };
});
function encodeWith(text: string) {
  return tokenize(text).flatMap((t) => wordToIndex.get(t) ?? []);
}

// ---------- maths ----------
const log2 = (x: number) => Math.log(x) / Math.LN2;
function softmaxRow(logits: Float32Array, row: number): Float64Array {
  const p = new Float64Array(V);
  let max = -Infinity;
  for (let v = 0; v < V; v++) max = Math.max(max, logits[row * V + v]);
  let sum = 0;
  for (let v = 0; v < V; v++) sum += p[v] = Math.exp(logits[row * V + v] - max);
  for (let v = 0; v < V; v++) p[v] /= sum;
  return p;
}
function js(p: ArrayLike<number>, q: ArrayLike<number>): number {
  let d = 0;
  for (let i = 0; i < p.length; i++) {
    const m = (p[i] + q[i]) / 2;
    if (p[i] > 0) d += 0.5 * p[i] * log2(p[i] / m);
    if (q[i] > 0) d += 0.5 * q[i] * log2(q[i] / m);
  }
  return Math.max(0, d);
}
function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let ab = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < a.length; i++) {
    ab += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return ab / Math.sqrt(aa * bb);
}
function l2(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}
const centred = (logits: Float32Array, row: number) => {
  const x = Float64Array.from(logits.subarray(row * V, (row + 1) * V));
  const mean = x.reduce((a, v) => a + v, 0) / V;
  return x.map((v) => v - mean);
};
const argmax = (p: ArrayLike<number>) => {
  let best = 0;
  for (let i = 1; i < p.length; i++) if (p[i] > p[best]) best = i;
  return best;
};
const sumAt = (p: ArrayLike<number>, ids: number[]) =>
  ids.reduce((a, i) => a + p[i], 0);
/** q_A: p renormalised over the tokens not banned. */
function allowedDist(p: Float64Array, banned: Uint8Array): Float64Array {
  const q = new Float64Array(V);
  let pa = 0;
  for (let v = 0; v < V; v++) if (!banned[v]) pa += q[v] = p[v];
  for (let v = 0; v < V; v++) q[v] /= pa;
  return q;
}
function entropyBits(q: Float64Array): number {
  let h = 0;
  for (const x of q) if (x > 0) h -= x * log2(x);
  return h;
}
function wilson(k: number, n: number): [number, number] | null {
  if (n === 0) return null;
  const z = 1.96;
  const p = k / n;
  const centre = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
  const half =
    (z / (1 + (z * z) / n)) *
    Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}
const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, v) => a + v, 0) / xs.length : Number.NaN;
const pairs = <T>(xs: T[]) =>
  xs.flatMap((a, i) => xs.slice(i + 1).map((b) => [a, b] as const));

// ---------- load ----------
const runs: Run[] = [];
const missing: string[] = [];
for (const lambdaS of LAMBDAS) {
  for (const seed of SEEDS) {
    const file = neuralSymbolicWeightsFilename(EPOCHS, cfg, lambdaS, seed);
    const model = existsSync(join(DATA, file))
      ? await loadModel(join(DATA, file))
      : null;
    if (!model) {
      missing.push(`λ=${lambdaS} seed ${seed}`);
      continue;
    }
    if (JSON.stringify(model.vocab) !== JSON.stringify(indexToWord))
      throw new Error(`${file}: vocabulary differs from training`);
    runs.push({ lambdaS, seed, file, model });
  }
}
const { layout, totalFloats } = computeLayout(cfg);
const flat = (m: Model) =>
  new Float32Array(packWeightsToSab(m.weights, layout, totalFloats));
const flats = new Map(runs.map((r) => [r, flat(r.model)] as const));

// The λ = 0 trainer should reproduce the CE-only baseline at seed 42.
const baselinePath = join(DATA, baselineWeightsFilename(EPOCHS, cfg));
const baseline = existsSync(baselinePath)
  ? await loadModel(baselinePath)
  : null;
const ns42 = runs.find((r) => r.lambdaS === 0 && r.seed === 42);
const baselineCheck =
  baseline && ns42 ? { l2: l2(flat(baseline), flats.get(ns42)!) } : null;

// ---------- one pass over the training sequences ----------
type PerRun = {
  ceSum: number;
  ceN: number;
  freeCeSum: number;
  freeN: number;
  pbSum: number;
  semSum: number;
  hqSum: number;
  conN: number;
};
type PerPair = { jsPa: number; jsQ: number; n: number };
const perRun = new Map<Run, PerRun>(
  runs.map((r) => [
    r,
    {
      ceSum: 0,
      ceN: 0,
      freeCeSum: 0,
      freeN: 0,
      pbSum: 0,
      semSum: 0,
      hqSum: 0,
      conN: 0,
    },
  ]),
);
const byLambda = LAMBDAS.map((lambdaS) => ({
  lambdaS,
  runs: runs.filter((r) => r.lambdaS === lambdaS),
}));
const perPair = new Map<string, PerPair>();
const pairKey = (a: Run, b: Run) => `${a.lambdaS}:${a.seed}-${b.seed}`;
for (const { runs: rs } of byLambda)
  for (const [a, b] of pairs(rs))
    perPair.set(pairKey(a, b), { jsPa: 0, jsQ: 0, n: 0 });

const started = Date.now();
const bannedFlags = new Uint8Array(V);
sequences.forEach((seq, k) => {
  const caches = new Map(
    runs.map(
      (r) => [r, forward(seq.input, r.model.weights, r.model.config)] as const,
    ),
  );
  for (let t = 0; t < seqLen; t++) {
    const banned = semMasks[k][t];
    const dists = new Map<
      Run,
      { p: Float64Array; pb: number; q: Float64Array | null }
    >();
    if (banned) for (const id of banned) bannedFlags[id] = 1;
    for (const r of runs) {
      const p = softmaxRow(caches.get(r)!.logits, t);
      const s = perRun.get(r)!;
      const ce = -Math.log(Math.max(p[seq.target[t]], 1e-12));
      s.ceSum += ce;
      s.ceN++;
      if (!banned) {
        s.freeCeSum += ce;
        s.freeN++;
        continue;
      }
      const pb = sumAt(p, banned);
      const q = allowedDist(p, bannedFlags);
      s.pbSum += pb;
      s.semSum += -Math.log(Math.max(1 - pb, 1e-10));
      s.hqSum += entropyBits(q);
      s.conN++;
      dists.set(r, { p, pb, q });
    }
    if (banned) {
      for (const { runs: rs } of byLambda) {
        for (const [a, b] of pairs(rs)) {
          const da = dists.get(a)!;
          const db = dists.get(b)!;
          const pp = perPair.get(pairKey(a, b))!;
          pp.jsPa += js([1 - da.pb, da.pb], [1 - db.pb, db.pb]);
          pp.jsQ += js(da.q!, db.q!);
          pp.n++;
        }
      }
      for (const id of banned) bannedFlags[id] = 0;
    }
  }
});
const passSeconds = Math.round((Date.now() - started) / 1000);

// ---------- prompt contexts: banned mass (P5) and next-token agreement (E1) ----------
function promptStats(r: Run) {
  return probes.map((pr) => {
    const { logits } = forward(pr.ids, r.model.weights, r.model.config);
    const row = pr.ids.length - 1;
    const p = softmaxRow(logits, row);
    return {
      ...pr,
      p,
      centred: centred(logits, row),
      pb: sumAt(p, pr.banned),
      pMatched: sumAt(p, pr.matched),
    };
  });
}
const prompted = new Map(runs.map((r) => [r, promptStats(r)] as const));

// ---------- violations, as in E2 ----------
function violations(r: Run, s: Setting, mode: "mask" | "bias") {
  const totals = Object.fromEntries(
    GROUP_NAMES.map((g) => [
      g,
      { samples: 0, parsed: 0, contradicted: 0, unknown: 0, distinct: 0 },
    ]),
  ) as Record<
    Group,
    {
      samples: number;
      parsed: number;
      contradicted: number;
      unknown: number;
      distinct: number;
    }
  >;
  const windowSize = Math.min(r.model.config.contextLen, 16);
  for (const prompt of prompts) {
    const promptTokens = r.model.encode(prompt).length;
    const groups = GROUP_NAMES.filter((g) => GROUPS[g](prompt));
    for (let seed = 0; seed < N; seed++) {
      resetRand(seed);
      const traces: StepTrace[] = [];
      const processor = makeProcessor(kb, buildTokenIndex(r.model.vocab), {
        mode,
        lambda: 0,
      });
      const text = generateText(
        r.model.weights,
        r.model.config,
        r.model.encode(prompt),
        MAX_TOKENS,
        r.model.vocab,
        s.temperature,
        s.topP,
        windowSize,
        {
          processor,
          traces,
        },
      );
      const report = verify(kb, text);
      const generated = r.model.encode(text).slice(promptTokens);
      for (const g of groups) {
        const t = totals[g];
        t.samples++;
        t.parsed += report.parsed;
        t.contradicted += report.contradicted;
        t.unknown += report.unknown;
        t.distinct += generated.length
          ? new Set(generated).size / generated.length
          : 0;
      }
    }
  }
  return Object.fromEntries(
    GROUP_NAMES.map((g) => {
      const t = totals[g];
      return [
        g,
        {
          ...t,
          distinct: t.samples ? t.distinct / t.samples : null,
          violationRate: t.parsed ? t.contradicted / t.parsed : null,
          violationCi95: wilson(t.contradicted, t.parsed),
        },
      ];
    }),
  ) as Record<
    Group,
    {
      samples: number;
      parsed: number;
      contradicted: number;
      unknown: number;
      distinct: number | null;
      violationRate: number | null;
      violationCi95: [number, number] | null;
    }
  >;
}

// ---------- assemble ----------
const runRows = runs.map((r) => {
  const s = perRun.get(r)!;
  const ps = prompted.get(r)!;
  const group = (f: (x: (typeof ps)[number]) => boolean) => ({
    bannedMass: mean(ps.filter(f).map((x) => x.pb)),
    matchedMass: mean(ps.filter(f).map((x) => x.pMatched)),
  });
  return {
    lambdaS: r.lambdaS,
    seed: r.seed,
    file: r.file,
    trainingCe: s.ceSum / s.ceN,
    perplexityWhereNoRuleFires: Math.exp(s.freeCeSum / s.freeN),
    positionsWhereNoRuleFires: s.freeN,
    constrained: {
      positions: s.conN,
      bannedMass: s.pbSum / s.conN,
      semLoss: s.semSum / s.conN,
      entropyQaBits: s.hqSum / s.conN,
    },
    prompts: {
      trained: group((x) => x.trained),
      untrained: group((x) => !x.trained),
    },
    violations: SETTINGS.map((st) => ({
      setting: st.name,
      maskOff: violations(r, st, "bias"),
      maskOn: violations(r, st, "mask"),
    })),
  };
});

const pairRows = byLambda.flatMap(({ lambdaS, runs: rs }) =>
  pairs(rs).map(([a, b]) => {
    const pa = prompted.get(a)!;
    const pb = prompted.get(b)!;
    const agree = (f: (i: number) => boolean) => {
      const idx = probes.map((_, i) => i).filter(f);
      return {
        centredLogitCosine: mean(
          idx.map((i) => cosine(pa[i].centred, pb[i].centred)),
        ),
        js: mean(idx.map((i) => js(pa[i].p, pb[i].p))),
        top1Agreement: mean(
          idx.map((i) => (argmax(pa[i].p) === argmax(pb[i].p) ? 1 : 0)),
        ),
      };
    };
    const pp = perPair.get(pairKey(a, b))!;
    return {
      lambdaS,
      seeds: [a.seed, b.seed],
      weightL2: l2(flats.get(a)!, flats.get(b)!),
      weightCosine: cosine(flats.get(a)!, flats.get(b)!),
      heldOutPrompts: agree((i) => !probes[i].trained),
      trainedPrompts: agree((i) => probes[i].trained),
      constrained: { jsPa: pp.jsPa / pp.n, jsQa: pp.jsQ / pp.n },
    };
  }),
);
const weightNorms = runs.map((r) => ({
  lambdaS: r.lambdaS,
  seed: r.seed,
  norm: Math.sqrt(flats.get(r)!.reduce((a, v) => a + v * v, 0)),
}));

const out = {
  protocol: {
    epochs: EPOCHS,
    seeds: SEEDS,
    lambdas: LAMBDAS,
    N,
    maxTokens: MAX_TOKENS,
    settings: SETTINGS,
    prompts,
    heldOutPrompts: prompts.filter((p) => !trainedPrompt(p)),
    trainingPositions: totalPositions,
    constrainedPositions,
  },
  missing,
  baselineCheck,
  passSeconds,
  seconds: Math.round((Date.now() - started) / 1000),
  runs: runRows,
  pairs: pairRows,
  weightNorms,
};
await mkdir("reports", { recursive: true });
await writeFile("reports/e1-e4.json", JSON.stringify(out, null, 2));

// ---------- print ----------
const f = (v: number | null | undefined, d = 4) =>
  v === null || v === undefined || Number.isNaN(v) ? "n/a" : v.toFixed(d);
const e = (v: number) => v.toExponential(2);
const pct = (v: number | null) =>
  v === null ? "n/a" : `${(v * 100).toFixed(1)}%`;
console.log(`Missing runs: ${missing.join(", ") || "none"}`);
console.log(
  `Baseline vs λ=0 seed 42, weight L2: ${baselineCheck ? e(baselineCheck.l2) : "n/a"}`,
);
console.log(
  `${constrainedPositions} constrained of ${totalPositions} training positions; ${out.seconds} s\n`,
);

console.log("Per run");
console.log(
  "| λ | Seed | Training CE | Perplexity, no rule fires | Banned mass, constrained | Sem loss | H(q_A) bits | Banned mass, untrained prompts | Matched set, untrained prompts | Banned mass, trained prompts | Matched set, trained prompts | Weight norm |",
);
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const r of runRows) {
  const n = weightNorms.find(
    (w) => w.lambdaS === r.lambdaS && w.seed === r.seed,
  )!.norm;
  console.log(
    `| ${r.lambdaS} | ${r.seed} | ${f(r.trainingCe)} | ${f(r.perplexityWhereNoRuleFires, 3)} | ${e(r.constrained.bannedMass)} | ${e(r.constrained.semLoss)} | ${f(r.constrained.entropyQaBits, 3)} | ${f(r.prompts.untrained.bannedMass)} | ${f(r.prompts.untrained.matchedMass)} | ${f(r.prompts.trained.bannedMass)} | ${f(r.prompts.trained.matchedMass)} | ${f(n, 2)} |`,
  );
}

console.log("\nSeed pairs");
console.log(
  "| λ | Seeds | Weight L2 | Weight cosine | Held-out prompts: centred-logit cosine | JS bits | Top-1 agree | Trained prompts: cosine | JS | Top-1 | JS (P_A, 1−P_A) | JS q_A |",
);
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const p of pairRows) {
  console.log(
    `| ${p.lambdaS} | ${p.seeds.join("–")} | ${f(p.weightL2, 2)} | ${f(p.weightCosine)} | ${f(p.heldOutPrompts.centredLogitCosine)} | ${f(p.heldOutPrompts.js)} | ${f(p.heldOutPrompts.top1Agreement, 3)} | ${f(p.trainedPrompts.centredLogitCosine)} | ${f(p.trainedPrompts.js)} | ${f(p.trainedPrompts.top1Agreement, 3)} | ${e(p.constrained.jsPa)} | ${f(p.constrained.jsQa)} |`,
  );
}

console.log("\nViolations: contradicted / parsed claims");
console.log(
  "| λ | Seed | Setting | Mask | Trained prompts | Untrained prompts | Distinct-token ratio, all |",
);
console.log("|---|---|---|---|---|---|---|");
for (const r of runRows) {
  for (const v of r.violations) {
    for (const [mask, a] of [
      ["off", v.maskOff],
      ["on", v.maskOn],
    ] as const) {
      console.log(
        `| ${r.lambdaS} | ${r.seed} | ${v.setting} | ${mask} | ${a.trained.contradicted}/${a.trained.parsed} (${pct(a.trained.violationRate)}) | ${a.untrained.contradicted}/${a.untrained.parsed} (${pct(a.untrained.violationRate)}) | ${f(a.all.distinct, 3)} |`,
      );
    }
  }
}
process.exit(0);
