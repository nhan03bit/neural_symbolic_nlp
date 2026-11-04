# When a KB-derived hard mask harms a transformer, and how systems decide a constraint is relevant

Scope: only what the earlier notes lack. The formal mask guarantee, ordering against top-p, and leakage through synonyms and spelling are in `Civil law KB M1 M5 plan/m1_lowering_and_inference_masks.md` and `Semantic loss with hard logit constraints/`, and are cited here only where an argument needs them.

How to read the tags:
- **Measured**: a number the paper reports. **Authors' view**: an interpretation or claim with no number behind it. Anything labelled "own" under Inferences is mine and is not in any paper.
- **Scale**: **[large]** means 0.5B parameters or more, or a hosted API. **[mid]** means an older seq2seq system. No source I found tests a from-scratch model near this project's size (vocabulary 937, d = 32, 2 layers). Small-model results below are 0.5B to 1.7B, which is still orders of magnitude bigger.
- **Reading depth**:
  - I read the PDF text directly for Riedel, Welbl, Xu (Generate-on-Graph), Faldu (RetinaQA), Li (DoG), Luo (GCR) and Özgü.
  - Domhan, Tam, dottxt, Maamari, Dai (KG noise), Scholak (PICARD), Dinu, Gehman, Wang, Ye and Ray were read through a page-summarising fetch tool. Their numbers were transcribed by that tool, not checked by me against the original tables.
  - Sources marked "abstract or snippet only" were not read in full.

Project figures (8 of 5,390, 0 conflicts, 10% firing at generation, massBefore) come from `Civil law KB M1 M5 plan/repo_probes_2026-11-03.md`. They are one seed on the memorised baseline.

## Is the claim true? "A knowledge base not built for the corpus will give vague and non-related constraints, leading to a corrupted neuro-symbolic system"

### Takeaway
Partly. As an absolute it is too strong, because a mismatched denylist KB is mostly inert, and this project's old KB (0 matches) is an example. The claim's mechanism is real, though. Measured evidence shows that external knowledge is about 2.4 times more often wrong for a corpus it was not derived from (31% against 13%, Riedel). It also shows that hard allowlists scoped from the wrong knowledge lower accuracy, sometimes below using no KB at all. "Corrupted" needs three things together: the gate fires, the banned set overlaps legitimate output, and that output carries probability mass that matters. Almost all the damage evidence comes from allowlists and soft context. No study measures a hard denylist mask with a mismatched KB, so the most relevant form of the claim is untested.

### Cited Findings
**Evidence for**
- **Direct evidence on mismatch (Measured).** When a KB is external to the text, entities co-occur "because they are related to the same topic". Manual inspection found the distant-supervision assumption violated about 13% of the time aligning Freebase to Wikipedia and 31% aligning to the New York Times. Per relation (100 sampled candidates each), NYT against Wikipedia: nationality 38% / 20%, place_of_birth 35% / 20%, contains 20% / 10%. Freebase is "derived in large parts from Wikipedia info-boxes" — [Riedel et al. 2010](https://link.springer.com/doi/10.1007/978-3-642-15939-8_10). Limit: this concerns training labels from entity co-occurrence, not decoding.
- **Learned gate moved to another KB's vocabulary (Measured, [large]).** On 2Wikimultihop (Wikidata labels), retrievers trained on Freebase fall well below plain chain-of-thought: GNN-RAG 42.00 / 26.78 / 37.54 against CoT 80.92 / 80.00 / 79.97 on Llama 3.1-8B / Gemma 2-9B / Qwen 2.5-7B. RoG "fails to generate relation labels of Wikidata" and cannot run at all — [Li et al., DoG](https://arxiv.org/abs/2410.18415).
- **KG-bound methods fall below no KB as gold facts disappear (Measured, [large]).** See the dose-response table under the coverage question. ToG on CWQ reaches 31.4 at IKG-80%, against 37.6 for a plain prompt with no KG — [Xu et al. 2024, GoG](https://arxiv.org/abs/2404.14741).
- **Inaccurate rules can be worse than none (Authors' view; figures not read).** Performance "would be seriously decreased when inaccurate logical rules appear, which may be even worse than baselines using only raw data" — [Yang et al., AAAI 2024](https://ojs.aaai.org/index.php/AAAI/article/view/29572), abstract only.

**Evidence against, or limiting**
- **A hard mask from a KB built for the task helps, and helps the smallest model most (Measured, [large]).** PICARD, which has access to the target schema, raises Spider exact match and execution accuracy: T5-Base 57.2 / 57.9 to 65.8 / 68.4, T5-3B 69.9 / 71.4 to 74.1 / 76.3. Top-k has a "modest to negligible impact" — [Scholak et al. 2021](https://arxiv.org/abs/2109.05093).
- **KG-constrained decoding gains on matched benchmarks (Measured, [large]).** DoG reaches 91.05 / 75.55 / 83.99 against CoT 89.88 / 72.14 / 80.92 (Llama 3.1-8B, bs = 1, WebQSP / CWQ / 2Wikimultihop), with ill-formed triplets going from 13.44% to 0.00% — [Li et al., DoG](https://arxiv.org/abs/2410.18415). GCR keeps a 100% faithful-reasoning ratio, against 48.1% on CWQ without the KG constraint, while "the answer hit rate on CWQ remains almost unchanged" — [Luo et al., GCR, ICML 2025](https://arxiv.org/abs/2410.13080).
- **Soft use tolerates a lot of noise (Measured, [large]).** With 50% of subgraph nodes replaced by irrelevant ones, ChatGPT on QALD-7 only falls from 82.56 to 80.39 — [Dai et al. 2024](https://arxiv.org/abs/2402.11541). It is a prompt input, not a mask.
- **Inert by construction in this project (project data).** The old KB fires at 0 positions. The narrow KB fires at 8 of 5,390 with 0 conflicts.

### Inferences
- **Own reframing: five states, not two.** Whether a KB is "mismatched" matters only through which state each firing lands in.

  | State | Condition | Effect | Project example |
  |---|---|---|---|
  | Inert: never fires | Trigger matches nothing | None, but also no benefit | Old KB on the corpus stream |
  | Inert: fires, no effect | Banned tokens hold almost no mass, or sit outside the nucleus | Sample unchanged | T = 1, top-p 0.6 on e2000: 0 of 3,200 banned draws with the mask off |
  | Useful | Banned token is truly wrong and has mass | Violation removed | T = 0.8, top-p 0.9: 56 contradicted down to 0 |
  | Hollow | True ban, but what remains is also poor | Valid, still wrong | e1000, see below |
  | Damaging: false ban | Legitimate token banned | Mass removed from correct output; CE infinite if the gold token is banned | One-word trigger on "x is" |

- **"Non-related" and "vague" are different failures (own).** A non-related KB shares no trigger vocabulary, so it tends to be inert. A vague KB has wide triggers or wide banned sets, so it fires often and collides with legitimate text. The owner's sentence joins them, but the evidence separates them: mismatch alone gives a null, and width gives the damage.
- **Allowlist against denylist is the key moderator (own).** Domhan, Maamari, RetinaQA, DoG and GCR are all allowlists: whatever the KB does not contain cannot be produced, so a mismatch turns into false bans automatically. This project's mask is a denylist, which is open-world for everything unlisted, so a mismatch turns into a null. That is why the project sees 0 matches and not catastrophe. The claim would hold much more strongly if the mask were ever changed to an allowlist. No paper tests this contrast directly.
- **The matched-benchmark gains are weak evidence against the claim (own).** WebQSP and CWQ questions are written against Freebase. DoG also uses a pre-scoped top-120 triplet graph and processes its datasets around answers present on the graph (section 3.1, read through broken two-column text). So these measure a KB that is built for the corpus, and they do not test mismatch.
- **Inert on the corpus does not prove inert at generation (own, and untested).** The narrow KB fires at 0.148% of corpus positions but at 10.0% of generation steps from the prompt `the claimant is`. A KB with 0 corpus matches could still fire on generated prefixes, so the old KB's "0 matches" should be re-measured on samples before anyone calls it inert.
- **Zero conflicts on 8 positions is weak evidence (own arithmetic).** With 0 failures in 8 trials, the 95% upper bound on the conflict rate is 1 − 0.05^(1/8) ≈ 31%. The positions are not independent draws from legal language either. It shows this KB does not contradict this text at these positions, and no more than that.

### Gaps
- I found no study that takes one model, swaps in a KB written for a different corpus, and measures a hard mask's effect on output. Riedel is the only direct measurement of KB-corpus mismatch I found, and it is about labels.
- No paper separates "never fires" from "fires harmlessly" as outcomes. The five states are my own synthesis.

## What failure modes are documented for KB or lexicon-constrained decoding?

### Takeaway
Most listed modes have measured examples, but mostly from allowlists on large models. False bans and wide triggers have the best evidence. Outdated facts in a mask and wrong entity linking inside a mask have no direct measurement, only neighbouring results.

### Cited Findings
- **False ban from out-of-context allowed sets (Measured, [mid]).** Alignment-based vocabulary selection takes the top-k target words per source word, out of context. Reference-token recall at k = 200 looks fine for whole sentences (EN-DE 97.5%), but idiom spans drop to 80.0%, or 58.2% on the ITDS set. Idiomatic proverbs reach 74.6% at k = 200 against 96.5% for literal ones. The authors say the limit comes from predicting words out of context and not from alignment quality — [Domhan et al. 2022](https://arxiv.org/abs/2205.06618).
- **Over-wide triggers (Authors' design choice).** Dinu et al. "filtered out entries occurring in the top 500 most frequent English words as well as single character entries" to avoid spurious matches — [Dinu et al. 2019](https://arxiv.org/abs/1906.01105). They do not report what happens without the filter.
- **Forcing terms lowers quality, more for one term base than the other (Measured, [mid]).** Constrained decoding: BLEU −0.2 on Wiktionary and −0.5 on IATE (exact matches), and −0.9 and −1.3 on approximate matches. Training-based term use on the same bases: BLEU +0.9 and +0.2. Term use under constrained decoding is 99.5% on Wiktionary but 82.0% on IATE at the same beam. The authors call constrained decoding "brittle" in realistic conditions, with examples of forcing a term when a variant is already present and of uninflected terms — [Dinu et al. 2019](https://arxiv.org/abs/1906.01105). These are inclusion constraints, not bans.
- **Irrelevant facts firing (Measured, not a mask).** See Riedel above: 31% of external-KB alignments fire on sentences that do not express the fact.
- **Wrong or missing entity linking (Measured, [large]).** RetinaQA on GrailQAbility: 949 of 1,691 errors on answerable questions involve the entity linker (56%; categories overlap), and recall error is 70% of errors, of which about 80% are entity-linking errors. When an entity is absent "the entity linker returns an empty set" — [Faldu et al. 2024](https://arxiv.org/abs/2403.10849).
- **KB incompleteness produces right answers for wrong reasons (Measured, [large]).** Patidar et al. report that models "sometimes detect them for the wrong reasons" (snippet only) — [Patidar et al., ACL 2023](https://arxiv.org/abs/2212.10189). RetinaQA's Table 2 shows it: on questions with a missing non-mention entity, Pangu + T (trained on answerable questions) scores F1(R) 83.19 but exact logical-form match 0.00 — [Faldu et al. 2024](https://arxiv.org/abs/2403.10849).
- **Outdated facts (Measured, soft only).** Longpre et al. build conflicts by swapping answer entities in passages and measure over-reliance on memorised answers. Their mitigation improves out-of-distribution generalisation by 4% to 7% (abstract level) — [Longpre et al. 2021](https://arxiv.org/abs/2109.05052). This tests stale context, and it is not a mask.
- **Legal KB-grounded tools still err (Measured, [large]).** Lexis+ AI, Westlaw AI-Assisted Research and Ask Practical Law AI "each hallucinate" between 17% and 33% of the time, though less than GPT-4 (abstract level) — [Magesh et al. 2025](https://arxiv.org/abs/2405.20362). This is retrieval, with no hard mask.
- **Empty allowed sets and dead ends (Measured, [large]).** PICARD gives up on 2% of T5-3B predictions ("beam search exited without finding a valid SQL prediction"), against 12% execution errors without it — [Scholak et al. 2021](https://arxiv.org/abs/2109.05093). Ahmed et al. report empty generations for at least 30% of a sampled prompt subset with NeuroLogic ([earlier notes](../Civil%20law%20KB%20M1%20M5%20plan/m1_lowering_and_inference_masks.md); one group's run).
- **Constraining too early (Measured, [large]).** "100% of GPT 3.5 Turbo JSON-mode responses placed the "answer" key before the "reason" key", which the authors use to explain its poor Last Letter score — [Tam et al. 2024](https://arxiv.org/abs/2408.02442). dottxt blames the prompt for that result, not the method — [dottxt](https://blog.dottxt.ai/say-what-you-mean.html). Ye et al. give the mechanism: a token that looks locally valid leads to a dead end ("soccer" for "soccer shoes") — [Ye et al. 2025](https://arxiv.org/abs/2504.09135). Ray recommends "reason free, constrain late" — [Ray 2026](https://arxiv.org/abs/2605.26128) (single-author preprint). DoG lifts the constraint once a triplet is complete and re-applies it at the next triplet token — [Li et al., DoG](https://arxiv.org/abs/2410.18415).
- **Over-filtering spills onto the wrong subject (Measured, [large]).** After training-set filtering at 0.05, the share of flagged samples mentioning "gay" rises from 4.1% to 30.2%. One author's rough check of 50 such samples called 32% false positives, 34% unclear and 34% toxic — [Welbl et al. 2021](https://arxiv.org/abs/2109.07445). The filter is a classifier and not a word list, and the sample is small.
- **A plain hard word ban has little effect on its own target (Measured, [large]).** Setting logits to −∞ on a bad-word list moves expected maximum toxicity only from 0.75 to 0.68 on toxic prompts and 0.51 to 0.48 on non-toxic ones. The paper reports no false-positive or perplexity figures for it — [Gehman et al. 2020](https://arxiv.org/abs/2009.11462). So this denylist's collateral damage is unmeasured.

### Inferences
- **A narrow denylist shows the hollow state on a weak checkpoint (own, from repo numbers).** The mask gives p/P_A. At e1000 for `claimant`, banned mass is 0.748 and `brings` is 0.087, so after masking `brings` is only 0.345 and other allowed tokens hold 0.655. At e2000 (0.331 and 0.614) `brings` becomes 0.918. So the same true ban gives good text on the strong checkpoint and valid junk on the weak one. Nothing about the KB differs.
- **Own corpus count for the one-word trigger (rough, word-level, `corpus.ts` lines 23-268 and 289-336, regex tokens, not BPE).** If the frame gate is removed and each of the 8 roles bans the other roles' verbs from the next word, the trigger fires at 64 role mentions and false-bans 7 (10.9%). This count uses 4,887 regex word tokens, so it is not comparable in unit to the 5,390 BPE tokens in the probes. All 7 are `x is`, because `is_owed` lowers to surface ` is`. So the wide trigger bans the opening of the definitions the KB was built from. This is a single lowering choice causing a false ban, with no fact being wrong. `landlord pays`, `tenant pays` and `trader pays` each occur once, matching the brief's example (`tenant pays` is my addition).
- **Corpus-consistent is not the same as correct (own, using [earlier local notes](../Civil%20law%20KB%20M1%20M5%20plan/kb_facts_against_sources.md)).** Those notes record `landlord owns the home` as "false as a general claim, fair for the typical case", because a subtenant's immediate landlord is "the person you rent from". A head tenant can therefore be a landlord who rents. The narrow ban on `the landlord is the person who rents` has 0 corpus conflicts, yet it is a false ban in real law. The conflict count cannot detect this.
- **Empty sets are unlikely with this denylist (own).** Exactly 7 of 937 tokens are banned per role, so the set cannot empty. Empty sets are an allowlist problem. The guard from the earlier notes stays as a safety check.

### Gaps
- No study measures a hard mask built from outdated facts. Temporal-QA work uses soft context.
- No study measures entity-linking error passed through a token mask. RetinaQA measures it through candidate generation.
- Several further KBQA error shares appeared only in search summaries, so I do not rely on them: MCTS-KBQA 26 of 100 on GrailQA, MarkQA 42 of 100, BERTologyNavigator 90 of 203.

## How do published systems decide a constraint applies, how accurate are those gates, and what happens when they are wrong?

### Takeaway
Gate types differ mainly in whether they can be wrong. Parser state and deterministic frames are exact relative to the grammar. Entity linking, retrieval and word-level triggers are statistical. Where recall is reported it runs from about 77% to 97% on ordinary text and falls to 58% to 80% on idioms. A gate error is hard to recover from downstream, since a candidate never admitted cannot be chosen again. Recall sets an upper limit on accuracy.

### Cited Findings
| Gate | System | Gate accuracy (a measured figure where one exists) | Downstream when wrong | Scale |
|---|---|---|---|---|
| Per-word translation lexicon | [Domhan 2022](https://arxiv.org/abs/2205.06618) | Sentence recall 97.5% at k = 200; idiom spans 58.2% to 80.0% | BLEU 34.2 vs 34.4 with human rating 98.0 ±1.9 vs 100 | mid |
| Learned context mask (NVS) | [Domhan 2022](https://arxiv.org/abs/2205.06618) | All idiom tokens included in 93% of segments, 62% without context | Authors report quality at the unconstrained baseline with lower latency | mid |
| Schema retrieval | [Maamari 2024](https://arxiv.org/abs/2408.07702) | Recall 77.44% (table first) to 90.36% (hybrid column); false positive 9.79% to 82.08% | Recall is "an upper bound on possible EX"; EX falls 2.72 to 11.57 points when added to the pipeline | large |
| Entity linker | [Faldu 2024](https://arxiv.org/abs/2403.10849) | 949 errors in 6,808 answerable questions | No candidate exists; 56% of errors overlap with the linker | large |
| Per-question KG scope | [Li, DoG](https://arxiv.org/abs/2410.18415) | Top-120 triplets by embedding, not a recall figure | Adding GNN retriever: CWQ +8.64 / +7.53 / +10.66, WebQSP −0.33 / −2.01 / −2.46 | large |
| Per-entity KG trie | [Luo, GCR](https://arxiv.org/abs/2410.13080) | Assumes question entities are linked (`Eq ⊆ E`) | Not tested under link errors | large |
| Parser state machine | [Scholak 2021](https://arxiv.org/abs/2109.05093) | Exact relative to grammar and schema | 2% dead ends | large |
| Frame or target identification | [ACL 2024](https://aclanthology.org/2024.acl-long.374) | Target identification F1 0.775 (snippet only) | Not measured for a mask | large |

- **Filtering helps weak models and hurts strong ones (Authors' report, per-model figures in a figure).** "As the model's SQL generation capability improves, the benefit of schema linking diminishes", with net losses for Gemini 1.5 Pro, ft:GPT-4o and Llama 3.1-405b, gains for Llama 3.1-8b, Mixtral-8x22b and Deepseek Coder-V2 — [Maamari et al. 2024](https://arxiv.org/abs/2408.07702). The Table 2 figures are on a 10% dev subset. The filter is on prompt input, not on the output.
- **Scoping cuts both ways (Measured).** A retrieval-scoped graph raises CWQ strongly but slightly lowers WebQSP, on the same DoG decoder (table above). The authors describe the retriever as returning "a highly concentrated subgraph".
- **Selection in place of a gate (Authors' report).** Safe-ABL uses rules "selectively" through a graphical model and says it tolerates "at least twice as many inaccurate rules as accurate ones" — [Yang et al., AAAI 2024](https://ojs.aaai.org/index.php/AAAI/article/view/29572), abstract only.
- **Discrimination over fully formed candidates (Measured).** Separating candidate generation from a discriminator lets a thresholded RetinaQA reach 83.30 overall on GrailQAbility, with unanswerable-question score 94.21 — [Faldu et al. 2024](https://arxiv.org/abs/2403.10849).

### Inferences
- **This project's gate is the safe type (own).** `?x is the person who` is a deterministic frame, so it behaves like a parser state rather than a statistical linker. It has no statistical recall number. It can only be wrong because the frame's meaning is wrong, for example a role word in a frame where the definition is not what is being said. Its false negatives give leakage, which the earlier notes cover. Its false positives are the damage route.
- **The Domhan contrast is the closest analogue and favours a contextual gate (own).** Out of context, 62% of segments retain all idiom tokens. With context it is 93%. A one-word trigger is the out-of-context case and a frame trigger is the in-context case, though the comparison is by analogy (allowlist, translation, 33k vocabulary).
- **Gate recall is a ceiling only for allowlists (own).** For a denylist, a missed firing leaves the model unconstrained, which costs nothing relative to baseline. A false firing costs real mass. So a denylist gate should be tuned for precision, and an allowlist gate for recall. Published systems are mostly allowlists, which is why they tune for recall (Maamari's SCSL description: "a more cautious approach less likely to filter out relevant columns"). Copying their recall-first habit here would be a mistake.

### Gaps
- I found no accuracy figure for a hand-written frame trigger on legal text.
- No paper reports the downstream effect of a false-positive trigger on a denylist mask.
- ACL 2024 is snippet only. Older frame-ID figures (about 89% overall, about 76% on ambiguous targets) were in a secondary review, so I do not rely on them.
- Safe-ABL's sweep figures are behind bot protection on the AAAI host. I did not try to get around that.

## What is known about the distortion a mask causes, and is the strict structured output quality loss real?

### Takeaway
The distribution distortion is well established and measurable. The headline quality loss from Tam et al. is disputed. It mixes prompting, parsing and JSON-mode implementation effects, and dottxt's rerun reverses its direction on one model. The newer small-model result (Ray 2026) is the most relevant, but is one unreviewed preprint. Nothing here is on a tiny model or on a word-level denylist.

### Cited Findings
**Distortion**
- Park et al. and the step-wise conditioning result are already in the earlier notes. New since then: Özgü et al. say masking "only evaluates whether a token is valid locally", and report a logit correction with up to 113× lower KL than masking across 14 grammars (MLP variant beats masking on 11 of 14) — [Özgü et al. 2026](https://arxiv.org/abs/2608.10137), preprint.
- **Distortion costs task accuracy (Measured, [large]).** Trie masking against DISC at K = 4: entity disambiguation micro-F1 0.768 to 0.800 (BLINK) and 0.776 to 0.789 (AY2); document retrieval R-precision 0.616 to 0.640; DBPedia entity retrieval 0.600 to 0.735 — [Ye et al., AISTATS 2025](https://arxiv.org/abs/2504.09135). Gains "quickly plateau" above K = 2.
- **The bias depends on the constraint, not always large (Measured).** ASAp did not uniformly improve correctness in Park's own benchmarks ([earlier notes](../Semantic%20loss%20with%20hard%20logit%20constraints/combining_training_and_inference_constraints.md)).

**Tam and the rebuttal**
- **What Tam measures ([large]).** Zero-shot, text against JSON-mode: Last Letter GPT-3.5 56.7 to 25.2, LLaMA-3-8B 70.1 to 28.0, but Gemini-1.5-Flash 65.4 to 77.0. GSM8K GPT-3.5 76.6 to 49.3, Gemini 89.3 to 89.2. Classification often improves: DDXPlus rises for every model, for example GPT-3.5 44.1 to 55.5. Authors' conclusion: "stricter format constraints generally lead to greater performance degradation in reasoning tasks" — [Tam et al. 2024](https://arxiv.org/abs/2408.02442), also at [EMNLP Industry](https://aclanthology.org/2024.emnlp-industry.91). The fetch tool flagged one table cell (Claude, GSM8K) as inconsistent, so I do not use it.
- **What Tam does not establish.** They use API JSON-mode and "assumed that the implementation is similar to the constrained decoding methods". It is not confirmed to be token masking.
- **dottxt's response (vendor of Outlines, so interested).** It alleges mismatched prompts, a JSON prompt with no schema, a Claude parser called "perfect", and conflation of JSON-mode with structured generation. Rerun on Llama-3-8B, unstructured against structured: GSM8K 0.77 / 0.78, Last Letter 0.73 / 0.77, Shuffle 0.41 / 0.44. Parser alone moves Last Letter NL from 0.35 to 0.61 — [dottxt, "Say What You Mean"](https://blog.dottxt.ai/say-what-you-mean.html).
- **Third analysis.** Causal analysis finds "no causal impact in 43 out of 48 scenarios", and its poster says GPT-4o is insensitive and small models more sensitive (snippet only) — [Yuan et al., Findings of EACL 2026](https://aclanthology.org/2026.findings-eacl.91).
- **Small models (Measured, 0.5B to 1.7B, one single-author preprint).** Hard answer-only schema: validity 61.5% to 100.0%, answer accuracy 19.7% to 11.0%, wrong-valid-schema 49.5% to 88.9%. Calendar task on Qwen2.5-1.5B: 91.5% to 48.0% executable accuracy, with both modes 100% schema-valid. Results vary by serving backend — [Ray 2026](https://arxiv.org/abs/2605.26128). A separate preprint found validity rising with a persistent semantic gap on 0.6B to 4B ([Chavan 2026, via earlier notes](https://arxiv.org/abs/2609.23742)).
- **A blog figure I rejected.** A claimed "phase transition" at mask fraction 0.926 and a 39% to 15% figure appear only in blog posts, so they are not used.

### Inferences
- **Do not transfer these to the project unchanged (own).** All these constraints touch most or all output tokens, change the format, or remove reasoning text. This mask touches about 7 of 937 tokens at a few positions and leaves the output format alone. The relevant quantity is how much mass the mask removes, and the project has it: mean 0.180 when fired at T = 1, top-p 0.6. These studies do not give a transfer factor.
- **The disagreement resolves on whether the constraint removes useful paths (own).** PICARD's smallest model gains the most, and Ray's small models lose. PICARD's mask removes only invalid SQL, while Ray's answer-only schema removes the reasoning text that produced correct answers. So "small models suffer from masks" is too general. The more defensible form is that small models have less slack when a mask removes something useful.
- **Step distortion is exact and cheap here (own).** With only a denylist at one step, KL(masked ‖ unmasked) = −log P_A. That gives 0.402 nats for `claimant` at e2000 (0.40251 from the probes), and it is already logged as massBefore. Beyond one step, the target P(y | y passes) can be estimated by rejection sampling, as bans are rare and the model is small. Park calls exact sampling "similar to rejection sampling" and intractable in general. It looks practical here. Not yet tried.
- **Distortion is likely minor for this KB (own, unmeasured).** The frame fires late in a clause, and the allowed set is nearly the whole vocabulary, so few prefixes dead-end. The step-wise bias Park describes needs a locally valid token whose continuations are mostly invalid. Testing it is simple with the rejection sampler.

### Gaps
- No distortion measurement exists on a from-scratch model under 1M parameters, or on word-level denylists. All sources are grammars or candidate lists.
- I found no independent replication of Tam or of dottxt by a party with no stake, except Yuan et al., which I read at snippet level.
- dottxt's Last Letter set has 150 questions, so 0.73 against 0.77 is about 6 questions. It gives no interval.

## What is the evidence on coverage versus precision? Does a wider KB help or harm?

### Takeaway
Several dose-response curves exist, and they fit the expected pattern: missing gold knowledge causes steady loss, and wrong knowledge hurts somewhat more than missing knowledge. But every curve is about allowlists, retrieval or prompt context. I found no curve of KB width against false-ban rate under a hard mask. Wider helps when the extra coverage is correct and the gate is precise, and otherwise it trades reach for collateral.

### Cited Findings
**Missing knowledge, Hits@1 (Measured, GPT-3.5, 1,000 sampled questions; crucial triples on the gold path are deleted, so this is targeted, not random; no-KG baselines come from the paper's Table 1, and I did not confirm they use the same sample)** — [Xu et al. 2024, GoG](https://arxiv.org/abs/2404.14741)

| Method | CKG | IKG-20% | IKG-40% | IKG-60% | IKG-80% | No-KG baselines |
|---|---|---|---|---|---|---|
| ToG, CWQ | 47.2 | 40.5 | 37.9 | 33.7 | 31.4 | IO 37.6, CoT 38.8 |
| GoG, CWQ | 55.7 | 44.9 | 44.3 | 36.2 | 34.4 | same |
| StructGPT, WebQSP | 76.0 | 67.8 | 60.1 | 51.7 | 43.7 | IO 63.3, CoT 62.2 |
| ToG, WebQSP | 76.9 | 70.3 | 61.4 | 60.6 | 55.9 | same |
| GoG, WebQSP | 78.7 | 70.8 | 66.6 | 62.6 | 56.5 | same |

- **Closed-world parser drops hardest (Measured).** ChatKBQA, a fine-tuned semantic parser, falls from 76.5 to 39.3 on CWQ and 78.1 to 49.5 on WebQSP at IKG-40%. The authors say semantic parsing methods "don't interact with the KGs" so have no idea of the absence — [Xu et al. 2024](https://arxiv.org/abs/2404.14741). Table 1 gives ToG WebQSP IKG-40% as 63.4 and Table 2 gives 61.4, an inconsistency in the paper.

**Wrong against missing knowledge (Measured, prompt context, delete / replace)** — [Dai et al. 2024](https://arxiv.org/abs/2402.11541)

| Dataset, model | 0% | 50% | 90% | No KG |
|---|---|---|---|---|
| QALD-7, ChatGPT | 82.56 | 80.39 / 80.39 | 62.42 / 54.30 | 71.45 |
| QALD-7, Vicuna 13B | 77.00 | 76.52 / 74.35 | 57.51 / 56.23 | 60.82 |
| LC-QuAD 2.0, ChatGPT | 50.60 | 40.78 / 40.28 | 19.16 / 17.64 | 16.42 |
| KQAPro, ChatGPT | 54.03 | 41.02 / 41.33 | 19.91 / 19.77 | 15.77 |

Authors' conclusion: "Incorrect facts are more likely to result in erroneous model outputs". Authors' size claim: an "inverse proportionality between a model's robustness and its size". The table only partly supports this, because Vicuna 13B's relative drop is slightly smaller than 7B's. Their "still improves" statement fails for ChatGPT and Vicuna 13B on QALD-7 at 90%.

**Precision against recall of the gate (Measured)**
- Schema linking: false positive 94.62% with recall 100% (no filter), down to false positive 9.79% with recall 77.44% — [Maamari et al. 2024](https://arxiv.org/abs/2408.07702).
- Allowed-set size: k = 200 to 1000 lifts ITDS idioms 58.2% to 88.0%, at a latency cost — [Domhan et al. 2022](https://arxiv.org/abs/2205.06618). Adapting the lexicon to the domain lifts EN-DE idiom recall at k = 200 from 80.0% to 97.2%, a measured result in favour of fitting the knowledge to the corpus.
- Reference against output coverage: selection covers 87.5% of the reference (95.1% with full vocabulary) but over 99% of the full model's own non-UNK output (snippet only) — [L'Hostis et al. 2016](https://arxiv.org/abs/1610.00072). A gate can look harmless by the model's output while still excluding valid text.

**Open-world and closed-world**
- The closed-world trade-off for this repo is already in the [earlier notes](../Semantic%20loss%20with%20hard%20logit%20constraints/combining_training_and_inference_constraints.md). GrailQAbility confirms that KB incompleteness is a real test condition, and models adapted with thresholds "significantly hurt performance for answerable questions" — [Faldu et al. 2024](https://arxiv.org/abs/2403.10849).

**Weak supervision as a neighbour**
- Rule coverage and accuracy are standard axes (WRENCH studies accuracy, sparsity, conflict and overlap), but my search found no reported precision-against-coverage result — [Zhang et al. 2021, WRENCH](https://arxiv.org/abs/2109.11377), abstract only.

### Inferences
- **What a wider KB costs here (own).** Going wider has two forms that behave differently. Adding rules behind the same frames (more roles, more verbs) is low risk, as each new rule is checked at the frame. Widening the trigger (one word instead of a frame) moved the rough false-ban rate from 0 of 8 to 7 of 64 in my count, at the cost of a far larger firing rate. So a wider trigger increases reach and damage together, and adding facts behind a narrow gate does not.
- **Soft context does not predict mask tolerance (own).** Dai's models withstand 50% replacement because they can ignore a prompt. A mask at −∞ cannot be ignored. Treating Dai as evidence of tolerance would be wrong. GoG's semantic-parser collapse is the closer analogue.
- **The "replace is worse than delete" gap is small in soft settings (own reading).** It is at most about 8 points, on QALD-7 at 90%, and often under 1 point. It does not support saying wrong facts are much worse than missing ones in that setting. For a mask the asymmetry should be much larger, by Wang's result in the next section. That is theoretical only.

### Gaps
- **No hard-mask dose-response exists.** I found no study that varies KB width, or injects noise into KB facts, and then measures false-ban rate or quality under a logit mask. This is the central gap, and a project-level curve would be new.
- GoG and Dai use sampled questions and targeted deletions. They do not show natural KB-corpus mismatch.

## What metrics do papers use for relevance and damage, and which suit a tiny corpus and model?

### Takeaway
Use several small per-firing metrics. A global perplexity cannot show this effect here, and BLEU-like aggregates missed comparable damage in Domhan. The most useful are gold-in-allowed rate, a false-ban count with an interval, mass removed, and wrong-but-valid rate on generated text.

### Cited Findings
- **Automatic metrics miss it (Measured, [mid]).** k = 200 costs at most 0.3 BLEU, and COMET shows the drop in only two of four pairs, while humans rate EN-DE k = 200 lower than baseline — [Domhan et al. 2022](https://arxiv.org/abs/2205.06618).
- **Loss cannot see test-time filtering (Authors' proof, informal statement).** "Irrespective of the classifier used for filtering", filtering with minimum acceptance rate ε never increases per-token loss by more than −n⁻¹ ln ε. So "LMs with low loss can still have bad samples" — [Welbl et al. 2021, Observation 1](https://arxiv.org/abs/2109.07445).
- **Separate validity from correctness (Authors' recommendation).** Report schema validity, answer accuracy, executable accuracy and wrong-valid rate separately — [Ray 2026](https://arxiv.org/abs/2605.26128).
- **Per-subset loss gap (Measured, [large]).** Train filtering at 0.05 moves C4 loss from 2.37 to 2.66 and LAMBADA accuracy from 50.1% to 34.9%, roughly matching a model a third the size. Loss rises +7% on least-toxic documents and +34% on most-toxic ones — [Welbl et al. 2021](https://arxiv.org/abs/2109.07445). PPLM raises perplexity 2.1× on non-toxic WAE and 4.3× on minority-identity text (snippet only) — [Xu et al. 2021](https://arxiv.org/abs/2104.06390).
- **Faithfulness is relative to the KB (Authors' definition).** GCR defines zero hallucination as paths "fully grounded within KGs" — [Luo et al., GCR](https://arxiv.org/abs/2410.13080). This is P1 in another form. It says nothing if the KG is wrong.

### Inferences
Own proposal, with each source's scale noted. None has been run in this form on the project beyond the columns marked "have".

| Metric | From | What it detects | How to compute here | Status |
|---|---|---|---|---|
| Firing rate on corpus and on generated prefixes, separately | Own | Inert against live | Count per KB | Have for narrow KB; missing for old KB on samples |
| Noise estimate V_ora: false bans / firings, with interval | [Wang 2023](https://arxiv.org/abs/2307.03886), [Riedel 2010](https://link.springer.com/doi/10.1007/978-3-642-15939-8_10) | Wrong rules | Corpus count plus a manual check of a sample, as Riedel did. Report an exact binomial interval | Have count; 0 of 8 gives ≤ 31% |
| Gold in allowed set | [Domhan 2022](https://arxiv.org/abs/2205.06618), [Maamari 2024](https://arxiv.org/abs/2408.07702) | False bans on gold text | Same as the conflict check, also run on a held-out, hand-written set of true legal sentences | Have on corpus; held-out set missing |
| Mass removed, −log P_A | Own, from [earlier notes](../Civil%20law%20KB%20M1%20M5%20plan/repo_probes_2026-11-03.md) | Size of change per firing | Already logged | Have |
| Sample-change rate: seeds whose output differs, mask on against off | Own | The "fires, no effect" state | Same seed, compare | Partly have |
| Target share after mask: p(gold)/P_A | Own | Hollow state | Per firing | Easy |
| Wrong-valid rate | [Ray 2026](https://arxiv.org/abs/2605.26128) | Valid but wrong output | Verifier: contradicted with mask on, then "unknown" and hand-checked text | Verifier exists; "other wrong verb" column is close |
| Per-subset loss gap on near-miss contexts | [Welbl 2021](https://arxiv.org/abs/2109.07445) | Collateral from M5 | CE on role-bearing sentences outside the frame, M5 on against off | Needs M5 run |
| Step or sequence KL against rejection sampling | [Park 2024](https://arxiv.org/abs/2405.21047), [Özgü 2026](https://arxiv.org/abs/2608.10137) | Distortion | Rejection sampling with the same seeds | Easy, not done |
| Small human rating | [Domhan 2022](https://arxiv.org/abs/2205.06618) | What the above miss | Rate about 50 samples blind, as a rough check | Optional |

- **Why global perplexity is useless here (own arithmetic).** Even if all 8 firing positions lost the worst seen −log P_A, the corpus-wide change is 8 × 0.40251 / 5390 ≈ 0.0006 nats, far below seed noise. Any banned gold token, though, gives infinite CE. So the metric reads either nothing or infinity, and neither is informative. Report it conditional on firing positions.
- **Small-corpus limits (own).** With 8 firings, intervals are wide and no percentage on its own should be quoted. Held-out data does not exist on this corpus as things stand, and the model has memorised it, so corpus conflicts test the rules and not the model.

### Gaps
- No paper proposes a "false-block rate" for a denylist as a standard metric. The closest names are Maamari's false-positive and recall figures, and L'Hostis's coverage.
- I found no agreed metric for "hollow" outcomes on word-level masks.

## Does a mismatched KB also do damage through training losses?

### Takeaway
In theory yes, with a clean formal condition in Wang et al. Empirically, the wrong-rule literature is thin, and I found no direct test of semantic loss with wrong constraints. The abductive-learning result says wrong rules can be worse than none. For this project, any harm would likely be local and small at λ ≤ 5 unless a wrong rule fires on positions sharing parameters with legitimate text, and that remains unmeasured.

### Cited Findings
- **Formal condition (Theorem, no experiments found in the part I read).** A noisy constraint has noise rate V_ora = P(y_ora ∉ C(x)). Post-hoc inference at penalty μ reduces CE for some μ "if and only if" V(f) > V_ora (Thm 4.3a), with Δ ≥ V(f)(1 − e^−μ) − μV_ora (4.3b). For noise-free constraints the authors recommend μ = ∞ (Cor. 4.5). They add that "if the noise rate is large, performing strictly-constrained inference can be harmful" — [Wang et al. 2023](https://arxiv.org/abs/2307.03886). Reading of f^μ as a logit penalty on labels outside C(x) is inferred from their proofs.
- **Training and inference interact under noise (Theorem).** If V_ora ≥ V(f_∞) and ρ ≥ 1/(V_ora − V(f_∞)), post-training inference does not improve f_ρ for any μ (Thm 5.2), so with a noisy constraint a large ρ can make it "unnecessary or even harmful". Regularisation risk is bounded by R(f_0) + ρ(V(f_0) − V(f_∞)) (Prop. 3.2) — [Wang et al. 2023](https://arxiv.org/abs/2307.03886).
- **Theory assumes correctness elsewhere.** van Krieken et al. state "If the constraint is correct, then all worlds w with non-zero probability..." (cited in [earlier notes](../Semantic%20loss%20with%20hard%20logit%20constraints/semantic_loss_uncertainty_limits.md)).
- **Inaccurate rules (Authors' report).** See Safe-ABL above: serious decrease, possibly worse than raw-data baselines, and tolerance of 2:1 inaccurate to accurate only with rule selection (abstract only). A snippet shows the sweep uses a ratio of inaccurate to accurate rules on Tic-Tac-Toe, with other NeSy methods degrading severely. Figures were not read — [Yang et al., AAAI 2024](https://ojs.aaai.org/index.php/AAAI/article/view/29572).
- **Correct knowledge can still mislead.** Reasoning shortcuts reach high accuracy with concepts of unintended meaning ([Marconato et al.](https://arxiv.org/abs/2305.19951), [Bortolotti et al., rsbench](https://arxiv.org/abs/2406.10368), both previously noted). So correctness of the KB is not sufficient, and this is independent of mismatch.
- **Winner-take-all under NLL-style loss.** Zombori's collapse is in the earlier notes. It concerns correct constraints and selection among allowed tokens, not wrong ones.
- **Noise studies that are not wrong-rule studies (Measured).** DeepProbLog with noisy *labels* holds 73.22% at 80% noise with explicit noise modelling (snippet only) — [Manhaeve et al. 2018](https://papers.nips.cc/paper/2018/hash/dc5d637ed5e62c36ecb73b654b05ba2a-Abstract.html). NASR's robustness result concerns noisy perception, not rules (snippet only) — [Cornelio et al., ICLR 2023](https://aminer.org/pub/63dcdb422c26941cf00b6059/learning-where-and-when-to-reason-in-neuro-symbolic-inference). They should not be cited as evidence about wrong knowledge.
- **Practice of removing rules (Procedure, no sweep).** In WALL-E 2.0 a rule that makes a wrong prediction is removed from the rule set (snippet only) — [Zhou et al. 2025](https://arxiv.org/abs/2504.15785).

### Inferences
- **Applying Thm 4.3a to this project (own).** V(f) and V_ora are both zero where nothing fires, so sparse coverage scales both, and the condition reduces to a comparison on firing positions. There, mean V(f) ≈ 0.099 at e2000. V_ora on the corpus is 0, but its 95% upper bound from 8 positions is about 31%. So the corpus alone cannot show V(f) > V_ora. The condition is for CE against an oracle, and the project's mask is justified by its support guarantee, not by CE, so this does not argue against the mask. It does argue against claiming a likelihood benefit.
- **Hard mask against finite penalty (own, numerical).** Cor. 4.5 allows μ ≤ W(−ηe^−η) + η with η = V(f)/V_ora, which gives μ_max = 0.874, 1.594, 4.965, 10.0 for η = 1.5, 2, 5, 10, so μ_max approaches η. At μ = ∞ any V_ora > 0 gives infinite CE. So −∞ is only justified on a likelihood basis when the KB is noise-free. The −∞ choice in this project is a commitment that the KB is treated as correct. Any rule not trusted fully should not be in it.
- **M5 with a false rule (own, using the earlier closed form).** With n_A constrained and n_B shared positions, P_B* = n_B·g / (n_B + n_A(1 + λ)). A false rule means legitimate text is punished. Here the conflict count is 0, so CE and M5 do not directly fight on these positions. If a wider rule is added with conflicts, M5 and CE fight directly, and the p_B = f_B/(1 + λ) result in the earlier notes applies. The model then loses real data: at λ = 5 that formula cuts those tokens' probability to one sixth where M5 covers every position of the context, and less where positions are shared. This is the damaging case. The size is known by formula, and it has not been run.
- **A mismatched KB through M5 is more harmful than through M1 in one way (own).** M1 acts only at fire time and can be switched off. M5 moves weights, and a wrong rule stays in them after the KB is fixed. The inert case carries through: a KB with 0 firings on training windows gives 0 gradient, so it cannot affect training at all.
- **A KB check before training (own).** Conflict counts are the only audit for firing positions. Probe contexts (unlabelled) have no target to conflict with, as earlier notes warn, so a wrong rule there meets no resistance. Any wider KB is riskiest there.

### Gaps
- **No direct test.** Three searches found no paper that injects wrong constraints into semantic loss and reports a curve. The closest are Wang's theorems (no noisy-constraint experiments in the part I read; I may have missed some in the main text as the page was long) and Safe-ABL's abstract.
- No study was found on noisy logic rules for sequence models or language models specifically.
- The rule that M5 harm persists after KB repair is my own reasoning. I found no study of it.
