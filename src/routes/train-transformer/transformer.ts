/**
 * A decoder-only transformer implemented entirely from scratch — no ML libraries.
 *
 * Vaswani et al. (2017) introduced the transformer in "Attention Is All You Need."
 * This file implements every operation by hand: forward pass, backpropagation through
 * attention, layer norm, feed-forward layers, and embedding lookups. The code is
 * intentionally verbose so you can point at any line and explain the math.
 *
 * @see https://arxiv.org/abs/1706.03762 — "Attention Is All You Need"
 *
 * Architecture (decoder-only, like GPT):
 *   token embeddings + positional embeddings
 *   → N transformer blocks (layer norm → multi-head causal self-attention → residual
 *                           → layer norm → feed-forward → residual)
 *   → layer norm → linear head → logits
 *
 * Every weight is a flat Float32Array. Every gradient is computed analytically.
 */
import { addBias, addInPlace, matmul, matmulTransAm, matmulTransB, ones, rand, sumCols, xavierInit, zeros } from "./matrix.js";

export type TransfomerConfig = {
  vocabSize: number;
  contextLen: number;
  embDim: number;
  numHeads: number;
  ffDim: number;
  numLayes: number;
}

export type BlockWeights = {
  ln1Gamma: Float32Array;
  ln1Beta: Float32Array;
  wQ: Float32Array;
  bQ: Float32Array;
  wK: Float32Array;
  bK: Float32Array;
  wV: Float32Array;
  bV: Float32Array;
  wO: Float32Array;
  bO: Float32Array;
  ln2Gamma: Float32Array;
  ln2Beta: Float32Array;
  ff1W: Float32Array;
  ff1B: Float32Array;
  ff2W: Float32Array;
  ff2B: Float32Array;
}

export type TransformerWeights = {
  tokEmb: Float32Array;
  posEmb: Float32Array;
  blocks: BlockWeights[];
  lnFGamma: Float32Array;
  lnFBeta: Float32Array;
  headW: Float32Array;
  headB: Float32Array;
}

export type BlockGrads = { [K in keyof BlockWeights]: Float32Array };
export type TransformerGrads = {
  tokEmb: Float32Array;
  posEmb: Float32Array;
  blocks: BlockGrads[];
  lnFGamma: Float32Array;
  lnFBeta: Float32Array;
  headW: Float32Array;
  headB: Float32Array;
}

type BlockAdamBuf = { [K in keyof BlockWeights]: { m: Float32Array, v: Float32Array }};
type AdamBuf = {
  tokEmb: { m: Float32Array; v: Float32Array };
  posEmb: { m: Float32Array; v: Float32Array };
  blocks: BlockAdamBuf[];
  lnFGamma: { m: Float32Array; v: Float32Array };
  lnFBeta: { m: Float32Array; v: Float32Array };
  headW: { m: Float32Array; v: Float32Array };
  headB: { m: Float32Array; v: Float32Array };
}

export const BLOCK_KEYS: (keyof BlockWeights)[] = [
  "ln1Gamma",
  "ln1Beta",
  "wQ",
  "bQ",
  "wK",
  "bK",
  "wV",
  "bV",
  "wO",
  "bO",
  "ln2Gamma",
  "ln2Beta",
  "ff1W",
  "ff1B",
  "ff2W",
  "ff2B",
];

type BlockCache = {
  input: Float32Array;
  ln1Out: Float32Array;
  ln1Mean: Float32Array;
  ln1Var: Float32Array;
  ln1Hat: Float32Array;
  Q: Float32Array;
  K: Float32Array;
  V: Float32Array;
  attnWeights: Float32Array;
  attnOut: Float32Array;
  x1: Float32Array;
  ln2Out: Float32Array;
  ln2Mean: Float32Array;
  ln2Var: Float32Array;
  ln2Hat: Float32Array;
  ff1Out: Float32Array;
  reluOut: Float32Array;
  ff2Out: Float32Array;
  output: Float32Array;
}

export type ForwardCache = {
  tokenIds: number[];
  x0: Float32Array;
  blockCaches: BlockCache[];
  lnFOut: Float32Array;
  lnFMean: Float32Array;
  lnFVar: Float32Array;
  lnFHat: Float32Array;
  logits: Float32Array;
  probs: Float32Array;
}

// Initialize

/** Create one transformer block's weight matrices, initialized with Xavier/Glorot. */
function initBlockWeights(D: number, F: number): BlockWeights {
  return {
    ln1Gamma: ones(D),
    ln1Beta: ones(D),
    wQ: xavierInit(D * D, D, D),
    bQ: zeros(D),
    wK: xavierInit(D * D, D, D),
    bK: zeros(D),
    wV: xavierInit(D * D, D, D),
    bV: zeros(D),
    wO: xavierInit(D * D, D, D),
    bO: zeros(D),
    ln2Gamma: ones(D),
    ln2Beta: zeros(D),
    ff1W: xavierInit(D * F, D, F),
    ff1B: zeros(D),
    ff2W: xavierInit(F * D, F, D),
    ff2B: zeros(D),
  };
}

/** Allocate zeroed gradient buffers matching one block's weight shapes. */
function zeroBlockGrads(D: number, F: number): BlockGrads {
  return {
    ln1Gamma: zeros(D),
    ln1Beta: zeros(D),
    wQ: zeros(D * D),
    bQ: zeros(D),
    wK: zeros(D * D),
    bK: zeros(D),
    wV: zeros(D * D),
    bV: zeros(D),
    wO: zeros(D * D),
    bO: zeros(D),
    ln2Gamma: zeros(D),
    ln2Beta: zeros(D),
    ff1W: zeros(D * F),
    ff1B: zeros(F),
    ff2W: zeros(F * D),
    ff2B: zeros(D),
  }
}

/**
 * Initialize all transformer weights — token/positional embeddings, N blocks, final layer norm, and output head.
 *
 * Every weight matrix uses Xavier/Glorot uniform initialization: values drawn from
 * [-sqrt(6/(fanIn+fanOut)), +sqrt(6/(fanIn+fanOut))]. This keeps activations and
 * gradients at a reasonable scale so training doesn't explode or vanish in the first steps.
 *
 * @see https://proceedings.mlr.press/v9/glorot10a.html — Glorot & Bengio (2010) "Understanding the difficulty of training deep feedforward neural networks"
 */