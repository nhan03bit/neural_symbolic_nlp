# Residual uncertainty after hard constraints and a logic loss: what can and cannot be guaranteed

Scope: the project's M1 hard logit mask, M2 soft bias, M3 trace, M4 verifier and M5 semantic loss, all driven by a small hand-written knowledge base (KB) of triples and Horn rules (`README.md`, lines 125-150).

Reading conventions:
- "Cited Findings" come from the linked source. I read the abstract page or full text as stated.
- "Inferences" are mine.
- Nearly every number below comes from models of 7B parameters or more, or from GPT-class APIs. The project's transformer has 78,951 parameters, 807 tokens, and a baseline sample that is "domain words in no order" (`README.md`, lines 196-214). The numbers show the shape of each limit, not what the project will measure.

## What can actually be guaranteed, by any method (summary map)

### Takeaway
No method resolves the uncertainty completely. Hard methods give certainty about a formal object: which token IDs were blocked, and what follows from the KB. Statistical methods give marginal, assumption-bound rates. The gap between the formal object and the meaning of the text is never closed by proof. It can only be bounded, reported or deferred, or removed from a given output by giving up neural generation there, which moves the risk to KB authoring and input parsing.

### Cited Findings
- Verified-generation soundness is inherited, not created: "the soundness of the LLM-modulo framework is inherited from the soundness of the correctness (hard) critics", and "the completeness of the system depends on the LLM's ability to generate all potentially relevant candidates" — [Kambhampati et al., ICML 2024](https://arxiv.org/pdf/2402.01817)
- Amazon's Automated Reasoning checks report results as relative to a policy model. A "Valid" finding means the conclusion follows from the model plus the premises, and the paper says soundness depends heavily on the quality of that model — [Bayless et al., 2025](https://arxiv.org/html/2511.09008v1)
- Distribution-free conditional coverage is impossible in the general case. Conformal coverage is marginal over calibration and test draws — [Angelopoulos & Bates](https://arxiv.org/html/2107.07511); [Barber et al., Information and Inference 2021](https://arxiv.org/abs/1903.04684)
- A calibrated generator must hallucinate at a rate close to the fraction of facts seen exactly once in training. This holds under a calibration condition, for "arbitrary" facts whose truth cannot be determined from the training data, regardless of architecture or data quality. The authors see no such statistical bound for systematic facts or for facts seen multiple times — [Kalai & Vempala, STOC 2024](https://arxiv.org/abs/2311.14648)
- Satisfying the logic does not fix the meaning of learned concepts. Neuro-symbolic predictors can reach high accuracy by assigning concepts unintended meanings, called reasoning shortcuts — [Marconato et al., NeurIPS 2023](https://proceedings.neurips.cc/paper_files/paper/2023/hash/e560202b6e779a82478edb46c6f8f4dd-Abstract.html)

### Inferences (mine)

| Residual | Can it be eliminated? | Best available treatment | Form of the promise |
| --- | --- | --- | --- |
| Blocked token ID appears | Yes, by construction | M1 mask | Absolute, for token-expressible constraints only |
| Derivation does not follow from the KB | Yes | Horn forward chaining | Absolute, relative to the KB |
| KB is wrong or incomplete | No | Human review, completeness statements, three-valued output | None formal; report coverage |
| Choice among valid tokens | No (a mask is silent) | Ensembles, sampling spread, conformal sets | Statistical or descriptive |
| Text-to-triple lifting error | No, except inside a closed controlled language | Redundant parses, abstain on disagreement, gold test set | Empirical rate |
| Inherent language or context ambiguity | Not by the model; only by more information | Ask, enumerate or abstain | Behavioural |
| Seed and epistemic spread | No, but can be measured | Deep ensemble, on this model | Descriptive; not a coverage claim |
| Sampling randomness | Yes | Greedy decoding, fixed seed | Absolute on one platform |
| Overall wrong-output rate | No | Conformal or selective prediction | Marginal, exchangeable, relative to an admission function |

Claim wording the evidence supports: "No output contains a blocked token, and every asserted triple the verifier could parse follows from the KB; X% of output was unparsed; the KB covers Y% of the test questions." Do not claim "the model's output is correct" or "uncertainty is resolved".

### Gaps
- I found no paper that sets out this whole map for constrained decoding. The table is my synthesis.

## What hard-constrained decoding and verified generation actually guarantee

### Takeaway
Soundness holds only relative to the encoded KB and only for what the mask can express at token level. The mask removes options but gives no reason to prefer among the remainder, and it also distorts the distribution over what survives. The semantic loss gives no per-output guarantee at all.

### Cited Findings
- Forward chaining is sound and complete for Horn KBs: it derives every entailed atomic sentence and stops at a fixed point. This source is course notes for a textbook result, not a primary paper — [NUS lecture notes](https://www.comp.nus.edu.sg/~kanmy/courses/3243_2007/lectureNotes/m7-logic2-pub_files/outline.htm)
- Under the closed world assumption a missing triple means false; under the open world assumption it means unknown. The open reading is "justified, since KGs are known to be very incomplete": place of birth is missing for 71% of people in Freebase, even though the schema makes it mandatory — [Nickel et al.](https://arxiv.org/pdf/1503.00759)
- There is a recognised middle ground. Completeness can be asserted locally for parts of a KB — [Razniewski et al. survey](https://archivesic.ccsd.cnrs.fr/DIG/hal-04461994v1). Text2KGBench uses a "locally closed approach" that scores only relations in the ground truth, so as to avoid false negatives — [Mihindukulasooriya et al., 2023](https://arxiv.org/abs/2308.02357)
- Constrained decoding "can distort the LLM's distribution": outputs are grammatical "but appear with likelihoods that are not proportional to the ones given by the LLM". The ASAp algorithm targets the true conditional distribution, and the abstract states it does this provably — [Park et al., NeurIPS 2024](https://arxiv.org/abs/2405.21047v3)
- Constrained decoding can add overhead and hurt task accuracy if it does not align sub-word vocabularies with the constraints — [Beurer-Kellner et al., 2024](https://arxiv.org/abs/2403.06988)
- Consistency can be guaranteed by construction at the distribution level. Semantic Probabilistic Layers keep predictions "consistent with a set of predefined symbolic constraints", with "perfect constraint satisfaction" in the authors' structured-output experiments. These are not free-text generation tasks — [Ahmed et al., NeurIPS 2022](https://proceedings.neurips.cc/paper_files/paper/2022/hash/c182ec594f38926b7fcb827635b9a8f4-Abstract.html); [abstract](https://arxiv.org/abs/2206.00426)
- Not all "constrained" decoders are hard. NeuroLogic Decoding converts the logic constraints into a soft penalty and uses beam search for approximately optimal solutions — [Lu et al., NAACL 2021](https://ar5iv.labs.arxiv.org/html/2010.12884)
- Semantic loss enters training as "existing loss + w · semantic loss", with an explicit independence assumption over the variables — [Xu et al., ICML 2018](https://arxiv.org/pdf/1711.11157), quotes as recorded in the project's earlier note `research_notes/Semantic loss original paper/xu_2018_semantic_loss.md`
- Models that follow rules can be overconfident in shortcut concepts, and the only fully trustworthy fix the authors identify is costly dense concept supervision — [Marconato et al., BEARS](https://arxiv.org/abs/2402.12240)

### Inferences (mine)
- P1 ("violations are 0 for token-expressible constraints") is true by construction. It tests the implementation, not the model or the KB. If M4 checks against the same KB, a clean result is partly circular, so a gold set written independently of the KB is needed.
- **The world assumption sets the mask's power.** Under an open reading, M1 can block only tokens that contradict a derived fact, so it is silent on anything the KB never mentions. Under a closed reading it blocks everything not derivable, which on a small KB leaves almost no legal vocabulary and rejects true statements. Neither reading escapes the trade-off. A sensible choice is closed only for specific relations declared complete, open otherwise, with a three-valued verifier output (supported, contradicted, unknown).
- **Horn rules cannot express negation natively.** In the README's relations, `can` and `cannot` are two unrelated positive predicates. A KB can derive both for one entity with no error unless an integrity check is added.
- **Wrong rules pass silently.** The README's example `is_a(x, fish) ⇒ cannot(x, fly)` is defeated by flying fish. Definite-clause logic is monotonic and has no exceptions, so the system would then enforce a falsehood with total confidence. A hand-written KB makes this a real risk rather than a theoretical one.
- **Ties survive the mask.** If three tokens are legal, the choice among them still comes entirely from the network. M2 changes that choice by adding +λ without any evidence that the choice improves, and token-by-token renormalisation is not conditioning on the sequence eventually being valid (Park et al.'s distinction). The mask also cannot foresee dead ends, where every continuation is blocked; I found no source on how to handle this for a token mask, so it needs an explicit design decision.
- `massBefore` from M3 measures how much the network wanted a blocked token. It is a useful diagnostic of model and KB disagreement, not a measure of correctness.
- M5 changes the weights but gives no per-output promise. A low semantic loss could also come from a shortcut, such as raising mass on the common allowed tokens, in the spirit of Marconato et al. This transfer from concept-based predictors to token-level loss is my extrapolation.
- BPE tokens make entity constraints a prefix problem. A multi-token entity needs a trie or automaton over token sequences. The README already notes that "constraints work cleanly only on whole-word tokens", while the transformer uses 1000 merges, not the skip-gram's whole-word vocabulary.

### Gaps
- No source I found quantifies mask distortion on a small from-scratch model, or on word-level KB constraints in place of grammars. Park et al. evaluate on program synthesis and constituency parsing.

## Verifier limits: lifting text into triples, entity linking, coreference, tokenisation

### Takeaway
A sound reasoner downstream does not make the pipeline sound, because errors concentrate in translation. Measured natural-language-to-logic accuracy on realistic text is well short of 100%, the benchmarks themselves are noisy, and the common failure is abstention or silent information loss rather than a visible crash. For the project, M4's real limit is likely to be "no parse", not "wrong parse".

### Cited Findings

**Text-to-logic pipelines**
- LINC (GPT-4, FOLIO): "all errors have been localized to the semantic parsing procedure". Failure modes are L1 (implicit information not captured), L2 (explicit information lost through the choice of representation) and L3 (syntax errors: 38% StarCoder+, 24% GPT-3.5, 13% GPT-4 of generations). It predicts Uncertain 57% of the time vs 41% for chain-of-thought. Precision on True/False is 93% vs 81%; recall is 60% vs 75%. 2% of predictions throw an error. The authors also found 22 of 204 FOLIO validation samples had errors — [Olausson et al., EMNLP 2023](https://arxiv.org/pdf/2310.15164)
- Logic-LM execution rate vs accuracy on executed samples (Exe_Rate / Exe_Acc, before self-refinement): GPT-4 FOLIO 79.9% / 80.4; GPT-4 AR-LSAT 32.6% / 60.0; GPT-4 ProofWriter 99.0% / 79.6; GPT-3.5 FOLIO 66.7% / 61.8. "Exe_Rate only reflects the grammar correctness." Self-refinement raised GPT-4 FOLIO execution to 85.8% but accuracy moved from 80.4 to 79.9. The authors attribute stagnation to the feedback being the solver's error message. Un-executable cases fall back to chain-of-thought. High rates on synthetic datasets are "somewhat anticipated" given their limited language variability — [Pan et al., Findings of EMNLP 2023](https://arxiv.org/pdf/2305.12295)
- Benchmarks are noisy. A human audit of 275 FOLIO validation and 100 MALLS test items found 42.5% and 42% incorrect gold formulas (semantic errors alone: 32% and 39%), plus 17.8% and 51% ambiguous sentences, and 8.4% incorrect entailment labels in FOLIO. Translation accuracy measured against curated gold on all FOLIO instances: Gemma 4 31B 74.2%, GPT-4o-mini 61.5%, Qwen3-30B 58.5%; on the unambiguous subset 82.7%, 69.0%, 65.0% — [Brunello et al., EMNLP 2026](https://aclanthology.org/2026.emnlp-main.576.pdf). A [secondary summary](https://www.emergentmind.com/papers/2606.02837) gives about 39% and 36%; the published abstract and Table 1 give the figures above, and I use those.
- Autoformalisation of competition maths into Isabelle/HOL: 25.3% flawless statement translations — [Wu et al., NeurIPS 2022](https://proceedings.neurips.cc/paper_files/paper/2022/hash/d0c6bc641a56bebee9d985b937307367-Abstract.html)
- Translators ignore ambiguity by default. Large pretrained models struggle to represent the range of possible meanings without explicit instruction, though they do better when the ambiguity is present in the input — [Stengel-Eskin et al., ICLR 2024](https://arxiv.org/abs/2306.00824)
- Multiple formalisations can be compared to catch errors. Automated Reasoning checks run redundant translations and return `TranslationAmbiguous` on disagreement, or `NoTranslations` when text does not map into the vocabulary. Reported soundness exceeds 99% on a benchmark, with soundness defined as 1 − false positives / samples. A 62-item airline-policy case study gives soundness 100%, recall 45.5%, FPR 0% with human vetting, and soundness 96.8%, recall 25.0%, FPR 8.7% without. Self-reported by the vendor; no independent replication found — [Bayless et al., 2025](https://arxiv.org/html/2511.09008v1)

**Triple extraction**
- Text2KGBench (Vicuna-13B and Alpaca-LoRA-13B, ontology-driven prompts): average F1 on Wikidata-TekGen 0.35 and 0.27; on DBpedia-WebNLG 0.30 and 0.25; Vicuna per-ontology F1 on Wikidata-TekGen spans 0.24 to 0.66. Ontology conformance is much higher, at 0.83 to 0.93. Subject, relation and object hallucination rates fall between about 0.07 and 0.38. These are 2023 open models — [Mihindukulasooriya et al.](https://arxiv.org/abs/2308.02357)
- Gold triples are themselves incomplete. In DocRED "false negative samples are prevalent"; models trained and evaluated on the 4,053 re-annotated documents scored about 13 F1 points higher, so much of the apparent error was in the labels — [Re-DocRED, 2022](https://arxiv.org/abs/2205.12696)

**Fact verifiers**
- FActScore is relative to a knowledge source (English Wikipedia). InstructGPT 42.5%, ChatGPT 58.3%, PerplexityAI 71.5% on biographies. Not-supported covers both contradicted and no evidence, and does not establish falsehood. Annotator agreement was 96%, 90% and 88% on the three models. The automated estimator differs from the human score by under 2 points in aggregate, which is not per-fact accuracy — [Min et al., EMNLP 2023](https://arxiv.org/html/2305.14251v2)
- SAFE agreed with crowd annotators on about 72% of roughly 16k facts, and SAFE was judged right in 76% of a sample of 100 disagreements — [Wei et al., 2024](https://arxiv.org/abs/2403.18802)
- FActScore is sensitive to the decomposition method — [A Closer Look at Claim Decomposition, 2024](https://arxiv.org/abs/2403.11903). "Fully atomic facts are not the right representation", because they lose the context needed to interpret them, which is especially relevant in ambiguous settings — [Gunjal & Durrett, Findings of EMNLP 2024](https://arxiv.org/abs/2406.20079)
- Even a pairwise meaning check is imperfect. The entailment classifier in semantic entropy was 92.7% and 95.3% accurate in manual checks, falling to 61% on high-temperature outputs (1.5) — [Kuhn et al.](https://arxiv.org/html/2302.09664v3)

### Inferences (mine)
- **The verifier inherits the KB's limits and adds its own.** LINC's 93% precision with a sound prover shows a sound reasoner does not imply 100% correct answers. Precision up and recall down is also the expected signature of the project's stack: errors turn into "unknown" rather than disappearing.
- **Answer accuracy hides translation error.** Logic-LM's 80.4% is an answer-level number on three-way labels, while curated formula accuracy runs from 58.5% to 74.2% for different models on the same dataset. Do not compare them directly, but they warn against using a downstream answer score as evidence that lifting is right. For M4, score triples against a gold set directly.
- **Vacuous pass risk.** On the current baseline text ("the claimant is. the and. six.."), a parser would extract almost nothing. Zero violations would then mean zero checked claims. E2 must report parsed-claim yield next to the violation rate, and treat unparsed text as unknown, not as clean. This should be re-checked after the three `transformer.ts` defects are fixed.
- **The project's advantage is scale.** With few relations and a controlled lexicon, a deterministic pattern parser needs no neural model, so its behaviour is exact on its own fragment. Its errors become coverage gaps: sentences outside the patterns. This is why large-LLM parser error rates may overstate wrong parses here, while understating misses. It is untested.
- **Silent lifting errors remain possible.** "The tenant paid the landlord" and a pronoun-bearing "she paid him" look alike to a pattern parser only if coreference is ignored. The model's training window is 16 tokens and its context 32, so a referent may lie outside what either the model or a per-sentence verifier sees. The safe rule is that an unresolved pronoun yields no triple. Entity aliases need an explicit table; string match on BPE-decoded text will miss or falsely merge entities.

### Gaps
- I found no verified measured accuracy for entity linking or coreference as components within a text-to-triple verifier. The search returned only general triple-extraction work, so no such number is given.
- Nothing measures verifiers on small-model output, which differs sharply from fluent LLM text.
- Bayless et al.'s benchmark conditions were not checked past what is stated above, and the 99% figure comes from the abstract.

## Quantifying what remains: conformal, selective, semantic entropy, ensembles, decomposition

### Takeaway
These methods bound or report uncertainty and do not reduce it. Conformal methods are valid at any calibration size but are marginal, need exchangeable data and an admission function, and fluctuate at small n. On a small corpus the sound uses are a deep ensemble over seeds (feasible here, unlike for large LLMs) and honest binomial bounds. A conformal claim needs fresh held-out prompts, and its meaning is limited to "acceptable to the checker".

### Cited Findings

**Conformal prediction**
- Conformal Language Modeling promises P(P(∃y ∈ C(X_test): A_test(y) = 1 | D_cal) ≥ 1 − ε) ≥ 1 − δ. So at least one admissible output is in the sample set; nothing is said about any individual response. If no configuration passes, it returns null. Stated limits: i.i.d. data, an appropriate admission function, sets not too large, and low k_max making some ε unattainable. Guarantees "do not necessarily hold when conditioned on a particular type of input". Datasets reserved on the order of 10^4 examples for calibration experiments (for example, TriviaQA validation 18,669 and MIMIC 19,658) — [Quach et al., ICLR 2024](https://arxiv.org/abs/2306.10193)
- In that work, admission relied on human references or proxies such as CheXbert labels — [Quach et al., Assumption 3](https://arxiv.org/abs/2306.10193)
- Conformal factuality backs off an answer by removing low-scored subclaims until the reference entails it. The guarantee is marginal, for α in [1/(n+1), 1], and assumes exchangeability. Reported GPT-4 factuality moved 30→80% on FActScore, 78→93% on NQ and 75→95% on MATH; on FActScore, about half the sub-claims were removed at α = 0.2. Correctness depends on the reference and the oracle, and the authors annotated 50 inputs per dataset — [Mohri & Hashimoto, ICML 2024](https://arxiv.org/html/2402.10978v1)
- Treating each claim in isolation fails for reasoning, where a step is valid only given earlier ones. Coherent factuality conformalises over a deducibility graph, reporting 90% factuality with at least 80% of claims retained on MATH and FELM. Preprint — [Rubin-Toles et al., 2025](https://arxiv.org/abs/2505.17126)
- Coverage is valid for any n, but coverage given one calibration set is random, distributed Beta(n+1−l, l) with l = ⌊(n+1)α⌋. At n = 1000 and α = 0.1, coverage is typically 0.88 to 0.92; the authors treat n = 1000 as sufficient "for most purposes". Under shift the guarantee does not automatically hold — [Angelopoulos & Bates](https://arxiv.org/html/2107.07511)
- KnowNo applies conformal prediction to ask a human for help, claiming statistical task-completion guarantees for robot planners — [KnowNo, CoRL 2023](https://arxiv.org/abs/2307.01928)

**Selective prediction**
- A selective classifier can guarantee 2% top-5 error on ImageNet with 99.9% probability while covering almost 60% of test instances — [Geifman & El-Yaniv, 2017](https://arxiv.org/abs/1705.08500)
- For LLMs, repetition within sampled outputs was the most reliable abstention signal, ahead of likelihood or self-verification — [Cole et al., EMNLP 2023](https://arxiv.org/abs/2305.14613)

**Semantic entropy**
- Entropy over meaning clusters formed by bidirectional entailment from 10 samples. AUROC on the 30B model: CoQA 0.77 vs 0.66 for counting distinct answers; TriviaQA 0.83 vs 0.79 — [Kuhn et al.](https://arxiv.org/html/2302.09664v3)
- The authors' public statements on the follow-up describe the method as catching only confabulations, not a consistent but wrong model. I could not open the Nature full text — [OATML summary of Farquhar et al., Nature 2024](https://oatml.cs.ox.ac.uk/blog/2024/06/19/detecting_hallucinations_2024.html)

**Decomposition and ensembles**
- Hou et al. use H(q(Y|X)) = I(Y;θ|X) + E[H(q(Y|X,θ))] as the template, and argue that Bayesian and deep-ensemble approaches do not work for black-box LLMs, where only in-context examples can be varied. They instead ensemble over clarifications of the input. AUROC for detecting ambiguity on AmbigQA: 71.7 (GPT-4 clarifier), 67.1 (fine-tuned Llama clarifier), and 89.8 with ground-truth disambiguations as an upper reference, vs 54.9 for semantic entropy and 53.6 for their in-context-example approximation of ensembles (5 example sets; aleatoric term). AmbigInst: 81.3 (GPT clarifier) and 96.7 (ground truth) vs 66.0 for semantic entropy. The appendix reports model-confidence methods below 60 at identifying ambiguous inputs — [Hou et al., ICML 2024](https://arxiv.org/abs/2311.08718)
- Deep ensembles give well-calibrated predictive uncertainty and higher uncertainty out of distribution — [Lakshminarayanan et al., NIPS 2017](https://arxiv.org/abs/1612.01474). Under dataset shift, post-hoc calibration performs poorly and methods that marginalise over models do surprisingly well — [Ovadia et al., 2019](https://arxiv.org/abs/1906.02530)
- Random initialisations "explore entirely different modes" — [Fort et al.](https://arxiv.org/abs/1912.02757)
- BEARS uses an ensemble to make concepts affected by shortcuts visibly uncertain, without eliminating the shortcuts — [Marconato et al.](https://arxiv.org/abs/2402.12240)

### Inferences (mine)

Own calculation from the Beta formula above (5th to 95th percentile of coverage for a single calibration set):

| n | α = 0.1 | α = 0.05 |
| --- | --- | --- |
| below 9 / below 19 | vacuous | vacuous |
| 20 | 0.784 to 0.982 | 0.861 to 0.997 |
| 50 | 0.826 to 0.960 | 0.909 to 0.993 |
| 100 | 0.848 to 0.945 | 0.911 to 0.980 |
| 200 | 0.864 to 0.933 | 0.923 to 0.973 |
| 1000 | 0.884 to 0.915 | 0.938 to 0.961 |

- **What small n promises.** The marginal guarantee stays valid, but a realised run can sit far from target. Vacuous thresholds match Mohri's α ≥ 1/(n+1).
- **Exchangeability is the bigger problem than n.** The corpus has 256 items and 6,431 overlapping windows (`README.md`). Overlapping windows from a training item are neither fresh nor independent. Calibration prompts must be held out by item, and must match the prompts used in deployment.
- **Conformal coverage here would be conditional on the KB.** If M4 is the admission function, the promise is only "some sampled output passes the checker". Passing can also be vacuous, as above, so require a parsed claim for admission. For meaningful results use human labels on some items; the conservative admission route in Quach et al. then applies.
- **Expected practical outcome.** A weak model may yield no achievable ε at reasonable k_max, returning null. That is an honest result and should be reported as one.
- **Ensembles are possible here, unlike in Hou et al.'s setting.** At this scale, training M seeds is affordable (710 s for one 300-epoch run on 10 cores). Compute next-token mutual information across seeds, and report it alongside `massBefore`. It is a descriptive measure of seed disagreement inside this model class. It is not a guarantee, and it does not detect errors shared by all seeds, such as those from a shared corpus or KB. Seeds trained on identical data also underestimate data uncertainty.
- **Semantic entropy is unlikely to fit as is.** It needs an entailment model and coherent text. The closest cheap analogue is entropy over the set of parsed triples across samples, with "no parse" as its own class. This is my proposal and is unvalidated.
- **Zero-violation reporting.** With no violations in n independent checked claims, the 95% upper bound is about 3/n, the rule of three — [Hanley & Lippman-Hand, JAMA 1983](https://jamanetwork.com/journals/jama/article-abstract/389714). So 0 of 100 gives about 3%, and 0 of 300 about 1%. The bound is on the rate within what was checked and sampled, not on absent errors. The same logic applies to vendor claims: 0 false positives among the 18 true negatives in Bayless et al.'s case study has an exact upper bound of about 15% by my calculation, and 0 of 62 samples gives about 4.7%.

### Gaps
- I found no study of conformal, ensemble or semantic-entropy methods on a transformer of this size or corpus size. All of the above is extrapolation.
- The AUROC in the Nature follow-up was not verified, so it is not reported.
- Ovadia's abstract does not name ensembles. Their ranking in that paper is not checked here.
- Hou et al.'s "ensembles" vary in-context examples on a fixed black-box model, so their low score says little about true multi-seed ensembles on a model one can retrain.

## Decoding choices: does greedy or beam decoding remove randomness?

### Takeaway
It removes sampling randomness only. The model's distribution, its dependence on the training seed, and the KB's coverage are untouched. Maximisation also discards the signal that uncertainty estimators rely on, and it is reproducible only under fixed numerics.

### Cited Findings
- Greedy decoding is not strictly reproducible on large models. Batch size, GPU count or GPU model can change outputs even with greedy decoding, because finite-precision floating-point arithmetic is non-associative. In one example (DeepSeek-R1-Distill-Qwen-7B, bfloat16) accuracy varied by up to 9% and response lengths differed by about 9,000 tokens — [Yuan et al., 2025](https://arxiv.org/abs/2506.09501)
- Training is unstable from one run to the next: "even one-bit changes in initial parameters result in models converging to vastly different values", and all sources of nondeterminism have similar effects on model diversity — [Summers & Dinneen, ICML 2021](https://arxiv.org/abs/2103.04514)
- A pipeline is underspecified when it can return many predictors with equivalently strong held-out performance that may behave very differently in deployment — [D'Amour et al., 2020](https://arxiv.org/abs/2011.03395). The abstract does not discuss seeds specifically.
- Likelihood-maximising decoding yields "bland and strangely repetitive" text, and decoding strategy alone can greatly change output quality on the same model — [Holtzman et al., ICLR 2020](https://arxiv.org/abs/1904.09751)
- Semantic entropy dropped from 0.758 AUROC with multinomial sampling to 0.735 with beam-search sampling on CoQA — [Kuhn et al.](https://arxiv.org/html/2302.09664v3)

### Inferences (mine)
- A greedy output is one fixed point of one seed's distribution. Same seed and same platform give the same text, which can still be wrong, and the top token's probability can be low. Determinism here is repeatability, not confidence.
- Run a seed test: same prompt, greedy decoding, M seeds, count distinct outputs. Greedy with a mask gives repeatability per seed, while the seed test exposes the variation it hides. This extends P4, which compares weights, to compare behaviour.
- Greedy picks the best token at each step, not the best sequence, and beam search approximates the latter. Under a mask, either can walk into dead ends.
- Yuan et al.'s hardware effects concern GPU batches on large models. The project's from-scratch TypeScript inference should be repeatable on one engine. Training sums worker gradients from `cpus − 2` workers, so if chunking changes with core count, floating-point sums may differ across machines. Worth checking against the "same seed gives same weights" gate.

### Gaps
- I found no peer-reviewed paper making exactly the claim that greedy decoding leaves model and seed uncertainty in place. It follows from the definitions, and the sources above support each part separately. Vendor and blog accounts of temperature-zero behaviour were not used because I could not verify their primary data.

## Inherent linguistic ambiguity: when the fault is not the model's, and what to do

### Takeaway
Often the uncertainty lies in the input, which has several legitimate readings, and no decoder, KB or better model removes it without more information. Evidence supports asking, enumerating or abstaining, each suiting a different condition. A forced single confident answer is the wrong behaviour.

### Cited Findings
- "Over half" of NQ-open questions are ambiguous, in the 14,042-question AmbigNQ data. The task is to find every plausible answer and rewrite the question for each — [Min et al., 2020](https://arxiv.org/abs/2004.10645)
- AmbiEnt has 1,645 linguist-annotated examples. GPT-4's generated disambiguations were judged correct 32% of the time, versus 90% for the dataset's own — [Liu et al., 2023](https://arxiv.org/abs/2304.14399)
- In NL-to-FOL, 17.8% of audited FOLIO and 51% of audited MALLS sentences are ambiguous, and accuracy measured on the unambiguous subset runs higher for FOLIO (for example 74.2→82.7 for Gemma 4) — [Brunello et al.](https://aclanthology.org/2026.emnlp-main.576.pdf)
- Aleatoric uncertainty is defined as irreducible randomness in the data-generating process, and epistemic uncertainty as coming from missing training information. Hou et al. attribute part of the aleatoric term to ambiguous or under-specified inputs — [Hou et al.](https://arxiv.org/abs/2311.08718)
- **Ask:** language models "rarely ask users to clarify ambiguous questions and instead provide incorrect answers"; CLAM selectively asks and reports significant accuracy gains on mixed questions. Preprint — [Kuhn et al., CLAM](https://arxiv.org/abs/2212.07769)
- **Abstain:** the most reliable abstention signal on ambiguous questions was repetition in sampled output — [Cole et al.](https://arxiv.org/abs/2305.14613). Guessing persists partly because accuracy-style benchmarks reward it — [Kalai et al., 2025](https://arxiv.org/abs/2509.04664)
- **Enumerate:** the AmbigQA task requires it ([Min et al.](https://arxiv.org/abs/2004.10645)), and the AmP authors argue that evaluation should consider the distribution of possible outputs ([Stengel-Eskin et al.](https://arxiv.org/abs/2306.00824)). Automated Reasoning checks do something similar: `TranslationAmbiguous` shows two translations and an assignment that distinguishes them ([Bayless et al.](https://arxiv.org/html/2511.09008v1))

### Inferences (mine)
A practical test separates the cases: fix the model and vary the disambiguating context. If adding context collapses the spread, the uncertainty was input-side. If the spread persists on an unambiguous prompt, it is model-side. This mirrors Hou et al.'s logic.

Rule of thumb for this project:
- Interactive, with a person able to answer: ask.
- Several readings, each with a KB derivation: enumerate them, with their derivations.
- No reading has a derivation, or the reading is outside the KB: abstain, and say "unknown", not "false".
- One reading and one derivation: answer.

Legal text sharpens this: terms like "reasonable" are deliberately open-textured, so a triple cannot capture their meaning. A KB for England & Wales civil disputes should refuse to assert them as settled facts. This is my judgment and not a sourced legal claim.

The small model adds model-made context ambiguity. A 32-token context cannot see earlier referents, which is model-side and fixable, unlike linguistic ambiguity. The two should be reported separately.

### Gaps
- All the cited datasets test large LLMs on English QA or NLI. I found no direct comparison of asking, enumerating and abstaining in a neurosymbolic pipeline, so the rule of thumb above is an inference. No legal-domain ambiguity data was checked.

## Fully deterministic alternatives: the neural-free route and its cost

### Takeaway
If an output must carry no model uncertainty, no neural network may author its content. The options run from a symbolic answer with template realisation, to the model proposing while a reasoner disposes. Determinism in content costs coverage and fluency, and it does not remove KB and input-parsing uncertainty. It does remove statistical uncertainty from the derivation.

### Cited Findings
- LLM-Modulo is generate-and-test: "the plans an LLM helps generate in this architecture have soundness guarantees because of the external sound critics". Autonomous plans were bleak by comparison: on average only about 12% of the best LLM's (GPT-4) plans were executable and goal-reaching. LLMs cannot serve as hard critics with soundness guarantees but can assist soft (style) critics. The domain models behind critics may themselves be acquired with LLM help — [Kambhampati et al.](https://arxiv.org/pdf/2402.01817)
- Pipelines with a solver hand the reasoning to the deterministic part, "transitioning the challenge of LLM from problem-solving to problem representation" — [Pan et al.](https://arxiv.org/pdf/2305.12295). LINC shows the same localisation — [Olausson et al.](https://arxiv.org/pdf/2310.15164)
- Vanilla seq2seq models "often fail to correctly express a given meaning representation" without semantic control in decoding, and "can be outperformed by hand-engineered systems" on overall quality, complexity, length and diversity of output — [Dušek et al., 2020](https://arxiv.org/abs/1901.07931)
- In data-to-document generation, neural models produce fluent text but fail to approximate human documents, and templated baselines exceed them on some metrics — [Wiseman et al., EMNLP 2017](https://arxiv.org/abs/1707.08052v1)
- Proof-carrying code provides the pattern for untrusted producers: the producer attaches a proof, and the consumer checks it against its own safety policy with a simple checker, so the producer need not be trusted. I read this via a course copy and secondary summaries — [Necula, POPL 1997](https://courses.grainger.illinois.edu/cs421/fa2010/papers/necula-pcc.pdf)
- Vetting improves results but does not fix recall: 25.0→45.5% in the case study, with soundness 96.8→100% — [Bayless et al.](https://arxiv.org/html/2511.09008v1)

### Inferences (mine)

From most to least deterministic:

| Route | Who authors content | Remaining uncertainty | Cost |
| --- | --- | --- | --- |
| Formal query → reasoner → template | KB and rules only | KB truth and coverage | No free text input; can only say what the KB and templates hold |
| NL query parsed by a deterministic grammar → reasoner → template | KB and rules | Plus parser coverage and ambiguity | Rejects unmatched wording |
| Model proposes a triple → reasoner verifies → template renders | KB-verified content only | Which true fact is chosen; completeness depends on model | Model adds ranking only, and misses are silent |
| Model generates text → M4 verifies, with proof attached | Model, with a check | All lifting errors | Fluent but only as sound as the parser |
| M1 + M2 + M5 only | Model | Everything above, except blocked token IDs | Fluent with no semantic promise |

- **Deterministic does not mean true.** The top route still outputs the flying-fish error, every time, with a proof. It does make every error traceable to a named rule or fact, which is the real gain.
- **The proof must be about the rendered text.** A proof attached to a triple says nothing about the sentence unless the realisation is a fixed template. This is why templating matters more than verification for a no-uncertainty output. With free neural text, the claim the proof covers is whatever the parser read.
- **For the project,** the top two routes are cheap, because forward chaining over a tiny KB is simple and because the model is currently far too weak to rely on. They also give an honest control arm for comparing M1 to M5. On questions where the KB holds the answer, a template system should beat the neural model on KB accuracy trivially. The research question therefore shifts to what the neural part adds at all: ranking, fluency, and coverage outside templates, each carrying uncertainty that must be reported.
- **Mixed output.** A reasonable design labels each span by provenance: "derived" (with a proof trace, from a template) or "generated" (unverified). This limits the promise to where it holds. It is a design proposal, unvalidated.

### Gaps
- I did not find a controlled study comparing a template or reasoner system against constrained neural generation on the same small KB.
- The 12% figure comes from planning benchmarks, and may not transfer to KB-grounded text.
- Critics' soundness in LLM-Modulo is assumed from external tools such as VAL. I did not find a general soundness result in the paper for critics that are themselves LLM-assisted, though I searched its text by keyword and did not read it line by line.
