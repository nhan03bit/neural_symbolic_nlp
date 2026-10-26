import { describe, expect, test } from "bun:test";
import { cosineSimilarity } from "../src/server/lib/math.js";
import { mulberry32 } from "../src/server/lib/rng.js";
import type {
  EpochResult,
  InitResult,
  TrainEmbedResult,
} from "../src/routes/train-embed/train.js";
import { trainSkipGram } from "../src/routes/train-embed/train.js";

const WORDS = ["king", "queen", "man", "woman", "cat", "dog", "tiger"];

async function run(epochs: number) {
  const epochResults: EpochResult[] = [];
  let init: InitResult | undefined;
  let result: TrainEmbedResult | undefined;

  for await (const item of trainSkipGram({
    words: WORDS,
    epochs,
    dimensions: 32,
    windowSize: 2,
    negativeSamples: 5,
    save: false,
  })) {
    if ("embeddings" in item) result = item;
    else if ("vocabSize" in item) init = item;
    else epochResults.push(item);
  }

  return { init: init!, epochResults, result: result! };
}

describe("rng", () => {
  test("same seed gives the same sequence, different seed differs", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const c = mulberry32(8);
    const seqA = [a(), a(), a()];
    expect(seqA).toEqual([b(), b(), b()]);
    expect(seqA).not.toEqual([c(), c(), c()]);
  });
});

describe("cosineSimilarity", () => {
  test("handles a zero vector without NaN", () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });
});

describe("skip-gram", () => {
  test("loss falls and embeddings do not collapse", async () => {
    const { init, epochResults, result } = await run(300);

    expect(init.embeddingDim).toBe(32);
    expect(epochResults.length).toBeGreaterThan(5);
    expect(epochResults.at(-1)!.loss).toBeLessThan(epochResults[0].loss);
    expect(epochResults.every((e) => Number.isFinite(e.loss))).toBe(true);

    // The old bug made every pair ~1.0. Related and unrelated pairs must now differ.
    const scores = result.similarities.map((s) => s.score);
    expect(result.similarities.length).toBe(
      (WORDS.length * (WORDS.length - 1)) / 2,
    );
    expect(Math.min(...scores)).toBeLessThan(0.9);
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThan(0.1);

    // Words used in similar contexts end up closer than words that are not.
    const sim = (a: string, b: string) =>
      result.similarities.find(
        (s) => (s.a === a && s.b === b) || (s.a === b && s.b === a),
      )!.score;
    expect(sim("king", "queen")).toBeGreaterThan(sim("king", "cat"));
    expect(sim("man", "woman")).toBeGreaterThan(sim("man", "cat"));
  }, 60_000);

  test("analogy query labels match the arithmetic", async () => {
    const { result } = await run(50);
    for (const a of result.analogies) expect(a.query).toMatch(/ - .* \+ /);
  }, 60_000);
});
