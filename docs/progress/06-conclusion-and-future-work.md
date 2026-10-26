# 06. Conclusion and future work

## Conclusion

Rebuilding the pipeline by hand makes one pattern visible at every stage. ELIZA's behaviour is designed and fully explicable, but cannot learn. The XOR network, Skip-gram and (when finished) the transformer learn their behaviour from a random start, and their weights do not say why.

What has been shown so far, with measurements:

- A single-layer network cannot learn XOR, and a 2→4→1 network can; four seeds reach the same function through unrelated weights, and at 500 epochs one of the four had not converged.
- A Skip-gram model can silently collapse (all cosines 1.0) from small, individually plausible bugs, and when repaired it learns real geometry (king/queen 0.88 to 0.90 across four seeds, king−man+woman→queen on all four) and also wrong relations (kitten−cat+dog→lion on all four).
- Across four Skip-gram seeds the same word's vectors are unrelated (cosine −0.28 to 0.09) while the pairwise geometry agrees (Pearson 0.977 to 0.984). The learned function is stable and the weights are not; this weakens a strong reading of "random weights" and is reported as such.

What has **not** been shown: anything about the transformer's reasoning, seed sensitivity at transformer scale, or the effect of a symbolic layer. Those are specified (chapters 04 and 05) and unrun.

The argument of chapter 03 stands as a claim about the objective: next-token cross-entropy from random weights contains no representation of justification. The proposed response is deliberately modest. A logit mask and a decoupled verifier cannot give the network reasoning, but they can give a *checkable, traceable* account of constraint behaviour that does not depend on the weights, which is the explainability property that Sheth, Roy and Gaur (2023) argue for.

## Next steps, in order

1. **Finish the transformer** (owner decision pending on who writes it). Fix the three defects listed in chapter 05 §1.2, then LayerNorm, attention, block, forward, loss, backward, Adam, generation. Pass the five verification gates before anything else.
2. **Regenerate** `.data/embedding-weights.json` by re-running Skip-gram with saving on.
3. **Build the symbolic layer** (`symbolic.ts`, `constraints.ts`, verifier) and its tests (P1, P2).
4. **Run E1–E3**, then replace the "none yet" cells in chapter 05 §4 with measured values, and revise chapters 03 and 04 if a prediction is refuted.
5. Resolve the open items in chapter 05 §1.4.

## Future work

| Direction | Taxonomy | Note |
|---|---|---|
| Training-time semantic loss (equation 8) | toward 2b | Needs a differentiable constraint over the allowed set |
| Knowledge-graph embeddings seeded from the Skip-gram vocabulary | strict 1a | Embed the knowledge base into the model's representations instead of masking logits |
| Constraints over multi-token words | – | Track partial-word state so a banned word cannot leak through its continuation tokens |
| End-to-end differentiable reasoning | 2b | Out of scope for a model this size |
| Larger corpus and more seeds | – | Needed before any claim about scale |
| Compare attention maps against the trace | – | Do the heads attend to the tokens the rules fire on? |
