/**
 * Lifting: reads the network's next-word predictions at definition frames and classifies each
 * confident one against the KB.
 *
 * - `confirmed`: the KB already holds it. Evidence the network learned the fact, though on this
 *   model it may be memorisation.
 * - `conflict`: the KB derives the opposite. Direct evidence of the reasoning gap (chapter 03).
 * - `novel`: neither. It would need p >= τ and no new contradiction to be accepted.
 *
 * Nothing here changes the KB. A wrong accepted fact would reach both the semantic loss and the
 * mask, so candidates are reported and that step stays off.
 */
import type { TransformerConfig, TransformerWeights } from "../train-transformer/transformer.js";
import type { KnowledgeBase, Triple } from "./symbolic.js";
import { forward } from "../train-transformer/transformer.js";
import { baseForm, FRAMES, key, NOT_ENFORCED } from "./symbolic.js";

export type LiftStatus = "confirmed" | "conflict" | "novel";

export type LiftedCandidate = {
  /** Always a defined_by claim: what the network predicts defines this role word. */
  triple: Triple;
  p: number;
  status: LiftStatus;
  /** The context that gave the highest p, such as "claimant is the person who". */
  pattern: string;
  /** Key of the fact that proves the status, if the KB has one. */
  proofKey?: string;
  /** The KB derives the opposite, but NOT_ENFORCED marks that fact as unreviewed. */
  heldBack?: boolean;
  /** `novel` only: p >= τ and adding it would create no contradiction. Never actually added. */
  passesGate?: boolean;
};

export const LIFT_MIN_P = 0.02;
export const LIFT_TAU = 0.3;

/**
 * Grammar words that follow these frames without claiming anything about a role. There is no
 * part-of-speech tagger here, so this list is a judgement, and other words may still read as noise.
 */
const FUNCTION_WORDS = new Set(
  "a an and are as at be been but by for from had has have he her his if in into is it its of on or she so that the their them they this to was were which who will with would".split(" "),
);

/** Classifies one role and word against the KB. `consistent` is only asked about novel words past τ. */
export function classifyCandidate(
  kb: KnowledgeBase,
  role: string,
  word: string,
  p: number,
  pattern: string,
  consistent: (t: Triple, p: number) => boolean,
  tau = LIFT_TAU,
): LiftedCandidate {
  const verb = baseForm(word) ?? word;
  const triple: Triple = { rel: "defined_by", a: role, b: verb };
  const opposite: Triple = { rel: "not_defined_by", a: role, b: verb };

  if (kb.has(triple.rel, role, verb)) return { triple, p, status: "confirmed", pattern, proofKey: key(triple) };
  if (kb.has(opposite.rel, role, verb)) {
    const held = NOT_ENFORCED.has(key(opposite));
    return { triple, p, status: "conflict", pattern, proofKey: key(opposite), ...(held ? { heldBack: true } : {}) };
  }
  return { triple, p, status: "novel", pattern, passesGate: p >= tau && consistent(triple, p) };
}

/** True if adding the triple leaves the KB with no more contradictions than it had. */
function staysConsistent(kb: KnowledgeBase, t: Triple, p: number): boolean {
  const trial = kb.clone();
  const before = trial.contradictions().length;
  trial.assert(t, { source: "lifted", p });
  trial.close();
  return trial.contradictions().length <= before;
}

/**
 * Prepares the probes once, so reading them every epoch costs only forward passes. A frame ending
 * in "is" needs one more step: is_owed's surface word is "owed", so that candidate's p is the joint
 * probability of "is" and then "owed".
 */
export function makeLifter(
  kb: KnowledgeBase,
  cfg: TransformerConfig,
  idxToToken: string[],
  encode: (text: string) => number[],
  windowSize: number,
) {
  const V = cfg.vocabSize;
  const roles = [...new Set([...kb.facts.values()].filter(({ t }) => t.rel === "defined_by").map(({ t }) => t.a))];
  const probes = roles.flatMap((role) =>
    FRAMES.map((frame) => {
      const pattern = frame.map((p) => (p === "?x" ? role : p)).join(" ");
      return { role, pattern, ids: encode(`the ${pattern}`).slice(-windowSize) };
    }),
  );
  const isId = idxToToken.indexOf(" is");
  const owedId = idxToToken.indexOf(" owed");
  const gateCache = new Map<string, boolean>();
  const consistent = (t: Triple, p: number) => {
    const k = key(t);
    if (!gateCache.has(k)) gateCache.set(k, staysConsistent(kb, t, p));
    return gateCache.get(k)!;
  };

  return (w: TransformerWeights): LiftedCandidate[] => {
    const best = new Map<string, LiftedCandidate>();
    const offer = (role: string, word: string, p: number, pattern: string) => {
      const k = `${role}|${word}`;
      if ((best.get(k)?.p ?? 0) < p) best.set(k, classifyCandidate(kb, role, word, p, pattern, consistent));
    };

    for (const { role, pattern, ids } of probes) {
      const { probs } = forward(ids, w, cfg);
      const row = (ids.length - 1) * V;
      for (let id = 0; id < V; id++) {
        const p = probs[row + id];
        if (p < LIFT_MIN_P) continue;
        const token = idxToToken[id];
        if (!/^ [a-z]+$/.test(token)) continue;
        const word = token.trim();
        if (FUNCTION_WORDS.has(word) && !baseForm(word)) continue;
        offer(role, word, p, pattern);
      }

      if (isId >= 0 && owedId >= 0 && probs[row + isId] >= LIFT_MIN_P) {
        const next = [...ids, isId].slice(-windowSize);
        const after = forward(next, w, cfg).probs;
        const joint = probs[row + isId] * after[(next.length - 1) * V + owedId];
        if (joint >= LIFT_MIN_P) offer(role, "owed", joint, `${pattern} is`);
      }
    }

    return [...best.values()]
      .map((c) => ({ ...c, p: Math.round(c.p * 1e6) / 1e6 }))
      .sort((a, b) => b.p - a.p);
  };
}

/** Accept novel candidates that keep the KB consistent. Returns the next KB and an audit log. */
export function acceptLifted(kb: KnowledgeBase, cands: LiftedCandidate[], tau = 0.3) {
  const next = kb.clone();
  const log: { triple: Triple; p: number; accepted: boolean; reason: string }[] = [];

  for (const c of cands) {
    if (c.status !== "novel") continue;
    if (c.p < tau) {
      log.push({ triple: c.triple, p: c.p, accepted: false, reason: `p < τ=${tau}`});
      continue;
    }

    const trial = next.clone();
    const before = trial.contradictions().length;
    trial.assert(c.triple, { source: "lifted", p: c.p });
    trial.close();

    if (trial.contradictions().length > before) {
      log.push({ triple: c.triple, p: c.p, accepted: false, reason: "would contradict KB"});
      continue;
    }
    next.assert(c.triple, { source: "lifted", p: c.p });
    next.close();
    log.push({ triple: c.triple, p: c.p, accepted: true, reason: "consistent" });
  }
  return { kb: next, log };
}
