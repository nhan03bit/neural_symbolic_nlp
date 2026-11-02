# What uncertainty semantic loss does and does not remove, and whether it has "its own randomness"

Conventions for these notes:
- "Cited Findings" states what a source says. Page numbers are PDF pages of the arXiv version named in the link text. Quotes come from `pdftotext` extractions of the PDFs, read on 2026-11-01.
- "Inferences" is my own reasoning and my own small computations. No source states them unless a link says so.
- `M5` means the project's per-position loss, L_t = −log Σ_{i∈A_t} p_{t,i}, added to cross-entropy (CE) with weight λ_s ([docs/progress/README.md](../../docs/progress/README.md), lines 126-131).
- Local checks are throwaway scripts in the session scratchpad: `m5_uncertainty.py`, `m5_paths.py`, `m5_toy.py`, `vk_repro.py`, `libra.py`. They are toys (free logits or softmax regression), not measurements of the transformer.

## Is the user's claim right? Clause by clause

The claim: "Semantic loss is still a probabilistic loss function that has its own randomness, so it would not resolve the Transformer's ambiguity/uncertainty completely."

### Takeaway
The conclusion is right, the middle clause is wrong, and the "so" is a non sequitur. Semantic loss is a deterministic function of a probability vector, and it describes a random event without adding any randomness. It leaves uncertainty unresolved for three other reasons: its objective cannot tell satisfying assignments apart, it is a soft penalty on the training points it sees, and it says nothing about uncertainty the knowledge base does not address. Removing all uncertainty would also be the wrong goal for a next-token distribution.

### Cited Findings
- **"Probabilistic": correct.** The loss is "proportional to a negative logarithm of the probability of generating a state that satisfies the constraint, when sampling values according to p", i.e. the "self-information (or 'surprise')" of that event — [Xu et al. 2018, §3.1, p. 3](https://arxiv.org/abs/1711.11157).
- Later work contrasts this with fuzzy relaxations, which sacrifice "sound probabilistic semantics" — [Ahmed et al. 2023, Semantic Strengthening, p. 1](https://arxiv.org/abs/2302.14207).
- **"Has its own randomness": incorrect for the exact loss.** The "sampling" in Xu's sentence is an interpretation. The quantity is the exact expectation E_{y∼Pr}[1{y ⊨ α}] = Σ_{y⊨α} Pr(y), and "Taking the negative logarithm recovers semantic loss" — [Ahmed et al. 2022, Eq. 2, p. 2](https://arxiv.org/abs/2201.11250).
- **Where the clause would be true.** Approximations do inject randomness. The pseudo-semantic loss enforces the constraint "on a random, local approximation" of the output distribution, "centered around a model sample" (abstract), and its algorithm draws "an assignment y ∼ pθ" — [Ahmed et al. 2023, Pseudo-SL, pp. 1, 5](https://arxiv.org/abs/2312.03905).
- **"Would not resolve completely": correct, for other reasons.** The constraint "only specifies what worlds are possible but does not specify which one is correct" — [van Krieken et al. 2024, p. 1](https://arxiv.org/abs/2404.08458). Loss-based methods "cannot guarantee that the predictions will be consistent at test time" — [Ahmed et al. 2022, SPL, p. 7](https://arxiv.org/abs/2206.00426).

### Inferences
- A loss computed with no random draw could not have "its own randomness" in the sense of a noise source. Repeating M5 on the same logits returns the identical number (1.4159835655173072, three times, in `m5_uncertainty.py`).
- The clause conflates three things: (a) the loss is about a distribution, (b) the model's output is a distribution, (c) the loss is computed by a random process. (a) and (b) are true. (c) is false for M5.
- The argument would fail even with a perfect optimiser and an infinite corpus, because the set of minimisers still contains many distributions. That is why randomness cannot be the reason.
- Suggested wording: "Semantic loss is a deterministic penalty on the probability that the model's next token breaks a rule. It adds no randomness. It reduces only the uncertainty about whether the next token is allowed, softly and only where rules fire and training reaches. It leaves open which allowed token comes next, and that is mostly uncertainty a language model should keep."

### Gaps
- None. The clause-level verdict follows directly from the definitions.

## Is semantic loss itself stochastic, and where does randomness actually come from?

### Takeaway
Exact semantic loss is not stochastic. The randomness and uncertainty around it come from the initial weights, data sampling, any noise in training, decoding, and finite data. The independence assumption is not randomness at all; it is a modelling restriction. In this repo, as far as I can see from the code, the loss and the training loop draw nothing random once the seed is fixed, so the initial weights and nucleus sampling are the only sources.

### Cited Findings
- Definition 1 is a function of a sentence α and a vector p, and Theorem 1 says it is the only function satisfying the axioms, up to a multiplicative constant — [Xu et al. 2018, §3.1-3.2, p. 3](https://arxiv.org/abs/1711.11157).
- Its value and gradient are computed by a pass over an arithmetic circuit, "in time linear in the size of the circuit" — [Xu et al. 2018, §5.1](https://arxiv.org/abs/1711.11157).
- Monte Carlo estimation exists as an alternative for hard constraints, but is called "infeasible in exponentially-sized output spaces where the valid outputs represent only a sliver of the distribution's support" — [Ahmed et al. 2023, Strengthening, p. 1](https://arxiv.org/abs/2302.14207).
- The independence assumption is an equation about the model, p_θ(w|x) := Π_i p_θ(w_i|x), adopted to "speed up inference, reduce the number of trainable parameters, and ease implementation" — [van Krieken et al. 2024, Eq. 2, p. 2](https://arxiv.org/abs/2404.08458).
- Initialisation matters for what training selects: "any randomized initialization in the parameters can lead to an initial bias among the outputs" — [Zombori et al. 2024, arXiv v1](https://arxiv.org/abs/2307.00465). This softmax bias makes "the dynamics of gradient descent overly sensitive to initialization" (abstract).
- Xu's experiments have their own noise, outside the loss: "Gaussian noise is added to every pixel (σ = 0.3)", labelled examples are "randomly chosen", and CIFAR-10 uses batches of 100 "of which half are unlabeled" — [Xu et al. 2018, §4.2](https://arxiv.org/abs/1711.11157).
- Generation in this repo is sampled. `generateText` applies temperature and then nucleus sampling, citing Holtzman et al., and draws `rand() * nucleusSum` — local `src/routes/train-transformer/transformer.ts`, lines 935-1001.
- The PRNG is seeded: "deterministic (seeded), so training is reproducible" — local `src/routes/train-transformer/matrix.ts`, lines 14-19.
- All weight matrices use Xavier initialisation from that PRNG — local `transformer.ts`, lines 149-214.
- No "dropout" or "shuffle" appears in `src/routes/train-transformer/*.ts` (local grep). The training loop "sums worker gradients and runs one Adam step per epoch" — local `train.ts`, line 15.

### Inferences
| Source of randomness or uncertainty | Inside the semantic loss? | In this repo |
|---|---|---|
| Random initial weights | No, but they select which minimiser is reached | Yes, seeded Xavier |
| SGD minibatches | No | Apparently none: one summed gradient per epoch |
| Dropout, input noise | No | None found |
| Sampling at generation | No, it happens after training | Yes, temperature then top-p |
| Independence assumption | Part of the Bernoulli model, not a noise source | Not within a softmax; positions are summed as if independent |
| Finite data | No; it is epistemic uncertainty | Yes, 401 sentences |
| Sampled loss estimate (pseudo-SL, Monte Carlo) | Only in those approximations | Not in M5 |

With a fixed seed, I expect the whole training run to be reproducible up to floating-point summation order. "Randomness" in the project is then really **seed sensitivity**, which is better treated as epistemic uncertainty (next sections) than as a property of the loss.

### Gaps
- I read `train.ts` by grep, not line by line. "No minibatches" rests on line 15 and the absence of shuffling, so confirm it before quoting.

## What does a minimum of semantic loss guarantee, and what does it leave open?

### Takeaway
Zero loss means all mass is on satisfying assignments, and nothing more. It does not choose among them, it holds only where the constraint was applied, and finite λ does not reach it where the data conflicts. Theory gives a statistical generalisation benefit with a stated bias, not a per-context guarantee. For a softmax, the minimiser set is a whole simplex face, but gradient descent does not treat that face neutrally: M5 is the exact loss shown to have a winner-take-all effect.

### Cited Findings
**Choosing among satisfying assignments**
- Xu's Proposition 3 gives "If x ⊨ α, then the semantic loss L^s(α, x) = 0", and the axioms imply "any vector satisfying the constraint must incur zero loss" — [Xu et al. 2018, p. 3](https://arxiv.org/abs/1711.11157).
- "if the distribution p_θ(c | x) allocates mass only to concepts c that satisfy the knowledge given y, these are optimal solutions, in the sense that the SL is exactly zero" — [Marconato et al. 2023, appendix on SL](https://arxiv.org/abs/2305.19951).
- "its encoding rule does not discriminate different satisfying assignments, causing the shortcut satisfaction problem" — [Li et al. 2023, p. 9](https://arxiv.org/abs/2403.00329).
- Neuro-symbolic learning "steers the network towards valid predictions without necessarily being confident" (Fig. 1), and such approaches "does not further restrict the learned output distribution" (abstract) — [Ahmed et al. 2022, NeSyEnt, pp. 1-2](https://arxiv.org/abs/2201.11250).
- For a fully expressive softmax over worlds, the semantic loss is convex over the simplex, "since the WMC is linear", and any preference over possible worlds can be modelled — [van Krieken et al. 2024, §4.1, p. 4](https://arxiv.org/abs/2404.08458). That convexity is "in the space of probability vectors over worlds, and not in the space of the parameters" (§3.2, p. 4).

**M5 is the disjunctive supervision loss, which has a winner-take-all dynamic**
- Zombori et al. define NLL-loss = −log(Σ_i y_i p_i) over a softmax, with y marking the allowed outputs. This is the same formula as M5 for one position. They show training "leads to an undesirable property that some of the acceptable labels would be favoured over others" and, "in the absence of other supervision", "a winner-take-all scenario, where all the probability concentrates on only one of the acceptable labels" — [Zombori et al. 2024, arXiv v1, p. 4](https://arxiv.org/abs/2307.00465) ([JMLR 25(412)](https://jmlr.org/papers/v25/23-0868.html)).
- Their **Theorem 4** proves this for softmax regression. "the gradient of the NLL-loss that the logits receive (through the softmax layer) is proportional to the output probabilities", and the limit puts mass only on the outputs that were initially maximal among allowed ones — [Zombori et al. 2024, p. 12](https://arxiv.org/abs/2307.00465).
- For hidden layers, "our results become approximations", though "the update dynamics remain mostly unchanged" in their 10-hidden-layer MLP — [Zombori et al. 2024, §4.4](https://arxiv.org/abs/2307.00465).
- Karlsson Faronius & Zuidberg Dos Martires prove that the semantic loss is a special case of disjunctive supervision. Using Adam (lr 0.001, batch 32) on a CNN with a softmax over worlds, they report "the confirmation of Zombori et al.'s WTA theorem" — [arXiv 2504.07851v2, pp. 5, 8, 10](https://arxiv.org/abs/2504.07851).
- van Krieken et al. saw the same thing empirically, without this explanation: the minima of the softmax model "are more uniformly distributed over the bottom triangle, but are biased towards the vertices. Therefore, using an expressive parameterisation is not sufficient to ensure the model is calibrated" — [van Krieken et al. 2024, §5, p. 8](https://arxiv.org/abs/2404.08458).

**Soft at finite λ, and not guaranteed at test time**
- Training-time constraints "can improve prediction accuracy … but it cannot guarantee that the predictions are always consistent with the constraints at inference time", and "Even state-of-the-art neuro-symbolic approaches like the Semantic Loss fail to ensure consistency with hard rules" — [Ahmed et al. 2022, SPL, pp. 1-2](https://arxiv.org/abs/2206.00426).
- Xu's test-set "Constraint" score, the share of predictions that satisfy the constraint, is 69.89% on grid paths and 55.28% on preference rankings. Both are large gains (from 6.99% and 2.72%) and both are far from 100% — [Xu et al. 2018, Tables 4-5](https://arxiv.org/abs/1711.11157).
- Ahmed et al. report valid paths rising from 56.9% to 67.4% with semantic loss — [Ahmed et al. 2022, NeSyEnt, p. 6](https://arxiv.org/abs/2201.11250).

**Generalisation theory**
- Xu's paper has no generalisation theorem. Its theorem is uniqueness; in the local PDF the word "guarantee" has 0 hits and "generaliz-" has 1 hit ("semantic loss generalizes to arbitrary logical output constraints") — [Xu et al. 2018](https://arxiv.org/abs/1711.11157).
- Wang et al. analyse exactly this loss. They define v_CE(x, f) := −log P_f(C(x)), which they note "is known as the semantic loss (Xu et al., 2018)", with labelled and unlabelled data — [Wang et al. 2023, ICML, arXiv pp. 2-3](https://arxiv.org/abs/2307.03886).
- Their result is a tradeoff. Regularisation "narrows the generalization gap by precluding models that are inconsistent with the constraints", but "its preference for small violations introduces a bias toward a suboptimal model" (abstract). The bound is Proposition 3.2: R(f_0) ≤ R(f_ρ) ≤ R(f_0) + ρ(V(f_0) − V(f_∞)), and the upper end can be reached "even with a noise-free constraint". If the risk minimiser also minimises violation, the relation "implies consistency".
- They also note that the regularised minimiser "is non-unique and may have different values of risks", and that the error bound (Theorem 3.6) "is most preferable when a large set of unlabeled data is available" — [Wang et al. 2023, pp. 3-4](https://arxiv.org/abs/2307.03886).

### Inferences
- **Entropy decomposition (my derivation).** With P_A = Σ_{A} p_i, q_A = p restricted to A and renormalised, q_B likewise, and H_b the binary entropy:
  H(p) = H_b(P_A) + P_A·H(q_A) + (1−P_A)·H(q_B).
  M5 = −log P_A depends on P_A alone. Its objective targets only the mass split, so H_b(P_A) goes to 0 and the q_B term vanishes. H(q_A) does not appear in the objective. This is the formal version of "it removes the rule-decidable part only".
- **The objective is neutral inside A, but the path is not (my derivation, agrees with Zombori Theorem 4).** From ∂L/∂z_j = p_j(1 − 1/P_A) for j ∈ A, a gradient step gives Δ(z_i − z_j) = η(q_i − q_j)(1 − P_A). The larger allowed token gains log-odds. Numeric check at z=[1,0,2], B={2}: predicted +0.3074, computed +0.3074.
- **Reproduction of van Krieken's softmax setup** (`vk_repro.py`; 4 logits, start p(r,g)=0.7, 200 random starts). Mean H(q_A) goes from 0.843 to 0.232 after their stated gradient descent (lr 0.1, 10,000 iterations). The maximum possible is 1.099. The source does not report this number; it is my computation.
- **The optimiser changes this.** Under Adam on free logits (lr 0.01, 3000 steps) the same starts keep mean H(q_A) at 0.843. My explanation is that per-coordinate normalisation makes all allowed logits rise at about the same rate. **That does not generalise:** Faronius & Zuidberg Dos Martires report winner-take-all with Adam on a CNN, so shared weights can bring it back. The project uses Adam with shared weights, and neither result predicts its behaviour. It has to be measured.
- **With CE present (my derivation, checked numerically).** Minimising −Σ f_i log p_i − λ log P_A at one context, with empirical next-token frequencies f, gives:
  - banned mass p_B = f_B/(1+λ) exactly (f_B = 0.2 gives 0.1818, 0.1, 0.0182, 0.0020 at λ = 0.1, 1, 10, 100);
  - ratios inside A stay at the data ratio (1.6667 in all runs);
  - total entropy falls only to a floor, the entropy of f renormalised over A (0.6746 at λ=100, tending to 0.6616).
  Three consequences follow. Finite λ never reaches zero loss if the corpus contains the banned token. If f_B = 0, the CE optimum already has zero banned mass and M5 adds nothing at the optimum, which is the categorical version of Xu's "semantic loss is almost always zero" (p. 5). And CE anchors the ratios wherever it has targets, so winner-take-all acts mainly where it does not.
- **Coverage (my toy, `m5_toy.py`, softmax regression, 12 seeds).** A rule-only context with no labels and λ=1 drops banned mass from 0.361 to 0.0003 (full-batch GD) or about 0 (Adam). A held-out context sharing only one feature, with no rule applied, reaches 0.021 mean and 0.035 max (GD), or 0.003 and 0.004 (Adam), so generalisation there is partial, with no zero. Contexts with no shared features cannot be moved at all.
- **Project consequences.**
  1. `A_t` is built from gold prefixes under teacher forcing, so nothing constrains a prefix the model generates itself and the corpus never contains. Only the mask covers that case.
  2. M5 as specified runs on training positions that also have a CE target. On a 401-sentence corpus, many contexts probably have one target, so CE already concentrates them. The marginal effect may sit mostly in early training and in generalisation to similar contexts.
- **The determinism bias of van Krieken does not apply to M5's minimisers.** Their theorem concerns independent Boolean variables, while one softmax over tokens is their "expressive" case over K worlds. Per-position constraints on separate variables give a product of simplex faces. A constraint tying several positions would reintroduce the problem if positions were treated as independent. Their §4.3 objection to conditioning does not apply either, because M5 evaluates the conditioned (softmax) distribution directly.

### Gaps
- No source I read measures M5-style winner-take-all in a transformer trained with CE. The closest experiment is a CNN with no CE on worlds.
- Wang et al.'s bound concerns population risk over a scoring space. I did not derive what it implies for a 401-sentence corpus or a model of this size, and I read only the parts cited here.

## Known weaknesses: verification of each citation

### Takeaway
All the cited works exist and most say what the brief implies, with three corrections. "BEARS" and "Not All Neuro-Symbolic Concepts…" are two separate papers. "Learning with deterministic-solution bias" is not a paper I could find. The determinism bias itself is **contested** by a 2025 preprint, although that dispute does not help M5. I add two sources the brief did not list, because they bear most directly on M5: Zombori et al. (2024) and Wang et al. (2023).

### Cited Findings
| Citation | Verified | What it actually says |
|---|---|---|
| van Krieken, Minervini, Ponti, Vergari, ICML 2024, PMLR 235 | Yes, read main text and App. C ([arXiv 2404.08458v2](https://arxiv.org/abs/2404.08458)) | Theorem 3.1: an independent distribution minimises semantic loss "if and only if it is deterministic for some variables, and those variables form an implicant of φ" (p. 3). Theorem 3.2: convex over independent distributions only for a conjunction of literals (p. 4). Theorem 3.3: minima connected only if implicants form a connected graph. MNIST Addition minima are "a set of disconnected vertices". Conclusion: such models "lack the ability to express uncertainty about multiple possibly valid options" (p. 9). |
| "Determinism bias" | Term, not a title | van Krieken's wording is "biased towards deterministic solutions". Karlsson Faronius & Zuidberg Dos Martires note it "was not formally defined" there and give a definition ([p. 12](https://arxiv.org/abs/2504.07851)). |
| "Learning with deterministic-solution bias" | **No paper found** under this title (one search) | Treat it as a description of van Krieken et al., not a citation. |
| Li, Liu, Yao, Xu, Chen, Ma, Lü, ICLR 2023 | Yes ([arXiv 2403.00329](https://arxiv.org/abs/2403.00329)) | Shortcut satisfaction: "the model overfits to a particular (easy) satisfying assignment". "not all satisfying assignments are the truth, and different inputs may require different assignments" (p. 1). Fig. 1 demonstrates it on DL2. Table 1 (p. 7) includes Xu's SL on their digit task: MNIST Acc 85.5 vs baseline 89.4, Sat 97.0, Q-Sat 0.0; USPS Acc 48.7 vs 75.4, Sat 98.8, Q-Sat 0.0. |
| Ahmed, Wang, Chang, Van den Broeck, "Neuro-Symbolic Entropy Regularization", UAI 2022, PMLR 180:43-53 | Yes ([PMLR](https://proceedings.mlr.press/v180/ahmed22a.html), [arXiv](https://arxiv.org/abs/2201.11250)) | Adds the conditional entropy H(Y\|α) as a penalty on top of SL, so the model will "confidently predict a valid object". This *deliberately* removes within-valid uncertainty. Their motivation: the network "should 'know' the right structure among the valid structures". |
| Marconato, Teso, Vergari, Passerini, "Not All Neuro-Symbolic Concepts Are Created Equal", NeurIPS 2023 | Yes, separate paper ([arXiv 2305.19951](https://arxiv.org/abs/2305.19951)) | Reasoning shortcuts are "unintended optima". Models "can attain high accuracy but by leveraging concepts with unintended semantics" (p. 1). SL is in scope: "RSs are chiefly a property of the prior knowledge" and Prop. 3 covers "DPL and SL" (p. 5). An entropy penalty alone did not fix concept quality for DPL (§5.5, experiments). Concept supervision did. |
| Marconato, Bortolotti, van Krieken, Vergari, Passerini, Teso, "BEARS", UAI 2024, PMLR 244:2399-2433 | Yes, separate paper ([PMLR](https://proceedings.mlr.press/v244/marconato24a.html), [arXiv v1](https://arxiv.org/abs/2402.12240)) | RSs "are linked to NeSy models being overconfident about the predicted concepts" (abstract). MNIST-Half, SL row, Table 1: label ECE 0.01; concept ECE 0.71; OOD label ECE 0.95; OOD concept ECE 0.88. With bears: 0.01, 0.38, 0.75, 0.37. Its stance is to accept ambiguity and calibrate it. Numbers are from the preprint and were not compared with the UAI version. |
| Ahmed, Chang, Van den Broeck, "Semantic Strengthening", AISTATS 2023, PMLR 206 | Yes ([arXiv 2302.14207](https://arxiv.org/abs/2302.14207)) | About *approximating* the loss: assume constraints are independent given features, which "introduces inconsistencies: an assignment that satisfies one constraint might violate another, leading to misaligned gradients" (p. 2), then restore dependence guided by conditional mutual information. It is not about uncertainty quality. |
| **Added:** Zombori, Rissaki, Szabó, Gatterbauer, Benedikt, JMLR 25(412), 2024 | Yes, arXiv v1 read ([JMLR](https://jmlr.org/papers/v25/23-0868.html), [arXiv](https://arxiv.org/abs/2307.00465)) | Winner-take-all, above. Proposes Libra-loss (Def. 7, p. 14): log(1 − Σ y_i p_i) − (1/k) Σ y_i log p_i, whose updates "preserve the ratios of the probabilities for the acceptable labels" (Theorem 8). |
| **Added:** Wang, He, Nguyen, Kumar, Roth, ICML 2023, PMLR 202:35740-35762 | Yes, parts read ([arXiv 2307.03886](https://arxiv.org/abs/2307.03886)) | Generalisation tradeoff, above. |
| **Added, contrary view:** Karlsson Faronius & Zuidberg Dos Martires, "Independence Is Not an Issue in Neurosymbolic AI" | Preprint v2, Apr 2025; I did not establish a peer-reviewed venue ([arXiv 2504.07851](https://arxiv.org/abs/2504.07851)) | Argues deterministic bias "is an artifact of improperly applying neurosymbolic AI": van Krieken use a "truncated" loss with positive examples only. With negatives and independent sigmoids they see no bias, and the truncated version reproduces it (pp. 2, 12). For softmax they confirm WTA. |

### Inferences
- **The dispute does not rescue M5, and its "truncated" label is arguable.** Xu's Definition 1 itself is −log Σ_{x⊨α}, with no negative term, and Xu assert α rather than label it true or false. Calling positive-only use "truncated" reads a binary-CE form into the definition, so this looks partly terminological. Either way M5 is positive-only *and* softmax, which is the arm where those authors report the bad behaviour. Their fix (labelled constraint-violating examples plus separate sigmoid networks) is a different design.
- **Reasoning shortcuts by analogy.** M5 has no concept layer, so the formal results do not transfer directly. The analogue is the lift loop in `docs/progress/README.md` (Step 4): reading "facts" from a model that has satisfied the rules for the wrong reason could add a wrong triple that passes the threshold and contradiction check. High confidence would not protect against that, given BEARS's link between shortcuts and overconfidence.
- **Shortcut satisfaction by analogy.** An M5 shortcut is a frequent allowed token (for example "the") that satisfies many A_t at once. CE should resist this at labelled positions. Li et al.'s Q-Sat of 0.0 for SL was measured on their specific digit task, so its size need not carry over. I expect it to matter less here, unless M5 is extended to unlabelled probe contexts.
- **Libra-loss is an option if within-A collapse is measured (not tested on the transformer).** By hand, its gradient on allowed logits is −1/k for all j ∈ A, which is why ratios stay fixed, and on banned logits it is p_j/P_B. A finite-difference check and a 3000-step free-logit run both agree (`libra.py`: ratios unchanged to 4 decimals). Zombori et al. note that its second term acts as an entropy regulariser. It diverges as P_B → 0, so it would need clipping.

### Gaps
- I read Marconato et al.'s Appendix A only in part, and did not verify the formal RS results for SL beyond Prop. 3 and the quoted appendix text.
- I ran only one search for a "deterministic-solution bias" title and could miss an obscure paper.
- I found no follow-up that resolves the van Krieken / Karlsson Faronius dispute, and I did not search extensively for one.

## Which kinds of uncertainty can semantic loss reduce?

### Takeaway
It can reduce uncertainty about whether the next token breaks a rule, and part of the epistemic uncertainty where rules fire. It cannot reduce the aleatoric spread among valid tokens, weight-level non-identifiability, or sampling randomness as a mechanism. Inside the allowed set it can even increase disagreement across seeds. These categories are not absolute, and the knowledge base itself moves the boundary.

### Cited Findings
- Aleatoric uncertainty "refers to the notion of randomness" and is "the irreducible part"; epistemic uncertainty is "caused by a lack of knowledge" and "can in principle be reduced on the basis of additional information" — [Hüllermeier & Waegeman 2021 (arXiv v3), p. 2](https://arxiv.org/abs/1910.09457).
- These are "context-dependent": "Changing the context will also change the sources of uncertainty: aleatoric may turn into epistemic uncertainty and vice versa", quoting Der Kiureghian & Ditlevsen that "In one model an addressed uncertainty may be aleatory, in another model it may be epistemic" — [Hüllermeier & Waegeman, §2.3, p. 9](https://arxiv.org/abs/1910.09457).
- In language tasks, aleatoric uncertainty "arises from ambiguity or inherent randomness in the data-generating process itself", with "input ambiguity" as an important source, while epistemic uncertainty arises "when correct outputs are predictable in principle, but models lack the knowledge" — [Hou et al. 2024, ICML, p. 1](https://arxiv.org/abs/2311.08718).
- One predictive distribution is read in two ways: as model confidence ("regards the predictive distribution as epistemic uncertainty") or as human variation ("as aleatoric uncertainty"), and "exploiting a single predictive distribution is limiting" — [Baan et al. 2024, arXiv 2402.16102](https://arxiv.org/abs/2402.16102).
- Constraints are assumed correct in this theory ("If the constraint is correct, then all worlds w with non-zero probability p*(w|x) are in W_φ"; [van Krieken et al. 2024, p. 3](https://arxiv.org/abs/2404.08458)). Wang et al. separately treat a "noisy constraint" with noise rate V_ora ([Wang et al. 2023](https://arxiv.org/abs/2307.03886)).

### Inferences
| Kind | In this project | Effect of M5 | Why |
|---|---|---|---|
| **Constraint uncertainty** (is the next token allowed?) | H_b(P_A), `massBefore` | **Reduced**, to near zero where it fires and λ dominates | This is the objective |
| **Aleatoric** (several valid tokens) | *rent* vs *deposit*; H(q_A) with corpus frequencies f | **Not reduced at the fixed point.** Floor = entropy of f over A | Objective ignores q_A; CE holds the ratios |
| **Epistemic, data-limited** | Few examples, unseen contexts | **Partly reduced where rules fire**, via a smaller hypothesis space (Wang Thm 3.6) | No effect where A_t = V, and it comes with bias if the rule is wrong or conflicts |
| **Epistemic, inside A with no data** | Which allowed token at an unlabelled context | **Not reduced; may rise** | Which token wins depends on the initial weights (Zombori) |
| **Weight non-identifiability** | README kind A, XOR and skip-gram seeds | **Not reduced** | The loss depends on outputs alone |
| **Sampling randomness** | Temperature, top-p, `rand()` | **Mechanism untouched**; only the distribution sampled from changes | Non-zero banned mass stays samplable; the mask gives zero |
| **Wrong knowledge** | Bad rule or lifted fact | **Worsened** | Creates confident error; with conflict, p_B = f_B/(1+λ) removes real data |

- The within-A row, from `m5_toy.py` at a labels-free, rule-only context (12 seeds; JS is mean KL to the mean, in nats):

| Optimiser, λ | Banned mass | Mean H(q_A) | JS total | JS within A |
|---|---|---|---|---|
| none, λ=0 | 0.361 | 1.327 | 0.054 | 0.049 |
| GD, λ=1 | 0.0003 | 0.350 | **0.827** | 0.827 |
| GD, λ=10 | ~0 | 0.129 | **1.008** | 1.008 |
| Adam, λ=1 | ~0 | 1.327 | 0.049 | 0.049 |

  So seed disagreement rose about 15-fold under GD, even as the rule was satisfied, because seeds picked different winners. A labelled context in the same toy kept H(q_A) at 1.168, equal to the entropy of f, for all λ. The direction under Adam in a shared-weight transformer is unknown.
- **Prediction P6 in the README needs splitting.** It says the Jensen-Shannon divergence across seeds should shrink on constrained positions. The toy shows it can grow or stay flat while the rule is being met. Report separately: (a) JS of the Bernoulli (P_A, 1−P_A) across seeds, which M5 should shrink; (b) JS of q_A across seeds, on which there is no reason to expect a reduction; and (c) mean H(q_A) with and without M5, which detects collapse. Otherwise a result can look like a refutation, or a success, for the wrong reason.
- **The four seeds already give a small ensemble decomposition**, in line with the disagreement-as-epistemic approach of Hou et al.: H(mean p) = mean H(p) + JS. Mean H(p) approximates aleatoric plus residual model spread, and JS approximates epistemic. With four seeds this is rough, so label it as indicative.
- **The KB moves the aleatoric boundary.** Spread over a banned token looks irreducible to a model that sees only the context, but it becomes reducible given the rule. This is Hüllermeier & Waegeman's context dependence, and gives a fair way to phrase the benefit: M5 feeds in information from outside the data, which turns part of what looked like data ambiguity into a resolvable question. It works only for what the rules can decide.

### Gaps
- No source gives this breakdown for semantic loss on next-token distributions. The table is my synthesis.
- Whether corpus frequencies in a 401-sentence corpus reflect real language variation or just sparse data is unresolved. At many contexts, f has one target, so what is called aleatoric above cannot be separated from sampling of the corpus.

## Is removing all uncertainty desirable for a next-token distribution?

### Takeaway
No. The sources agree that uncertainty among valid options is legitimate information about language, and that maximising likelihood at decode time degrades text. They do not all want it preserved everywhere: for tasks with one right answer, some methods deliberately push it down. The right goal is to remove rule-excluded mass and keep a calibrated spread over the rest.

### Cited Findings
- **Valid uncertainty should be kept.** "We argue that the perception model should be able to express uncertainty over these three worlds, as there is no evidence to conclude which one is correct … We should leave determining any further preference to the provided data" — [van Krieken et al. 2024, p. 1](https://arxiv.org/abs/2404.08458).
- **Ambiguity is functional in language.** "all efficient communication systems will be ambiguous, assuming that context is informative about meaning", since "unambiguous language is partly redundant with the context and therefore inefficient" — [Piantadosi, Tily & Gibson 2012, Cognition 122, pp. 280-281](https://pdodds.w3.uvm.edu/files/papers/others/2012/piantadosi2012b.pdf).
- **Maximising is bad for text.** "maximization is an inappropriate decoding objective for open-ended text generation", beam search giving "bland, incoherent" output — [Holtzman et al. 2020, ICLR, p. 1](https://arxiv.org/abs/1904.09751).
- **The opposite extreme is also bad.** Pure sampling gives text "incoherent and almost unrelated to the context", blamed on an "unreliable tail" that should be truncated — [Holtzman et al. 2020, pp. 1-2](https://arxiv.org/abs/1904.09751).
- **Penalising overconfidence helps.** Penalising low-entropy outputs "acts as a strong regularizer", and the confidence penalty and label smoothing improved models across benchmarks including "language modeling (Penn Treebank)" — [Pereyra et al. 2017, abstract](https://arxiv.org/abs/1701.06548).
- **Overconfidence hides errors.** A model that stays uncertain about concepts with unintended meaning "enables users to distinguish between high- and low-quality predictions" — [Marconato et al. 2024, BEARS, §3](https://arxiv.org/abs/2402.12240).
- **Contrary position.** Entropy minimisation inside the valid set "encourages the model to confidently predict a valid object" and improved accuracy and validity on structured tasks — [Ahmed et al. 2022, NeSyEnt](https://arxiv.org/abs/2201.11250). Xu's loss forces "the underlying classifier to make an decision and construct a confident hypothesis for all data" (p. 5), under exactly-one on Bernoulli outputs — [Xu et al. 2018](https://arxiv.org/abs/1711.11157). van Krieken et al. take the opposite direction: "we maximise entropy, instead of minimising the entropy, like in Neuro-Symbolic Entropy Regularisation", which for softmax models counteracts the vertex bias at suitable weights (App. C, p. 14) — [van Krieken et al. 2024](https://arxiv.org/abs/2404.08458).
- **Closest LLM evidence on cost.** Word-banning with pseudo-SL on GPT-2 lowered toxicity probability from 34.11% to 9.80%, while PPL rose from 25.85 to 28.14 — [Ahmed et al. 2023, Pseudo-SL, Table 3](https://arxiv.org/abs/2312.03905), recorded in the earlier note `research_notes/Semantic loss original paper/xu_2018_semantic_loss.md`.

### Inferences
- **The conflict resolves by task type (my reading; no source says this).** NeSyEnt and Xu target tasks with one correct structure or class, where low entropy is the truth. Language has many acceptable continuations, so there low entropy would be overconfidence. M5 sits with the language case.
- **The README uses Xu's semi-supervised results too directly.** Lines 81 and 207-211 of `docs/progress/README.md` use Xu's MNIST gain (78.46% to 98.38%) and Fig. 2 ("must confidently assign a consistent class") as evidence for M5. That mechanism comes from exactly-one on independent Bernoulli outputs, whose loss is 0 only at vertices: `m5_uncertainty.py` gives L = 0.8109 at (⅓,⅓,⅓) and 0 at (1,0,0), and gradient descent ends at (0.9995, 0.0005, 0.0005). Under a softmax, exactly-one holds by construction, so this pressure is absent from M5's objective (Xu §4.2). Xu's evidence supports M5 only by analogy. The "regime matches" claim is weaker than written.
- **Two earlier statements need correcting.** The caller may want these for the report; I did not edit them.
  1. `research_notes/Semantic loss original paper/xu_2018_semantic_loss.md`, line 162: "M5 leaves the *relative* probabilities within A_t unchanged". This is true of the loss value and of the mask, and false of gradient steps (Zombori Theorem 4).
  2. `docs/progress/README.md`, line 213: "It does not choose between *rent* and *deposit*". This is true of the objective, not of the dynamics. The worked example at lines 147-154 uses tied logits, the one case where the effect is absent.
- **M5 relative to top-p.** Top-p removes the tail by rank, while M5 removes mass by rule. The two can complement each other: neither requires removing the valid spread, and at T = 0.8 with top-p 0.9 (the repo's defaults in `generateText`) a very small banned mass may be cut before sampling. That is not a guarantee, which only the mask provides.
- **What success should look like, then.** Lower `massBefore` on constrained positions, H(q_A) no lower than the baseline without M5 (a drop suggests collapse, unless the baseline is itself overconfident), and little PPL rise where no rule fires (the README's P7).

### Gaps
- No source I found tests semantic loss specifically on calibration of a next-token distribution. Pereyra, Holtzman and Piantadosi address the general question, not M5.
- Holtzman's result is about decoding with large models. Applying it to a model trained on 401 sentences is an extrapolation.
- There is no data yet from the transformer. Everything about this project's behaviour here is prediction.
