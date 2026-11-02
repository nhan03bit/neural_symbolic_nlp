/**
 * A cached run has no training to do, but what it generates must still follow the request.
 *
 * Runs against a throwaway .data directory, so it needs no saved weights from a real run.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TransformerTrainResult } from "../src/routes/train-transformer/train.js";
import { resetRand } from "../src/routes/train-transformer/matrix.js";
import {
  buildVocabulary,
  MODEL_VERSION,
  TRAIN_TEXTS,
  trainTransformer,
} from "../src/routes/train-transformer/train.js";
import { initWeights } from "../src/routes/train-transformer/transformer.js";

const EPOCHS = 300;
const LAYERS = 1;
const SEED_TOKENS = 3;
const OLD_SAMPLE = " the claimant is saved during training";

const originalCwd = process.cwd();
let sandbox: string;

function plain(values: Float32Array) {
  return Array.from(values);
}

beforeAll(() => {
  const { indexToWord } = buildVocabulary();
  resetRand(42);
  const w = initWeights({
    vocabSize: indexToWord.length,
    contextLen: 32,
    embDim: 32,
    numHeads: 2,
    ffDim: 128,
    numLayers: LAYERS,
  });

  sandbox = mkdtempSync(join(tmpdir(), "transformer-cache-"));
  mkdirSync(join(sandbox, ".data"));
  const corpusHash = createHash("sha256").update(TRAIN_TEXTS.join("\n")).digest("hex").slice(0, 8);
  const weights = {
    tokEmb: plain(w.tokEmb),
    posEmb: plain(w.posEmb),
    blocks: w.blocks.map((block) =>
      Object.fromEntries(Object.entries(block).map(([k, v]) => [k, plain(v)])),
    ),
    lnFGamma: plain(w.lnFGamma),
    lnFBeta: plain(w.lnFBeta),
    headW: plain(w.headW),
    headB: plain(w.headB),
  };
  const history = [0, 50, 100, 200, EPOCHS].map((epoch) => ({
    epoch,
    loss: 6.7 - epoch / 1000,
    sample: OLD_SAMPLE,
  }));
  const save = (name: string, log: typeof history) =>
    writeFileSync(join(sandbox, ".data", name), JSON.stringify({ history: log, weights }));

  save(`transformer-weights-e${EPOCHS}-l${LAYERS}-d32-h2-ff128-ctx32-c${corpusHash}-${MODEL_VERSION}.json`, history);
  // Epoch 100 belongs to this run. Epoch 200's log differs, as if a later run had overwritten it.
  save(`transformer-weights-e100-l${LAYERS}-d32-h2-ff128-ctx32-${MODEL_VERSION}.json`, history.slice(0, 3));
  save(
    `transformer-weights-e200-l${LAYERS}-d32-h2-ff128-ctx32-${MODEL_VERSION}.json`,
    history.slice(0, 4).map((entry) => ({ ...entry, loss: entry.loss + 1 })),
  );
  process.chdir(sandbox);
});

afterAll(() => {
  process.chdir(originalCwd);
  rmSync(sandbox, { recursive: true, force: true });
});

async function runCached(maxTokens: number, temperature = 1, topP = 1) {
  let done: TransformerTrainResult | undefined;
  const bySavedEpoch = new Map<number, string | undefined>();
  for await (const event of trainTransformer({
    epochs: EPOCHS,
    temperature,
    topP,
    numLayers: LAYERS,
    maxTokens,
  })) {
    if ("architecture" in event) done = event;
    else if ("epoch" in event) bySavedEpoch.set(event.epoch, event.sample);
  }
  if (!done) throw new Error("no done event");
  expect(done.architecture).toContain("cached");
  return { done, bySavedEpoch };
}

describe("cached transformer run", () => {
  const { tokenize } = buildVocabulary();

  test("the final sample has as many tokens as the request asks for", async () => {
    const short = await runCached(5);
    const long = await runCached(20);

    // tokenize() can split a sampled sequence differently, so compare with some slack.
    const shortTokens = tokenize(short.done.samples.at(-1)!.text.trim()).length;
    const longTokens = tokenize(long.done.samples.at(-1)!.text.trim()).length;
    expect(Math.abs(shortTokens - (SEED_TOKENS + 5))).toBeLessThanOrEqual(2);
    expect(Math.abs(longTokens - (SEED_TOKENS + 20))).toBeLessThanOrEqual(4);

    // The epoch stream and the done event must agree, because the page shows the latter last.
    expect(long.bySavedEpoch.get(EPOCHS)).toBe(long.done.samples.at(-1)!.text);
  }, 120_000);

  test("the final sample follows the requested temperature and top-p", async () => {
    const hot = await runCached(20, 1.5, 1);
    const narrow = await runCached(20, 0.2, 0.1);
    expect(hot.done.samples.at(-1)!.text).not.toBe(narrow.done.samples.at(-1)!.text);
  }, 120_000);

  test("a checkpoint from this run gets a sample that follows the request", async () => {
    const { bySavedEpoch, done } = await runCached(20);
    const fresh = bySavedEpoch.get(100)!;
    expect(fresh).not.toBe(OLD_SAMPLE);
    expect(Math.abs(tokenize(fresh.trim()).length - (SEED_TOKENS + 20))).toBeLessThanOrEqual(4);
    expect(done.samples.find((s) => s.epoch === 100)?.text).toBe(fresh);
  }, 120_000);

  test("epochs with no usable weights keep the sample saved during training", async () => {
    const { bySavedEpoch, done } = await runCached(20);
    expect(bySavedEpoch.get(0)).toBe(OLD_SAMPLE); // Never checkpointed.
    expect(bySavedEpoch.get(50)).toBe(OLD_SAMPLE); // Between checkpoints.
    expect(bySavedEpoch.get(200)).toBe(OLD_SAMPLE); // Checkpoint from a different run.
    expect(done.samples.find((s) => s.epoch === 0)?.text).toBe(OLD_SAMPLE);
  }, 120_000);
});
