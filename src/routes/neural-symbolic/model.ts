import type { NeuralSymbolicMeta } from "./train.js";
import { readFile } from "node:fs/promises";
import { applyMerges } from "../../server/lib/bpe.js";
import { PRE_TOKEN_RE, tryLoadWeights } from "../train-transformer/train.js";

export async function loadModel(path: string) {
  const m = await tryLoadWeights(path);
  if (!m) return null;

  const wordToIndex: Map<string, number> = new Map(m.vocab.map((t, i) => [t, i] as const));
  const tokenize = (text: string) => applyMerges(` ${text}`.toLowerCase(), m.merges, PRE_TOKEN_RE);
  const encode = (text: string) =>
    tokenize(text)
      .map((t) => wordToIndex.get(t))
      .filter((i): i is number => i !== undefined);
  /** Tokens `encode` loses because the vocabulary doesn't hold them. */
  const dropped = (text: string) => tokenize(text).filter((t) => !wordToIndex.has(t));

  return { ...m, encode, dropped };
}

/** The λ, seed and KB hash a neural-symbolic run recorded. Baseline files have none. */
export async function readRunMeta(path: string): Promise<NeuralSymbolicMeta | null> {
  const json = JSON.parse(await readFile(path, "utf-8"));
  return json.neuralSymbolic ?? null;
}
