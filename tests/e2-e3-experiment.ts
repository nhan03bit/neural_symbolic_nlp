/**
 * E2 (violation rate, mask off and on) and E3 (one full trace) on the saved seed-42 models.
 *
 *   bun tests/e2-e3-experiment.ts
 *
 * Protocol (chapter 05 §2), fixed before running:
 * - Models: the CE-only baseline and the λ_s = 50 neural-symbolic model, both 2000 epochs,
 *   2 layers, training seed 42. One training seed, so E2 is partial: the protocol asks for
 *   seeds 42, 1, 2, 3.
 * - Prompts: every role word in every definition frame (8 roles × 3 frames = 24), e.g.
 *   "the claimant is the person who". The frame fires at the first step. "Trained" prompts
 *   occur in the training text (each role appears there in one frame); "untrained" prompts put
 *   a role in a frame it never appears in. Results are reported for all, trained and untrained.
 * - Sampling: seeds 0..N-1 per prompt, 20 tokens, at two fixed settings: the compare view's
 *   default (T = 0.8, top-p 0.9) and the full distribution (T = 1, top-p 1).
 * - Mask off runs the processor in `bias` mode with λ = 0, which edits nothing but records the
 *   trace (massBefore). Every mask-off text is checked against plain generation (P2).
 * - Violations come from the verifier: contradicted claims over parsed claims, with a 95%
 *   Wilson interval. Distinct-token ratio is the mean over samples of distinct / generated
 *   tokens. Not computed: perplexity on held-out text, because the neural-symbolic trainer has
 *   no held-out split.
 *
 * Writes reports/e2-e3-seed42.json and prints the tables.
 */
import type { StepTrace } from "../src/routes/neural-symbolic/constraints.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeProcessor } from "../src/routes/neural-symbolic/constraints.js";
import { loadModel } from "../src/routes/neural-symbolic/model.js";
import {
  buildTokenIndex,
  FRAMES,
  KnowledgeBase,
  RULES,
  TRIPLES,
} from "../src/routes/neural-symbolic/symbolic.js";
import { verify } from "../src/routes/neural-symbolic/verify.js";
import { resetRand } from "../src/routes/train-transformer/matrix.js";
import { TRAIN_TEXTS } from "../src/routes/train-transformer/train.js";
import { generateText } from "../src/routes/train-transformer/transformer.js";

const N = 50;
const MAX_TOKENS = 20;
const SETTINGS = [
  { name: "T 0.8, top-p 0.9", temperature: 0.8, topP: 0.9 },
  { name: "T 1, top-p 1", temperature: 1, topP: 1 },
];
const DATA = join(process.cwd(), ".data");
const MODELS = [
  {
    name: "CE only",
    file: "transformer-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-v4.json",
  },
  {
    name: "CE + SL (λ = 50)",
    file: "neural-symbolic-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-k91eeb742-ls50-s42-n3-v4.json",
  },
];
const E3 = {
  prompt: "the claimant is the person who",
  seed: 42,
  setting: SETTINGS[0],
};

type Model = NonNullable<Awaited<ReturnType<typeof loadModel>>>;
type Setting = (typeof SETTINGS)[number];

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

const kb = new KnowledgeBase(TRIPLES, RULES);
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

function sample(
  model: Model,
  prompt: string,
  seed: number,
  s: Setting,
  mode?: "mask" | "bias",
) {
  const traces: StepTrace[] = [];
  resetRand(seed);
  const hooks = mode && {
    processor: makeProcessor(kb, buildTokenIndex(model.vocab), {
      mode,
      lambda: 0,
    }),
    traces,
  };
  const windowSize = Math.min(model.config.contextLen, 16);
  const text = generateText(
    model.weights,
    model.config,
    model.encode(prompt),
    MAX_TOKENS,
    model.vocab,
    s.temperature,
    s.topP,
    windowSize,
    hooks,
  );
  return { text, traces };
}

function emptyTotals() {
  return {
    samples: 0,
    parsed: 0,
    supported: 0,
    contradicted: 0,
    unknown: 0,
    firedSteps: 0,
    massBefore: 0,
    distinct: 0,
    p2Mismatches: 0,
  };
}
type Totals = ReturnType<typeof emptyTotals>;

function summary(t: Totals) {
  return {
    samples: t.samples,
    parsed: t.parsed,
    supported: t.supported,
    contradicted: t.contradicted,
    unknown: t.unknown,
    p2Mismatches: t.p2Mismatches,
    violationRate: t.parsed ? t.contradicted / t.parsed : null,
    violationCi95: wilson(t.contradicted, t.parsed),
    meanMassBeforeAtFiredSteps: t.firedSteps
      ? t.massBefore / t.firedSteps
      : null,
    distinctTokenRatio: t.samples ? t.distinct / t.samples : null,
  };
}

function arm(model: Model, s: Setting, mode: "mask" | "bias") {
  const totals = Object.fromEntries(
    GROUP_NAMES.map((g) => [g, emptyTotals()]),
  ) as Record<Group, Totals>;
  const contradictions = new Map<string, number>();
  for (const prompt of prompts) {
    const promptTokens = model.encode(prompt).length;
    const groups = GROUP_NAMES.filter((g) => GROUPS[g](prompt));
    for (let seed = 0; seed < N; seed++) {
      const { text, traces } = sample(model, prompt, seed, s, mode);
      const mismatch =
        mode === "bias" && text !== sample(model, prompt, seed, s).text;
      const report = verify(kb, text);
      // generateText returns prompt + continuation; the distinct-token ratio counts the continuation only.
      const generated = model.encode(text).slice(promptTokens);
      const fired = traces.filter((t) => t.maskedTokens.length > 0);
      for (const g of groups) {
        const t = totals[g];
        t.samples++;
        t.parsed += report.parsed;
        t.supported += report.supported;
        t.contradicted += report.contradicted;
        t.unknown += report.unknown;
        t.firedSteps += fired.length;
        t.massBefore += fired.reduce((a, f) => a + f.massBefore, 0);
        t.distinct += generated.length
          ? new Set(generated).size / generated.length
          : 0;
        if (mismatch) t.p2Mismatches++;
      }
      for (const c of report.claims.filter(
        (c) => c.status === "contradicted",
      )) {
        const k = `${trainedPrompt(prompt) ? "" : "*"}${c.claim.a} → ${c.claim.b}`;
        contradictions.set(k, (contradictions.get(k) ?? 0) + 1);
      }
    }
  }
  return {
    groups: Object.fromEntries(
      GROUP_NAMES.map((g) => [g, summary(totals[g])]),
    ) as Record<Group, ReturnType<typeof summary>>,
    /** "*" marks a claim from an untrained prompt. */
    topContradictions: [...contradictions]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6),
  };
}

const models = await Promise.all(
  MODELS.map(async (m) => ({
    ...m,
    model: await loadModel(join(DATA, m.file)),
  })),
);
for (const m of models) if (!m.model) throw new Error(`missing ${m.file}`);
if (
  JSON.stringify(models[0].model!.vocab) !==
  JSON.stringify(models[1].model!.vocab)
)
  throw new Error("vocabularies differ");

const started = Date.now();
const e2 = models.flatMap(({ name, file, model }) =>
  SETTINGS.map((s) => ({
    model: name,
    file,
    setting: s.name,
    maskOff: arm(model!, s, "bias"),
    maskOn: arm(model!, s, "mask"),
  })),
);
const e3 = models.map(({ name, model }) => {
  const { text, traces } = sample(
    model!,
    E3.prompt,
    E3.seed,
    E3.setting,
    "mask",
  );
  return { model: name, text, verify: verify(kb, text), traces };
});

const out = {
  protocol: {
    N,
    maxTokens: MAX_TOKENS,
    prompts,
    trainedPrompts: prompts.filter(trainedPrompt),
    settings: SETTINGS,
    trainingSeed: 42,
    e3: { prompt: E3.prompt, seed: E3.seed, setting: E3.setting.name },
  },
  seconds: Math.round((Date.now() - started) / 1000),
  e2,
  e3,
};
await mkdir("reports", { recursive: true });
await writeFile("reports/e2-e3-seed42.json", JSON.stringify(out, null, 2));

const pct = (v: number | null) =>
  v === null ? "n/a" : `${(v * 100).toFixed(2)}%`;
const ci = (v: [number, number] | null) =>
  v ? `${pct(v[0])}–${pct(v[1])}` : "n/a";
console.log(
  `E2: ${prompts.length} prompts (${prompts.filter(trainedPrompt).length} trained) × ${N} seeds, ${out.seconds} s\n`,
);
console.log(
  "| Prompts | Model | Setting | Mask | Samples | Claims parsed | Supported | Contradicted | Unknown | Violation rate (95% CI) | Mean massBefore at fired steps | Distinct-token ratio | P2 mismatches |",
);
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const g of GROUP_NAMES) {
  for (const row of e2) {
    for (const [mask, a] of [
      ["off", row.maskOff],
      ["on", row.maskOn],
    ] as const) {
      const r = a.groups[g];
      console.log(
        `| ${g} | ${row.model} | ${row.setting} | ${mask} | ${r.samples} | ${r.parsed} | ${r.supported} | ${r.contradicted} | ${r.unknown} | ${pct(r.violationRate)} (${ci(r.violationCi95)}) | ${r.meanMassBeforeAtFiredSteps?.toFixed(4) ?? "n/a"} | ${r.distinctTokenRatio?.toFixed(3) ?? "n/a"} | ${mask === "off" ? r.p2Mismatches : "–"} |`,
      );
    }
  }
}
console.log("\nMost frequent contradictions, mask off (* = untrained prompt):");
for (const row of e2)
  console.log(
    `  ${row.model}, ${row.setting}: ${row.maskOff.topContradictions.map(([k, n]) => `${k} ×${n}`).join(", ") || "none"}`,
  );
console.log("\nContradictions with the mask on:");
for (const row of e2)
  console.log(
    `  ${row.model}, ${row.setting}: ${row.maskOn.topContradictions.map(([k, n]) => `${k} ×${n}`).join(", ") || "none"}`,
  );

console.log(
  `\nE3: "${E3.prompt}", sampling seed ${E3.seed}, ${E3.setting.name}, mask on`,
);
for (const r of e3) {
  console.log(`\n${r.model}: ${r.text.trim()}`);
  console.log(
    `claims ${r.verify.parsed}, supported ${r.verify.supported}, contradicted ${r.verify.contradicted}, unknown ${r.verify.unknown}`,
  );
  console.log(
    "| Step | Rules fired | Masked tokens | massBefore | massAfter | Chosen |",
  );
  console.log("|---|---|---|---|---|---|");
  for (const t of r.traces) {
    console.log(
      `| ${t.step} | ${t.rulesFired.join("; ") || "–"} | ${t.maskedTokens.map((m) => m.trim()).join(", ") || "–"} | ${t.massBefore.toFixed(4)} | ${t.massAfter.toFixed(4)} | ${JSON.stringify(t.chosen)} |`,
    );
  }
}
