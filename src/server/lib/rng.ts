/**
 * Seedable pseudo-random number generator (Mulberry32).
 *
 * Training starts from random weights, so every run differs unless the generator is
 * seeded. A fixed seed makes a run reproducible, and varying the seed shows how much
 * of a model's behaviour comes from the initial randomness rather than from the data.
 */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
