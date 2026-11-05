/**
 * M4 verifier: reads definition claims out of generated text and checks them against the KB.
 *
 * It parses definition frames only ("the claimant is the person who brings"). `not_defined_by`
 * says what does not define a role word, so a bare "the creditor brings a claim" is not a
 * violation. Counts are returned as well, because zero violations means nothing without knowing
 * how many claims were checked.
 */
import type { KnowledgeBase, Triple } from "./symbolic.js";
import { baseForm, FRAMES, key, NOT_ENFORCED } from "./symbolic.js";

export type ClaimStatus = "supported" | "contradicted" | "unknown";
export type Claim = { sentence: string; claim: Triple; status: ClaimStatus; proof: string[] };
export type VerifyReport = {
  claims: Claim[];
  parsed: number;
  supported: number;
  contradicted: number;
  unknown: number;
};

/** The word or phrase after a frame. "is owed" is the only KB verb that takes two words. */
function verbAfterFrame(rest: string[]): string | undefined {
  if (rest[0] === "is" && rest[1] === "owed") return "owed";
  if (rest[0] === "is" && rest[1]) return `is ${rest[1]}`;
  // A frame may end the text mid-claim: "... who is" has not claimed anything yet.
  return rest[0] === "is" ? undefined : rest[0];
}

function classify(kb: KnowledgeBase, sentence: string, x: string, word: string): Claim {
  const verb = baseForm(word) ?? word;
  const claim: Triple = { rel: "defined_by", a: x, b: verb };
  const opposite: Triple = { rel: "not_defined_by", a: x, b: verb };

  if (kb.has(claim.rel, x, verb)) return { sentence, claim, status: "supported", proof: kb.explain(claim) };
  // A held-back fact is unreviewed, so it counts as unknown here too, the same as at the mask.
  if (kb.has(opposite.rel, x, verb) && !NOT_ENFORCED.has(key(opposite))) {
    return { sentence, claim, status: "contradicted", proof: kb.explain(opposite) };
  }
  return { sentence, claim, status: "unknown", proof: [] };
}

export function verify(kb: KnowledgeBase, text: string): VerifyReport {
  const entities = kb.entities();
  const claims: Claim[] = [];

  for (const raw of text.toLowerCase().split(/[.!?]+/)) {
    const sentence = raw.trim();
    const words = sentence.split(/\s+/);

    for (const frame of FRAMES) {
      for (let i = 0; i + frame.length < words.length; i++) {
        const x = words[i];
        const matches = entities.has(x) && frame.every((p, k) => p === "?x" || p === words[i + k]);
        if (!matches) continue;

        const word = verbAfterFrame(words.slice(i + frame.length));
        if (word) claims.push(classify(kb, sentence, x, word));
      }
    }
  }

  const count = (status: ClaimStatus) => claims.filter((c) => c.status === status).length;
  return {
    claims,
    parsed: claims.length,
    supported: count("supported"),
    contradicted: count("contradicted"),
    unknown: count("unknown"),
  };
}
