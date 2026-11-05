/**
 * Worker thread for the neural-symbolic trainer. Kept apart from the baseline's worker so the
 * baseline stays cross-entropy only.
 *
 * It does what train-transformer/train-worker.ts does, and also adds the semantic loss gradient
 * at positions the knowledge base constrains. semLoss is measured at every λ, including 0, so the
 * CE-only control arm reports it without being trained on it.
 */
import type { TransformerConfig } from "../train-transformer/transformer.js";
import type { WeightLayout } from "../train-transformer/weigth-layout.js";
import type { SemMask } from "./semantic-loss.js";
import { parentPort, workerData } from "node:worker_threads";
import { backward, crossEntropyLoss, forward } from "../train-transformer/transformer.js";
import { createGradViews, createWeightViews } from "../train-transformer/weigth-layout.js";
import { addSemanticGrad, allowedMassAt } from "./semantic-loss.js";

const { weightSab, gradSab, layout, cfg, sequences, seqLen, semMasks, semGroups, ruleTokens, lambdaS } = workerData as {
  weightSab: SharedArrayBuffer;
  gradSab: SharedArrayBuffer;
  layout: WeightLayout;
  cfg: TransformerConfig;
  sequences: { input: number[]; target: number[] }[];
  seqLen: number;
  semMasks: SemMask[];
  semGroups: (number | null)[][];
  /** Trigger → ban rule → the token ids of that rule's word. */
  ruleTokens: number[][][];
  lambdaS: number;
};

const w = createWeightViews(weightSab, layout, cfg.numLayers);
const grads = createGradViews(gradSab, layout, cfg.numLayers);
const constrained = semMasks.map((mask) => mask.some((banned) => banned !== null));

parentPort!.on("message", (msg: { type: string }) => {
  if (msg.type !== "compute") return;

  new Float32Array(gradSab).fill(0);
  let totalLoss = 0;
  // Totalled by trigger pattern, so the patterns add up to the epoch's semantic loss exactly.
  const groupSem = new Float64Array(ruleTokens.length);
  const groupMass = new Float64Array(ruleTokens.length);
  const groupRuleMass = ruleTokens.map((rules) => new Float64Array(rules.length));

  sequences.forEach((seq, k) => {
    const cache = forward(seq.input, w, cfg);
    totalLoss += crossEntropyLoss(cache.probs, seq.target, seqLen, cfg.vocabSize);
    if (constrained[k]) {
      semMasks[k].forEach((banned, t) => {
        const group = semGroups[k][t];
        if (!banned || group === null) return;
        const pA = allowedMassAt(cache.probs, t * cfg.vocabSize, cfg.vocabSize, banned);
        groupSem[group] -= Math.log(pA) / seqLen;
        groupMass[group] += 1 - pA;
        ruleTokens[group].forEach((tokens, r) => {
          for (const id of tokens) groupRuleMass[group][r] += cache.probs[t * cfg.vocabSize + id];
        });
      });
    }

    const addSem = constrained[k] && lambdaS > 0
      ? (dLogits: Float32Array, probs: Float32Array, S: number, V: number) =>
          addSemanticGrad(dLogits, probs, semMasks[k], S, V, lambdaS)
      : undefined;
    backward(cache, seq.target, w, cfg, grads, addSem);
  });

  parentPort!.postMessage({ type: "done", loss: totalLoss, groupSem, groupMass, groupRuleMass });
});

parentPort!.postMessage({ type: "ready" });
