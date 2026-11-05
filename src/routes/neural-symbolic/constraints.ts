// src/routes/neuro-symbolic/constraints.ts
import type { KnowledgeBase } from "./symbolic.js";
import { allowed } from "./symbolic.js";

export type StepTrace = {
  step: number;
  rulesFired: string[];
  maskedTokens: string[];
  supportedTokens: string[];
  unenforceable: string[];
  massBefore: number; // p(banned) at temperature 1, before editing: how much the network wanted it
  massAfter: number; // p(banned) after editing: 0 under the mask
  chosen: string;
  fallback: boolean; // everything banned → logits left untouched
};

export type ProcessorCtx = {
  ids: number[];
  step: number;
  logits: Float32Array;
  idxToToken: string[];
};
export type LogitsProcessor = (ctx: ProcessorCtx) => StepTrace;

function massOf(logits: Float32Array, ids: number[]): number {
  let max = -Infinity;
  for (const z of logits) if (z > max) max = z;
  let sum = 0;
  for (const z of logits) sum += Math.exp(z - max);
  let m = 0;
  for (const i of ids) m += Math.exp(logits[i] - max) / sum;
  return m;
}

export function makeProcessor(
  kb: KnowledgeBase,
  tokenIndex: Map<string, number[]>,
  opts: { mode: "mask" | "bias" | "both"; lambda: number },
): LogitsProcessor {
  return ({ ids, step, logits, idxToToken }) => {
    const a = allowed(kb, ids, idxToToken, tokenIndex);
    const trace: StepTrace = {
      step,
      rulesFired: a.fired,
      maskedTokens: a.banned.map((i) => idxToToken[i]),
      supportedTokens: a.supported.map((i) => idxToToken[i]),
      unenforceable: a.unenforceable,
      massBefore: massOf(logits, a.banned),
      massAfter: 0,
      chosen: "",
      fallback: false,
    };

    if (a.banned.length >= logits.length) {
      trace.fallback = true;
      trace.massAfter = trace.massBefore;
      return trace;
    }

    if (opts.mode !== "bias") for (const b of a.banned) logits[b] = -Infinity;
    if (opts.mode !== "mask")
      for (const s of a.supported) logits[s] += opts.lambda;
    trace.massAfter = opts.mode === "bias" ? massOf(logits, a.banned) : 0;
    return trace;
  };
}
