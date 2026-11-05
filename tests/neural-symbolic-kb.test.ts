import { describe, expect, test } from "bun:test";
import {
  allowed,
  buildTokenIndex,
  KnowledgeBase,
  RULES,
  TRIPLES,
} from "../src/routes/neural-symbolic/symbolic";
import { buildVocabulary, TRAIN_TEXTS } from "../src/routes/train-transformer/train";

// Runs on the real corpus and tokenizer. A synthetic vocabulary would pass with a KB that never fires.
const v = buildVocabulary();
const indexToWord = v.indexToWord;
const tokenIndex = buildTokenIndex(indexToWord);
const kb = new KnowledgeBase(TRIPLES, RULES);
const ids = TRAIN_TEXTS.flatMap((s) =>
  v.tokenize(s).flatMap((tok) => {
    const id = v.wordToIndex.get(tok);
    return id === undefined ? [] : [id];
  }),
);
const encode = (text: string) => v.tokenize(text).map((tok) => v.wordToIndex.get(tok)!);
const firings = ids.flatMap((target, p) => {
  if (p === 0) return [];
  const a = allowed(kb, ids.slice(Math.max(0, p - 16), p), indexToWord, tokenIndex);
  return a.fired.length ? [{ target, ...a }] : [];
});

describe("civil-law KB closure", () => {
  test("26 base facts close to 100 with no contradictions", () => {
    expect(TRIPLES).toHaveLength(26);
    expect(kb.facts.size).toBe(100);
    expect(kb.contradictions()).toEqual([]);
  });
  test("a cross-domain ban prints its proof", () => {
    const proof = kb.explain({ rel: "not_defined_by", a: "claimant", b: "owns" });
    expect(proof[0]).toContain("R-OTHER-DOMAIN");
    expect(proof.join("\n")).toContain("defined_by:landlord:owns [KnowledgeBase]");
  });
});

describe("civil-law KB on the training text", () => {
  test("it fires, and never bans the next token in the corpus", () => {
    expect(firings).toHaveLength(9);
    expect(firings.filter((f) => f.banned.includes(f.target))).toEqual([]);
    expect(firings.flatMap((f) => f.unenforceable)).toEqual([]);
  });
  test("every supported token at a firing is the corpus's next token", () => {
    const withSupport = firings.filter((f) => f.supported.length);
    expect(withSupport).toHaveLength(8);
    for (const f of withSupport) expect(f.supported).toContain(f.target);
  });
});

describe("civil-law KB frames", () => {
  const banned = (text: string) =>
    allowed(kb, encode(text), indexToWord, tokenIndex).banned.map((i) => indexToWord[i].trim()).sort();

  test("bans other roles' verbs inside the frame", () => {
    expect(banned("the claimant is the person who")).toEqual(
      ["answers", "buys", "owes", "owns", "rents", "sells"],
    );
  });
  test("is_owed does not block 'the debtor is the person who is liable'", () => {
    expect(banned("the debtor is the person who")).not.toContain("is");
    expect(banned("the debtor is the person who is")).toEqual(["owed"]);
    expect(banned("the creditor is the person who is")).toEqual([]);
  });
  test("the unreviewed landlord-rents ban is held back, with its fact kept", () => {
    expect(banned("the landlord is the person who")).not.toContain("rents");
    expect(kb.has("not_defined_by", "landlord", "rents")).toBe(true);
  });
  test("nothing fires outside a frame", () => {
    expect(banned("the landlord")).toEqual([]);
    expect(banned("the landlord pays the")).toEqual([]);
  });
});
