/**
 * Training orchestrator for a tiny GPT — tokenizes a corpus, trains with data parallelism, streams results.
 *
 * Radford et al. (2018) showed that a decoder-only transformer pre-trained on raw text
 * learns surprisingly general language representations. This file trains the same
 * architecture from scratch on a small story corpus, demonstrating every step:
 * BPE tokenization, sequence construction, multi-worker gradient accumulation, and
 * autoregressive text generation.
 *
 * @see https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf — Radford et al. (2018) "Improving Language Understanding by Generative Pre-Training" (GPT-1)
 * @see https://arxiv.org/abs/1508.07909 — Sennrich, Haddow & Birch (2016) "Neural Machine Translation of Rare Words with Subword Units" (BPE)
 *
 * Training uses data parallelism via SharedArrayBuffer: each worker thread runs
 * forward+backward on its slice of sequences and accumulates gradients into shared
 * memory. The main thread sums worker gradients and runs one Adam step per epoch.
 *
 * Yields InitResult, then EpochResults during training, then a final TransformerTrainResult.
 */
import type {
  BlockWeights,
  TransformerConfig,
  TransformerWeights,
} from "./transformer";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { join } from "node:path";
import { Worker } from "node:worker_threads";

import { buildSync } from "esbuild";

import { applyMerges, trainBpeOnText } from "../../server/lib/bpe";
import { CIVIL_LAW_DEFINITIONS, STORIES } from "../train-embed/corpus";

/**
 * Part of every weights filename. Raise it when a change to transformer.ts or to the tokeniser
 * makes saved weights invalid, so they are retrained instead of served as cached. The corpus hash
 * covers only the text, so it does not catch a tokeniser change. Filenames without a version hold
 * weights trained with defects D1-D3 (docs/progress/05, section 1.2). v2 weights use the older
 * 807-token vocabulary of word pieces, and v3 weights use a vocabulary with a separate "s" token.
 */
export const MODEL_VERSION = "v4";

// A word keeps its apostrophe ending, so "ravi's" is one token. A separate "s" would be dropped
// without the optional whitespace, and with it could fuse onto any sampled word ("thes").
export const PRE_TOKEN_RE = /\s?\w+(?:'\w+)*|[^\w\s]/g;

/** Training text: each civil-law definition as a sentence, then the dispute stories that use those terms. */
export const TRAIN_TEXTS = [
  ...CIVIL_LAW_DEFINITIONS.map((d) => `${d}.`),
  ...STORIES,
];
import { resetRand } from "./matrix";
import {
  adamUpdate,
  BLOCK_KEYS,
  countParams,
  crossEntropyLoss,
  forward,
  generateText,
  initAdam,
  initWeights,
  zeroGrads,
} from "./transformer";
import {
  computeLayout,
  copyWeightsFromSab,
  createWeightViews,
  packWeightsToSab,
  sumGradsFromWorkers,
} from "./weigth-layout";

/** Yields to the event loop so SSE events can flush during long training loops. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const round = (arr: Float32Array) =>
  Array.from(arr, (v) => Math.round(v * 1000000) / 1000000);

/** Serialize the full model (weights + config + vocab + BPE merges) to a JSON-cacheable object. */
export function serializeModel(
  w: TransformerWeights,
  cfg: TransformerConfig,
  vocab: string[],
  merges: { pair: [string, string]; merged: string }[],
  history: EpochResult[],
) {
  return {
    type: "decoder-transformer" as const,
    config: cfg,
    vocab,
    merges,
    history,
    weights: {
      tokEmb: round(w.tokEmb),
      posEmb: round(w.posEmb),
      blocks: w.blocks.map((bw) => {
        const obj: Record<string, number[]> = {};
        for (const key of BLOCK_KEYS) obj[key] = round(bw[key]);
        return obj;
      }),
      lnFGamma: round(w.lnFGamma),
      lnFBeta: round(w.lnFBeta),
      headW: round(w.headW),
      headB: round(w.headB),
    },
  };
}

/**
 * Try to load pre-trained weights and their training log from a cached JSON file.
 * Returns null if the file is missing, or predates saved history (so it gets retrained).
 */
export async function tryLoadWeights(path: string): Promise<{
  weights: TransformerWeights;
  history: EpochResult[];
  config: TransformerConfig;
  vocab: string[];
  merges: { pair: [string, string]; merged: string }[];
} | null> {
  try {
    const json = JSON.parse(await readFile(path, "utf-8"));
    if (!Array.isArray(json.history)) return null;
    const sw = json.weights;
    const weights: TransformerWeights = {
      tokEmb: new Float32Array(sw.tokEmb),
      posEmb: new Float32Array(sw.posEmb),
      blocks: sw.blocks.map((b: Record<string, number[]>) => {
        const bw = {} as BlockWeights;
        for (const [k, v] of Object.entries(b)) {
          bw[k as keyof BlockWeights] = new Float32Array(v);
        }
        return bw;
      }),
      lnFGamma: new Float32Array(sw.lnFGamma),
      lnFBeta: new Float32Array(sw.lnFBeta),
      headW: new Float32Array(sw.headW),
      headB: new Float32Array(sw.headB),
    };
    return {
      weights,
      history: json.history,
      config: json.config,
      vocab: json.vocab,
      merges: json.merges,
    };
  } catch {
    return null;
  }
}

/**
 * Load the weights saved at one epoch of a finished run.
 *
 * Checkpoint filenames have no corpus fingerprint and later runs overwrite them, so a checkpoint
 * only counts if its training log is the start of this run's log and ends at that epoch.
 */
async function loadCheckpoint(
  path: string,
  epoch: number,
  runHistory: EpochResult[],
): Promise<TransformerWeights | null> {
  const checkpoint = await tryLoadWeights(path);
  if (!checkpoint || checkpoint.history.at(-1)?.epoch !== epoch) return null;
  const sameRun = checkpoint.history.every(
    (entry, i) =>
      entry.epoch === runHistory[i]?.epoch &&
      entry.loss === runHistory[i]?.loss,
  );
  return sameRun ? checkpoint.weights : null;
}

export type InitResult = {
  vocabSize: number;
  contextLen: number;
  embeddingDim: number;
  numHeads: number;
  ffDim: number;
  numLayers: number;
  totalParams: number;
  temperature: number;
  topP: number;
  corpusSentences: number;
  trainingSequences: number;
};

export type EpochResult = {
  epoch: number;
  loss: number;
  sample?: string;
};

export type TransformerTrainResult = {
  architecture: string;
  finalLoss: number;
  samples: { epoch: number; text: string }[];
};

type TrainOpts = {
  epochs: number;
  temperature: number;
  topP: number;
  numLayers: number;
  maxTokens: number;
  /** Stops training at the next epoch, for example when the client disconnects. */
  signal?: AbortSignal;
};

/** Fingerprint of the training text, so weights are never reloaded for a different corpus. */
export function corpusHash(): string {
  return createHash("sha256").update(TRAIN_TEXTS.join("\n")).digest("hex").slice(0, 8);
}

/** Name of the file holding a finished baseline run with these settings. */
export function baselineWeightsFilename(epochs: number, cfg: TransformerConfig): string {
  return `transformer-weights-e${epochs}-l${cfg.numLayers}-d${cfg.embDim}-h${cfg.numHeads}-ff${cfg.ffDim}-ctx${cfg.contextLen}-c${corpusHash()}-${MODEL_VERSION}.json`;
}

/** Bundle the train-worker.ts entry point with esbuild so it can be loaded as a Worker thread. */
function buildWorkerBundle(): string {
  // Resolve from the project root, not import.meta.url: in production this
  // module is bundled into dist/index.js, where the .ts source doesn't exist.
  const workerDir = join(process.cwd(), "src/routes/train-transformer");
  const workerEntry = join(workerDir, "train-worker.ts");
  const outfile = join(workerDir, ".train-worker.mjs");
  buildSync({
    entryPoints: [workerEntry],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    write: true,
  });
  return outfile;
}

/**
 * Train BPE on the corpus and number its tokens, most frequent first.
 *
 * The default runs BPE until every word is one token (it stops by itself at 1781 merges), so
 * samples hold only corpus words, never pieces such as " h" or "or".
 *
 * Shared by the training route and tests/search-transformer.ts, so a searched config sees
 * exactly the token ids the route would train on.
 */
export function buildVocabulary(numMerges = 2000) {
  let vocabulary = vocabularies.get(numMerges);
  if (!vocabulary) {
    vocabulary = trainVocabulary(numMerges);
    vocabularies.set(numMerges, vocabulary);
  }
  return vocabulary;
}

// BPE takes about a second here, and a free host's share of a CPU stretches that past ten, before
// a request can send anything. It depends only on the corpus, so each size is trained once.
const vocabularies = new Map<number, ReturnType<typeof trainVocabulary>>();

function trainVocabulary(numMerges: number) {
  const corpusText = TRAIN_TEXTS.map((s) => ` ${s}`)
    .join("")
    .toLowerCase();
  const { merges: bpeMerges } = trainBpeOnText(
    corpusText,
    numMerges,
    PRE_TOKEN_RE,
  );

  function tokenize(text: string): string[] {
    return applyMerges(` ${text}`.toLowerCase(), bpeMerges, PRE_TOKEN_RE);
  }

  const freq = new Map<string, number>();
  for (const sentence of TRAIN_TEXTS) {
    for (const tok of tokenize(sentence)) {
      freq.set(tok, (freq.get(tok) ?? 0) + 1);
    }
  }

  const indexToWord: string[] = [];
  const wordToIndex = new Map<string, number>();
  for (const [word] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
    wordToIndex.set(word, indexToWord.length);
    indexToWord.push(word);
  }

  return { bpeMerges, tokenize, indexToWord, wordToIndex };
}

/**
 * Train a decoder-only transformer from scratch — the main training pipeline.
 *
 * Steps:
 * 1. Build a BPE vocabulary from the story corpus
 * 2. Tokenize all sentences and construct overlapping (input, target) sequences
 * 3. If cached weights exist for this config, load them and skip training
 * 4. Otherwise, spawn N worker threads for data-parallel gradient computation
 * 5. Each epoch: workers compute forward+backward → main thread sums gradients → Adam step
 * 6. Periodically generate sample text to show learning progress
 *
 * Yields InitResult (architecture info), then EpochResult (loss + samples), then TransformerTrainResult.
 */
export async function* trainTransformer(
  opts: TrainOpts,
): AsyncGenerator<InitResult | EpochResult | TransformerTrainResult> {
  const { epochs, temperature, topP, numLayers, maxTokens } = opts;
  resetRand();

  const { bpeMerges, tokenize, indexToWord, wordToIndex } = buildVocabulary();
  const vocabSize = indexToWord.length;

  const cfg: TransformerConfig = {
    vocabSize,
    contextLen: 32,
    embDim: 32,
    numHeads: 2,
    ffDim: 128,
    numLayers,
  };

  const allTokenIds: number[] = [];
  for (const setence of TRAIN_TEXTS) {
    for (const tok of tokenize(setence)) {
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

  // The corpus fingerprint keeps weights trained on one training text from being reloaded
  // for another (the vocabulary and token ids would no longer match).
  const weightsFilename = baselineWeightsFilename(epochs, cfg);
  const weightsPath = join(process.cwd(), ".data", weightsFilename);

  const checkpointPath = (epoch: number) =>
    join(
      process.cwd(),
      ".data",
      `transformer-weights-e${epoch}-l${numLayers}-d${cfg.embDim}-h${cfg.numHeads}-ff${cfg.ffDim}-ctx${cfg.contextLen}-${MODEL_VERSION}.json`,
    );

  const cached = await tryLoadWeights(weightsPath);
  if (cached) {
    const w = cached.weights;

    yield {
      vocabSize,
      contextLen: cfg.contextLen,
      embeddingDim: cfg.embDim,
      numHeads: cfg.numHeads,
      ffDim: cfg.ffDim,
      numLayers: cfg.numLayers,
      totalParams: countParams(w),
      temperature,
      topP,
      corpusSentences: TRAIN_TEXTS.length,
      trainingSequences: sequences.length,
    };

    let totalLoss = 0;
    for (const seq of sequences) {
      const cache = forward(seq.input, w, cfg);
      totalLoss += crossEntropyLoss(cache.probs, seq.target, seqLen, vocabSize);
    }
    const finalLoss = totalLoss / sequences.length;

    // Saved samples used the settings of the original training run. Weights exist on disk only
    // at checkpoints and at the end, so those are the epochs that can follow this request.
    const lastEpoch = cached.history.at(-1)?.epoch;
    const samples: { epoch: number; text: string }[] = [];
    for (const entry of cached.history) {
      const weightsAtEpoch =
        entry.epoch === lastEpoch
          ? w
          : entry.epoch % 100 === 0
            ? await loadCheckpoint(
                checkpointPath(entry.epoch),
                entry.epoch,
                cached.history,
              )
            : null;
      const sample = weightsAtEpoch
        ? generateText(
            weightsAtEpoch,
            cfg,
            seedIds,
            maxTokens,
            indexToWord,
            temperature,
            topP,
            seqLen,
          )
        : entry.sample;
      if (sample !== undefined)
        samples.push({ epoch: entry.epoch, text: sample });
      yield { ...entry, sample };
    }

    yield {
      architecture: `Decoder-Only Transformer (${cfg.numLayers} layers, ${cfg.embDim}d, ${cfg.numHeads}h, ${cfg.ffDim}ff) — cached`,
      finalLoss: Math.round(finalLoss * 1000000) / 1000000,
      samples,
    };
    return;
  }

  const w = initWeights(cfg);
  const adamBuf = initAdam(w);

  yield {
    vocabSize,
    contextLen: cfg.contextLen,
    embeddingDim: cfg.embDim,
    numHeads: cfg.numHeads,
    ffDim: cfg.ffDim,
    numLayers: cfg.numLayers,
    totalParams: countParams(w),
    temperature,
    topP,
    corpusSentences: TRAIN_TEXTS.length,
    trainingSequences: sequences.length,
  };

  const step = 10;
  const earlyEpochs = 10;
  const sampleEvery = 10;
  const lr = 0.001;
  const serializedMerges = bpeMerges.map((m) => ({
    pair: m.pair,
    merged: m.merged,
  }));
  const collectedSamples: { epoch: number; text: string }[] = [];
  const history: EpochResult[] = [];

  const { layout, totalFloats } = computeLayout(cfg);
  const weightSab = packWeightsToSab(w, layout, totalFloats);

  const workerPath = buildWorkerBundle();

  const numWorkers = Math.max(1, cpus().length - 2);
  const seqsPerWorker = Math.ceil(sequences.length / numWorkers);

  const workerGradSabs: SharedArrayBuffer[] = [];
  const workers: Worker[] = [];

  // Workers must not outlive this generator: a return from the abort check, a consumer
  // breaking out of the stream, or an error all leave through this finally.
  try {
    for (let i = 0; i < numWorkers; i++) {
      const workerSeqs = sequences.slice(
        i * seqsPerWorker,
        (i + 1) * seqsPerWorker,
      );
      const gradSab = new SharedArrayBuffer(totalFloats * 4);
      workerGradSabs.push(gradSab);

      const worker = new Worker(workerPath, {
        workerData: {
          weightSab,
          gradSab,
          layout,
          cfg,
          sequences: workerSeqs,
          seqLen,
        },
      });
      workers.push(worker);
    }

    await Promise.all(
      workers.map(
        (worker) =>
          new Promise<void>((resolve) => {
            worker.once("message", (msg: { type: string }) => {
              if (msg.type === "ready") resolve();
            });
          }),
      ),
    );

    const grads = zeroGrads(cfg);

    const wShared = createWeightViews(weightSab, layout, cfg.numLayers);

    for (let epoch = 0; epoch <= epochs; epoch++) {
      if (opts.signal?.aborted) return;

      const results = await Promise.all(
        workers.map(
          (worker) =>
            new Promise<{ loss: number }>((resolve) => {
              worker.once("message", (msg: { type: string; loss: number }) => {
                if (msg.type === "done") resolve({ loss: msg.loss });
              });
              worker.postMessage({ type: "compute" });
            }),
        ),
      );

      let totalLoss = 0;
      for (const r of results) totalLoss += r.loss;

      sumGradsFromWorkers(grads, workerGradSabs, layout);
      adamUpdate(wShared, grads, adamBuf, lr, epoch + 1);

      const loss = totalLoss / sequences.length;

      // A full-batch epoch can take many seconds, so the first epochs all report: otherwise a
      // long run shows epoch 0 and then nothing for a minute or more, which looks like a hang.
      if (epoch <= earlyEpochs || epoch % step === 0 || epoch === epochs) {
        let sample: string | undefined;
        if (epoch % sampleEvery === 0 || epoch === epochs) {
          copyWeightsFromSab(weightSab, layout, w);
          sample = generateText(
            w,
            cfg,
            seedIds,
            maxTokens,
            indexToWord,
            temperature,
            topP,
            seqLen,
          );
          collectedSamples.push({ epoch, text: sample });
        }

        const entry: EpochResult = {
          epoch,
          loss: Math.round(loss * 1000000) / 1000000,
          sample,
        };
        history.push(entry);
        yield entry;
        await tick();
      }

      if (epoch > 0 && epoch % 100 === 0) {
        copyWeightsFromSab(weightSab, layout, w);
        await writeFile(
          checkpointPath(epoch),
          `${JSON.stringify(serializeModel(w, cfg, indexToWord, serializedMerges, history), null, 2)}\n`,
        );
      }
    }
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()));
  }

  copyWeightsFromSab(weightSab, layout, w);

  const finalLoss = (() => {
    let total = 0;
    for (const seq of sequences) {
      const cache = forward(seq.input, w, cfg);
      total += crossEntropyLoss(cache.probs, seq.target, seqLen, vocabSize);
    }
    return total / sequences.length;
  })();

  await writeFile(
    weightsPath,
    `${JSON.stringify(serializeModel(w, cfg, indexToWord, serializedMerges, history), null, 2)}\n`,
  );

  yield {
    architecture: `Decoder-Only Transformer (${cfg.numLayers} layers, ${cfg.embDim}d, ${cfg.numHeads}h, ${cfg.ffDim}ff)`,
    finalLoss: Math.round(finalLoss * 1000000) / 1000000,
    samples: collectedSamples,
  };
}
