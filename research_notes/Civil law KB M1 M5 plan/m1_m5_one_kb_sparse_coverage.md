# M1 and M5 reading one KB, when the constraint fires rarely and the target is always allowed

Scope: only what `reports/Semantic loss with hard logit constraints.md` lacks. Nothing here has been run on the transformer. No M5 code exists in the training loop, and every number labelled "own" comes from closed forms or small numpy toys, run from stdin with no files written. The figures 8 of 5,390, 0 conflicts, 0.099 and 0.331 come from the brief. I could not find them in the repo, and I did not recompute them. The count fits the code: 5,390 tokens give the 5,374 windows of 16 recorded in `README.md:230` and built in `src/routes/train-transformer/train.ts:295-300`.

Corrections to the earlier report that change what follows:
- **The model no longer underfits.** The report reasons from "perplexity about 292". The recorded 2000-epoch run ends at loss 0.2489, perplexity about 1.28, and "shows memorisation, not generalisation" (`README.md:234`, `README.md:241`). This moves M5 towards Xu's fully supervised null.
- **The factorial cost is out of date.** The report's "8 trainings, about 95 minutes" came from a 710 s run. The 2000-epoch run took about 86 minutes (`README.md:223`), so 8 trainings is about 11.5 hours (own arithmetic).
- **The decomposition is in print.** The report says it did not find CE = masked CE + L_sem in a paper. Wang et al. 2023, Proposition 4.6, Eq. 21 states it for a noise-free constraint: training through the hard constraint gives "argmin R_CE(f) − V_CE(f)", where V_CE is the semantic loss. They call this "opposite" to the regularised objective ([Wang et al. 2023](https://arxiv.org/abs/2307.03886)).

## With very sparse coverage, what does the literature say about constraint losses?

### Takeaway
I found no paper that varies constraint coverage as an experimental variable, so this is a real gap. The closest evidence is a re-analysis of a rule covering 3.5% of training phrases: averaged over 100 seeds, the training-time term gave a small gain and the post-hoc step gave a much larger one, with almost nothing added when both ran. The published large M5-style gains come from constraints applied to every example.

### Cited Findings
- **No direct study.** Three searches aimed at coverage, sparsity and rule firing rate found none. They found only work on rules as weak labellers, where low coverage is a known issue ([ASTRA, abstract-level only](https://arxiv.org/abs/2104.05514)) and matches are softly widened to similar sentences ([Neural Rule Grounding, abstract-level only](https://arxiv.org/abs/1909.02177)). Neither measures a constraint loss.
- **Closest empirical case.** Krishna et al. re-ran Hu et al.'s A-but-B rule. The rule fires on 3.5% of 76,961 training phrases and 11.1% of 6,920 training sentences (Table 1). The rule term is 1 when the sentence lacks the structure, so it is inactive elsewhere ([Krishna et al. 2018](https://aclanthology.org/D18-1505/)).
- **Their result over 100 seeds** (Figure 2, read from PDF text, and the additions all check). All test sentences: baseline 87.66, distillation 87.97, projection 88.73, both 88.77. Test A-but-B sentences only: baseline 80.25, distillation 82.17, projection 89.56, both 89.13 ([Krishna et al. 2018](https://aclanthology.org/D18-1505/)).
- **Reported versus averaged.** Hu et al. had reported +1.6 for distillation, and the averaged gain is about +0.3. Krishna et al. conclude the improvements "can almost entirely be attributed to just one of their two proposed mechanisms", and the distillation model "is ineffective" with proper averaging. The baseline alone ranged from 83.47 to 87.20 across seeds ([Krishna et al. 2018](https://aclanthology.org/D18-1505/)).
- **Full supervision gives a null in Xu's own paper.** "In the fully supervised case (N = all), semantic loss does not significantly affect accuracy. Because the MLP has enough capacity to almost perfectly fit the training data, where the constraint is always satisfied, semantic loss is almost always zero" ([Xu et al. 2018](https://arxiv.org/abs/1711.11157)). The earlier report cites the last clause. The causal sentence is what matters now that the model memorises.
- **Theory favours a lot of constraint-bearing data.** Wang et al.'s bound "is most preferable when a large set of unlabeled data is available", so that the errors in estimating violation are small. Lemma 3.3 gives V(f_ρ) ≤ 1/ρ + u, with u an upper bound on the smallest achievable violation ([Wang et al. 2023](https://arxiv.org/abs/2307.03886)).
- **The closest language-model precedent is not sparse in the same way.** Pseudo-semantic loss used a list of 871 possibly-bad tokens and was applied to the toxic portion of a corpus, "the local perturbations of a toxic sentence", with log-likelihood fine-tuning on the nontoxic part ([Ahmed et al. 2023, local copy](https://arxiv.org/abs/2312.03905)). So its loss saw data that breaks the constraint. This KB has 0 such positions.
- **Dense token-level penalties do carry to generation.** Unlikelihood on every time-step with a target (candidates are the previous context tokens) lowered 4-gram repetition in greedy continuations from .442 to .283, with perplexity going from 25.64 to 26.91, per Table 2 as read from PDF text. Adding sequence-level fine-tuning reached .058 ([Welleck et al. 2019](https://arxiv.org/abs/1908.04319)). Coverage here is every position.
- **The fuzzy-logic imbalance is a neighbouring result.** Implication losses have a strong gradient imbalance between antecedent and consequent, because contrapositive cases vastly outnumber positive ones ([van Krieken et al. 2022](https://arxiv.org/abs/2002.06100)).

### Inferences
- **Own reading of Krishna.** Their pattern is the one predicted here for M1 and M5: post-hoc gain on covered items is about 4.8 times the training gain (9.31 against 1.92), and with post-hoc on, the training term adds −0.43 on covered items and +0.04 overall. About 76% of distillation's overall gain sits on covered sentences (0.115 × 1.92 = 0.22 of 0.29, assuming others unchanged). Limits: this is a binary classifier, soft projection and a teacher-student loss, not next-token prediction, and it is about 24 times denser by phrase than this KB.
- **The imbalance does not transfer directly.** In M5 the trigger is read from the input and never predicted, so a non-firing position gives zero gradient, not a push on the antecedent. Only the "very few active groundings" part carries over.
- **Coverage scales the Wang bound (own, from Lemma 3.3).** V averages over all x, and it is 0 where no constraint fires, so V = c·v̄ with c = 8/5390 and v̄ the mean violation on covered contexts. Lemma 3.3 then gives v̄ ≤ 1/(cρ) + u/c. It is vacuous until ρ exceeds about 674, and reaches 0.099 only near ρ = 6,800 with u = 0. This is a sufficient condition from a loose step (it uses R ≤ 1), so it does not show that smaller λ fails. It does show that the theory offers no assurance anywhere in the schema's range of 0 to 5.
- **Aggregate size (own, epoch-2000 values).** M5's gradient L1 mass is 8·2λ·P_B = 3.17 at λ = 2 and 7.92 at λ = 5. CE's is at most 5390·2·0.2203 = 2,375, using mean(1−p) ≤ 1 − exp(−0.2489). So M5 holds at least about 0.13% or 0.33% of the logit-gradient mass. This is a lower bound, and it says nothing about direction or about parameters where M5's share is much larger, such as the head rows of banned tokens.
- **Counterweight on scale.** Xu's best weight was 0.005 with every example constrained, so c·λ matches it at λ ≈ 3.4. Aggregate size alone therefore does not prove a null. Xu's loss sits on unlabelled data, where it has information CE lacks, and that is the difference that counts here.

### Gaps
- No source gives a coverage threshold or a dose-response curve for any constraint loss.
- I did not verify coverage for every task in GLUECons or ROAD-R. The claim "applied to every example" is checked only for Xu's exactly-one experiments.

## When targets are always allowed, what can M5 change, and does it generalise?

### Takeaway
At a fully expressive optimum it changes nothing at those contexts. It can change speed, the balance of capacity across contexts that share parameters, and the path inside the allowed set. Its reach is whatever the parameters alias. Where a parameter also serves contexts in which the banned token is legitimate, generalisation and collateral damage are one effect. Adam may absorb much of λ where a parameter serves mainly the constrained contexts. No source measures this on a transformer.

### Cited Findings
- **Reweighting in deep nets fades.** Importance weighting affects models early in training, its effect "diminishes over successive epochs", and L2 and batch norm partly restore it while dropout does not ([Byrd and Lipton 2019](https://arxiv.org/abs/1812.03372)). The repo has no weight decay, no batch norm and no dropout, only layer norm (`src/routes/train-transformer/transformer.ts:299`, and no matches for the others in `transformer.ts` or `train.ts`).
- **Adam is scale-invariant.** "the magnitudes of parameter updates are invariant to rescaling of the gradient" ([Kingma and Ba 2015](https://arxiv.org/abs/1412.6980)). The repo runs one full-batch Adam step per epoch at lr 0.001 (`train.ts:405`, `train.ts:482`).
- **Risk trade-off.** R(f_0) ≤ R(f_ρ) ≤ R(f_0) + ρ(V(f_0) − V(f_∞)), and if the risk minimiser also minimises violation then R(f_ρ) = R(f_0). They add that V(f_0) can be small when the noise rate is small and the model is expressive ([Wang et al. 2023, Prop. 3.2](https://arxiv.org/abs/2307.03886)). The same paper notes that the minimiser is non-unique.
- **Grounded rules hold only where grounded, by contrast with lifted ones.** Demeester et al. avoid "separate loss terms for every ground atom", and "when these constraints are satisfied, the injected rules always hold, even for unseen but inferred facts" ([Demeester et al. 2016](https://arxiv.org/abs/1606.08359)). M5 is a ground-level method by this classification. That classification is my own reading, and their model is matrix factorisation.
- **Held-out effects exist at dense coverage.** Xu's held-out constraint satisfaction rose from 6.99% to 69.89% and from 2.72% to 55.28% (already in the earlier report). Krishna's +1.92 is on held-out A-but-B test sentences ([Krishna et al. 2018](https://aclanthology.org/D18-1505/)). Minervini and Riedel report "drastically reducing the number of background knowledge violations" with accuracy that "does not always improve" on the standard sets ([Minervini and Riedel 2018](https://arxiv.org/abs/1808.08609)).

### Inferences
- **Own derivation, checked by grid search: aliasing closed form.** Suppose n_A constrained positions and n_B other positions share one output distribution, and the banned token has frequency g on the n_B positions and 0 on the n_A. Then P_B* = n_B·g / (n_B + n_A(1+λ)). Grid and formula agree to 6 places on (n_A, n_B, g, λ) = (8, 8, .2, 0), (8, 8, .2, 2), (8, 40, .2, 2), (8, 40, .2, 5), (8, 5382, .002, 2) and (8, 5382, .002, 5). The report's f_B/(1+λ) is the case where M5 covers every position.
- **What it implies.** Halving P_B takes λ = 1 + n_B/n_A: λ = 2 for n_B = 8, λ = 6 for n_B = 40, λ ≈ 674 if the whole corpus aliased. The schema cap of λ ≤ 5 therefore only reaches a halving if fewer than about 32 positions share the relevant parameters. The same formula is the collateral: CE on the n_B positions pays for the drop, because their shared P_B falls below g.
- **Own check: optimiser dependence.** One labelled context with free logits, V = 937, |B| = 3, start P_B = .331, target allowed. P_B at step 500:

  | Optimiser | λ = 0 | λ = 2 | λ = 5 | λ = 50 |
  |---|---|---|---|---|
  | Gradient descent, lr .5 | .00088 | .00044 | .00026 | .00004 |
  | Adam, lr .003 | .06676 | .0657 | .06031 | .04273 |

  So at the same step, λ acts as a time dilation under gradient descent, and it nearly disappears under Adam, even at λ = 50. **Adam removes only the speed-up, not a shift in the optimum.** On fully aliased logits (Adam, lr .01, V = 20), P_B matched the closed form within 2,000 steps: for (n_A, n_B, g) = (8, 8, .2) it was .1000, .0500, .0285 and .0038 at λ = 0, 2, 5 and 50, and for (8, 5382, .002) it stayed at about .0020 throughout. So under Adam λ matters where parameters are shared with other uses, and hardly at all where a parameter serves only the constrained contexts. These are free-logit toys. A transformer sits between the two cases, and how much of each applies is unknown.
- **The memorising regime is unfavourable (inference, not measured).** Byrd and Lipton's fading effect and Xu's fully supervised null both point the same way for a model at loss 0.249. But L_sem is not zero here: 0.104 nats on average, 0.402 for the worst role (own, −log(1 − P_B)). A residual remains for M5 to act on, so a null is likely but not certain.
- **Own toy on nearby contexts, not the transformer.** Softmax regression on sparse features: 5,390 positions, V = 100, 60 topics in 6 groups, 3 banned tokens, 8 rule positions in a rule topic, 2,983 neighbour positions in the same group using banned tokens legitimately, Adam lr .01, 500 steps, 3 seeds. Means of banned mass at the last step, with per-position id features on (memorising):

  | λ | Trained 8 | Held-out, same topic, no id | Neighbour topics | Far topics | CE on legitimate banned targets |
  |---|---|---|---|---|---|
  | 0 | .0009 | .0076 | .0643 | .0009 | .0925 |
  | 2 | .0009 | .0076 | .0643 | .0009 | .0925 |
  | 5 | .0009 | .0075 | .0642 | .0009 | .0925 |
  | 100 | .0003 | .0041 | .0634 | .0009 | .0926 |
  | 672 | .0001 | .0020 | .0649 | .0012 | .0906 |

  With shared features only (underfit, CE about 2.16), the trained and held-out columns coincide: .0026, .0025, .0025, .0011, .0004 at those λ values, with neighbours falling only from .0453 to .0441. Reading: at λ ≤ 5 nothing moved beyond the third decimal in any family. At λ of 100 and above the reach was the rule topic's own feature, and did not extend to neighbour topics. There was also no collateral, but only because this toy gives the rule topic its own parameter, so the aliasing case above is not exercised. H(q_A) at held-out moved modestly, 2.33 to 2.21 at λ = 100, and rose to 2.74 at λ = 672. **Limit:** trained banned mass here is .0009 at λ = 0, far below the brief's 0.099, so the toy is not in the same state as the saved weights, and shows mechanism only.

### Gaps
- No paper measures banned mass on contexts near a constrained one, in any language model. Direct evidence requires the measurement below.
- How many parameters are effectively shared across "nearby" contexts in this transformer is unknown, so n_B in the closed form cannot be read off. It could be estimated from gradient overlap between positions, which nobody has done here.

## How should M5's effect be measured, and how should λ be chosen?

### Takeaway
The brief's measure is the right primary one: banned mass from raw logits at temperature 1, λ = 0 against λ > 0, same seed and same epoch. It needs four additions: an A/A noise floor, a curve across checkpoints, separate context families (trained contexts alone are close to reading the training loss), and a collateral measure. Choose λ against a stated target on contexts M5 never trained on, on a log grid or with a multiplier, and do not treat any default as meaningful.

### Cited Findings
- **Seed averaging decides these conclusions.** Models "must be averaged over far more random seeds than what has traditionally been reported", on the finding that reversed Hu et al. It "mirrors" Reimers and Gurevych 2017 ([Krishna et al. 2018](https://aclanthology.org/D18-1505/)).
- **Published grids span orders of magnitude.** Xu searched {0.001, 0.005, 0.01, 0.05, 0.1}, and 0.005 was best or nearly best ([Xu et al. 2018, App. C](https://arxiv.org/abs/1711.11157)). Pseudo-semantic loss searched {0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 4, 8} ([Ahmed et al. 2023, App. B](https://arxiv.org/abs/2312.03905)).
- **Multipliers are the published alternative to a fixed λ.** Nandwani et al. use an alternating min-max with one Lagrange variable per constraint and report fewer violations ([Nandwani et al. 2019](https://proceedings.neurips.cc/paper/2019/hash/cf708fc1decf0337aded484f8f4519ae-Abstract.html)). Gallego-Posada et al. describe "expensive trial-and-error tuning of the penalty factor" and reach pre-set targets with a constrained formulation, though for network sparsity and not for logic ([Gallego-Posada et al. 2022](https://arxiv.org/abs/2208.04425)). Solving primal and dual separately can cause instability or slow convergence, per a log-barrier paper ([Kervadec et al.](https://arxiv.org/abs/1904.04205), search excerpt only).
- **Fine-tuning from a trained model is standard practice in the language-model precedents.** Sequence-level unlikelihood fine-tunes a trained model ([Welleck et al. 2019](https://arxiv.org/abs/1908.04319)), and pseudo-semantic loss fine-tunes GPT-2 ([Ahmed et al. 2023](https://arxiv.org/abs/2312.03905)).
- **The project's P5 already specifies the base comparison:** mean `massBefore` on constrained positions, mask off, λ_s > 0 against λ_s = 0, same seed (`docs/progress/README.md:262`). `README.md:186` of the same folder also requires identical weights at λ_s = 0.
- **Checkpoints exist per 100 epochs** in `.data/` (for example the e1900 and e2000 weights files), which makes a same-epoch curve possible without extra saves (observed in the directory listing).

### Inferences
Own recommendations, not from a source:
- **Primary number.** P_B at T = 1 from raw logits, paired by context, seed and epoch. Report it also as L_sem in nats, because that equals the mask's distortion at that context (see the last section). Report per role, since the mean of 0.099 hides 0.331.
- **A/A floor first.** Run λ = 0 twice with one seed. Each worker has its own gradient buffer and summing looks ordered (`train.ts:466-482`), so I expect a match, but this is unverified. If the two differ, the difference sets the floor for every paired claim.
- **Four context families, kept separate.**
  1. The 8 trained positions: a manipulation check, not evidence of generalisation.
  2. Held-out trigger contexts M5 never sees, with the same trigger and a different prefix: the generalisation test.
  3. The role word without the trigger, where a banned token can be legitimate: collateral.
  4. A matched random token set of similar frequency at the same contexts, as the earlier report proposed: chance control.
- **Curve over checkpoints.** Report the λ-gap at each checkpoint. A gap that opens early and closes matches the time-dilation and fading pictures, and one final-epoch number cannot separate that from no effect.
- **Fixed contexts only.** Do not compare `massBefore` from generated text across arms, because sampling with the mask on or at another λ changes the later prefixes, so the context distributions differ.
- **Diagnostics to log.** The ratio of M5 to CE gradient L1 mass, overall and for head rows of banned tokens; distinct contexts among the 8, since repeats reduce the effective sample; H(q_A), and weights-only perplexity on held-out text, which does not exist yet (`README.md:235`).
- **Sampling error on 8 (own).** A Hoeffding half-width on mean banned mass from 8 independent contexts is √(ln 20 / 16) = 0.43. This is worst-case, and the contexts are not independent, but it shows that 0.099 is not a firm estimate of the rule's general violation. The held-out family should be much larger.
- **Staging to control the cost (own arithmetic, 86 min per run).**
  1. Fine-tune from the saved epoch-2000 weights for 200 epochs at λ in {0, 2, 5, 50} with Adam state reset in all arms, about 9 minutes each. It removes initial-weight variance, and tests only the late-stage effect.
  2. Full runs at one seed, λ in {0, 5, 50}, about 4.3 hours, plus A/A at 1.4 hours. λ = 50 needs a temporary rise in the schema cap and is diagnostic only: if it does nothing, smaller values will not help.
  3. Only if a gap clears the floor, the seed factorial. Four seeds give a minimum sign-flip p of 0.125 (already in the report), and Krishna's 100 seeds are out of reach at this cost. So report per-seed values and call the result preliminary.
- **Choosing λ.**
  - Fix the target first, for example mean P_B on held-out trigger contexts at most ε, with a limit on the rise in held-out perplexity and in family-3 CE.
  - Then either use a log grid over 0.1 to 50, or one multiplier per role with λ_r ← max(0, λ_r + η(P̄_B,r − ε)). A per-role multiplier suits the 0.099 against 0.331 spread. It has not been tried here.
  - Never select on the 8 trained positions, where more λ will tend to look better by construction.
  - The earlier reading of λ through f_B/(1+λ) does not apply with f_B = 0, and the aliasing formula is the applicable idealisation.

### Gaps
- No paper reports a same-seed A/A floor for a constraint loss, or a principled λ for a sparsely firing rule.
- Whether the fine-tune design predicts the from-scratch result is unknown.
- The KB and the 8 contexts are not in the repo as far as I could find, so I could not count distinct contexts or per-role sizes.

## Do unlabelled probe contexts help, or risk collapse?

### Takeaway
Probes are the only route that gives M5 information CE lacks, and they are where the positive evidence sits, so they are the one way to add coverage worth testing. They carry two risks. Collapse is real but conditional: theory proves it for gradient descent on softmax regression, a second group reports it with Adam on a CNN, and my toys show it depends on how peaked q_A already is and on the optimiser, not only on |A|. The risk the sources do not stress is memorisation of the probes themselves: in my toy, banned mass fell on the probes and rose on held-out contexts at λ = 2. Score only on held-out probes, keep CE in every update, measure H(q_A) and seed spread separately, and keep Libra-loss in reserve.

### Cited Findings
- **Collapse theorem.** Zombori et al.'s Theorem 4: for softmax regression, gradient updates with this loss reach a limit with all mass on the allowed outputs that were initially maximal, "under any realistic model and random initialization" a single output. They add that it "can prevent the optimizer from fitting to other points" ([Zombori et al. 2024](https://arxiv.org/abs/2307.00465)). The theorem has no condition on the number of allowed outputs k, although their toy uses k = 3 of m = 100.
- **Scope of the theorem.** It holds "in the absence of other supervision". For hidden layers "our results become approximations", though dynamics "remain mostly unchanged" in their 10-layer MLP ([Zombori et al. 2024](https://arxiv.org/abs/2307.00465)). WTA with Adam on a CNN is reported elsewhere ([Karlsson Faronius and Zuidberg Dos Martires 2025](https://arxiv.org/abs/2504.07851), per the earlier notes).
- **Example of harm.** Two samples with one input, {A, B} and {A, C}, where B and C start above A: "the signals from the two samples work against each other", and the joint optimum A is not found ([Zombori et al. 2024, Example 6](https://arxiv.org/abs/2307.00465)).
- **Libra-loss** preserves allowed-output ratios "in the absence of other supervision", and on the figure's trajectories "only slightly distorts the initial probability ratios" in softmax regression and a 10-layer MLP ([Zombori et al. 2024](https://arxiv.org/abs/2307.00465)).
- **M5 in the language-model literature is close to unlikelihood.** Welleck's term is −Σ_c log(1 − p(c)), and CRINGE states the single-token form ([Welleck et al. 2019](https://arxiv.org/abs/1908.04319); [Adolphs et al.](https://arxiv.org/abs/2211.05826)). M5 is −log(1 − Σ_c p(c)), which matches for one banned token and differs for several (own observation).
- **Mixing is the published practice.** Sequence-level unlikelihood runs on prefixes from data with model-decoded continuations, with no gold next token for the penalty, and fine-tuning "equally mix[es]" those updates with likelihood or token-level updates ([Welleck et al. 2019](https://arxiv.org/abs/1908.04319)). CRINGE keeps MLE on positive sequences and contrasts each negative token with a positive sampled from the model's own top-k ([Adolphs et al.](https://arxiv.org/abs/2211.05826)).
- **Adversarial probes.** Minervini and Riedel generate substitution sets by maximising violation, under a language-model plausibility bound log p_L(S) ≤ τ, and minimise J_D + λ·max J_I. J_I as defined takes no gold label. Standard accuracy did not always improve, adversarial accuracy rose by up to 79.6% in relative terms, and violations fell sharply ([Minervini and Riedel 2018](https://arxiv.org/abs/1808.08609)).
- **Unlabelled data is what the theory wants, and at a cost.** Large unlabelled sets tighten Wang's bound, and regularisation adds bias "toward a suboptimal model" ([Wang et al. 2023](https://arxiv.org/abs/2307.03886)). Xu's largest gains are from unlabelled data with exactly-one on Bernoulli outputs, a mechanism the earlier report showed is absent for a softmax. So those gains transfer only by analogy.

### Inferences
- **Own check on collapse, free logits, L_sem only.** H(q_A) start to end, 5 seeds:

  | V, set size | Start of q_A | Gradient descent (lr 1, 20,000 steps) | Adam (lr .01, 5,000 steps) |
  |---|---|---|---|
  | 937, \|B\| = 3, P_B = .099 | near-uniform (sd .5) | 6.716 to 6.709 | 6.716 to 6.713 |
  | 937, \|B\| = 3, P_B = .099 | peaked (sd 2) | 4.942 to 2.361 | 4.942 to 4.904 |
  | 937, \|B\| = 50, P_B = .331 | peaked (sd 2) | 4.927 to 0.015 | 4.927 to 4.915 |
  | 937, \|A\| = 3, P_B = .9 | near-uniform (sd .5) | 0.982 to 0.001 | 0.982 to 0.982 |

  I expected a short denylist to be safe. That is only partly true: under gradient descent a peaked q_A collapses even with |B| = 3, because the drift is η(q_i − q_j)P_B and peaked q_A has large differences. So a probe set is more exposed where the memorising model is already confident. Adam on free logits shows no collapse, which conflicts with Faronius and Zuidberg Dos Martires on a CNN, so shared weights are the open variable.
- **Own toy on shared features with probes, not the transformer.** Same memorising toy as above, plus 200 unlabelled probes at the rule topic, each with its own id feature, and no CE. The held-out contexts are separate from the probes. Means of 3 seeds:

  | Rule form, λ | Banned mass, probes | Banned mass, held-out | H(q_A), probes | H(q_A), held-out | JS of q_A across seeds, probes |
  |---|---|---|---|---|---|
  | \|B\| = 3, λ = 0 | .0077 | .0076 | 2.328 | 2.329 | .0003 |
  | \|B\| = 3, λ = 2 | .0002 | **.0117** | **0.674** | 1.986 | .0009 |
  | \|B\| = 3, λ = 20 | .0001 | .0028 | 1.065 | 3.168 | **.0114** |
  | \|A\| = 4, λ = 0 | .2302 | .2300 | 1.109 | 1.110 | .0001 |
  | \|A\| = 4, λ = 2 | .0107 | .2002 | 0.460 | 0.748 | .0005 |
  | \|A\| = 4, λ = 20 | .0113 | .1077 | 1.334 | 1.352 | .0075 |

  Three readings. **First, probes can be memorised and not generalised:** at |B| = 3, λ = 2, banned mass fell about 38-fold on the probes and rose by half on held-out contexts. Only λ = 20 lowered held-out mass, by 63%. So a probe set scored on itself would have reported success while the target quantity got worse. **Second, entropy and seed spread are separate signals:** at λ = 2, H(q_A) on probes fell by 71% while JS stayed small, so the seeds lost entropy in much the same direction. At λ = 20, entropy partly recovered and JS rose 38-fold. Neither alone detects the problem, and the entropy changes are not monotonic in λ. **Third, a short allowlist reached held-out contexts more readily** than a short denylist, 13% at λ = 2 and 53% at λ = 20. Neighbour-topic banned mass, not tabled, was flat: .0643 to .0671 at |B| = 3. CE on neighbours stayed at about .060. Limits: 3 seeds, and an explicit per-probe feature, which is a crude stand-in for how a transformer memorises.
- **Own recommended design, not tested.**
  - Generate probes by substituting within trigger templates, or from model-generated prefixes that reach a trigger, and keep them plausible. Avoid fragments no language model would produce.
  - Split them into training and evaluation sets. Using one set for both would be circular.
  - Start with far fewer probes than corpus positions. 200 probes at λ = 2 are about 7.4% of position weight (400/5390), against 0.3% now (16/5390).
  - Full-batch training mixes CE at every step automatically, but that does not anchor a probe context CE never touches. Its q_A is only as anchored as the parameters it shares.
  - Gate: stop if H(q_A) on evaluation probes drops, or cross-seed JS of q_A rises, beyond the λ = 0 range. Then try Libra-loss, checked against the same metrics.
- **Probes raise the KB risk.** Corpus-conflict counting cannot audit a probe, since it has no target. A wrong rule then trains in with nothing pushing back, so probes need human review of the KB first.

### Gaps
- No source tests probes with a semantic loss in a language model with a next-token head. Welleck and Minervini are the nearest, and neither uses a denylist set under log-sum.
- Faronius and Zuidberg Dos Martires and my toy disagree under Adam, and neither is a transformer trained with CE. Only the real run can settle it.
- No source I read tests Libra-loss on a token vocabulary of this size.

## What ordering and separation rules keep M1 and M5 from interfering?

### Takeaway
The earlier report's five rules stand, and I found no source against them. Wang et al. add the sharpest support: training through the mask is the opposite objective, and a mask keeps its value after any finite λ if the rule is noise-free. New here: on contexts the mask covers, M5's value equals the mask's own distortion, so a successful M5 should change little in masked output there. M5's visible contribution has to be read at contexts the mask does not reach.

### Cited Findings
- **M5 must not read masked probabilities.** Eq. 21 gives the on-training objective R_CE − V_CE, "opposite" to the regulariser "in their attitudes towards violations": regularisation "views violation as a bad thing", while constrained inference treats "a large violation" as "a great potential to be improved" ([Wang et al. 2023, Prop. 4.6](https://arxiv.org/abs/2307.03886)).
- **Inference after regularisation is still worthwhile if the rule is right.** A mask lowers CE risk if and only if V(f) > V_ora (Theorem 4.3), so for a noise-free constraint it "always achieves a smaller or equal risk". Inference stops helping a regularised model only when V_ora ≥ V(f_∞) and ρ ≥ 1/(V_ora − V(f_∞)) (Theorem 5.2) ([Wang et al. 2023](https://arxiv.org/abs/2307.03886)).
- **Order in a major library.** Hugging Face's generation code builds `NoBadWordsLogitsProcessor` ahead of `TemperatureLogitsWarper` and `TopPLogitsWarper`, which matches mask, then temperature, then top-p ([transformers `generation/utils.py`, about lines 1502, 1605, 1614, main branch as fetched](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/utils.py)).
- **Same list in both layers, separated by stage.** Pseudo-semantic loss trains with a word-list constraint and bans the words at generation ([Ahmed et al. 2023](https://arxiv.org/abs/2312.03905)). Krishna's arms show that the post-hoc step and the training term can be measured separately on one rule ([Krishna et al. 2018](https://aclanthology.org/D18-1505/)).
- **Separation in the repo's code.** `forward` computes `softmaxRows` on raw logits (`transformer.ts:756`). `generateText` copies last-position logits into a fresh array before temperature (`transformer.ts:957-967`). The specified processor edits only that array, and `massBefore` is read before the edit (`docs/progress/07-neurosymbolic-code-2b.md:553`, `:563`). M5's gradient uses `cache.probs` (`07:437`).

### Inferences
- **Own identity, checked numerically.** With q_A the masked distribution, KL(q_A ‖ p) = −log P_A = L_sem at that context. On logits [2, 1, .5, −1, .2] and A = {0, 2, 4}, both sides are 0.26299. So M5's value is the information cost of the mask at that step, and for an allowed target, also exactly the CE the mask removes. At the brief's values that is 0.104 nats on average and 0.402 for the worst role, and 8 × 0.104/5390 = 0.00015 nats per token over the corpus.
- **The consequence that matters.** With M1 on, the sampled distribution at a covered context is q_A, whatever P_B is. M5 has no objective on q_A, only path drift. So at covered contexts with the mask on, a successful M5 should leave generated text about unchanged. That gives M5 three jobs left: mask-off persistence, lower distortion measured directly, and contexts where M1 does not fire. Krishna's −0.43 and +0.04 fit this pattern in a different task.
- **Consequence for Wang's Theorem 5.2.** With zero noise, V_ora = 0, so its condition needs V(f_∞) = 0 and an infinite ρ. So for a correct rule no finite λ makes the mask redundant. 0 corpus conflicts does not show the rule is noise-free: it shows only that the 8 positions do not contradict it.
- **Added separation rules (own).**
  1. **Parity test.** One test asserting that the precomputed `semMasks` entry equals `allowed()` on the same ids for a sample of positions, so that M5 and M1 cannot drift apart when the KB or tokenizer changes.
  2. **Context parity.** Training prefixes are at most 16 tokens from `seq.input.slice(0, t+1)`, and generation uses `ids.slice(-windowSize)`, with windowSize from `seqLen ?? cfg.contextLen` (32 unless passed; `transformer.ts:953`, `:957`). Pass 16 so that both see the same context length, or the model is scored on contexts it never saw.
  3. **Separate write paths for probes.** Probes contribute L_sem only, and never enter `crossEntropyLoss`, the corpus-conflict count or the M1 trace.
  4. **Measure with the mask off.** Read M5's effect at fixed contexts from raw logits, at T = 1. State the temperature whenever a generation-time figure is quoted, because the mass at T = 0.8 differs.
  5. **Keep the guards aligned.** M5 skips when B covers the vocabulary, and M1 falls back (`07:387`, `07:558`). Count both, since they mark the same situation.
- **What this does not fix.** Wrong definitions made of allowed tokens pass both layers. M1 blocks only listed single-token forms after a fired trigger, and M5 lowers only those tokens' mass. That the samples "still contain wrong definitions" is therefore not by itself evidence against either layer, until each wrong token is checked against B. The check is not done here, because the KB was not available to me.

### Gaps
- No paper tests the combination with a sparse rule, or reports M5-equivalent banned mass with and without a later mask in a language model.
- Wang's results concern population risk under a stated hypothesis class, not one transformer, and the on-training comparison uses their CCM formulation, with soft µ. I read µ = ∞ as M1.
- The Hugging Face line numbers are from the main branch on the fetch date and will drift.
