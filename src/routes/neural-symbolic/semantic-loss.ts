/**
 * Semantic loss (Xu et al., 2018, in the "exactly one of A" form):
 *   L_sem = -(1/S) Σ_t log Σ_{i∈A_t} p_{t,i}
 * banned[t] = token ids outside A_t, or null when position t has no constraint.
 * @see https://arxiv.org/abs/1711.11157 — Xu et al. (2018) "A Semantic Loss Function for Deep Learning with Symbolic Knowledge"
 */
export type SemMask = (number[] | null)[];

function allowedMass(probs: Float32Array, row: number, V: number, isBanned: Uint8Array): number {
  let pA = 0;
  for (let j = 0; j < V; j++) if (!isBanned[j]) pA += probs[row + j];
  return Math.max(pA, 1e-10);
}

/** P_A at one position, so a caller can attribute the loss to whatever fired there. */
export function allowedMassAt(probs: Float32Array, row: number, V: number, banned: number[]): number {
  return allowedMass(probs, row, V, bannedFlags(banned, V));
}

function bannedFlags(B: number[], V: number): Uint8Array {
  const f = new Uint8Array(V);
  for (const j of B) f[j] = 1;
  return f;
}

export function semanticLoss(probs: Float32Array, banned: SemMask, S: number, V: number): number {
  let loss = 0;
  for (let t = 0; t < S; t++) {
    const B = banned[t];
    if (!B || B.length === 0 || B.length >= V) continue;
    loss -= Math.log(allowedMass(probs, t * V, V, bannedFlags(B, V)));
  }
  return loss / S;
}

/** Adds λ_s · ∂L_sem/∂z into dLogits (which already holds the CE gradient, scaled by 1/S). */
export function addSemanticGrad(
  dLogits: Float32Array,
  probs: Float32Array,
  banned: SemMask,
  S: number,
  V: number,
  lambdaS: number,
): void {
  const c = lambdaS / S;
  for (let t = 0; t < S; t++) {
    const B = banned[t];
    if (!B || B.length === 0 || B.length >= V) continue;

    const row = t * V;
    const isBanned = bannedFlags(B, V);
    const pA = allowedMass(probs, row, V, isBanned);

    for (let j = 0; j < V; j++) {
      const p = probs[row + j];
      dLogits[row + j] += isBanned[j] ? c * p : c * p * (1 - 1 / pA);
    }
  }
}