# How semantic loss (M5) and the logits-processor pipeline (M1-M4) fit this repo

Paths are relative to the repo root, `/Users/nedpham/Projects/neural_symbolic_nlp`.

Evidence labels used below:

- **`file:line`** is a statement in the repo as it stands on 2026-11-01. Several of these files have uncommitted changes.
- **[probe]** is a number computed for these notes. It comes from read-only scratch scripts that ran the real tokenizer, the chapter 07 spec code (extracted verbatim from the markdown) and forward passes over the saved baseline weights `.data/transformer-weights-e300-l2-d32-h2-ff128-ctx32-cbf9d5315.json`. Nothing was trained and no repo file changed. **A probe number is not an E1-E3 result and is not recorded in the repo's docs.**
  - The probe first reproduced the corpus hash `bf9d5315` (it matches the weights filename), V = 807, 1000 merges and 6,431 windows (`README.md:201-203`), from 6,447 tokens.
  - Scripts: `/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/8724344b-c01a-42e9-b5bf-de8bf0aecbbe/scratchpad/probe/probe.ts` and `/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/8724344b-c01a-42e9-b5bf-de8bf0aecbbe/scratchpad/probe/probe2.ts`.
- **[derivation]** is my own algebra, checked numerically on a tabular softmax with the chapter 07 gradient code.

## How do M1-M5 fit together, and what does the design say about their interaction?

### Takeaway
Structurally the two can coexist. M5 acts only on training probabilities and M1/M2 act only on a fresh copy of the logits at generation, so they share a knowledge base and meet only through the saved weights. Both read the same `allowed()` function, so A_t is shared by construction. However, no doc says outright that M5 runs on unmasked logits; that follows from the code path. The figure the user cites shows only the inference path.

### Cited Findings
**The docs' stated relationship**
- Status of the docs' position: M5 is "training term, stretch" in the root README (`README.md:135`) and in chapter 04, which says "Only attempt it after M1-M4 are measured" (`docs/progress/04-neurosymbolic-design.md:165`). The newer progress README instead makes 2b the "integration target" (`docs/progress/README.md:11`).
- The intended division of labour is stated once: "the design uses the semantic loss to train and keeps the mask for the guarantee and the verifier for measurement" (`docs/progress/README.md:232`; also `:97-101`).
- Chapter 07 maps four crossings: M5 (symbols to network, training), lift (network to symbols), M1/M2 + M3 (symbols to network, inference), M4 (output to symbols) (`docs/progress/07-neurosymbolic-code-2b.md:9-14`).
- All of chapter 07 is unrun: "Nothing here has been run" (`07-neurosymbolic-code-2b.md:3`). `src/routes/neuro-symbolic/` does not exist; `src/routes/` holds no such directory ([probe], directory listing).

**The figure**
- `fig-neurosymbolic-flow.png` is drawn by `flow()` with nodes for context ids, transformer, processor, sampling, verifier, KB and trace only, and no training node (`docs/images/make_figures.py:296-313`). Its subtitle says the symbolic parts "act on the logits and on the finished text" (`make_figures.py:298`). M5 is therefore absent from it.
- The combined picture exists only as ASCII in `07-neurosymbolic-code-2b.md:23-32` and `docs/progress/README.md:115-122`.

**Does M5 run on unmasked logits?**
- No doc sentence says this, but the code path forces it. `forward` computes `probs = softmaxRows(logits)` (`src/routes/train-transformer/transformer.ts:756`). M5 reads `cache.probs` inside `backward` (`07-neurosymbolic-code-2b.md:422-424`), at temperature 1, added next to the CE gradient (`transformer.ts:817-823`).
- The processor runs inside `generateText` on a separate length-V copy (`transformer.ts:961-964`; `07-neurosymbolic-code-2b.md:566`), before the temperature loop (`transformer.ts:966-968`), which is the "seam" (`04-neurosymbolic-design.md:79-82`).

**Do M1 and M5 share A_t?**
- Yes, by construction. Chapter 07 says "M1-M5 all read the allowed set A_t" (`07-neurosymbolic-code-2b.md:3`). Training calls `allowed(kb, ctx, indexToWord, tokenIndex)` (`:446`) and the processor calls `allowed(kb, ids, idxToToken, tokenIndex)` (`:531`). Both use the default `TRIGGERS` (`:286`).
- M4 does **not** use `allowed()`. It has its own parser and calls `kb.has("cannot", ...)` (`:588-604`). It shares the KB, not A_t.
- M2's S_t is not used by M5. `addSemanticGrad` reads only the banned set (`:380-400`), and M5 "has no reason to prefer one allowed token over another" (`:346`).

**The direct link between M3 and M5**
- `massBefore` is the banned mass at temperature 1 before editing (`:506`). `L_sem` is `-log` of the allowed mass (`:352`).

### Inferences
- If M5 were computed after the mask, banned p = 0, P_A = 1, and the loss and gradient would both be 0. It must run on unmasked probabilities, and the spec does. A future refactor that routes `backward` through the processor would silently zero M5, so this deserves a unit test.
- For one context, `L_sem = -log(1 - massBefore)`. M5 trains the same quantity M3 reports. Hence P5 (`docs/progress/README.md:245`), if evaluated on training contexts, is close to "the training loss went down". It only says something new on contexts outside the training set.
- The honest description of the combination is sequential, not nested: KB to A_t to M5 to weights, then the same KB to the same A_t to M1/M2 at generation, then M4 on text.
- The figure should gain a training path if it is meant to represent the combined design.

### Gaps
- Whether the owner intends the figure to stay inference-only is not stated.
- No doc defines how M5 and M1 are to be reported jointly, beyond P5 to P7 (`docs/progress/README.md:243-249`).

## Is there an actual conflict? Items (a) to (g), plus others found

### Takeaway
No item makes the combination mathematically inconsistent. Three things block it in practice:

1. The chapter 07 KB has **zero coverage of the current corpus**.
2. The lift loop **cannot change A_t as specified**, despite what the docs say.
3. M5 is evaluated **only on labelled training positions**, which undercuts the docs' main reason for choosing it.

The CE-versus-M5 clash at banned targets is real but well-behaved, with a closed form.

### Cited Findings

**Summary**

| Item | Verdict | Severity |
|---|---|---|
| (a) M2 versus unbiased training | No conflict; M2 has no prediction | Low, but unevaluated |
| (b) Lift feedback | Inert for A_t as specified; real if extended to bans | Doc error now; high risk if extended |
| (c) Training versus generation A_t | Same function; docs misdescribe it | Doc error, plus covariate shift |
| (d) BPE alignment | Docs contradict each other; P1 has a leak | Medium |
| (e) Target outside A_t | Real, specified, closed form | Managed, if conflicts are counted |
| (f) Empty A_t | Handled consistently; unreachable in practice | None |
| (g) Coverage | 0% as written; about 2% ceiling for role words | **Blocking** |

**(a) M2 bias at inference against an unbiased training distribution: no conflict, but unevaluated.**
- Eq. (7) adds λ to S_t inside A_t (`04-neurosymbolic-design.md:129-133`). A ban wins over support (`07-neurosymbolic-code-2b.md:329`).
- M5 is neutral among allowed tokens (`07-neurosymbolic-code-2b.md:346`). The two therefore act on disjoint questions.
- P1-P7 contain no prediction about M2 (`04-neurosymbolic-design.md:177-182`; `docs/progress/README.md:243-247`), and E2 tests only "processor off" against "hard mask on" (`05-implementation-and-evaluation.md:61`). M2 cannot currently be refuted.
- [derivation] The bias is applied before temperature, so its effective odds multiplier is exp(λ/T), not exp(λ). At the defaults λ = 2 (`07:743`) and T = 0.8 (`07:745`) that is 12.2 rather than 7.4.

**(b) Lift feedback: inert today, dangerous if extended. The docs overstate it.**
- The docs claim "The new knowledge base gives new allowed sets for the next round" (`docs/progress/README.md:156`) and call the loop "the intertwined part" (`07-neurosymbolic-code-2b.md:16`).
- `liftCan` only emits `rel: "can"` (`07:663`). `allowed()` bans only through triggers with `rel: "cannot"` (`07:245-251`, `:309-311`). Lifted triples therefore reach S_t (M2) and never B_t. `semMasks` and the mask are identical across rounds.
- `liftCan` also keeps only words known to `baseForm` (`07:661`), which knows only fly and swim (`07:231-237`). On the civil-law corpus it can find nothing.
- Acceptance needs p >= τ = 0.3 (`07:675`, `:680`). [probe] On the saved baseline, top-1 next-token probability over 919 sampled windows has mean 0.050, maximum 0.0985, and is never >= 0.3. Caveat: this baseline contains defects D1-D3 (`README.md:212`). With nothing accepted, the loop stops at round 0 (`07:707`).
- The gate's only logical check is a same-pair `can`/`cannot` clash (`07:197-203`, `:684-691`).
- `index.ts` builds the KB from base `TRIPLES` on every request (`07:780`) and returns lifted candidates without persisting them (`07:800-804`). Nothing stores KB_{r+1}.
- The weights filename suffix is `-sem${lambdaS}` only (`07:489`), with no KB hash. An edited KB would silently reuse weights trained on a different A_t.

**(c) A_t from "forward chaining over the window" against the generation context: same function, but the docs misdescribe it.**
- The docs say forward chaining runs over context (`04-neurosymbolic-design.md:59`, with `entail(context)` at `:114`) and "over the tokens in the window" (`docs/progress/README.md:124`).
- The code closes the KB once, globally (`07:138-141`, `:168-194`). `allowed()` only matches the last 1-4 decoded words against triggers (`07:295-307`). Context never adds a fact, so "Tom is a tenant" could not bind `is_a(tom, tenant)`.
- Training uses `seq.input.slice(0, t+1)` (`07:445`) and generation uses `ids.slice(-windowSize)` (`transformer.ts:957`) with the same 16-token cap (`07:783`; `train.ts:238`). The cited `train.ts:234` in `07:783` is stale; the line is now 238.
- A four-word trigger such as T-LIVES (`07:250`) cannot fire at window positions t < 3, but windows slide by 1 (`train.ts:240`), so the same corpus position fires in a later window.
- Known false binding: "the eagle saw the girl flew" binds "girl" (`07:934`).

**(d) BPE tokens against KB entities: the docs contradict each other, and P1 has an unlisted leak.**
- Chapter 04 and the progress README say a split word "is constrained only on its first token" (`04-neurosymbolic-design.md:169`; `docs/progress/README.md:165`).
- Chapter 07 says it "cannot be enforced" and is "never partly banned" (`07:254-256`, `:932`). The code follows chapter 07.
- [probe] V = 807: 596 tokens start with a space, 211 do not. 450 of 925 word types (48.6%) are a single token, covering 4,280 of 4,899 word occurrences (87.4%). Piece counts run up to 6 pieces.
- [probe] Of 14 role words, `creditor`, `buyer` and `seller` split (`" cred"+"itor"`, `" buy"+"er"`, `" sell"+"er"`), so they cannot be banned. Triggers still fire on them, because `contextWords` rebuilds words from decoded text (`07:276-278`).
- The comment says the index holds "tokens that are exactly ' word'" (`07:254`), but the code only tests for a leading space and letters (`07:260-263`). [probe] Of 595 index keys, 145 are pure fragments (such as `st`, `per`) and 76 are both a complete word and a prefix of a longer word.
- [probe] Examples of the prefix problem: `" rent"` begins `" rent"+"ers"` and `" pay"` begins `" pay"+"ing"`. Banning `rent` therefore also blocks the first piece of `renters`, contrary to "rather than over-banning its first piece" (`07:256`).
- [probe] All 450 single-token words can also be spelled from two or more other vocabulary tokens (for example `tenant` in 2 pieces). A masked `" tenant"` token does not stop the same word being spelled in pieces. The verifier parses text (`07:591-597`), so it would count that as a violation.
- The baseline sample already contains fragment joins such as "fromy" and "founds" (`README.md:210`).

**(e) Target token outside A_t: real, specified, and has a closed form.**
- The spec counts these as `corpusConflicts` and notes CE "cannot reach zero" at such positions (`07:449-453`, `:491`; `docs/progress/README.md:238`). It treats the conflict as useful data (`07:57`).
- [derivation] The gradient on target y in B is `((1+λ_s) p_y - 1)/S`.
- [derivation] For a context with empirical banned frequency f_B, the optimum of `CE + λ_s L_sem` has **P_B* = f_B/(1+λ_s)**, with proportions inside A and inside B unchanged from the data.
- [derivation] A pure conflict therefore settles at p_y = 1/(1+λ_s), with a CE floor of ln(1+λ_s). Numeric check on a tabular softmax with the chapter 07 gradient: λ_s = 0.5 gives p = 0.6667, CE = 0.4055; λ_s = 2 gives p = 0.3333, CE = 1.0986; mixed f_B = 0.3 gives P_B = 0.2000 and 0.1000.
- [derivation] With f_B = 0 the optimum is P_B = 0 at any λ_s. At a conflict-free position the banned-logit gradient is just (1+λ_s) times CE's own, so M5 changes speed there, not the destination.
- The spec's gradient and its hand-checked values are correct: [probe] the extracted code gives L = 0.4055 and 1.5464 with the rows in `07:828-829`.

**(f) Empty A_t: handled consistently, and practically unreachable.**
- Generation falls back to unmasked logits and records it (`04-neurosymbolic-design.md:84`; `07:543-547`). Training skips the position (`07:346`, `:373`, `:391`; `docs/progress/README.md:173`).
- A_t is defined as a complement, "everything except `banned`" (`07:280`), and bans are a few surface forms per fact (`07:231-234`), so |B_t| is far below 807.
- [derivation] The clamp at 1e-10 (`07:360`) is not a blow-up risk: the L1 norm of the gradient per row is bounded by 2c, since the banned part sums to c·P_B and the allowed part to c(1-P_A).

**(g) Corpus size and KB coverage: blocking.**
- Chapter 07 says the KB "uses only words that occur in `STORIES`", citing `eagle flies`, `girl flew` and so on (`07:57`). The corpus has since become civil law only (`src/routes/train-embed/corpus.ts:4`; `train.ts:36`; `README.md:46`, `:200`).
- [probe] All 10 KB entities and all 8 surface forms occur **0 times** in `TRAIN_TEXTS`. Running chapter 07's loop over all windows gives `constrainedPositions = 0`, `corpusConflicts = 0`, no rule fired. The expected "`girl -> flew`" conflict (`07:457`) cannot happen.
- With that KB, L_sem would be 0 at every position and M1 would never fire. Chapter 07's tests use a synthetic vocabulary (`07:890`, `:898`) and would still pass, so they would not reveal this.
- The chapter 04 KB examples (kitten, bear, eagle) are likewise from the old corpus (`04-neurosymbolic-design.md:92-97`), and it describes "a toy domain" (`:170`). `README.md:139` still uses `is_a(x, fish)`.
- The only civil-law rule sketched is the worked example, "the object of pays must be something that payer owes", marked illustrative (`docs/progress/README.md:147`). No such trigger or relation exists in `07:76-90` or `:245-251`.
- [probe] Ceiling for a civil-law KB with 14 role words as `?x` under a single-word trigger: 132 of 6,447 corpus positions (2.05%), or 2,092 of 102,896 window positions (2.03%). `court` alone is 49 of the 132 and `landlord` 22; `creditor`, `buyer` and `seller` occur 1 time each.
- [probe] The docs' `pays` example would touch 3 corpus positions ("tenant/buyer/customer pays the", 1 each), about 0.05%, with no conflict for its stated ban.
- The docs do require reporting this count (`docs/progress/README.md:164`, `:236`).

**Other conflicts found**
- **M5 runs only where labels exist.** Every M5 position is a training position with a CE target (`07:443-456`). The docs justify M5 by Xu et al.'s few-label gains and say "the regime matches" because the corpus is 401 sentences (`docs/progress/README.md:81`). Xu's gain comes from applying the loss to unlabelled data (`docs/progress/README.md:211`). Xu's stated limit is a model able to "almost perfectly fit the training data", where the loss "is almost always zero" (`research_notes/Semantic loss original paper/xu_2018_semantic_loss.md:111`).
- **E2's cost metric breaks under the mask.** E2 reports "perplexity on held-out text" in both arms (`05:61`). A held-out target in B_t has probability exactly 0 under the mask, so perplexity is infinite. `crossEntropyLoss` would clamp it at `1e-10` (`transformer.ts:789`), and it reads `cache.probs`, which the mask never touches (`transformer.ts:756`).
- **No held-out set exists.** The README says so (`README.md:258`), yet E1, E2, P7 and chapter 07 all need one (`05:54`, `:61`; `docs/progress/README.md:247`; `07:929`). [probe] `CIVIL_LAW_CORPUS` (118 items, not in training text) is 20.96% out-of-vocabulary and carries source tags, so it is not usable as is.
- **The observe-only path is not exposed as such.** The "key number for 2b" is `massBefore` with the mask off (`07:926`), but mode `off` passes no processor, so traces are empty (`07:785-799`). The workaround already allowed by the schema is `mode: "bias", lambda: 0` (`07:548-549`, `:742-743`).
- **Filename and seed plumbing.** `TrainOpts` and the schema have no seed (`train.ts:150-156`; `src/schemas/train-transformer-request.ts`). `resetRand()` uses its default of 42 (`train.ts:193`; `matrix.ts:18`). The cache key has no seed (`train.ts:250`; `docs/architecture.md:830`), so seeds 1, 2 and 3 would reload seed 42's file. Checkpoint names have no seed, λ or hash (`train.ts:419`) and write to `process.cwd()/.data`.
- **The route example uses a file the README warns against.** `07:819` loads the unhashed `...ctx32.json`, while `README.md:228` says to use "only the hashed final file".

### Inferences
- A corpus conflict needs a KB first, so the conflict rate on the civil-law corpus is unknown today. It cannot be estimated from the chapter 07 KB.
- M5 at training positions behaves like "weight CE's existing push on banned logits by (1+λ_s)". Its distinct effect, per the optimum above, can only come through underfitting and through generalisation to other contexts. So the docs' claim B ("selects among solutions the data never pinned down", `docs/progress/README.md:200`, `:207`) needs M5 at positions the data does not cover. The spec has none. A cheap fix is to add unlabelled probe positions with L_sem only and no CE, using the templates already in `07:647`. This is a design change, not something the docs specify.
- Order-of-magnitude scale. [probe] Mean mass on the pay-forms (`pay`, `pays`, `paid`) after role words on the baseline is 0.69%, an illustrative banned set on a defective model. At a constrained position the M5-to-CE L1 ratio in logit space is about λ_s·P_B, or roughly 1.4% at λ_s = 2. Averaged over about 2% of positions it is about 0.03%. Adam's per-parameter scaling and the concentration in specific head rows mean this does not directly predict the outcome, but a null result on P5 at this scale would not be surprising.
- If the lift were extended to `cannot`, the feedback risk in the brief becomes real. One wrong accepted triple would simultaneously zero the token in the mask, shrink its mass by 1/(1+λ_s) in training, lower what the next lift reads, and make the verifier flag correct text, because all layers share the KB. Guards: freeze KB_0 as the verifier's reference, version the KB in the weights filename, and keep the `[lifted, p]` provenance (`07:709`).
- M5 will also shrink `conflict`-status candidates in the lift report (`07:624`) because of the loss, not because of reasoning. That count should not be read as "gap closed" after M5.
- P1 as worded ("violations are 0 for token-expressible constraints", `README.md:147`) can be refuted by piece-spelling, if measured with the text verifier. It also holds vacuously when no constraint is expressible, so its denominator must be reported.

### Gaps
- Actual `massBefore`, conflict counts and violation rates on a civil-law KB: no such KB exists.
- Whether a fixed transformer reaches coherent subject-verb text at all. Without it P3 could come out near 0 for reasons unrelated to correctness: the baseline text is "domain words in no order" (`README.md:212`).
- Whether fragment-spelling occurs at a meaningful rate in generation: not measured.
- Earlier notes in this folder tree propose regenerating a KB-derived corpus (`research_notes/Neurosymbolic reasoning corpus from paper/project_symbolic_layer_fit.md:295`). Whether the owner prefers that or a civil-law KB is undecided in the docs, and it changes every coverage number above.

## What do the docs claim about uncertainty or ambiguity, and can the design back it up?

### Takeaway
The limits sections are honest about the mask. The new ambiguity section is much stronger than the design supports. It presents M5's benefits as table facts while its status line says nothing is measured. The word "uncertainty" is not used at all: the docs talk about three kinds of "ambiguity", and none of the three has been measured on the transformer.

### Cited Findings
**What is stated carefully**
- `README.md:141`: "A mask is not understanding... leaves the weights unchanged. The trace explains the symbolic decision, not the network's internal computation. Constraints work cleanly only on whole-word tokens."
- `04-neurosymbolic-design.md:169-173` gives five limits, `:51` refuses to claim the transformer reasons, and `07-neurosymbolic-code-2b.md:16-21` says "towards 2b". `05:108` warns that a self-authored KB makes P1 easy and P3 inflatable.
- `docs/progress/README.md:187` opens "argument and predictions only. Nothing here is measured yet", `:215` says M5 does not help weight ambiguity, and `:234-239` lists four limits.
- [probe] A case-insensitive search for `uncertain`, `calibrat` and `confidence interval` in `README.md`, chapters 03-07 and the progress README returned no hits. No doc claims calibrated uncertainty. There are no intervals, and `README.md:258` states "no significance tests".

**Claims the design cannot currently back up**
1. "Reduced where the KB speaks" and "Reduced in the network's own distribution", "persists with the mask off" (`docs/progress/README.md:225`, `:230`) are in the present tense and unmeasured. Kind C is "Not yet measured" (`:201`). They are P5 and P6, not findings.
2. Kind B evidence comes from Skip-gram (`:79`, `:200`), but M5 is wired only into `transformer.ts` (`07:405-428`). The README's comparison table has Skip-gram rows awaiting a neuro-symbolic value (`README.md:243-244`), although no mechanism touches that model. `README.md:218` itself says to compare each model only with its own run.
3. "The creditor is owed money... 2b is the option that turns that line into a training signal" (`docs/progress/README.md:79`). [probe] "the creditor is owed" occurs 0 times and `creditor` is a split token, so under chapter 07 it cannot be a banned target. A next-token ban also encodes a different thing from a relation.
4. "It helps most when data is scarce... the regime matches" (`:81`). Discussed above: scarce text is not the same as few labels.
5. "New allowed sets for the next round" (`:156`) and the two-way "intertwined" description (`07:16`): the reverse path does not reach A_t as specified.
6. The 2b row's "8 of 8" H rating (`:65`) is the authors' rating of a category. The docs say it is not measured (`:67`) and that the project is only "towards 2b" (`:162`), so it should not be read as a property of this design.
7. "Forward chaining over the tokens in the window" (`:124`): not what `allowed()` does.
8. "Removed completely" for the mask (`:223`) holds only at positions where a trigger fires, on single-token surface forms, and only at the token level.
9. `massBefore` as "direct evidence of the gap" (`04-neurosymbolic-design.md:151`; `README.md:139`). On a near-uniform model any token set gets mass by chance. Perplexity is about 292 (`README.md:206`), so a 3-4 token set would get on the order of 1% regardless of meaning. [probe] The illustrative pay-forms mean of 0.69% is in that range.
10. `07:351` says "exactly one of A". An earlier note marks this as inaccurate, since the constraint is "at least one of A" under a categorical distribution (`research_notes/Semantic loss original paper/xu_2018_semantic_loss.md:93`). `docs/progress/README.md:133` has the better wording.
11. `07:57` and `:457` assert corpus facts that are no longer true (see (g)).

**Inconsistent status across docs**
- Root README says the transformer is "Done" (`README.md:23`). The progress README says "partly written" (`docs/progress/README.md:13`). Chapter 05 lists it as not written (`05:36-38`), which `docs/architecture.md:1011` onward already flags as out of date.
- Eq. (8) in chapter 04 names the whole objective L_sem (`04:162`), while chapter 07 and the progress README use L_sem for the term alone (`07:336`; `docs/progress/README.md:130`).
- The README lists four predictions (`README.md:143-150`). P5-P7 are "to add to chapter 04 §9" (`docs/progress/README.md:241`) and have not been added (`04:177-182`).

### Inferences
- `README.md:141` is accurate for M1/M2 but describes the mask alone. It needs a sibling sentence if M5 is adopted, since M5 does change the weights.
- A cheap control for claim 9: compare `massBefore` with the mass on a random token set of the same size and similar frequency in the same context.
- Rewording table `:225` to "predicted (P5, P6)" would make the section consistent with its own status line.

### Gaps
- The local PDFs were not re-read for these notes. Xu quotations rely on the existing notes in `research_notes/Semantic loss original paper/`.

## What experiment would isolate each layer's contribution?

### Takeaway
A 2 x 2 x 4 layout (λ_s on/off x mask on/off x seeds 42, 1, 2, 3) needs only **8 trainings, about 95 minutes** by extrapolation, because the mask factor needs no retraining. On violation rate the interaction is degenerate by construction, since the mask forces a floor in both mask-on cells. So M5's added value has to be read from `massBefore` on fixed contexts and from constraints held out of A_t.

### Cited Findings
**Existing plan and repo conventions**
- E1: seeds 42, 1, 2, 3, weight L2 and cosine, logit cosine (`05:54`). E2: N samples per seed, off against mask, violation rate, perplexity, distinct-token ratio (`05:61`). E3: one trace (`05:66`).
- Predictions: P1-P4 (`04:179-182`); P5-P7 with JS divergence and weight cosine (`docs/progress/README.md:245-247`). The brief's "P1-P3" is out of date.
- Chapter 07's reporting table: `corpusConflicts`, `semLoss` for λ_s in {0, 0.5, 2}, mask-off `massBefore`, violation rate, lifted status, held-out CE (`07:924-929`).
- The baseline records **one seed only** (`README.md:218`). A difference below seed spread is "noise until E1 measures that spread" (`README.md:227`). Any `transformer.ts` fix requires a re-run of the baseline (`README.md:224`). Gates must pass first (`README.md:251`; `05:73-77`).
- `λ_s = 0` must reproduce baseline weights, and processor-off must reproduce output byte for byte (`docs/progress/README.md:174`; `04:82`).
- Cost: 710 s for 300 epochs, 2 layers on 10 cores (`README.md:196`). [probe] A 16-token forward pass takes about 0.82 ms. The 102,896 `allowed()` calls, plus everything else in the first probe, completed in about 1.4 s total, so precomputing masks is negligible.

**Preconditions (all absent today)**
1. Fix D1-D3 and pass the five gates (`docs/architecture.md:1011-1019`; `05:73-77`), and re-run the baseline.
2. A civil-law KB, plus TRIGGERS and SURFACE for it. Run `constrainedPositions` and `corpusConflicts` first, since they need no training. **Stop if `constrainedPositions` is 0.**
3. Split a held-out set, in the same change as (1), since a new hash forces a new baseline anyway (`README.md:225`).
4. Add `seed` to `TrainOpts`, the schema and filenames, with a KB hash and `-sem` suffix. Run from a separate working directory, so checkpoints do not overwrite the tracked `.data/` files (`train.ts:251`, `:419`).
5. Add P5-P7 to chapter 04, and fix KB_train and KB_heldout before seeing model output (`05:108`).

**Minimal layout (a proposal; no cell has been run)**

| Cell | λ_s | Processor at generation | Weights | Answers |
|---|---|---|---|---|
| A | 0 | observe-only (`bias`, λ = 0) | new baseline per seed | P3, P4/E1, P2 |
| B | 0 | mask | same as A | Mask alone: P1, E3 |
| C | 2 | observe-only | new per seed | Loss alone: P5, P6, P7 |
| D | 2 | mask | same as C | Both: residual leak, mass the mask still moves |

Each cell runs seeds 42, 1, 2, 3 with the same generation seeds across cells. That is 16 cells from 8 trained models. Keep M4 rejection sampling off (`04:155`), the KB frozen at KB_0 (no lift), and the configuration at the baseline's 300 epochs, 2 layers, T = 0.8, top-p 0.9, 40 tokens (`README.md:196`).

**Metrics by what they can isolate**

| Metric | Source | Depends on | Reads out |
|---|---|---|---|
| CE and `semLoss` per epoch | `07:491` | λ_s | Cost and whether M5 is active |
| `massBefore` on a **fixed** probe set: `the {x}`, `the {x} can` (`07:647`), plus held-out text | `07:506` | λ_s only (A = B, C = D) | Network's own forbidden mass (P5), free of trajectory effects |
| Same, on a matched random token set | control | λ_s only | Whether mass is above chance |
| Violations per trigger firing, per sample, by verifier, with the prompt stripped (`generateText` returns seed ids too, `transformer.ts:1015`) | `07:588` | Both | P1, P3, P5 |
| Violations of KB_heldout (never in A_t) | `05:108` | Both | **Generalisation**, the only route by which M5 can beat the mask |
| Piece-spelled violations (fragments forming a banned word) | verifier on text | Both | Mask leak, P1 scope |
| Weights-only perplexity on held-out no-rule text | `docs/progress/README.md:247` | λ_s only | P7. Do not compute it after the mask |
| JS divergence across seeds; weight cosine; logit cosine | `docs/progress/README.md:246`; `05:54` | λ_s | P6, E1 |
| Distinct-token ratio | `05:61` | Both | Degeneracy |
| `constrainedPositions`, `corpusConflicts`, `unenforceable` | `07:440-441`, `:273` | KB, once | Denominators |

### Inferences
- **Reading each layer:**
  - Mask = B - A on violations.
  - Loss = C - A on `massBefore` and violations.
  - M3 and M4 are instruments and get no factor. Verify M3 is passive by checking that the `bias`, λ = 0 run is identical to no processor.
  - The B-A interaction with D-C equals the loss effect by arithmetic, since B = D = 0 on expressible constraints. Do not report it as a finding.
- **What D adds:** with the mask on, M5 can only show up as less mass being moved (a smaller `massBefore`), less distortion from renormalisation, and possibly fewer held-out violations.
- **Trajectories:** same-seed runs stay paired only until the first step the mask changes the nucleus, then they diverge. Sampled-trajectory `massBefore` is therefore confounded by context, which is why the fixed probe set is primary.
- **Statistics:** with four seeds, a paired sign-flip test has a minimum two-sided p of 2/16 = 0.125, so four seeds can never give p < 0.05. Report per-seed values and range, in line with `README.md:227` and `:258`. Six seeds reach 2/64 = 0.031, at 12 trainings, about 2.4 hours.
- **Cost estimate:** 8 x 710 s = 5,680 s, about 95 minutes, assuming the D1-D3 fix does not change run time. Generating 200 samples of 40 tokens in 16 cells is 128,000 forward passes, or about 2 minutes at 0.82 ms. Whether 300 epochs remains sufficient after the fixes is unknown.
- **λ_s:** use 2 first, the largest in `07:925`. If it moves nothing, 0.5 is unlikely to. If it does, adding 0.5 costs 4 more trainings, about 47 minutes.
- **Optional arms, no retraining needed:** M2 as `both`, λ = 2 gives 8 more cells, but it needs a new prediction first since none exists. Lift should be a separate later experiment, and only after it can reach A_t.
- **Determinism:** the worker count depends on the machine (`train.ts:324`) and gradients are float32 sums per worker, so the `λ_s = 0` weight-identity check should be expected to hold on the same machine, not across machines.

### Gaps
- N is unspecified in `05:61`. My 200 is a planning value, not derived. If generated text fires triggers at about the corpus rate of 2% per step, 200 x 40 tokens gives about 160 opportunities per seed, but the true rate is unknown.
- No minimum effect size is defined for P5 ("not lower") or P7 ("a large rise"). P7's threshold in particular needs a number before running.
- Coverage of an unlabelled-probe variant of M5 (see the previous section) would add a third level to the λ_s factor. Whether to add it is an owner decision.

## What is recorded as measured versus not measured?

### Takeaway
The only recorded results are for stages 2 and 3, plus one single-seed, known-defective transformer baseline with no symbolic component. No M1-M5 result of any kind exists, and neither do E1-E3 or P1-P7.

### Cited Findings
**Recorded as measured**
- XOR over four seeds: `README.md:33-38`; `05:91-93`.
- Skip-gram, civil-law corpus, one seed: analogies 0/5 and the cosine tables (`README.md:46-64`, `:158-185`).
- Skip-gram seed agreement on the **earlier toy corpus**, not re-run on civil law (`README.md:74-80`).
- Transformer baseline, 300 epochs, one seed, **with D1-D3 present**: loss 6.717 at epoch 0, lowest 5.637 at epoch 210, 5.678 at epoch 300, perplexity about 292, 710 s (`README.md:196-206`, `:212`). The same README says "Only stages 2 and 3 have measured results" and calls this a baseline, not an experiment (`README.md:27`).
- `docs/architecture.md:7` says that until the defects are fixed and a gradient check passes, those checkpoints "are not evidence of anything".

**Analytic, not measured**
- 12,704 parameters per block (`05:98`).
- M5 unit-test values were hand-computed, and the tests have not been run (`07:3`, `:824`; `docs/progress/README.md:154`).

**Explicitly not measured or not run**
- Stage 5 "Designed only", stage 6 "Not run, no results" (`README.md:24-25`).
- E1, E2, E3: "none yet" (`05:83-85`; also `:56`, `:62`, `:67`).
- Violation rate and `massBefore`: "not measured" (`README.md:246-247`). Output ambiguity: "Not yet measured" (`docs/progress/README.md:201`).
- The five gates are listed as not done (`README.md:251`). P1-P7 are all open (`04:184`; `docs/progress/README.md:187`, `:241`).
- The neuro-symbolic column of the comparison table is empty (`README.md:241-247`).
- Sheth ratings are "not something this project has measured" (`docs/progress/README.md:67`).

**Computed for these notes only, not in the repo docs** ([probe], see the top of this file)
- Chapter 07 KB coverage of 0 positions; the 2.05% role-word ceiling; token-alignment shares; top-1 probability range on the defective baseline; 0.69% illustrative pay-form mass.

### Inferences
- The population optimum P_B* = f_B/(1+λ_s) is a mathematical property, checked on a toy softmax. It is not evidence of how the transformer behaves.
- Any statement that M5 or the mask "reduces" something must remain conditional until the factorial is run.

### Gaps
- `tests/` currently has no `neuro-symbolic.test.ts` (`tests/` holds `ieee-data.ts`, `probe-embed.ts`, `probe-xor.ts`, `train-embed.test.ts`), so nothing guards the spec code.
- The probe used the working tree at the time of reading, which includes uncommitted edits to `corpus.ts`. The hash match to `cbf9d5315` indicates the training text is unchanged from the recorded baseline.
