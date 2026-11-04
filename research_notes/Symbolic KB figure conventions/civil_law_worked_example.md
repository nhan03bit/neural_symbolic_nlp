# Civil-law worked example for the KB figure: `the claimant is the person who` (corpus L23)

Scope: England and Wales, educational, not legal advice. Run and checked 2026-11-03 with bun 1.3.13. Every number below is a read-only probe, not a recorded experiment. It comes from one trained run with the mask off, and nothing was trained. A hash of the `.data` listing was the same before and after the probe, and no repo file changed except these notes. Scripts, commands and raw output are at the end, under "Reproduction record", because the scratchpad is temporary. In citations, `kb_trace.out`, `weights_probe.out` and `extra_checks.out` are the outputs reproduced there.

## Q1. Which candidate traces best through the actual KB?

### Takeaway
Use approach (a): corpus line L23, query `the claimant is the person who`, with `brings` as the supported word and `owns` as the banned word. The KB fires only inside definition frames. It fired at 0 positions in all 34 stories, so a story sentence cannot be the traced query. A real sampled continuation from (c) can sit beside the trace as a labelled annotation. Approach (b) depends on human annotation, and its key words fall outside the model's 16-token window.

### Cited Findings

**The KB does not fire on story text.**
- `eve was owed money by a business and made a claim in the county court.` (L295) gives `fired: []`. So does `gita made a claim against a man who owed her rent.` (L297) — `kb_trace.out` section B.
- Across every prefix of the full stories, `allowed()` fired on 0 of 109 tokens of L295 and 0 of 105 tokens of L297 — `kb_trace.out` section B.
- `eve is the person who` gives `fired: []`, because `eve` is not a KB entity. `the claimant is the man who` also gives `fired: []`, because the frame is an exact word match — `kb_trace.out` section B.
- In the real training stream the KB fires at 9 of 5,390 positions: 0 in the 34 stories, and all 9 in eight of the 222 definition sentences (L23, L24, L27, L28, L31, L32, L37 twice, L38). The repo test asserts the same count, and all 8 tests pass — `kb_trace.out` section C; `tests/neural-symbolic-kb.test.ts` L44; `repo_test.out`.
- `CIVIL_LAW_CORPUS` also never fires: 0 firings, and 0 frame-regex hits in 118 entries. It holds 11 `TREE` entries (L706-716) and 44 `FP-` entries. 11,592 of its 17,398 tokens are outside the vocabulary, and nothing outside `corpus.ts` imports it — `kb_trace.out` section D; `extra_checks.out`; grep in the reproduction record.

**Comparison of the three approaches.**

| | (a) Definition as query | (b) Story, hand mapping, then frame | (c) Generated continuation |
|---|---|---|---|
| Text | L23 `the claimant is the person who` + next word | L295 or L297 sentence, then a frame that is not in the corpus at that point | Output of `generateText` from the L23 frame |
| Produced by code | Tokens, firing, bans, support, proof, probabilities | Only the frame part. The story text fires nothing | The sampled tokens, plus everything in (a) |
| Human annotation | Only the callout labels, which name what the code bound | All links from story words to KB roles | None for the text. Choice of seed and top-p is ours |
| Real token? | L23 frame is the first 6 tokens of the training stream | The prefix plus frame is a constructed string | Real at T = 1 with top-p 0.9 or 1.0. Never at top-p 0.6 (0 of 2,000) |
| Main weakness | Looks less like a real dispute. It is training text, so it is not a test of generalisation | The 16-token window drops `eve` and `owed` | One sample is an anecdote, and it depends on the sampling setting |
| Verdict | **Recommended for the trace** | Optional, as a separately labelled strip outside the tree | **Optional annotation** beside the banned leaf |

**Why (b) misleads.**
- The model only sees 16 tokens in the setup it was trained with (`seqLen = Math.min(cfg.contextLen, 16)`, `train.ts` L295). For L295 plus the frame the window is ` business and made a claim in the county court. the claimant is the person who`, so `eve was owed money by a` is gone. For L297 it is ` a claim against a man who owed her rent. the claimant is the person who`, so `gita made` is gone — `weights_probe.out`.
- The same token means opposite roles. ` owed` (id 109) is the creditor's word in L295 (`eve was owed`), but it is the debtor's past tense in L297 (`a man who owed her rent`). It is also the surface form of `is_owed` in `SURFACE` — `kb_trace.out` section B; `symbolic.ts` L219. Only a person can tell these apart. The code does not attempt it.
- Eve is both a creditor (`was owed money`) and a claimant (`made a claim`). `disjoint(court_party,debt_party)` is therefore not true of people, only of role labels. Showing eve inside the tree would invite the wrong reading.
- `brings` does not appear in either story sentence. Both say `made a claim`.

**Option (c), measured.** A banned token really does receive probability. At T = 1 and top-p 1.0, sampling seed 1 gives ` the claimant is the person who owns the home. the tenant is the` — `weights_probe.out`. Seed 42 gives the correct ` the claimant is the person who brings a claim. the defendant is the person who answers a`.

### Inferences
- Approach (a) is the honest default because the query, the firing and the numbers all come from running code on one real token sequence. The callouts only name what `allowed()` bound.
- If the owner wants the look of a real dispute, the L295 sentence can go in a strip above the query, marked "human annotation, KB does not fire here". No arrow should run from it into the tree.
- The corpus's `TREE` entries, such as `TREE K-FORMATION` at L706, look more like the reference figure. They are strings that no code executes, so drawing one would not be a trace of this KB.

### Gaps
- No story could be traced by code alone, and the KB cannot bind a named person. This is a limit of the current KB, not of the search.

## Q2. Trace of the recommended example

### Takeaway
At `the claimant is the person who`, `T-F0-BAN` and `T-F0-SUP` fire. Six words are banned, `brings` is supported, and nothing is unenforceable. `owns` has the deepest proof: R-OTHER-DOMAIN over R-CLASS.

### Cited Findings

#### Text and tokens
- Corpus line: `src/routes/train-embed/corpus.ts` L23, `"the claimant is the person who brings a claim"`. `TRAIN_TEXTS` adds a final period (`train.ts` L45-48).
- Query (frame) tokens from `buildVocabulary()`, which match positions 0-5 of the training stream, with the next stream token ` brings` — `kb_trace.out` sections A and C:

| Position | Token | Id | KB concept | Where the concept comes from |
|---|---|---|---|---|
| 0 | ` the` | 0 | none, outside the 5-word pattern | |
| 1 | ` claimant` | 204 | role, `?x = claimant` | `allowed()` binds it |
| 2 | ` is` | 4 | frame | `T-F0` pattern |
| 3 | ` the` | 0 | frame | `T-F0` pattern |
| 4 | ` person` | 63 | frame | `T-F0` pattern |
| 5 | ` who` | 45 | frame | `T-F0` pattern |
| next | ` brings` | 569 | verb, supported | `defined_by(claimant,brings)` |
| candidate | ` owns` | 365 | verb, banned | `not_defined_by(claimant,owns)` |

- **No word in the query carries the class or the counterpart.** `court_party` is not a token in this text, and `defendant` is not in the query. They are KB lookups from `claimant`: `is_a(claimant,court_party)` and `counterpart(claimant,defendant)` — `kb_trace.out` section F. Draw them as attached to `claimant`, and not as if they were read from the text.

#### Output of `allowed()`, exact
```
fired:
  T-F0-BAN: not_defined_by(claimant,answers) ← R-COUNTER
  T-F0-BAN: not_defined_by(claimant,owns) ← R-OTHER-DOMAIN
  T-F0-BAN: not_defined_by(claimant,rents) ← R-OTHER-DOMAIN
  T-F0-BAN: not_defined_by(claimant,sells) ← R-OTHER-DOMAIN
  T-F0-BAN: not_defined_by(claimant,buys) ← R-OTHER-DOMAIN
  T-F0-BAN: not_defined_by(claimant,owes) ← R-OTHER-DOMAIN
  T-F0-SUP: defined_by(claimant,brings) ← kb
banned (sorted): answers, buys, owes, owns, rents, sells
banned ids (fired order): 570, 365, 571, 572, 367, 137
supported: brings (id 569)
unenforceable: []
```
Of the 12 triggers, only `T-F0-BAN` (6 firings) and `T-F0-SUP` (1) fired. The other 10 fired nothing — `extra_checks.out`.

The KB holds a seventh fact, `not_defined_by(claimant,is_owed)`, which is not enforced at this position because `T-F0-BAN` excludes `is_owed`. It fires one word later: `the claimant is the person who is` gives `T-F0-IS-BAN: not_defined_by(claimant,is_owed) ← R-OTHER-DOMAIN` and bans ` owed` — `extra_checks.out`.

#### Output of `explain()`, exact
```
not_defined_by(claimant,owns)  [R-OTHER-DOMAIN]
  is_a(claimant,court_party)  [kb]
  disjoint(court_party,housing_party)  [kb]
  class_verb(housing_party,owns)  [R-CLASS]
    is_a(landlord,housing_party)  [kb]
    defined_by(landlord,owns)  [kb]

defined_by(claimant,brings)  [kb]

not_defined_by(claimant,answers)  [R-COUNTER]
  counterpart(claimant,defendant)  [kb]
  defined_by(defendant,answers)  [kb]
```
Source: `kb_trace.out` section E. The KB closes to 100 facts with 0 contradictions: 26 kb, 4 R-SYM-COUNTERPART, 6 R-SYM-DISJOINT, 8 R-CLASS, 8 R-COUNTER, 48 R-OTHER-DOMAIN — `kb_trace.out` section F.

#### Figure content

**Top box.** Query text, verbatim: `the claimant is the person who` followed by a slot for the next word.

| Callout | On | Exact text |
|---|---|---|
| Role | `claimant` | `?x = claimant` (token id 204) |
| Class (KB lookup) | `claimant` | `is_a(claimant, court_party)` |
| Counterpart (KB lookup) | `claimant` | `counterpart(claimant, defendant)` |
| Frame | `is the person who` | `T-F0: ?x is the person who` |
| Verb, supported | next-word slot | `brings`, `defined_by(claimant, brings)`, corpus L23 |
| Verb, banned | next-word slot | `owns`, `not_defined_by(claimant, owns)` |
| Legal definition, marked as a source and not as KB | `claimant` | CPR r2.3(1): "'claimant' means a person who makes a claim" |

**Tree, in drawing order.** True/False edges are the conditions in `allowed()`. The proof below N4 is a conjunction, so draw it with AND joins and not as True/False forks.

| Node | Content | Real value on this query |
|---|---|---|
| N1 | Last 5 words match `?x is the person who`? (`T-F0`) | True |
| N1 False leaf, not taken | No constraint | Observed on `the claimant is the man who` and on L295: `fired: []` |
| N2 | `?x` is a KB entity? | True, `claimant` |
| N2 False leaf, not taken | No constraint | Observed on `eve is the person who`: `fired: []` |
| N3 | `defined_by(claimant, v)`? | True for `brings`. False for `owns` |
| N3 True leaf | **Supported:** `brings`, p = 0.6137 | Sibling leaf, marked but not highlighted |
| N4 | `not_defined_by(claimant, v)`, enforced here? | True for `owns`, by `T-F0-BAN` |
| N4 False leaf, not taken | Unconstrained, for example ` said` p = 0.0118 | `said` is `unconstrained` in `extra_checks.out` |
| P1 | `is_a(claimant, court_party)` | [kb] |
| P2 | `disjoint(court_party, housing_party)` | [kb] |
| P3 | `class_verb(housing_party, owns)` | [R-CLASS], from `is_a(landlord, housing_party)` [kb] and `defined_by(landlord, owns)` [kb] |
| P4 | `not_defined_by(claimant, owns)` | [R-OTHER-DOMAIN], from P1, P2, P3 |
| Highlighted leaf | **Banned:** `owns`, p = 0.1246 | Would be removed by a mask. See Q3 |

**Branches not taken, to show faded or list in the caption.**
- R-COUNTER is not on the path to `owns`. It gives `answers` from `counterpart(claimant,defendant)` and `defined_by(defendant,answers)`.
- `disjoint` to `trade_party` gives `sells` and `buys`. `disjoint` to `debt_party` gives `owes` and `is_owed`.
- `class_verb(housing_party, rents)` via the tenant gives the `rents` ban, which is a sibling of `owns`.
- `T-F1` and `T-F2` (other frames) and all `-IS-` triggers fire nothing here.
- `NOT_ENFORCED` holds only `not_defined_by(landlord,rents)`, so it does not affect this query.

**Formula under the tree.** `Y = allowed(kb, contextIds, idxToToken, tokenIndex)`, the real signature (`symbolic.ts` L287-293). Do not copy `Map_Function(X, Z, Θ1)` from the reference. There are no learned parameters here: the mapping is an exact word match.

**Suggested caption.** "Read-only trace of `the claimant is the person who` (corpus L23, the first 6 training tokens) through `allowed()`. Frame T-F0 binds ?x = claimant. The KB stores defined_by(claimant, brings) and derives not_defined_by(claimant, owns) by R-OTHER-DOMAIN. not_defined_by means the verb does not define the role word, not that a claimant can never own anything. disjoint separates role labels, not people. Probabilities: e2000 weights, one trained run, mask off, T = 1, no top-p cut-off. Educational, England and Wales, not legal advice."

### Inferences
- I recommend highlighting the banned `owns` leaf and not `brings`. The ban is the only thing that acts on the distribution: `allowed()` defines `A_t` as everything except `banned` (`symbolic.ts` L286), so support alone changes no probability.
- I recommend `owns` over `answers` for three reasons: it has the largest banned probability, its proof has the depth of the reference tree, and it uses R-CLASS. Its cost is that the proof depends on `defined_by(landlord,owns)`, the weakest fact in the KB (see Q4). If that matters more than depth, use `answers`, whose proof has only 2 leaves.
- `allowed()` loops over triggers and then over KB objects. It does not test one candidate at a time, so N3 and N4 are a per-candidate reading of the loop. The membership output in `extra_checks.out` confirms that reading gives the same result for the words shown.

### Gaps
- `explain()` shows the provenance of the first derivation only. Each of these facts appears to have one derivation, judging from the 8 x 7 count of R-COUNTER and R-OTHER-DOMAIN facts, but I did not enumerate alternatives separately.

## Q3. Model probabilities at the frame (read-only probe)

### Takeaway
It could be done, in about 17 seconds. `owns` is p = 0.1246, not 0.0xx. With the mask off at T = 1, the banned words hold 0.3252 of the mass, and `brings` holds 0.6137. At the T = 1, top-p 0.6 setting of the earlier baseline samples, a banned token was never drawn, so any "removed" label must state its setting.

### Cited Findings
- Weights: `.data/transformer-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-v4.json`, one trained run, last history entry epoch 2000, loss 0.248975. The current corpus hash `bf9d5315` matches the filename, and the file's vocabulary equals the rebuilt one (937 tokens) — `kb_trace.out`; `weights_probe.out`.
- Config from the file: V = 937, context 32, d = 32, 2 heads, ff 128, 2 layers — `weights_probe.out`.
- Function: the repo's `forward()`, 6-token context, last row of `probs`. It is deterministic, so a repeat gave the identical value — `extra_checks.out`.

| Token | Status | p, mask off, T = 1 | Rank |
|---|---|---|---|
| ` brings` | supported | 0.6137 | 1 |
| ` owns` | banned | 0.1246 | 2 |
| ` answers` | banned | 0.0888 | 3 |
| ` owes` | banned | 0.0506 | 4 |
| ` rents` | banned | 0.0461 | 5 |
| ` buys` | banned | 0.0150 | 6 |
| ` sells` | banned | 1.95e-7 | 199 |
| ` said` | unconstrained | 0.0118 | 7 |
| ` has` | unconstrained | 0.0108 | 8 |
| ` asks` | unconstrained | 0.0091 | 9 |
| ` is` | unconstrained | 0.0061 | 10 |

- Banned mass 0.3252 (0.325210), supported mass 0.6137, other 0.0611 — `weights_probe.out`; `extra_checks.out`.
- Removing the banned tokens and renormalising gives `brings` 0.9094, `said` 0.0174, `has` 0.0160, `asks` 0.0134, `is` 0.0091. **This is the probe's own arithmetic, not repo code.** `src/routes/neural-symbolic/constraints.ts` and `verify.ts` are 0 bytes, so there is no mask to run in the repo today — `wc -c` in the reproduction record.

**One sampled next token from `generateText`, T = 1, 2,000 sampling seeds, unmasked** — `weights_probe.out`:

| top-p | `brings` | `owns` | `answers` | `owes` | `rents` | `buys` | Other | Banned total |
|---|---|---|---|---|---|---|---|---|
| 0.6 | 2000 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 0.9 | 1352 | 257 | 184 | 117 | 90 | 0 | 0 | 648 |
| 1.0 | 1242 | 265 | 151 | 101 | 93 | 32 | 116 | 642 |

**The numbers depend strongly on the preceding context** — `weights_probe.out`:

| Context ending in the frame | `brings` | `owns` | Banned mass | Top token |
|---|---|---|---|---|
| Frame alone (6 tokens, a true training prefix) | 0.6137 | 0.1246 | 0.3252 | ` brings` |
| L295 sentence + frame, last 16 tokens (constructed) | 0.3877 | 0.0727 | 0.4099 | ` brings`, then ` buys` 0.1697 |
| L297 sentence + frame, last 16 tokens (constructed) | 0.1808 | 0.0022 | 0.3262 | ` is` 0.4449, then ` rents` 0.1841 |
| L295 sentence + frame, 22 tokens (past the trained length) | ~0 (rank 194) | ~0 (rank 868) | 0.0000 | ` no` 0.2662 |

**Other frames, alone, T = 1, for comparison** — `weights_probe.out`:

| Frame | Supported p | Banned mass | Largest banned |
|---|---|---|---|
| claimant, L23 | brings 0.6137 | 0.3252 | owns 0.1246 |
| defendant, L24 | answers 0.8556 | 0.1211 | brings 0.0695 |
| tenant, L28 | rents 0.8676 | 0.1168 | brings 0.0708 |
| debtor, L38 | owes 0.8650 | 0.1112 | buys 0.0830 |
| consumer, L32 | buys 0.9312 | 0.0541 | brings 0.0417 |
| creditor, L37 | none | 0.0230 | brings 0.0098 |
| landlord, L27 | owns 0.9735 | 0.0155 | brings 0.0079 |
| trader, L31 | sells 0.9754 | 0.0000 | all below 0.00001 |

Windows slide by one token, so every frame alone is the start of one training window. The model is causal: position 5 gives the identical p for the first 6 tokens and the first 16 tokens of the stream (`owns` 0.12462005764245987 in both) — `window_counts.out`. So the L23 values are exactly the model's output at training sequence 0, position 5, whose target is ` brings`.

L23 is a corpus-edge case. Its frame is in **1** training window, because it opens the stream. Each of the other seven frames is in **11** — `window_counts.out`. In the 16-token training window that ends at a frame, banned mass is lower than for the frame alone: defendant 0.0192, landlord 0.0420, tenant 0.0572, debtor 0.0283 — `weights_probe.out`. L23 has no such window.

### Inferences
- `owns p = 0.1246, would be removed` is measured, and valid only with its label: frame alone, e2000, mask off, T = 1, no top-p cut-off.
- Use "would be removed" and not "removed", since no mask exists in the repo yet.
- The figure should not imply the model always errs here. At top-p 0.6 the same model drew `brings` 2,000 times out of 2,000. This agrees with the earlier probe note that the violation does not occur at that setting ([repo_probes_2026-11-03.md](../Civil%20law%20KB%20M1%20M5%20plan/repo_probes_2026-11-03.md)).
- The L23 frame is training text, so these numbers show what the model retained after training, not generalisation.
- L23's banned mass may be high partly because the frame is seen in 1 window and not 11. I did not test this cause. The figure should not present 0.3252 as typical of the frames: the mean over 8 roles in the earlier note is about 0.10, and it used the older KB.
- Do not feed more than 16 tokens. Training uses positions 0-15 only, so positions 16-31 of `posEmb` appear never to be trained, which would explain the 22-token row. Pass `seqLen = 16` to `generateText`, because its default window is `cfg.contextLen` (32).
- The earlier note's banned mass of 0.331 for claimant came from an older KB in which `is_owed` mapped to ` is`. The current 0.3252 plus ` is` at 0.0061 gives 0.3313, which accounts for the difference. Use 0.3252.

### Gaps
- One trained run, so there is no between-seed spread and no confidence interval on these p values.
- I did not run a masked `generateText`, because the repo has no mask code and an edited copy goes beyond this probe. So the figure should not show a masked continuation.
- I did not sample at the request schema's defaults (T = 0.8, top-p 0.9, `src/schemas/train-transformer-request.ts` L6-7).

## Q4. Legal correctness against primary sources

### Takeaway
L23 is well supported: CPR r2.3(1) defines the claimant almost in the same words, and r2.1(1) applies the CPR to the County Court and High Court. The risk in the figure is not L23. It lies in reading `not_defined_by`, `disjoint` or "banned" as statements about what people can do. The CPR itself shows a claimant can answer a counterclaim and a landlord can be a claimant.

### Cited Findings

**Quotes checked in the fetched page text on 2026-11-03.**
- "'claimant' means a person who makes a claim" and "'defendant' means a person against whom a claim is made" — [CPR Part 2, r2.3(1)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part02).
- "these Rules apply to all proceedings in – (a) the County Court; (b) the High Court; and (c) the Civil Division of the Court of Appeal" — [CPR Part 2, r2.1(1)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part02).
- "a possession claim brought by a – (i) landlord (or former landlord); (ii) mortgagee; or (iii) licensor (or former licensor)" — [CPR Part 55, r55.2(1)(a)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part55). This shows both the verb "brought" and a landlord in the claimant's position.
- "unless the context requires otherwise, references to a claimant or defendant include a party bringing or defending an additional claim" — [CPR Part 20, r20.2(2)(b)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part20).
- "A defendant may make a counterclaim against a claimant by filing particulars of the counterclaim" and "Part 10 (acknowledgment of service) does not apply to a claimant who wishes to defend a counterclaim" — [CPR Part 20, r20.4(1) and (3)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part20).
- "'default judgment' means judgment without trial where a defendant— (a) has failed to file an acknowledgment of service; or (b) has failed to file a defence or any document intended to be a defence" — [CPR Part 12, r12.1](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part12).
- "You can apply to a county court to claim money you're owed by a person or business." and "There's a different process to make a court claim in Scotland and to make a court claim in Northern Ireland" — [GOV.UK, Make a court claim for money](https://www.gov.uk/make-court-claim-for-money). This closely supports the first sentence of L295.
- "You might have to pay more or get a county court judgment (CCJ) if you do not respond in time." — [GOV.UK, Respond to a court claim for money](https://www.gov.uk/respond-to-court-claim-for-money). This supports the L297 outcome.

**Wording in the figure.**

| Do not write | Why it overclaims | Write instead |
|---|---|---|
| "A claimant cannot own" or "claimants do not own" | A landlord or mortgagee brings possession claims (r55.2(1)(a)) | "Owning does not define the role word claimant" |
| "A claimant never answers" (if `answers` is shown) | A claimant may defend a counterclaim (r20.4(3)), and role references can include a party defending an additional claim (r20.2(2)(b)) | "Answering does not define the role word claimant" |
| "Court parties and housing parties are disjoint" with no gloss | One person can hold both roles (r55.2). Eve in L295 is both creditor and claimant | "Separate role labels, not separate people" |
| "Banned" meaning legally false | `the claimant is the person who owns the land` can be true of a particular case. The ban applies in this frame only | "Blocked in this definition frame" |
| `defined_by(landlord, owns)` as a statement of law | "The head landlord is the person who owns the property" while a subtenant's "immediate landlord is the person you rent from" ([Shelter England](https://england.shelter.org.uk/housing_advice/private_renting/subtenants), quoted in [kb_facts_against_sources.md](../Civil%20law%20KB%20M1%20M5%20plan/kb_facts_against_sources.md), not re-fetched) | Keep the KB's exact fact name and add "corpus simplification" |
| `court_party` or `housing_party` as legal terms | Earlier notes found "housing party" in no source checked ([kb_facts_against_sources.md](../Civil%20law%20KB%20M1%20M5%20plan/kb_facts_against_sources.md)) | Label them "KB class labels" |
| "brings = the correct legal answer" | The fact is the KB's copy of a corpus sentence. CPR says "makes" | "KB fact from corpus L23" with the CPR quote in its own box |
| "the claimant" as if there is only one | Earlier notes cite r19.1, "any number of claimants or defendants" ([kb_facts_against_sources.md](../Civil%20law%20KB%20M1%20M5%20plan/kb_facts_against_sources.md), not re-fetched) | Keep L23 verbatim, and do not add "the only" |
| "supported" as "boosted" or "the only allowed word" | Support changes no probability. ` said`, ` has` and others stay allowed | "Supported: matches a KB fact" |

### Inferences
- The figure's weakest link is inside the path to `owns`: `defined_by(landlord,owns)`. L23 itself is sound, but the proof that bans `owns` borrows the landlord simplification. The figure can stay accurate by showing that fact under its KB name, with the note above.
- L297 works against `defined_by(defendant,answers)`: the man in that story `did nothing at all`, yet a judgment was entered against him. So he is a defendant who did not answer. r2.3(1) defines a defendant by the claim made against them, and r12.1 covers one who fails to file. This matters if `answers` appears in the figure.

### Gaps
- The CPR pages carry footers of "Updated: Sunday, 1 October 2023" (Parts 2, 20, 55) and "Updated: Friday, 17 November 2023" (Part 12). I did not check separately for later amendments to these rules. Check again before publication.
- r2.1(1) lists courts and does not itself say "England and Wales". That these courts serve England and Wales is background knowledge here, not a quote.
- The GOV.UK pages do not name "England and Wales". They say the process differs in Scotland and in Northern Ireland, and the Respond page mentions Scotland only.
- I did not re-fetch Shelter, Housing Act 1988 or CPR r19.1. Those come from the earlier notes.
- I did not check the fee figures in L295 or the rest of L297, and the figure should not use them.

## Q5. Alternative examples, ranked by clarity to a reader

### Takeaway
All three fire in code. The tenant frame is the clearest to a lay reader, but it has a Wales problem and a small `owns` probability. None beats L23 on the combination of legal support and measured effect.

### Cited Findings

| Rank | Corpus line and query | Fires? | Supported, p | Banned to show, p | Proof | Legal note |
|---|---|---|---|---|---|---|
| 1 | L28 `the tenant is the person who` | Yes, `T-F0-BAN` and `T-F0-SUP`. Stream position 53 | `rents` 0.8676 alone, 0.9396 in real window | `owns` 0.0146 alone, 0.0008 in real window. Larger: `brings` 0.0708 alone | `not_defined_by(tenant,owns)` [R-COUNTER]: derived `counterpart(tenant,landlord)` and `defined_by(landlord,owns)` | In Wales, "tenants and licencees are now known as 'contract-holders'" ([Welsh Government](https://www.gov.wales/housing-law-changed-renting-homes)). Earlier notes record that a leaseholder is described as owning ([kb_facts_against_sources.md](../Civil%20law%20KB%20M1%20M5%20plan/kb_facts_against_sources.md)) |
| 2 | L24 `the defendant is the person who` | Yes, `T-F0-BAN` and `T-F0-SUP`. Stream position 16 | `answers` 0.8556 alone, 0.9682 in real window | `brings` 0.0695 alone, 0.0104 in real window | `not_defined_by(defendant,brings)` [R-COUNTER]: derived `counterpart(defendant,claimant)` and `defined_by(claimant,brings)` | CPR defines a defendant as one "against whom a claim is made", not one who answers ([r2.3(1)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part02)). A defendant can bring a counterclaim ([r20.4(1)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part20)) |
| 3 | L38, constructed extension `the debtor is the person who is` | Yes in code, `T-F0-IS-BAN`. **Never in the training stream**, because L38 continues `owes`. L38's own frame fires at stream position 127 | None at this position. ` liable` is top at 0.5892 and is unconstrained | ` owed` 0.2563, the largest single banned value seen on any frame | `not_defined_by(debtor,is_owed)` [R-COUNTER]: derived `counterpart(debtor,creditor)` and `defined_by(creditor,is_owed)` | Earlier notes found no general statutory definition, only statute-specific ones ([kb_facts_against_sources.md](../Civil%20law%20KB%20M1%20M5%20plan/kb_facts_against_sources.md)). My own reasoning, unsourced: a debtor on one debt can be owed money on another |

Sources for code values: `kb_trace.out` sections A, C, E; `weights_probe.out`.

**Lines to avoid as the main example.**
- L27 landlord: it fires, but it is the weakest legal fact, and banned mass is 0.0155.
- L31 trader: it fires and has a statutory anchor in "'Trader' means a person acting for purposes relating to that person's trade, business, craft or profession" ([CRA 2015 s2(2)](https://www.legislation.gov.uk/ukpga/2015/15/section/2)), but banned mass is 0.0000, so there is nothing to show.
- L32 consumer: it fires, but "'Consumer' means an individual acting for purposes that are wholly or mainly outside that individual's trade, business, craft or profession" ([CRA 2015 s2(3)](https://www.legislation.gov.uk/ukpga/2015/15/section/2)) does not mention buying, and banned mass is only 0.0541.
- L37 creditor at `who`: it fires bans only and supports nothing. Only `... who is` supports ` owed` (0.9920).

### Inferences
- The figure should prefer L23 because it has the largest measured banned mass and a near-verbatim CPR definition, and because it avoids the tenant frame's Wales divergence. Its numbers come with the corpus-edge caveat in Q3.
- A second panel on L28 could help a lay reader, since rents against owns needs no legal background. Its `owns` value is too small to serve as the "removed" number.

### Gaps
- "Clarity to a reader" is my judgement. I did not test it with readers.

### Reproduction record

All scripts are read-only probes in `/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/trace`, importing repo code by absolute path. Run from `/Users/nedpham/Projects/neural_symbolic_nlp` so relative paths resolve.

```
bun <trace>/kb_trace.ts        > kb_trace.out
bun <trace>/weights_probe.ts   > weights_probe.out     # about 17 s
bun <trace>/extra_checks.ts    > extra_checks.out
bun <trace>/window_counts.ts   > window_counts.out
bun test tests/neural-symbolic-kb.test.ts              # 8 pass, 0 fail, 25 expect() calls
```

Other checks:
- `.data` listing hash, before and after the weights probe: `2b4df71a1293b07a87cc1babd0e8c78e6f686ac5` both times.
- Weights file SHA-1: `c1f45df3186a81c6bd0eb62015cd321d2755484a`. The `-e2000-...-ctx32-v4.json` checkpoint has the same hash.
- `wc -c src/routes/neural-symbolic/*`: `constraints.ts`, `index.ts`, `lift.ts`, `model.ts`, `semantic-loss.ts` and `verify.ts` are all 0 bytes. `symbolic.ts` is 11,936 bytes.
- `grep -n CIVIL_LAW_CORPUS -r src tests`, excluding `corpus.ts`: no matches.
- Legal quotes: pages fetched with `curl` on 2026-11-03, HTML stripped to text, and quotes searched for in that text. The `https://www.gov.uk/respond-money-claim` request redirected to `https://www.gov.uk/respond-to-court-claim-for-money`.

#### Script source: kb_trace.ts

```ts
// READ-ONLY PROBE. Runs the repo KB + tokenizer. Writes nothing to the repo or .data.
import { createHash } from "node:crypto";
import { allowed, buildTokenIndex, KnowledgeBase, RULES, TRIPLES, TRIGGERS, NOT_ENFORCED, contextWords, key } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/neural-symbolic/symbolic.ts";
import { buildVocabulary, TRAIN_TEXTS } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-transformer/train.ts";
import { CIVIL_LAW_CORPUS, CIVIL_LAW_DEFINITIONS, STORIES } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-embed/corpus.ts";

const v = buildVocabulary();
const I = v.indexToWord;
const ti = buildTokenIndex(I);
const kb = new KnowledgeBase(TRIPLES, RULES);
const enc = (t: string) => v.tokenize(t).map((tok) => { const id = v.wordToIndex.get(tok); return { tok, id }; });
const ids = (t: string) => enc(t).flatMap((e) => (e.id === undefined ? [] : [e.id]));
const J = (x: unknown) => JSON.stringify(x);
const words = (a: number[]) => a.map((i) => I[i].trim()).sort();

console.log("corpusHash", createHash("sha256").update(TRAIN_TEXTS.join("\n")).digest("hex").slice(0, 8));
console.log("vocab", I.length, "facts", kb.facts.size, "contradictions", J(kb.contradictions()), "triggers", TRIGGERS.length, "NOT_ENFORCED", J([...NOT_ENFORCED]));

function show(label: string, text: string) {
  const e = enc(text);
  const a = allowed(kb, ids(text), I, ti);
  console.log(`\n### ${label}\ntext: ${J(text)}`);
  console.log("tokens:", J(e.map((x) => [x.tok, x.id ?? null])));
  console.log("contextWords:", J(contextWords(ids(text), I)));
  console.log("fired:", J(a.fired));
  console.log("banned:", J(words(a.banned)), "ids", J(a.banned));
  console.log("supported:", J(words(a.supported)), "ids", J(a.supported));
  console.log("unenforceable:", J(a.unenforceable));
}

console.log("\n===== A. definitions as frame queries (frame = text up to and including who/that) =====");
const frames: [string, string][] = [
  ["L23", "the claimant is the person who"], ["L24", "the defendant is the person who"],
  ["L27", "the landlord is the person who"], ["L28", "the tenant is the person who"],
  ["L31", "the trader is a business that"], ["L32", "the consumer is a person who"],
  ["L37", "the creditor is the person who"], ["L37+is", "the creditor is the person who is"],
  ["L38", "the debtor is the person who"], ["L38+is", "the debtor is the person who is"],
];
for (const [l, t] of frames) show(l, t);

console.log("\n===== B. full corpus sentences and stories: does the KB fire? =====");
const eve1 = "eve was owed money by a business and made a claim in the county court.";
const gita1 = "gita made a claim against a man who owed her rent.";
show("L295 first sentence", eve1);
show("L297 first sentence", gita1);
show("eve as ?x (eve is not a KB entity)", "eve is the person who");
show("L295 first sentence + frame (claimant)", `${eve1} the claimant is the person who`);
show("L295 first sentence + frame (creditor +is)", `${eve1} the creditor is the person who is`);
show("bare role", "the claimant");
show("role+near frame", "the claimant is the man who");

for (const [name, text] of [["L295 eve full", STORIES.find((s) => s.startsWith("eve was owed"))!], ["L297 gita full", STORIES.find((s) => s.startsWith("gita made"))!]] as const) {
  const seq = ids(text); let n = 0;
  for (let p = 1; p <= seq.length; p++) if (allowed(kb, seq.slice(Math.max(0, p - 16), p), I, ti).fired.length) n++;
  console.log(`\n${name}: tokens=${seq.length}, prefixes on which allowed() fired=${n}, OOV tokens=${enc(text).filter((x) => x.id === undefined).length}`);
}

console.log("\n===== C. every firing in the training token stream (real windows, same as the test) =====");
const stream: { id: number; sent: number }[] = [];
TRAIN_TEXTS.forEach((s, si) => { for (const e of enc(s)) if (e.id !== undefined) stream.push({ id: e.id, sent: si }); });
const sid = stream.map((x) => x.id);
const defN = CIVIL_LAW_DEFINITIONS.length;
let fires = 0, storyFires = 0;
for (let p = 1; p < sid.length; p++) {
  const a = allowed(kb, sid.slice(Math.max(0, p - 16), p), I, ti);
  if (!a.fired.length) continue;
  fires++;
  const si = stream[p - 1].sent; if (si >= defN) storyFires++;
  console.log(J({ pos: p, inSentence: si, isStory: si >= defN, text: TRAIN_TEXTS[si].slice(0, 60), next: I[sid[p]], banned: words(a.banned), supported: words(a.supported), targetBanned: a.banned.includes(sid[p]), targetSupported: a.supported.includes(sid[p]) }));
}
console.log(`firings=${fires} of ${sid.length} positions; in stories=${storyFires}; definitions=${defN}; stories=${STORIES.length}`);

console.log("\n===== D. CIVIL_LAW_CORPUS (unused by the transformer) =====");
let cFire = 0, oov = 0, total = 0;
CIVIL_LAW_CORPUS.forEach((s, i) => {
  const e = enc(s); total += e.length; oov += e.filter((x) => x.id === undefined).length;
  const seq = ids(s);
  for (let p = 1; p <= seq.length; p++) { const a = allowed(kb, seq.slice(Math.max(0, p - 16), p), I, ti); if (a.fired.length) { cFire++; console.log("fire", i, s.slice(0, 80)); } }
});
console.log(`entries=${CIVIL_LAW_CORPUS.length}, firings=${cFire}, tokens=${total}, OOV tokens=${oov}`);

console.log("\n===== E. explain() =====");
const ex = (rel: string, a: string, b: string) => { console.log(`\n-- ${rel}(${a},${b}) has=${kb.has(rel, a, b)}`); console.log(kb.explain({ rel, a, b }).join("\n")); };
for (const b of ["brings"]) ex("defined_by", "claimant", b);
for (const b of ["answers", "owns", "rents", "sells", "buys", "owes", "is_owed"]) ex("not_defined_by", "claimant", b);
ex("defined_by", "defendant", "answers"); ex("not_defined_by", "defendant", "brings"); ex("not_defined_by", "tenant", "owns"); ex("not_defined_by", "landlord", "rents");
ex("not_defined_by", "trader", "buys"); ex("not_defined_by", "consumer", "sells"); ex("not_defined_by", "debtor", "is_owed"); ex("not_defined_by", "creditor", "owes"); ex("defined_by", "creditor", "is_owed");
ex("class_verb", "court_party", "brings"); ex("counterpart", "defendant", "claimant");

console.log("\n===== F. facts about claimant, and rule use =====");
for (const rel of ["defined_by", "is_a", "counterpart", "not_defined_by"]) console.log(rel, J(kb.objects(rel, "claimant")));
console.log("disjoint(court_party,*)", J(kb.objects("disjoint", "court_party")));
console.log("class_verb(court_party,*)", J(kb.objects("class_verb", "court_party")));
console.log("class_verb(housing_party,*)", J(kb.objects("class_verb", "housing_party")));
const cnt: Record<string, number> = {};
for (const { prov } of kb.facts.values()) { const k = prov.source === "rule" ? prov.rule : prov.source; cnt[k] = (cnt[k] ?? 0) + 1; }
console.log("facts by source", J(cnt));
console.log("triggers", J(TRIGGERS.map((t) => t.id)));
console.log("word counts in TRAIN_TEXTS of callout words:", J(["claimant", "brings", "owns", "answers", "owed", "owes", "claim"].map((w) => [w, ti.get(w)])));
```

#### Script source: weights_probe.ts

```ts
// READ-ONLY PROBE, not a recorded experiment. One trained run (seed 42), mask off. No training, nothing written to .data.
import { readFileSync } from "node:fs";
import { allowed, buildTokenIndex, KnowledgeBase, RULES, TRIPLES } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/neural-symbolic/symbolic.ts";
import { buildVocabulary, TRAIN_TEXTS } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-transformer/train.ts";
import { forward, generateText, type TransformerConfig, type TransformerWeights } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-transformer/transformer.ts";
import { resetRand } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-transformer/matrix.ts";

const PATH = "/Users/nedpham/Projects/neural_symbolic_nlp/.data/transformer-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-v4.json";
const json = JSON.parse(readFileSync(PATH, "utf-8"));
console.log("file keys", Object.keys(json), "weights keys", Object.keys(json.weights));
console.log("history length", json.history?.length, "last", JSON.stringify({ ...json.history?.at(-1), sample: undefined }));
const v = buildVocabulary(); const I = v.indexToWord;
for (const k of Object.keys(json)) if (k !== "weights" && k !== "history") console.log("meta", k, JSON.stringify(json[k]).slice(0, 200));
const sw = json.weights;
const w: TransformerWeights = {
  tokEmb: new Float32Array(sw.tokEmb), posEmb: new Float32Array(sw.posEmb),
  blocks: sw.blocks.map((b: Record<string, number[]>) => Object.fromEntries(Object.entries(b).map(([k, a]) => [k, new Float32Array(a)]))),
  lnFGamma: new Float32Array(sw.lnFGamma), lnFBeta: new Float32Array(sw.lnFBeta), headW: new Float32Array(sw.headW), headB: new Float32Array(sw.headB),
};
const cfg: TransformerConfig = { vocabSize: I.length, contextLen: 32, embDim: 32, numHeads: 2, ffDim: 128, numLayers: 2 };
console.log("size checks: tokEmb", w.tokEmb.length, "=", cfg.vocabSize * 32, "| posEmb", w.posEmb.length, "=", 32 * 32, "| blocks", w.blocks.length, "| headB", w.headB.length, "= V", cfg.vocabSize);
const fileVocab = json.indexToWord ?? json.vocab ?? json.vocabulary;
if (fileVocab) console.log("vocab equal to rebuilt:", JSON.stringify(fileVocab) === JSON.stringify(I));

const kb = new KnowledgeBase(TRIPLES, RULES); const ti = buildTokenIndex(I);
const ids = (t: string) => v.tokenize(t).map((x) => { const i = v.wordToIndex.get(x); if (i === undefined) throw new Error(`OOV ${x}`); return i; });
const f4 = (x: number) => x.toFixed(4);

function probe(label: string, text: string, windowLen = 16) {
  const all = ids(text); const ctx = all.slice(-windowLen);
  const c = forward(ctx, w, cfg); const V = cfg.vocabSize; const last = ctx.length - 1;
  const p = Array.from(c.probs.slice(last * V, (last + 1) * V));
  const sum = p.reduce((a, b) => a + b, 0);
  const a = allowed(kb, ctx, I, ti);
  const massB = a.banned.reduce((s, i) => s + p[i], 0);
  const massS = a.supported.reduce((s, i) => s + p[i], 0);
  const order = p.map((x, i) => [x, i] as const).sort((x, y) => y[0] - x[0]);
  const rank = (i: number) => order.findIndex((e) => e[1] === i) + 1;
  console.log(`\n### ${label}\ncontext (${ctx.length} tokens): ${JSON.stringify(ctx.map((i) => I[i]).join(""))}  sum(p)=${sum.toFixed(5)}`);
  console.log("top 10 mask off, T=1:", order.slice(0, 10).map(([x, i]) => `${JSON.stringify(I[i])} ${f4(x)}`).join(", "));
  console.log("supported:", a.supported.map((i) => `${I[i].trim()} p=${f4(p[i])} rank=${rank(i)} id=${i}`).join("; ") || "(none)");
  console.log("banned:", [...a.banned].sort((x, y) => p[y] - p[x]).map((i) => `${I[i].trim()} p=${p[i].toFixed(5)} rank=${rank(i)} id=${i}`).join("; ") || "(none)");
  console.log(`banned mass=${f4(massB)}  supported mass=${f4(massS)}  other mass=${f4(1 - massB - massS)}`);
  if (massB > 0) {
    const renorm = (i: number) => p[i] / (1 - massB);
    console.log("after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty):", a.supported.map((i) => `${I[i].trim()} p=${f4(renorm(i))}`).join("; "), "| top 5:", order.filter((e) => !a.banned.includes(e[1])).slice(0, 5).map(([x, i]) => `${JSON.stringify(I[i])} ${f4(x / (1 - massB))}`).join(", "));
  }
  return { p, a };
}

console.log("\n===== frames alone =====");
for (const t of ["the claimant is the person who", "the defendant is the person who", "the landlord is the person who", "the tenant is the person who", "the trader is a business that", "the consumer is a person who", "the creditor is the person who", "the creditor is the person who is", "the debtor is the person who", "the debtor is the person who is"]) probe(t, t);

console.log("\n===== sensitivity to preceding context (claimant frame, 16-token window as in training and in generateText with seqLen 16) =====");
const eve1 = "eve was owed money by a business and made a claim in the county court.";
const gita1 = "gita made a claim against a man who owed her rent.";
probe("eve L295 first sentence + frame, window 16", `${eve1} the claimant is the person who`);
probe("gita L297 first sentence + frame, window 16", `${gita1} the claimant is the person who`);
probe("eve L295 first sentence + frame, window 32", `${eve1} the claimant is the person who`, 32);
probe("eve L295 first sentence + creditor frame +is, window 16", `${eve1} the creditor is the person who is`);
// training-stream context of L24: the window that really ends at that frame
const stream = TRAIN_TEXTS.flatMap((s) => ids(s));
const showAt = (pos: number) => stream.slice(Math.max(0, pos - 16), pos).map((i) => I[i]).join("");
probe("real training window ending at L24 frame (stream pos 16)", showAt(16));
probe("real training window ending at L27 frame (stream pos 43)", showAt(43));
probe("real training window ending at L28 frame (stream pos 53)", showAt(53));
probe("real training window ending at L38 frame (stream pos 127)", showAt(127));

console.log("\n===== generateText (repo code, unmasked), one sampled next token, frame = claimant, T=1 =====");
const frame = ids("the claimant is the person who");
for (const topP of [0.6, 0.9, 1.0]) {
  const counts = new Map<string, number>();
  for (let seed = 1; seed <= 2000; seed++) {
    resetRand(seed);
    const out = generateText(w, cfg, frame, 1, I, 1.0, topP, 16);
    const next = out.slice("".length).replace(frame.map((i) => I[i]).join(""), "");
    counts.set(next, (counts.get(next) ?? 0) + 1);
  }
  console.log(`top-p ${topP}: 2000 seeds ->`, [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, c]) => `${JSON.stringify(k)} ${c}`).join(", "));
}

console.log("\n===== generateText continuations, seed 42 and first seeds that sample ' owns' / ' answers' at the frame (T=1, top-p 1.0) =====");
resetRand(42); const s42a = generateText(w, cfg, frame, 12, I, 1.0, 1.0, 16); resetRand(42); const s42b = generateText(w, cfg, frame, 12, I, 1.0, 1.0, 16);
console.log("seed 42:", JSON.stringify(s42a), "reproducible:", s42a === s42b);
const head = frame.map((i) => I[i]).join("");
for (const tgt of [" brings", " owns", " answers", " rents", " sells", " buys", " owes"]) {
  let found = "";
  for (let seed = 1; seed <= 2000 && !found; seed++) {
    resetRand(seed); const o = generateText(w, cfg, frame, 8, I, 1.0, 1.0, 16);
    if (o.startsWith(head + tgt)) found = `seed ${seed}: ${JSON.stringify(o)}`;
  }
  console.log(tgt, "->", found || "(not sampled in 2000 seeds)");
}
```

#### Script source: extra_checks.ts

```ts
// READ-ONLY PROBE. Small follow-ups to kb_trace.ts and weights_probe.ts.
import { readFileSync } from "node:fs";
import { allowed, buildTokenIndex, KnowledgeBase, RULES, TRIPLES, TRIGGERS } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/neural-symbolic/symbolic.ts";
import { buildVocabulary } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-transformer/train.ts";
import { forward, type TransformerConfig } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-transformer/transformer.ts";
import { CIVIL_LAW_CORPUS } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-embed/corpus.ts";
const v = buildVocabulary(); const I = v.indexToWord; const ti = buildTokenIndex(I); const kb = new KnowledgeBase(TRIPLES, RULES);
const ids = (t: string) => v.tokenize(t).map((x) => v.wordToIndex.get(x)!);
const a1 = allowed(kb, ids("the claimant is the person who is"), I, ti);
console.log("claimant+is:", JSON.stringify({ fired: a1.fired, banned: a1.banned.map((i) => I[i]), supported: a1.supported.map((i) => I[i]), unenforceable: a1.unenforceable }));
// Which of the 12 triggers matched at the frame?
const f = ids("the claimant is the person who");
for (const t of TRIGGERS) { const r = allowed(kb, f, I, ti, [t]); console.log(t.id, JSON.stringify(t.pattern), "fired:", r.fired.length, "banned:", r.banned.length, "supported:", r.supported.length); }
// Candidate membership at the frame
const a = allowed(kb, f, I, ti);
for (const w of ["brings", "owns", "answers", "rents", "sells", "buys", "owes", "owed", "said", "has", "is"]) {
  const i = ti.get(w)![0]; console.log(w, "id", i, a.banned.includes(i) ? "BANNED" : a.supported.includes(i) ? "SUPPORTED" : "unconstrained");
}
// Exact small probabilities at the frame
const sw = JSON.parse(readFileSync("/Users/nedpham/Projects/neural_symbolic_nlp/.data/transformer-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-v4.json", "utf-8")).weights;
const w: any = { tokEmb: new Float32Array(sw.tokEmb), posEmb: new Float32Array(sw.posEmb), blocks: sw.blocks.map((b: any) => Object.fromEntries(Object.entries(b).map(([k, x]) => [k, new Float32Array(x as number[])]))), lnFGamma: new Float32Array(sw.lnFGamma), lnFBeta: new Float32Array(sw.lnFBeta), headW: new Float32Array(sw.headW), headB: new Float32Array(sw.headB) };
const cfg: TransformerConfig = { vocabSize: I.length, contextLen: 32, embDim: 32, numHeads: 2, ffDim: 128, numLayers: 2 };
const c = forward(f, w, cfg); const V = cfg.vocabSize; const p = Array.from(c.probs.slice(5 * V, 6 * V));
for (const wd of ["brings", "owns", "answers", "owes", "rents", "buys", "sells"]) console.log(wd, p[ti.get(wd)![0]].toExponential(4));
const massB = a.banned.reduce((s, i) => s + p[i], 0); console.log("banned mass", massB.toFixed(6), "brings/(1-mass)", (p[ti.get("brings")![0]] / (1 - massB)).toFixed(6), "repeat determinism:", forward(f, w, cfg).probs[5 * V + ti.get("owns")![0]] === c.probs[5 * V + ti.get("owns")![0]]);
// Frame regex over the unused corpus (independent of OOV dropping)
const re = /\b(claimant|defendant|landlord|tenant|trader|consumer|creditor|debtor) is (the person who|a person who|a business that)\b/i;
console.log("CIVIL_LAW_CORPUS frame regex hits:", CIVIL_LAW_CORPUS.filter((s) => re.test(s)).length, "of", CIVIL_LAW_CORPUS.length,
  "| TREE entries", CIVIL_LAW_CORPUS.filter((s) => s.startsWith("TREE ")).map((s) => s.split("\n")[0]).join("; "),
  "| FP entries", CIVIL_LAW_CORPUS.filter((s) => s.startsWith("FP-")).length);
```

#### Raw output: kb_trace.out

```text
corpusHash bf9d5315
vocab 937 facts 100 contradictions [] triggers 12 NOT_ENFORCED ["not_defined_by(landlord,rents)"]

===== A. definitions as frame queries (frame = text up to and including who/that) =====

### L23
text: "the claimant is the person who"
tokens: [[" the",0],[" claimant",204],[" is",4],[" the",0],[" person",63],[" who",45]]
contextWords: ["the","claimant","is","the","person","who"]
fired: ["T-F0-BAN: not_defined_by(claimant,answers) ← R-COUNTER","T-F0-BAN: not_defined_by(claimant,owns) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(claimant,rents) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(claimant,sells) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(claimant,buys) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(claimant,owes) ← R-OTHER-DOMAIN","T-F0-SUP: defined_by(claimant,brings) ← kb"]
banned: ["answers","buys","owes","owns","rents","sells"] ids [570,365,571,572,367,137]
supported: ["brings"] ids [569]
unenforceable: []

### L24
text: "the defendant is the person who"
tokens: [[" the",0],[" defendant",163],[" is",4],[" the",0],[" person",63],[" who",45]]
contextWords: ["the","defendant","is","the","person","who"]
fired: ["T-F0-BAN: not_defined_by(defendant,brings) ← R-COUNTER","T-F0-BAN: not_defined_by(defendant,owns) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(defendant,rents) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(defendant,sells) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(defendant,buys) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(defendant,owes) ← R-OTHER-DOMAIN","T-F0-SUP: defined_by(defendant,answers) ← kb"]
banned: ["brings","buys","owes","owns","rents","sells"] ids [569,365,571,572,367,137]
supported: ["answers"] ids [570]
unenforceable: []

### L27
text: "the landlord is the person who"
tokens: [[" the",0],[" landlord",32],[" is",4],[" the",0],[" person",63],[" who",45]]
contextWords: ["the","landlord","is","the","person","who"]
fired: ["T-F0-BAN: not_defined_by(landlord,sells) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(landlord,buys) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(landlord,owes) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(landlord,brings) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(landlord,answers) ← R-OTHER-DOMAIN","T-F0-SUP: defined_by(landlord,owns) ← kb"]
banned: ["answers","brings","buys","owes","sells"] ids [572,367,137,569,570]
supported: ["owns"] ids [365]
unenforceable: []

### L28
text: "the tenant is the person who"
tokens: [[" the",0],[" tenant",121],[" is",4],[" the",0],[" person",63],[" who",45]]
contextWords: ["the","tenant","is","the","person","who"]
fired: ["T-F0-BAN: not_defined_by(tenant,owns) ← R-COUNTER","T-F0-BAN: not_defined_by(tenant,sells) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(tenant,buys) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(tenant,owes) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(tenant,brings) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(tenant,answers) ← R-OTHER-DOMAIN","T-F0-SUP: defined_by(tenant,rents) ← kb"]
banned: ["answers","brings","buys","owes","owns","sells"] ids [365,572,367,137,569,570]
supported: ["rents"] ids [571]
unenforceable: []

### L31
text: "the trader is a business that"
tokens: [[" the",0],[" trader",78],[" is",4],[" a",2],[" business",122],[" that",11]]
contextWords: ["the","trader","is","a","business","that"]
fired: ["T-F2-BAN: not_defined_by(trader,buys) ← R-COUNTER","T-F2-BAN: not_defined_by(trader,owes) ← R-OTHER-DOMAIN","T-F2-BAN: not_defined_by(trader,brings) ← R-OTHER-DOMAIN","T-F2-BAN: not_defined_by(trader,answers) ← R-OTHER-DOMAIN","T-F2-BAN: not_defined_by(trader,owns) ← R-OTHER-DOMAIN","T-F2-BAN: not_defined_by(trader,rents) ← R-OTHER-DOMAIN","T-F2-SUP: defined_by(trader,sells) ← kb"]
banned: ["answers","brings","buys","owes","owns","rents"] ids [367,137,569,570,365,571]
supported: ["sells"] ids [572]
unenforceable: []

### L32
text: "the consumer is a person who"
tokens: [[" the",0],[" consumer",91],[" is",4],[" a",2],[" person",63],[" who",45]]
contextWords: ["the","consumer","is","a","person","who"]
fired: ["T-F1-BAN: not_defined_by(consumer,sells) ← R-COUNTER","T-F1-BAN: not_defined_by(consumer,owes) ← R-OTHER-DOMAIN","T-F1-BAN: not_defined_by(consumer,brings) ← R-OTHER-DOMAIN","T-F1-BAN: not_defined_by(consumer,answers) ← R-OTHER-DOMAIN","T-F1-BAN: not_defined_by(consumer,owns) ← R-OTHER-DOMAIN","T-F1-BAN: not_defined_by(consumer,rents) ← R-OTHER-DOMAIN","T-F1-SUP: defined_by(consumer,buys) ← kb"]
banned: ["answers","brings","owes","owns","rents","sells"] ids [572,137,569,570,365,571]
supported: ["buys"] ids [367]
unenforceable: []

### L37
text: "the creditor is the person who"
tokens: [[" the",0],[" creditor",576],[" is",4],[" the",0],[" person",63],[" who",45]]
contextWords: ["the","creditor","is","the","person","who"]
fired: ["T-F0-BAN: not_defined_by(creditor,owes) ← R-COUNTER","T-F0-BAN: not_defined_by(creditor,brings) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(creditor,answers) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(creditor,owns) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(creditor,rents) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(creditor,sells) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(creditor,buys) ← R-OTHER-DOMAIN"]
banned: ["answers","brings","buys","owes","owns","rents","sells"] ids [137,569,570,365,571,572,367]
supported: [] ids []
unenforceable: []

### L37+is
text: "the creditor is the person who is"
tokens: [[" the",0],[" creditor",576],[" is",4],[" the",0],[" person",63],[" who",45],[" is",4]]
contextWords: ["the","creditor","is","the","person","who","is"]
fired: ["T-F0-IS-SUP: defined_by(creditor,is_owed) ← kb"]
banned: [] ids []
supported: ["owed"] ids [109]
unenforceable: []

### L38
text: "the debtor is the person who"
tokens: [[" the",0],[" debtor",207],[" is",4],[" the",0],[" person",63],[" who",45]]
contextWords: ["the","debtor","is","the","person","who"]
fired: ["T-F0-BAN: not_defined_by(debtor,brings) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(debtor,answers) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(debtor,owns) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(debtor,rents) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(debtor,sells) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(debtor,buys) ← R-OTHER-DOMAIN","T-F0-SUP: defined_by(debtor,owes) ← kb"]
banned: ["answers","brings","buys","owns","rents","sells"] ids [569,570,365,571,572,367]
supported: ["owes"] ids [137]
unenforceable: []

### L38+is
text: "the debtor is the person who is"
tokens: [[" the",0],[" debtor",207],[" is",4],[" the",0],[" person",63],[" who",45],[" is",4]]
contextWords: ["the","debtor","is","the","person","who","is"]
fired: ["T-F0-IS-BAN: not_defined_by(debtor,is_owed) ← R-COUNTER"]
banned: ["owed"] ids [109]
supported: [] ids []
unenforceable: []

===== B. full corpus sentences and stories: does the KB fire? =====

### L295 first sentence
text: "eve was owed money by a business and made a claim in the county court."
tokens: [[" eve",699],[" was",14],[" owed",109],[" money",27],[" by",43],[" a",2],[" business",122],[" and",6],[" made",98],[" a",2],[" claim",15],[" in",9],[" the",0],[" county",124],[" court",10],[".",1]]
contextWords: ["eve","was","owed","money","by","a","business","and","made","a","claim","in","the","county","court."]
fired: []
banned: [] ids []
supported: [] ids []
unenforceable: []

### L297 first sentence
text: "gita made a claim against a man who owed her rent."
tokens: [[" gita",514],[" made",98],[" a",2],[" claim",15],[" against",326],[" a",2],[" man",515],[" who",45],[" owed",109],[" her",34],[" rent",36],[".",1]]
contextWords: ["gita","made","a","claim","against","a","man","who","owed","her","rent."]
fired: []
banned: [] ids []
supported: [] ids []
unenforceable: []

### eve as ?x (eve is not a KB entity)
text: "eve is the person who"
tokens: [[" eve",699],[" is",4],[" the",0],[" person",63],[" who",45]]
contextWords: ["eve","is","the","person","who"]
fired: []
banned: [] ids []
supported: [] ids []
unenforceable: []

### L295 first sentence + frame (claimant)
text: "eve was owed money by a business and made a claim in the county court. the claimant is the person who"
tokens: [[" eve",699],[" was",14],[" owed",109],[" money",27],[" by",43],[" a",2],[" business",122],[" and",6],[" made",98],[" a",2],[" claim",15],[" in",9],[" the",0],[" county",124],[" court",10],[".",1],[" the",0],[" claimant",204],[" is",4],[" the",0],[" person",63],[" who",45]]
contextWords: ["eve","was","owed","money","by","a","business","and","made","a","claim","in","the","county","court.","the","claimant","is","the","person","who"]
fired: ["T-F0-BAN: not_defined_by(claimant,answers) ← R-COUNTER","T-F0-BAN: not_defined_by(claimant,owns) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(claimant,rents) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(claimant,sells) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(claimant,buys) ← R-OTHER-DOMAIN","T-F0-BAN: not_defined_by(claimant,owes) ← R-OTHER-DOMAIN","T-F0-SUP: defined_by(claimant,brings) ← kb"]
banned: ["answers","buys","owes","owns","rents","sells"] ids [570,365,571,572,367,137]
supported: ["brings"] ids [569]
unenforceable: []

### L295 first sentence + frame (creditor +is)
text: "eve was owed money by a business and made a claim in the county court. the creditor is the person who is"
tokens: [[" eve",699],[" was",14],[" owed",109],[" money",27],[" by",43],[" a",2],[" business",122],[" and",6],[" made",98],[" a",2],[" claim",15],[" in",9],[" the",0],[" county",124],[" court",10],[".",1],[" the",0],[" creditor",576],[" is",4],[" the",0],[" person",63],[" who",45],[" is",4]]
contextWords: ["eve","was","owed","money","by","a","business","and","made","a","claim","in","the","county","court.","the","creditor","is","the","person","who","is"]
fired: ["T-F0-IS-SUP: defined_by(creditor,is_owed) ← kb"]
banned: [] ids []
supported: ["owed"] ids [109]
unenforceable: []

### bare role
text: "the claimant"
tokens: [[" the",0],[" claimant",204]]
contextWords: ["the","claimant"]
fired: []
banned: [] ids []
supported: [] ids []
unenforceable: []

### role+near frame
text: "the claimant is the man who"
tokens: [[" the",0],[" claimant",204],[" is",4],[" the",0],[" man",515],[" who",45]]
contextWords: ["the","claimant","is","the","man","who"]
fired: []
banned: [] ids []
supported: [] ids []
unenforceable: []

L295 eve full: tokens=109, prefixes on which allowed() fired=0, OOV tokens=0

L297 gita full: tokens=105, prefixes on which allowed() fired=0, OOV tokens=0

===== C. every firing in the training token stream (real windows, same as the test) =====
{"pos":6,"inSentence":0,"isStory":false,"text":"the claimant is the person who brings a claim.","next":" brings","banned":["answers","buys","owes","owns","rents","sells"],"supported":["brings"],"targetBanned":false,"targetSupported":true}
{"pos":16,"inSentence":1,"isStory":false,"text":"the defendant is the person who answers a claim.","next":" answers","banned":["brings","buys","owes","owns","rents","sells"],"supported":["answers"],"targetBanned":false,"targetSupported":true}
{"pos":43,"inSentence":4,"isStory":false,"text":"the landlord is the person who owns the home.","next":" owns","banned":["answers","brings","buys","owes","sells"],"supported":["owns"],"targetBanned":false,"targetSupported":true}
{"pos":53,"inSentence":5,"isStory":false,"text":"the tenant is the person who rents the home.","next":" rents","banned":["answers","brings","buys","owes","owns","sells"],"supported":["rents"],"targetBanned":false,"targetSupported":true}
{"pos":75,"inSentence":8,"isStory":false,"text":"the trader is a business that sells goods.","next":" sells","banned":["answers","brings","buys","owes","owns","rents"],"supported":["sells"],"targetBanned":false,"targetSupported":true}
{"pos":84,"inSentence":9,"isStory":false,"text":"the consumer is a person who buys goods.","next":" buys","banned":["answers","brings","owes","owns","rents","sells"],"supported":["buys"],"targetBanned":false,"targetSupported":true}
{"pos":117,"inSentence":14,"isStory":false,"text":"the creditor is the person who is owed money.","next":" is","banned":["answers","brings","buys","owes","owns","rents","sells"],"supported":[],"targetBanned":false,"targetSupported":false}
{"pos":118,"inSentence":14,"isStory":false,"text":"the creditor is the person who is owed money.","next":" owed","banned":[],"supported":["owed"],"targetBanned":false,"targetSupported":true}
{"pos":127,"inSentence":15,"isStory":false,"text":"the debtor is the person who owes money.","next":" owes","banned":["answers","brings","buys","owns","rents","sells"],"supported":["owes"],"targetBanned":false,"targetSupported":true}
firings=9 of 5390 positions; in stories=0; definitions=222; stories=34

===== D. CIVIL_LAW_CORPUS (unused by the transformer) =====
entries=118, firings=0, tokens=17398, OOV tokens=11592

===== E. explain() =====

-- defined_by(claimant,brings) has=true
defined_by(claimant,brings)  [kb]

-- not_defined_by(claimant,answers) has=true
not_defined_by(claimant,answers)  [R-COUNTER]
  counterpart(claimant,defendant)  [kb]
  defined_by(defendant,answers)  [kb]

-- not_defined_by(claimant,owns) has=true
not_defined_by(claimant,owns)  [R-OTHER-DOMAIN]
  is_a(claimant,court_party)  [kb]
  disjoint(court_party,housing_party)  [kb]
  class_verb(housing_party,owns)  [R-CLASS]
    is_a(landlord,housing_party)  [kb]
    defined_by(landlord,owns)  [kb]

-- not_defined_by(claimant,rents) has=true
not_defined_by(claimant,rents)  [R-OTHER-DOMAIN]
  is_a(claimant,court_party)  [kb]
  disjoint(court_party,housing_party)  [kb]
  class_verb(housing_party,rents)  [R-CLASS]
    is_a(tenant,housing_party)  [kb]
    defined_by(tenant,rents)  [kb]

-- not_defined_by(claimant,sells) has=true
not_defined_by(claimant,sells)  [R-OTHER-DOMAIN]
  is_a(claimant,court_party)  [kb]
  disjoint(court_party,trade_party)  [kb]
  class_verb(trade_party,sells)  [R-CLASS]
    is_a(trader,trade_party)  [kb]
    defined_by(trader,sells)  [kb]

-- not_defined_by(claimant,buys) has=true
not_defined_by(claimant,buys)  [R-OTHER-DOMAIN]
  is_a(claimant,court_party)  [kb]
  disjoint(court_party,trade_party)  [kb]
  class_verb(trade_party,buys)  [R-CLASS]
    is_a(consumer,trade_party)  [kb]
    defined_by(consumer,buys)  [kb]

-- not_defined_by(claimant,owes) has=true
not_defined_by(claimant,owes)  [R-OTHER-DOMAIN]
  is_a(claimant,court_party)  [kb]
  disjoint(court_party,debt_party)  [kb]
  class_verb(debt_party,owes)  [R-CLASS]
    is_a(debtor,debt_party)  [kb]
    defined_by(debtor,owes)  [kb]

-- not_defined_by(claimant,is_owed) has=true
not_defined_by(claimant,is_owed)  [R-OTHER-DOMAIN]
  is_a(claimant,court_party)  [kb]
  disjoint(court_party,debt_party)  [kb]
  class_verb(debt_party,is_owed)  [R-CLASS]
    is_a(creditor,debt_party)  [kb]
    defined_by(creditor,is_owed)  [kb]

-- defined_by(defendant,answers) has=true
defined_by(defendant,answers)  [kb]

-- not_defined_by(defendant,brings) has=true
not_defined_by(defendant,brings)  [R-COUNTER]
  counterpart(defendant,claimant)  [R-SYM-COUNTERPART]
    counterpart(claimant,defendant)  [kb]
  defined_by(claimant,brings)  [kb]

-- not_defined_by(tenant,owns) has=true
not_defined_by(tenant,owns)  [R-COUNTER]
  counterpart(tenant,landlord)  [R-SYM-COUNTERPART]
    counterpart(landlord,tenant)  [kb]
  defined_by(landlord,owns)  [kb]

-- not_defined_by(landlord,rents) has=true
not_defined_by(landlord,rents)  [R-COUNTER]
  counterpart(landlord,tenant)  [kb]
  defined_by(tenant,rents)  [kb]

-- not_defined_by(trader,buys) has=true
not_defined_by(trader,buys)  [R-COUNTER]
  counterpart(trader,consumer)  [kb]
  defined_by(consumer,buys)  [kb]

-- not_defined_by(consumer,sells) has=true
not_defined_by(consumer,sells)  [R-COUNTER]
  counterpart(consumer,trader)  [R-SYM-COUNTERPART]
    counterpart(trader,consumer)  [kb]
  defined_by(trader,sells)  [kb]

-- not_defined_by(debtor,is_owed) has=true
not_defined_by(debtor,is_owed)  [R-COUNTER]
  counterpart(debtor,creditor)  [R-SYM-COUNTERPART]
    counterpart(creditor,debtor)  [kb]
  defined_by(creditor,is_owed)  [kb]

-- not_defined_by(creditor,owes) has=true
not_defined_by(creditor,owes)  [R-COUNTER]
  counterpart(creditor,debtor)  [kb]
  defined_by(debtor,owes)  [kb]

-- defined_by(creditor,is_owed) has=true
defined_by(creditor,is_owed)  [kb]

-- class_verb(court_party,brings) has=true
class_verb(court_party,brings)  [R-CLASS]
  is_a(claimant,court_party)  [kb]
  defined_by(claimant,brings)  [kb]

-- counterpart(defendant,claimant) has=true
counterpart(defendant,claimant)  [R-SYM-COUNTERPART]
  counterpart(claimant,defendant)  [kb]

===== F. facts about claimant, and rule use =====
defined_by ["brings"]
is_a ["court_party"]
counterpart ["defendant"]
not_defined_by ["answers","owns","rents","sells","buys","is_owed","owes"]
disjoint(court_party,*) ["housing_party","trade_party","debt_party"]
class_verb(court_party,*) ["brings","answers"]
class_verb(housing_party,*) ["owns","rents"]
facts by source {"kb":26,"R-SYM-COUNTERPART":4,"R-SYM-DISJOINT":6,"R-CLASS":8,"R-COUNTER":8,"R-OTHER-DOMAIN":48}
triggers ["T-F0-BAN","T-F0-SUP","T-F0-IS-BAN","T-F0-IS-SUP","T-F1-BAN","T-F1-SUP","T-F1-IS-BAN","T-F1-IS-SUP","T-F2-BAN","T-F2-SUP","T-F2-IS-BAN","T-F2-IS-SUP"]
word counts in TRAIN_TEXTS of callout words: [["claimant",[204]],["brings",[569]],["owns",[365]],["answers",[570]],["owed",[109]],["owes",[137]],["claim",[15]]]
```

#### Raw output: weights_probe.out

```text
file keys [ "type", "config", "vocab", "merges", "history", "weights" ] weights keys [ "tokEmb",
  "posEmb", "blocks", "lnFGamma", "lnFBeta", "headW", "headB"
]
history length 210 last {"epoch":2000,"loss":0.248975}
meta type "decoder-transformer"
meta config {"vocabSize":937,"contextLen":32,"embDim":32,"numHeads":2,"ffDim":128,"numLayers":2}
meta vocab [" the","."," a"," to"," is",","," and"," of"," for"," in"," court"," that"," not"," it"," was"," claim"," can"," goods"," be"," or"," an"," on"," if"," pounds"," must"," he"," so"," money"," thousand
meta merges [{"pair":[" ","t"],"merged":" t"},{"pair":[" ","a"],"merged":" a"},{"pair":["h","e"],"merged":"he"},{"pair":[" t","he"],"merged":" the"},{"pair":["r","e"],"merged":"re"},{"pair":[" ","c"],"merged":" c
size checks: tokEmb 29984 = 29984 | posEmb 1024 = 1024 | blocks 2 | headB 937 = V 937
vocab equal to rebuilt: true

===== frames alone =====

### the claimant is the person who
context (6 tokens): " the claimant is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " brings" 0.6137, " owns" 0.1246, " answers" 0.0888, " owes" 0.0506, " rents" 0.0461, " buys" 0.0150, " said" 0.0118, " has" 0.0108, " asks" 0.0091, " is" 0.0061
supported: brings p=0.6137 rank=1 id=569
banned: owns p=0.12462 rank=2 id=365; answers p=0.08881 rank=3 id=570; owes p=0.05062 rank=4 id=137; rents p=0.04611 rank=5 id=571; buys p=0.01504 rank=6 id=367; sells p=0.00000 rank=199 id=572
banned mass=0.3252  supported mass=0.6137  other mass=0.0611
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): brings p=0.9094 | top 5: " brings" 0.9094, " said" 0.0174, " has" 0.0160, " asks" 0.0134, " is" 0.0091

### the defendant is the person who
context (6 tokens): " the defendant is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " answers" 0.8556, " brings" 0.0695, " rents" 0.0342, " owns" 0.0130, " refused" 0.0086, " ordered" 0.0038, " said" 0.0030, " owes" 0.0029, " asks" 0.0026, " buys" 0.0015
supported: answers p=0.8556 rank=1 id=570
banned: brings p=0.06947 rank=2 id=569; rents p=0.03420 rank=3 id=571; owns p=0.01301 rank=4 id=365; owes p=0.00293 rank=8 id=137; buys p=0.00151 rank=10 id=367; sells p=0.00000 rank=96 id=572
banned mass=0.1211  supported mass=0.8556  other mass=0.0233
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): answers p=0.9735 | top 5: " answers" 0.9735, " refused" 0.0098, " ordered" 0.0043, " said" 0.0035, " asks" 0.0029

### the landlord is the person who
context (6 tokens): " the landlord is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " owns" 0.9735, " brings" 0.0079, " buys" 0.0057, " rents" 0.0025, " has" 0.0017, " could" 0.0015, " owes" 0.0014, " died" 0.0010, " returns" 0.0009, " trial" 0.0006
supported: owns p=0.9735 rank=1 id=365
banned: brings p=0.00786 rank=2 id=569; buys p=0.00568 rank=3 id=367; owes p=0.00138 rank=7 id=137; answers p=0.00055 rank=11 id=570; sells p=0.00000 rank=419 id=572
banned mass=0.0155  supported mass=0.9735  other mass=0.0110
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): owns p=0.9888 | top 5: " owns" 0.9888, " rents" 0.0025, " has" 0.0017, " could" 0.0015, " died" 0.0010

### the tenant is the person who
context (6 tokens): " the tenant is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " rents" 0.8676, " brings" 0.0708, " answers" 0.0230, " owns" 0.0146, " buys" 0.0077, " sold" 0.0045, " is" 0.0040, " played" 0.0023, " was" 0.0010, " owes" 0.0007
supported: rents p=0.8676 rank=1 id=571
banned: brings p=0.07078 rank=2 id=569; answers p=0.02301 rank=3 id=570; owns p=0.01458 rank=4 id=365; buys p=0.00766 rank=5 id=367; owes p=0.00074 rank=10 id=137; sells p=0.00000 rank=108 id=572
banned mass=0.1168  supported mass=0.8676  other mass=0.0157
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): rents p=0.9823 | top 5: " rents" 0.9823, " sold" 0.0051, " is" 0.0045, " played" 0.0026, " was" 0.0012

### the trader is a business that
context (6 tokens): " the trader is a business that"  sum(p)=1.00000
top 10 mask off, T=1: " sells" 0.9754, " is" 0.0078, " rule" 0.0051, " means" 0.0045, " on" 0.0020, " claims" 0.0006, " purpose" 0.0005, " within" 0.0005, " harm" 0.0004, " stops" 0.0004
supported: sells p=0.9754 rank=1 id=572
banned: answers p=0.00000 rank=115 id=570; brings p=0.00000 rank=134 id=569; rents p=0.00000 rank=136 id=571; owns p=0.00000 rank=399 id=365; buys p=0.00000 rank=484 id=367; owes p=0.00000 rank=722 id=137
banned mass=0.0000  supported mass=0.9754  other mass=0.0246
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): sells p=0.9754 | top 5: " sells" 0.9754, " is" 0.0078, " rule" 0.0051, " means" 0.0045, " on" 0.0020

### the consumer is a person who
context (6 tokens): " the consumer is a person who"  sum(p)=1.00000
top 10 mask off, T=1: " buys" 0.9312, " brings" 0.0417, " rents" 0.0061, " is" 0.0046, " asks" 0.0037, " owes" 0.0031, " owns" 0.0022, " said" 0.0017, " answers" 0.0011, " put" 0.0008
supported: buys p=0.9312 rank=1 id=367
banned: brings p=0.04170 rank=2 id=569; rents p=0.00605 rank=3 id=571; owes p=0.00305 rank=6 id=137; owns p=0.00222 rank=7 id=365; answers p=0.00112 rank=9 id=570; sells p=0.00000 rank=401 id=572
banned mass=0.0541  supported mass=0.9312  other mass=0.0147
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): buys p=0.9845 | top 5: " buys" 0.9845, " is" 0.0049, " asks" 0.0039, " said" 0.0018, " put" 0.0009

### the creditor is the person who
context (6 tokens): " the creditor is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " is" 0.9617, " brings" 0.0098, " answers" 0.0088, " judge" 0.0046, " rents" 0.0037, " fee" 0.0022, " was" 0.0019, " sold" 0.0015, " claim" 0.0014, " claimant" 0.0011
supported: (none)
banned: brings p=0.00982 rank=2 id=569; answers p=0.00880 rank=3 id=570; rents p=0.00368 rank=5 id=571; owes p=0.00066 rank=12 id=137; buys p=0.00001 rank=37 id=367; owns p=0.00000 rank=48 id=365; sells p=0.00000 rank=59 id=572
banned mass=0.0230  supported mass=0.0000  other mass=0.9770
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty):  | top 5: " is" 0.9843, " judge" 0.0047, " fee" 0.0023, " was" 0.0020, " sold" 0.0016

### the creditor is the person who is
context (7 tokens): " the creditor is the person who is"  sum(p)=1.00000
top 10 mask off, T=1: " owed" 0.9920, " liable" 0.0047, " sent" 0.0023, " mydeposits" 0.0002, " he" 0.0002, " too" 0.0001, " taken" 0.0001, " an" 0.0000, " test" 0.0000, " allowed" 0.0000
supported: owed p=0.9920 rank=1 id=109
banned: (none)
banned mass=0.0000  supported mass=0.9920  other mass=0.0080

### the debtor is the person who
context (6 tokens): " the debtor is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " owes" 0.8650, " buys" 0.0830, " brings" 0.0219, " said" 0.0170, " owns" 0.0038, " died" 0.0024, " rents" 0.0015, " answers" 0.0009, " put" 0.0005, " has" 0.0004
supported: owes p=0.8650 rank=1 id=137
banned: buys p=0.08299 rank=2 id=367; brings p=0.02188 rank=3 id=569; owns p=0.00383 rank=5 id=365; rents p=0.00155 rank=7 id=571; answers p=0.00093 rank=8 id=570; sells p=0.00000 rank=480 id=572
banned mass=0.1112  supported mass=0.8650  other mass=0.0238
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): owes p=0.9732 | top 5: " owes" 0.9732, " said" 0.0192, " died" 0.0027, " put" 0.0006, " has" 0.0005

### the debtor is the person who is
context (7 tokens): " the debtor is the person who is"  sum(p)=1.00000
top 10 mask off, T=1: " liable" 0.5892, " owed" 0.2563, " foreseeable" 0.0941, " taken" 0.0134, " out" 0.0122, " too" 0.0065, " donoghue" 0.0045, " fair" 0.0035, " test" 0.0035, " harm" 0.0033
supported: (none)
banned: owed p=0.25633 rank=2 id=109
banned mass=0.2563  supported mass=0.0000  other mass=0.7437
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty):  | top 5: " liable" 0.7923, " foreseeable" 0.1266, " taken" 0.0180, " out" 0.0164, " too" 0.0087

===== sensitivity to preceding context (claimant frame, 16-token window as in training and in generateText with seqLen 16) =====

### eve L295 first sentence + frame, window 16
context (16 tokens): " business and made a claim in the county court. the claimant is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " brings" 0.3877, " buys" 0.1697, " has" 0.1277, " answers" 0.0851, " owns" 0.0727, " owes" 0.0442, " rents" 0.0382, " is" 0.0280, " through" 0.0199, " still" 0.0075
supported: brings p=0.3877 rank=1 id=569
banned: buys p=0.16969 rank=2 id=367; answers p=0.08509 rank=4 id=570; owns p=0.07273 rank=5 id=365; owes p=0.04422 rank=6 id=137; rents p=0.03817 rank=7 id=571; sells p=0.00000 rank=354 id=572
banned mass=0.4099  supported mass=0.3877  other mass=0.2024
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): brings p=0.6569 | top 5: " brings" 0.6569, " has" 0.2164, " is" 0.0475, " through" 0.0336, " still" 0.0126

### gita L297 first sentence + frame, window 16
context (16 tokens): " a claim against a man who owed her rent. the claimant is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " is" 0.4449, " rents" 0.1841, " brings" 0.1808, " buys" 0.0854, " answers" 0.0531, " still" 0.0146, " has" 0.0143, " through" 0.0076, " appointment" 0.0025, " owns" 0.0022
supported: brings p=0.1808 rank=3 id=569
banned: rents p=0.18408 rank=2 id=571; buys p=0.08542 rank=4 id=367; answers p=0.05306 rank=5 id=570; owns p=0.00216 rank=10 id=365; owes p=0.00147 rank=12 id=137; sells p=0.00000 rank=245 id=572
banned mass=0.3262  supported mass=0.1808  other mass=0.4930
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): brings p=0.2683 | top 5: " is" 0.6603, " brings" 0.2683, " still" 0.0217, " has" 0.0212, " through" 0.0113

### eve L295 first sentence + frame, window 32
context (22 tokens): " eve was owed money by a business and made a claim in the county court. the claimant is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " no" 0.2662, " first" 0.2573, " for" 0.2024, " a" 0.1293, " repair" 0.0308, " trader" 0.0260, " money" 0.0247, "." 0.0106, " too" 0.0094, " risk" 0.0050
supported: brings p=0.0000 rank=194 id=569
banned: buys p=0.00000 rank=158 id=367; answers p=0.00000 rank=514 id=570; sells p=0.00000 rank=551 id=572; rents p=0.00000 rank=585 id=571; owes p=0.00000 rank=649 id=137; owns p=0.00000 rank=868 id=365
banned mass=0.0000  supported mass=0.0000  other mass=1.0000
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): brings p=0.0000 | top 5: " no" 0.2662, " first" 0.2573, " for" 0.2024, " a" 0.1293, " repair" 0.0308

### eve L295 first sentence + creditor frame +is, window 16
context (16 tokens): " and made a claim in the county court. the creditor is the person who is"  sum(p)=1.00000
top 10 mask off, T=1: " owed" 0.9846, " was" 0.0048, " are" 0.0025, " sent" 0.0017, " liable" 0.0016, " harm" 0.0007, " foreseeable" 0.0006, " he" 0.0005, " too" 0.0005, " water" 0.0004
supported: owed p=0.9846 rank=1 id=109
banned: (none)
banned mass=0.0000  supported mass=0.9846  other mass=0.0154

### real training window ending at L24 frame (stream pos 16)
context (16 tokens): " the claimant is the person who brings a claim. the defendant is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " answers" 0.9682, " brings" 0.0104, " is" 0.0102, " rents" 0.0076, " refused" 0.0011, " owns" 0.0009, " wins" 0.0003, " played" 0.0002, " owes" 0.0001, " buys" 0.0001
supported: answers p=0.9682 rank=1 id=570
banned: brings p=0.01042 rank=2 id=569; rents p=0.00757 rank=4 id=571; owns p=0.00093 rank=6 id=365; owes p=0.00012 rank=9 id=137; buys p=0.00012 rank=10 id=367; sells p=0.00000 rank=109 id=572
banned mass=0.0192  supported mass=0.9682  other mass=0.0126
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): answers p=0.9871 | top 5: " answers" 0.9871, " is" 0.0104, " refused" 0.0011, " wins" 0.0003, " played" 0.0002

### real training window ending at L27 frame (stream pos 43)
context (16 tokens): ". the defendant may pay or defend the claim. the landlord is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " owns" 0.9435, " answers" 0.0153, " rents" 0.0116, " owes" 0.0113, " brings" 0.0085, " buys" 0.0069, " has" 0.0008, " appointment" 0.0005, " trial" 0.0003, " through" 0.0003
supported: owns p=0.9435 rank=1 id=365
banned: answers p=0.01535 rank=2 id=570; owes p=0.01130 rank=4 id=137; brings p=0.00847 rank=5 id=569; buys p=0.00686 rank=6 id=367; sells p=0.00000 rank=447 id=572
banned mass=0.0420  supported mass=0.9435  other mass=0.0145
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): owns p=0.9849 | top 5: " owns" 0.9849, " rents" 0.0121, " has" 0.0008, " appointment" 0.0006, " trial" 0.0003

### real training window ending at L28 frame (stream pos 53)
context (16 tokens): " the landlord is the person who owns the home. the tenant is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " rents" 0.9396, " answers" 0.0355, " buys" 0.0085, " brings" 0.0075, " owes" 0.0048, " is" 0.0011, " owns" 0.0008, " played" 0.0006, " usually" 0.0004, " sold" 0.0002
supported: rents p=0.9396 rank=1 id=571
banned: answers p=0.03546 rank=2 id=570; buys p=0.00852 rank=3 id=367; brings p=0.00753 rank=4 id=569; owes p=0.00482 rank=5 id=137; owns p=0.00083 rank=7 id=365; sells p=0.00000 rank=241 id=572
banned mass=0.0572  supported mass=0.9396  other mass=0.0033
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): rents p=0.9966 | top 5: " rents" 0.9966, " is" 0.0012, " played" 0.0006, " usually" 0.0004, " sold" 0.0003

### real training window ending at L38 frame (stream pos 127)
context (16 tokens): " the creditor is the person who is owed money. the debtor is the person who"  sum(p)=1.00000
top 10 mask off, T=1: " owes" 0.9677, " buys" 0.0230, " brings" 0.0038, " answers" 0.0008, " contact" 0.0006, " said" 0.0004, " died" 0.0004, " rents" 0.0003, " put" 0.0003, " letter" 0.0003
supported: owes p=0.9677 rank=1 id=137
banned: buys p=0.02302 rank=2 id=367; brings p=0.00384 rank=3 id=569; answers p=0.00084 rank=4 id=570; rents p=0.00032 rank=8 id=571; owns p=0.00026 rank=14 id=365; sells p=0.00000 rank=474 id=572
banned mass=0.0283  supported mass=0.9677  other mass=0.0040
after removing banned and renormalising (probe arithmetic, repo has no mask code: constraints.ts is empty): owes p=0.9959 | top 5: " owes" 0.9959, " contact" 0.0006, " said" 0.0004, " died" 0.0004, " put" 0.0003

===== generateText (repo code, unmasked), one sampled next token, frame = claimant, T=1 =====
top-p 0.6: 2000 seeds -> " brings" 2000
top-p 0.9: 2000 seeds -> " brings" 1352, " owns" 257, " answers" 184, " owes" 117, " rents" 90
top-p 1: 2000 seeds -> " brings" 1242, " owns" 265, " answers" 151, " owes" 101, " rents" 93, " buys" 32, " said" 28, " has" 22, " asks" 18, " is" 11, " put" 7, " sold" 6, " played" 4, " could" 3, " still" 3, " ordered" 2, " back" 2, " did" 2, " sends" 1, " wrote" 1, " wins" 1, " offered" 1, " provides" 1, " appointment" 1, " would" 1, " refused" 1

===== generateText continuations, seed 42 and first seeds that sample ' owns' / ' answers' at the frame (T=1, top-p 1.0) =====
seed 42: " the claimant is the person who brings a claim. the defendant is the person who answers a" reproducible: true
 brings -> seed 6: " the claimant is the person who brings a claim. the defendant is the"
 owns -> seed 1: " the claimant is the person who owns the home. the tenant is the"
 answers -> seed 20: " the claimant is the person who answers a claim. the claimant asks the"
 rents -> seed 4: " the claimant is the person who rents the home. the landlord gets the"
 sells -> (not sampled in 2000 seeds)
 buys -> seed 89: " the claimant is the person who buys goods. the seller supplies the goods"
 owes -> seed 30: " the claimant is the person who owes money. the judge decides the case"
```

#### Raw output: extra_checks.out

```text
claimant+is: {"fired":["T-F0-IS-BAN: not_defined_by(claimant,is_owed) ← R-OTHER-DOMAIN"],"banned":[" owed"],"supported":[],"unenforceable":[]}
T-F0-BAN ["?x","is","the","person","who"] fired: 6 banned: 6 supported: 0
T-F0-SUP ["?x","is","the","person","who"] fired: 1 banned: 0 supported: 1
T-F0-IS-BAN ["?x","is","the","person","who","is"] fired: 0 banned: 0 supported: 0
T-F0-IS-SUP ["?x","is","the","person","who","is"] fired: 0 banned: 0 supported: 0
T-F1-BAN ["?x","is","a","person","who"] fired: 0 banned: 0 supported: 0
T-F1-SUP ["?x","is","a","person","who"] fired: 0 banned: 0 supported: 0
T-F1-IS-BAN ["?x","is","a","person","who","is"] fired: 0 banned: 0 supported: 0
T-F1-IS-SUP ["?x","is","a","person","who","is"] fired: 0 banned: 0 supported: 0
T-F2-BAN ["?x","is","a","business","that"] fired: 0 banned: 0 supported: 0
T-F2-SUP ["?x","is","a","business","that"] fired: 0 banned: 0 supported: 0
T-F2-IS-BAN ["?x","is","a","business","that","is"] fired: 0 banned: 0 supported: 0
T-F2-IS-SUP ["?x","is","a","business","that","is"] fired: 0 banned: 0 supported: 0
brings id 569 SUPPORTED
owns id 365 BANNED
answers id 570 BANNED
rents id 571 BANNED
sells id 572 BANNED
buys id 367 BANNED
owes id 137 BANNED
owed id 109 unconstrained
said id 50 unconstrained
has id 102 unconstrained
is id 4 unconstrained
brings 6.1369e-1
owns 1.2462e-1
answers 8.8815e-2
owes 5.0622e-2
rents 4.6109e-2
buys 1.5044e-2
sells 1.9504e-7
banned mass 0.325210 brings/(1-mass) 0.909447 repeat determinism: true
CIVIL_LAW_CORPUS frame regex hits: 0 of 118 | TREE entries TREE K-FORMATION; TREE K-BREACH; TREE K-REMEDY; TREE N-NEGLIGENCE; TREE CRA-GOODS; TREE CRA-SERVICES; TREE P-LIMITATION; TREE P-TRACK (as of 31 October 2026); TREE P-ADR; TREE DEP; TREE NUIS | FP entries 44
```

#### Raw output: repo_test.out

```text
bun test v1.3.13 (bf2e2cec)

 8 pass
 0 fail
 25 expect() calls
Ran 8 tests across 1 file. [1143.00ms]
```

#### Script source: window_counts.ts

```ts
// READ-ONLY PROBE. How many training windows contain each frame, and is the frame-alone row the same as the row in a longer window?
import { readFileSync } from "node:fs";
import { buildVocabulary, TRAIN_TEXTS } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-transformer/train.ts";
import { forward, type TransformerConfig } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-transformer/transformer.ts";
const v = buildVocabulary(); const I = v.indexToWord;
const ids = (t: string) => v.tokenize(t).map((x) => v.wordToIndex.get(x)!);
const stream = TRAIN_TEXTS.flatMap((s) => ids(s)); const L = 16;
const nSeq = stream.length - L; // sequences i = 0 .. stream.length - L - 1, input = stream[i, i+L)
console.log("stream", stream.length, "sequences", nSeq);
for (const t of ["the claimant is the person who", "the defendant is the person who", "the landlord is the person who", "the tenant is the person who", "the trader is a business that", "the consumer is a person who", "the creditor is the person who", "the debtor is the person who"]) {
  const f = ids(t); let occ = 0, windows = 0, offset0 = 0;
  for (let s = 0; s + f.length <= stream.length; s++) {
    if (!f.every((x, k) => stream[s + k] === x)) continue;
    occ++;
    for (let i = Math.max(0, s + f.length - L); i <= s && i < nSeq; i++) { windows++; if (i === s) offset0++; }
  }
  console.log(JSON.stringify(t), "occurrences", occ, "windows holding whole frame as input", windows, "of which frame starts at position 0", offset0);
}
const sw = JSON.parse(readFileSync("/Users/nedpham/Projects/neural_symbolic_nlp/.data/transformer-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-v4.json", "utf-8")).weights;
const w: any = { tokEmb: new Float32Array(sw.tokEmb), posEmb: new Float32Array(sw.posEmb), blocks: sw.blocks.map((b: any) => Object.fromEntries(Object.entries(b).map(([k, x]) => [k, new Float32Array(x as number[])]))), lnFGamma: new Float32Array(sw.lnFGamma), lnFBeta: new Float32Array(sw.lnFBeta), headW: new Float32Array(sw.headW), headB: new Float32Array(sw.headB) };
const cfg: TransformerConfig = { vocabSize: I.length, contextLen: 32, embDim: 32, numHeads: 2, ffDim: 128, numLayers: 2 };
const V = cfg.vocabSize; const owns = v.wordToIndex.get(" owns")!, brings = v.wordToIndex.get(" brings")!;
const shortC = forward(stream.slice(0, 6), w, cfg).probs; const longC = forward(stream.slice(0, 16), w, cfg).probs;
console.log("causal check, position 5, first 6 tokens vs first 16 tokens: owns", shortC[5 * V + owns], longC[5 * V + owns], "brings", shortC[5 * V + brings], longC[5 * V + brings]);
```

#### Raw output: window_counts.out

```text
stream 5390 sequences 5374
"the claimant is the person who" occurrences 1 windows holding whole frame as input 1 of which frame starts at position 0 1
"the defendant is the person who" occurrences 1 windows holding whole frame as input 11 of which frame starts at position 0 1
"the landlord is the person who" occurrences 1 windows holding whole frame as input 11 of which frame starts at position 0 1
"the tenant is the person who" occurrences 1 windows holding whole frame as input 11 of which frame starts at position 0 1
"the trader is a business that" occurrences 1 windows holding whole frame as input 11 of which frame starts at position 0 1
"the consumer is a person who" occurrences 1 windows holding whole frame as input 11 of which frame starts at position 0 1
"the creditor is the person who" occurrences 1 windows holding whole frame as input 11 of which frame starts at position 0 1
"the debtor is the person who" occurrences 1 windows holding whole frame as input 11 of which frame starts at position 0 1
causal check, position 5, first 6 tokens vs first 16 tokens: owns 0.12462005764245987 0.12462005764245987 brings 0.6136857867240906 0.6136857867240906
```
