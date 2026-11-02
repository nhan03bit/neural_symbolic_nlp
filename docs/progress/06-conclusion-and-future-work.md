# 06. Conclusion and future work

## Conclusion

Rebuilding the pipeline by hand makes one pattern visible at every stage. ELIZA's behaviour is designed and fully explicable, but cannot learn. The XOR network, Skip-gram and the transformer learn their behaviour from a random start, and their weights do not say why.

What has been shown so far, with measurements:

- A single-layer network cannot learn XOR, and a 2→4→1 network can; four seeds reach the same function through unrelated weights, and at 500 epochs one of the four had not converged.
- A Skip-gram model can silently collapse (all cosines 1.0) from small, individually plausible bugs, and when repaired it learns real geometry (king/queen 0.88 to 0.90 across four seeds, king−man+woman→queen on all four) and also wrong relations (kitten−cat+dog→lion on all four) on the toy corpus. On the civil-law corpus, on one seed, 0 of 5 role analogies are correct.
- Across four Skip-gram seeds the same word's vectors are unrelated (cosine −0.28 to 0.09) while the pairwise geometry agrees (Pearson 0.977 to 0.984). The learned function is stable and the weights are not; this weakens a strong reading of "random weights" and is reported as such.

- The transformer trains end to end on the civil-law text. Its one recorded baseline, on one seed and with three known defects, stops at a loss of 5.678 and produces domain words in no order.

What has **not** been shown: anything about the transformer's reasoning, seed sensitivity at transformer scale, or the effect of a symbolic layer. Those are specified (chapters 04 and 05) and unrun.

The argument of chapter 03 stands as a claim about the objective: next-token cross-entropy from random weights contains no representation of justification. The proposed response is deliberately modest. A logit mask and a decoupled verifier cannot give the network reasoning, but they can give a *checkable, traceable* account of constraint behaviour that does not depend on the weights, which is the explainability property that Sheth, Roy and Gaur (2023) argue for.

Adding the semantic loss does not close the gap either, according to the literature and our derivations (chapter 03 §7). It is deterministic, so randomness is not why it falls short. It cannot choose among allowed tokens, it is a soft penalty, it acts only where applied, and it inherits the knowledge base's errors. Weight initialisation and top-p sampling both remain. The realistic target is zero mass on rule-excluded tokens and a calibrated spread over the rest, with each guarantee stated next to its coverage.

## Next steps, in order

1. **Fix the transformer.** Fix D1–D3 (chapter 05 §1.2), pass the five verification gates, then re-run the baseline.
2. **Write a civil-law knowledge base**, and stop if `constrainedPositions` is 0. Decide whether M5 gets unlabelled probe contexts, because without them it mostly changes learning speed (chapter 04 §7).
3. **Add seeds and a held-out split** (preconditions in chapter 05 §2).
4. **Build the symbolic layer** (`symbolic.ts`, `constraints.ts`, verifier) and its tests (P1, P2). The verifier should report claims parsed.
5. **Run E1–E4**, then replace the "none yet" cells in chapter 05 §4 with measured values, and revise chapters 03 and 04 if a prediction is refuted.
6. Rewrite `tests/ieee-data.ts` for the civil-law corpus and the `report/` folder, and resolve the other open items in chapter 05 §1.4.

## Future work

| Direction | Taxonomy | Note |
|---|---|---|
| Unlabelled probe contexts for the semantic loss | toward 2b | Where M5 could add something cross-entropy does not. Must be measured for collapse onto one allowed token |
| Measuring what remains | – | Multi-seed ensembles describe seed spread. Conformal methods need fresh held-out prompts and promise only marginal coverage |
| Query, reasoner and template as a control arm | – | Removes model randomness from the output's content, at the cost of generation |
| Knowledge-graph embeddings seeded from the Skip-gram vocabulary | strict 1a | Embed the knowledge base into the model's representations instead of masking logits |
| Constraints over multi-token words | – | Compile a string-level automaton over tokens, shared by M1 and M5, so a banned word cannot leak through pieces |
| End-to-end differentiable reasoning | 2b | Out of scope for a model this size |
| Larger corpus and more seeds | – | Needed before any claim about scale |
| Compare attention maps against the trace | – | Do the heads attend to the tokens the rules fire on? |
