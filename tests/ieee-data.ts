/**
 * Regenerates every number and plot input used by docs/progress/ieee/main.tex.
 *
 *   bun tests/ieee-data.ts
 *
 * Output goes to docs/progress/ieee/data/. Nothing in the paper is typed in by
 * hand: tables and figures read these files. The transformer is not trained here
 * because it does not exist yet; only its analytic parameter count is written.
 */
import { mkdir, writeFile } from "node:fs/promises";
import {
  trainMultiLayer,
  trainSingleLayer,
} from "../src/routes/neural-net/train.js";
import { trainSkipGram } from "../src/routes/train-embed/train.js";
import { cosineSimilarity } from "../src/server/lib/math.js";

const OUT = new URL("../docs/progress/ieee/data/", import.meta.url);
await mkdir(OUT, { recursive: true });
const save = (name: string, text: string) =>
  writeFile(new URL(name, OUT), text);

const SEEDS = [42, 1, 2, 3];

// ---------------------------------------------------------------- XOR ------
type Curve = { epoch: number; loss: number }[];
async function runXor(
  gen: AsyncGenerator<any>,
): Promise<{ curve: Curve; final: any }> {
  const curve: Curve = [];
  let final: any;
  for await (const item of gen) {
    if ("predictions" in item) final = item;
    else curve.push({ epoch: item.epoch, loss: item.loss });
  }
  return { curve, final };
}

const xor: Record<string, unknown> = {};
const multiCurves: Record<number, Curve> = {};
for (const epochs of [500, 5000]) {
  for (const seed of SEEDS) {
    const r = await runXor(trainMultiLayer(epochs, seed));
    const w = (r.final.weights as any).weights ?? r.final.weights;
    xor[`multi_${epochs}_${seed}`] = {
      firstLoss: r.curve[0].loss,
      finalLoss: r.curve.at(-1)!.loss,
      predictions: r.final.predictions.map((p: any) => +p.actual.toFixed(4)),
      w1_row0: w.w1[0].map((x: number) => +x.toFixed(4)),
    };
    if (epochs === 5000) multiCurves[seed] = r.curve;
  }
}
const single = await runXor(trainSingleLayer(500, 42));
xor.single_500_42 = {
  firstLoss: single.curve[0].loss,
  finalLoss: single.curve.at(-1)!.loss,
  predictions: single.final.predictions.map((p: any) => +p.actual.toFixed(4)),
};
const rerunA = await runXor(trainMultiLayer(500, 42));
const rerunB = await runXor(trainMultiLayer(500, 42));
xor.deterministic = rerunA.curve.at(-1)!.loss === rerunB.curve.at(-1)!.loss;
await save("xor.json", JSON.stringify(xor, null, 2));

// pgfplots table: epoch, loss per seed (multi-layer, 5000 epochs) + single layer
{
  const rows = multiCurves[42].map((p, i) => [
    p.epoch,
    ...SEEDS.map((s) => multiCurves[s][i].loss),
  ]);
  await save(
    "xor_multi_loss.csv",
    [
      "epoch," + SEEDS.map((s) => `seed${s}`).join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n") + "\n",
  );
  const s5000 = await runXor(trainSingleLayer(5000, 42));
  await save(
    "xor_single_loss.csv",
    ["epoch,loss", ...s5000.curve.map((p) => `${p.epoch},${p.loss}`)].join(
      "\n",
    ) + "\n",
  );
}

// ---------------------------------------------------------- Skip-gram ------
const WORDS = [
  "king",
  "queen",
  "man",
  "woman",
  "boy",
  "girl",
  "prince",
  "cat",
  "dog",
  "kitten",
  "puppy",
  "tiger",
  "elephant",
  "he",
  "his",
];
const EPOCHS = 300;

type SgRun = {
  seed: number;
  curve: Curve;
  vecs: Map<string, number[]>;
  sims: Map<string, number>;
  analogies: { query: string; result: string; score: number }[];
  words: string[];
  init: any;
};
const runs: SgRun[] = [];
for (const seed of SEEDS) {
  const curve: Curve = [];
  let init: any;
  let result: any;
  for await (const item of trainSkipGram({
    words: WORDS,
    epochs: EPOCHS,
    dimensions: 32,
    windowSize: 2,
    negativeSamples: 5,
    save: false,
    seed,
  })) {
    if ("vocabSize" in item) init = item;
    else if ("embeddings" in item) result = item;
    else curve.push({ epoch: item.epoch, loss: item.loss });
  }
  const vecs = new Map<string, number[]>(
    result.embeddings.map((e: any) => [e.word, e.vector]),
  );
  const words = [...vecs.keys()].sort();
  const sims = new Map<string, number>();
  for (let i = 0; i < words.length; i++)
    for (let j = i + 1; j < words.length; j++)
      sims.set(
        `${words[i]}|${words[j]}`,
        cosineSimilarity(vecs.get(words[i])!, vecs.get(words[j])!),
      );
  runs.push({
    seed,
    curve,
    vecs,
    sims,
    analogies: result.analogies,
    words,
    init,
  });
}

const pearson = (x: number[], y: number[]) => {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0,
    sxx = 0,
    syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
};

// Do different seeds agree on geometry (pairwise cosines) although the weights differ?
const pairKeys = [...runs[0].sims.keys()];
const rsa: Record<string, number> = {};
const direct: Record<string, number> = {};
for (let a = 0; a < runs.length; a++) {
  for (let b = a + 1; b < runs.length; b++) {
    const key = `${runs[a].seed}-${runs[b].seed}`;
    rsa[key] = pearson(
      pairKeys.map((k) => runs[a].sims.get(k)!),
      pairKeys.map((k) => runs[b].sims.get(k)!),
    );
    // Same word, different seed: cosine between the raw vectors (embedding axes are arbitrary).
    direct[key] =
      runs[0].words.reduce(
        (acc, w) =>
          acc + cosineSimilarity(runs[a].vecs.get(w)!, runs[b].vecs.get(w)!),
        0,
      ) / runs[0].words.length;
  }
}

// Answer key chosen by us (one acceptable answer per query), applied identically to every seed.
const KEY: Record<string, string> = {
  "king - man + woman": "queen",
  "queen - woman + man": "king",
  "prince - boy + girl": "princess",
  "kitten - cat + dog": "puppy",
  "puppy - dog + cat": "kitten",
  "he - man + woman": "she",
  "his - man + woman": "her",
};
const analogySummary = runs.map((r) => ({
  seed: r.seed,
  correct: r.analogies.filter((a) => KEY[a.query] === a.result).length,
  total: r.analogies.length,
  results: r.analogies.map((a) => ({
    query: a.query,
    result: a.result,
    score: a.score,
  })),
}));

const pick = (r: SgRun, a: string, b: string) =>
  +(r.sims.get(a < b ? `${a}|${b}` : `${b}|${a}`) ?? NaN).toFixed(4);
const pairs = [
  ["king", "queen"],
  ["man", "woman"],
  ["cat", "dog"],
  ["cat", "king"],
  ["tiger", "elephant"],
];
await save(
  "skipgram.json",
  JSON.stringify(
    {
      epochs: EPOCHS,
      init: runs[0].init,
      finalLoss: Object.fromEntries(
        runs.map((r) => [r.seed, r.curve.at(-1)!.loss]),
      ),
      firstLoss: Object.fromEntries(runs.map((r) => [r.seed, r.curve[0].loss])),
      pairCosines: Object.fromEntries(
        runs.map((r) => [
          r.seed,
          Object.fromEntries(
            pairs.map(([a, b]) => [`${a}|${b}`, pick(r, a, b)]),
          ),
        ]),
      ),
      pairwiseGeometryPearson: rsa,
      meanSameWordCosineAcrossSeeds: direct,
      analogies: analogySummary,
    },
    null,
    2,
  ),
);

await save(
  "skipgram_loss.csv",
  [
    "epoch," + SEEDS.map((s) => `seed${s}`).join(","),
    ...runs[0].curve.map((p, i) =>
      [p.epoch, ...runs.map((r) => r.curve[i].loss)].join(","),
    ),
  ].join("\n") + "\n",
);

// 2-D PCA of the seed-42 embeddings (power iteration, deterministic start).
function pca2(rows: number[][]): number[][] {
  const n = rows.length,
    d = rows[0].length;
  const mean = Array.from(
    { length: d },
    (_, j) => rows.reduce((a, r) => a + r[j], 0) / n,
  );
  const X = rows.map((r) => r.map((v, j) => v - mean[j]));
  const comps: number[][] = [];
  for (let c = 0; c < 2; c++) {
    let v = Array.from({ length: d }, (_, j) => Math.sin(j + 1 + c));
    for (let it = 0; it < 200; it++) {
      const Xv = X.map((r) => r.reduce((a, x, j) => a + x * v[j], 0));
      const w = Array.from({ length: d }, (_, j) =>
        X.reduce((a, r, i) => a + r[j] * Xv[i], 0),
      );
      for (const p of comps) {
        const dot = w.reduce((a, x, j) => a + x * p[j], 0);
        for (let j = 0; j < d; j++) w[j] -= dot * p[j];
      }
      const norm = Math.sqrt(w.reduce((a, x) => a + x * x, 0));
      v = w.map((x) => x / norm);
    }
    comps.push(v);
  }
  return X.map((r) => comps.map((p) => r.reduce((a, x, j) => a + x * p[j], 0)));
}
const r0 = runs[0];
const proj = pca2(r0.words.map((w) => r0.vecs.get(w)!));
await save(
  "skipgram_pca_seed42.csv",
  [
    "word,pc1,pc2",
    ...r0.words.map(
      (w, i) => `${w},${proj[i][0].toFixed(4)},${proj[i][1].toFixed(4)}`,
    ),
  ].join("\n") + "\n",
);

// Cosine heat-map data for seed 42 (full matrix, row-major).
{
  const W = r0.words;
  const lines = ["x,y,cos"];
  W.forEach((a, i) =>
    W.forEach((b, j) => {
      const c = i === j ? 1 : r0.sims.get(a < b ? `${a}|${b}` : `${b}|${a}`)!;
      lines.push(`${i},${j},${c.toFixed(4)}`);
    }),
  );
  await save("skipgram_cos_seed42.csv", lines.join("\n") + "\n");
  await save("skipgram_words.txt", W.join("\n") + "\n");
}

// ------------------------------------------------- transformer (analytic) --
// Per-block parameter count for a pre-LN block with D model dim and F ff dim:
//   Q,K,V,O: 4(D*D + D)   LN1, LN2: 2*(2D)   FFN: (D*F + F) + (F*D + D)
const blockParams = (D: number, F: number) =>
  4 * (D * D + D) + 2 * (2 * D) + (D * F + F) + (F * D + D);
await save(
  "transformer_params.json",
  JSON.stringify(
    {
      note: "Analytic count from the block definition; the transformer is not trained.",
      D32_F128_perBlock: blockParams(32, 128),
      D64_F256_perBlock: blockParams(64, 256),
    },
    null,
    2,
  ),
);

console.log("wrote", OUT.pathname);
console.log("xor deterministic:", xor.deterministic);
console.log(
  "skipgram finalLoss",
  Object.fromEntries(runs.map((r) => [r.seed, r.curve.at(-1)!.loss])),
);
console.log("geometry pearson", rsa);
console.log("same-word cosine across seeds", direct);

// ------------------------------------------------ LaTeX fragments (paper) --
// Everything the paper prints as a number comes from these generated files.
const f = (x: number, d = 3) => x.toFixed(d);
const sci = (x: number) => x.toExponential(1).replace("e-", "\\mathrm{e}{-").concat("}");
{
  const x = xor as any;
  const rows = SEEDS.map((s) => {
    const a = x[`multi_500_${s}`];
    const b = x[`multi_5000_${s}`];
    return `${s} & ${f(a.finalLoss, 4)} & $${sci(b.finalLoss)}$ & ${b.predictions.map((p: number) => f(p, 2)).join(" / ")} & $[${b.w1_row0.map((v: number) => f(v, 1).replace(/^-0\.0$/, "0.0")).join(",\\,")}]$`;
  });
  const sg = x.single_500_42;
  rows.push(
    `single-layer (42) & ${f(sg.finalLoss, 4)} & -- & ${sg.predictions.map((p: number) => f(p, 2)).join(" / ")} & --`,
  );
  await save("table_xor.tex", rows.join(" \\\\\n") + "\n");

  const sgRows = runs.map((r, i) => {
    const c = (a: string, b: string) => f(pick(r, a, b), 2);
    const an = analogySummary[i];
    return `${r.seed} & ${f(r.curve[0].loss)} $\\rightarrow$ ${f(r.curve.at(-1)!.loss)} & ${c("king", "queen")} & ${c("man", "woman")} & ${c("cat", "dog")} & ${c("cat", "king")} & ${an.correct}/${an.total}`;
  });
  await save("table_sg.tex", sgRows.join(" \\\\\n") + "\n");

  const rv = Object.values(rsa);
  const dv = Object.values(direct);
  const mac: Record<string, string> = {
    sgVocab: String(runs[0].init.vocabSize),
    sgPairs: String(runs[0].init.totalPairs),
    sgSent: String(runs[0].init.sentenceCount),
    sgEpochs: String(EPOCHS),
    sgPearsonMin: f(Math.min(...rv), 3),
    sgPearsonMax: f(Math.max(...rv), 3),
    sgSameMin: f(Math.min(...dv), 2),
    sgSameMax: f(Math.max(...dv), 2),
    sgWordList: runs[0].words.join(","),
    blockParamsSmall: blockParams(32, 128).toLocaleString("en-US").replace(",", "{,}"),
    xorSingleStart: f(x.single_500_42.firstLoss, 4),
    xorSingleEnd: f(x.single_500_42.finalLoss, 4),
  };
  await save(
    "numbers.tex",
    Object.entries(mac).map(([k, v]) => `\\newcommand{\\${k}}{${v}}`).join("\n") + "\n",
  );
}
