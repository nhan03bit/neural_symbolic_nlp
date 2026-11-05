/** Semantic loss is averaged over mostly unconstrained windows, so it needs exponent notation. */
export const formatSem = (v: number) => (v === 0 ? "0" : v.toExponential(3));
