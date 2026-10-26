# 03. The reasoning gap

**Thesis.** A transformer is fitted, not designed. It is trained from random weights to minimise next-token loss, so what it ends up computing is a statistical compression of its data. It has no component that represents *why* an output is right, and so it cannot account for its own outputs. The study note says this in its closing callout (p5):

> the LLM abstracts relationships in the data but "lack the ability reasoning Why? its own output. Due to randomness of each Self Attention and Feed Forwarding. The model guessing the best weight to achieved 'Target Error' But lack the Critical Reasoning to its own."

This chapter separates that sentence into four claims, says how much support each has in this project, and states where the claim should *not* be pushed.

## 1. The objective contains no notion of truth

Equation (6) of chapter 02 rewards assigning high probability to the token that actually followed in the training text. It rewards plausibility with respect to the corpus. It does not reward:

- being consistent with a stated fact;
- being able to derive the answer;
- being able to say which earlier tokens or rules justified it.

A model can therefore reach low loss by producing text that *sounds* like the corpus while contradicting what the corpus implies. In our setting the corpus is 34 short stories where, for example, a kitten is a young cat and a king is a man. Nothing in the loss forbids "the kitten barked".

*Support in this project:* argument from the objective, plus the stage-3 analogue: Skip-gram reaches a loss of 1.24 to 1.27 and still answers `kitten − cat + dog` with "lion" (cosine 0.81 to 0.86) on all four seeds (chapter 01 §4.3 and §4.5). Low loss, a high score and a wrong relation coexist.

## 2. Weights come from a random start, not from a design

Training begins at a random point (Xavier initialisation; chapter 02) and follows stochastic gradients to a nearby minimum. Different seeds give different minima.

*Support in this project (small scale, measured):* on XOR, four seeds with identical data, architecture, loss and optimiser all reach the same function (outputs 0.01 / 0.98 / 0.98 / 0.02, loss about $3\times10^{-4}$), yet their first hidden unit's weights are [5.84, −1.49, 6.18, −0.28], [0, −6.5, −1.93, 5.29], [3.52, −2.62, −6.75, −5.17] and [4.02, −2.85, 1.15, −6.58] (chapter 01 §3). At 500 epochs one seed had not converged at all (loss 0.1506 against 0.011 to 0.023).

*Support at stage 3 (measured, four seeds):* the same word has unrelated Skip-gram vectors across seeds (mean cosine −0.28 to 0.09), yet the pairwise geometry agrees (Pearson 0.977 to 0.984).

![Seed agreement on geometry versus coordinates](../images/fig-seed-agreement.png)

*Figure 3.1. Hatched: correlation of pairwise-cosine matrices between two seeds. Open: mean cosine between the same word's vectors from the two seeds. Chapter 01, Figure 1.9.*

*Not yet supported:* that the same holds for the transformer. Experiment E1 ([chapter 05](05-implementation-and-evaluation.md#2-experiments)) is designed to test it, and has not been run. We expect similar final loss and very different weights, but expectation is not a result.

*Care with the claim.* Randomness of weights does not by itself mean unreliable *outputs*. Four XOR seeds agree on the function, and four Skip-gram seeds agree on the relations between words. This is evidence *against* a strong reading of "random", and is reported as such. The point is narrower: the **internal solution is not unique and not designed**, so one cannot read the reason for an output off the weights, and two models with equal loss need not share a mechanism. Whether they agree on *held-out* behaviour is exactly what E1 and E2 would examine.

## 3. "Pure emergent, not designed" means opaque

The note's p3 callout links emergence to the black box. The neuro-symbolic literature draws the same line. Sheth, Roy and Gaur (2023, p57) note that the "black-box nature" of large models and their "inscrutability" hinder reliable evaluation of cognitive capability. Post-hoc explainers (attention maps, saliency) describe where the model looked, not a justification the model could be held to.

Contrast with stage 0. ELIZA's behaviour is fully explained by its rules, and fully unable to generalise. A transformer generalises and cannot explain itself. The two columns are the trade the neuro-symbolic programme tries to break (chapter 04).

## 4. Why more attention or depth does not close the gap

The note's own picture ends with layers that move from syntax to meaning to "deep reasoning". Adding heads or layers changes capacity, not the objective. If the objective rewards only next-token plausibility, capacity buys a better fit to plausible text. Whether *reasoning* emerges at scale is an open empirical question that this project cannot address; we claim only that **in this small model, nothing in the construction asks for it or exposes it**.

## 5. Scope and honest limits

- The model is tiny: 2 layers, $d=32$, a 34-story corpus. It demonstrates the mechanism, not the behaviour of large models, which are reported to do better on many reasoning tasks.
- The evidence so far is XOR (4 seeds) and Skip-gram (4 seeds). It is illustrative, not statistical.
- "Lack of reasoning" is a design statement about *this* architecture and objective, not a proof about all neural models.
- The note is the author's study note, not a peer-reviewed source. The peer-reviewed support for the black-box concern is Sheth et al. (2023).

## 6. What would change the conclusion

If E1 shows that seeds converge to near-identical weights, the "random weights" claim weakens (the solution would be more unique than argued). If E2 shows that the baseline model already satisfies the knowledge-base constraints at a rate near 100%, the gap on this corpus is small and the symbolic layer has little to correct. Both outcomes are reportable.
