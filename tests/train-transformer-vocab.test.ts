/**
 * The transformer's vocabulary must rebuild the corpus exactly and hold only whole words.
 *
 * Word pieces in the vocabulary reach the page as tokens like " h" and "or", and text lost by the
 * pre-token regex is text the model never sees.
 */
import { describe, expect, test } from "bun:test";
import {
  buildVocabulary,
  TRAIN_TEXTS,
} from "../src/routes/train-transformer/train.js";

const { tokenize, indexToWord } = buildVocabulary();

describe("transformer vocabulary", () => {
  test("rejoined tokens rebuild every training text", () => {
    const normalise = (text: string) => text.replace(/\s+/g, " ");
    const changed = TRAIN_TEXTS.filter(
      (text) =>
        normalise(tokenize(text).join("")) !==
        normalise(` ${text}`.toLowerCase()),
    );

    expect(changed).toEqual([]);
  });

  test("every vocabulary entry is a whole word or punctuation mark", () => {
    const corpus = TRAIN_TEXTS.map((text) => ` ${text}`)
      .join("")
      .toLowerCase();
    const wholeTokens = new Set(corpus.match(/\s?\w+(?:'\w+)*|[^\w\s]/g));
    const pieces = indexToWord.filter((token) => !wholeTokens.has(token));

    expect(pieces).toEqual([]);
  });

  test("only punctuation can join the word before it", () => {
    // A bare "s" would fuse onto whatever was sampled before it, giving "thes".
    const joining = indexToWord.filter(
      (token) => !/^\s/.test(token) && !/^[^\w\s]$/.test(token),
    );

    expect(joining).toEqual([]);
  });
});
