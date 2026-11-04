# How candidate knowledge bases fit the civil-law corpus and tokenizer

All numbers below are read-only probes on text and tokenizer, run on 2026-11-03. They are not recorded experiments. No model was trained and no weights were used except to compare one vocabulary list. Probe IDs (p1 to p6) point to the last section of this file, which holds each script's path, command, source and raw output.

Terms used throughout:
- **Transformer stream:** `TRAIN_TEXTS` tokenized by `buildVocabulary()`, in the order `trainTransformer` uses. This is the text a next-token mask would act on.
- **LAW stream:** `LAW_DATASET` (`CORPUS`) tokenized by `tokenize()`. It trains Skip-gram only.
- **Position:** a target token `p` whose preceding words match a trigger.
- **False ban:** the gold token at a fired position is banned.

**The brief needs one correction.** `LAW_DATASET` is what [src/routes/train-embed/train.ts](../../src/routes/train-embed/train.ts) uses, and that file is Skip-gram, which has no next-token distribution to mask. The transformer uses `TRAIN_TEXTS` and its own tokenizer in [src/routes/train-transformer/train.ts L46-49 and L220-251](../../src/routes/train-transformer/train.ts). The primary numbers below are therefore on the transformer stream, with the LAW stream alongside. [corpus.ts L432](../../src/routes/train-embed/corpus.ts#L432) says the same.

| Stream | Text | Tokens | Vocabulary | BPE merges | Punctuation kept |
|---|---|---|---|---|---|
| Transformer | 222 definitions + 34 stories = 256 items | 5,390 | 937 | 1,781 | `.` `,` `'` (503 tokens) |
| LAW | 401 cleaned sentences | 4,887 | 924 | 1,625 | none |

## 1. Does the old chapter 07 KB fire on the current text?

### Takeaway
No. It fires 0 times, on both streams, and chapter 07's own `allowed()` engine confirms it on the transformer stream.

### Cited Findings
- All 10 entities (eagle, bird, fish, girl, boy, king, queen, human, bear, wolf) and all 8 surface forms (fly, flies, flew, flying, swim, swims, swam, swimming) occur 0 times as whole words in both streams. The objects `animal` and `forest` also occur 0 times — [p1](#p1).
- Substrings exist but do not match: `king` 9 and `fish` 1. A word-level trigger cannot fire on them — [p1](#p1).
- Running chapter 07's §2 code unmodified (extracted from the file; 19 closed facts) gave 0 of 5,390 positions and 0 of 85,984 window positions — [p2](#p2).

### Inferences
- Mismatch 1 in [chapter 07](../../docs/progress/07-neurosymbolic-code-2b.md) is correct on the "0 fires" part. Its denominator is out of date (see question 2).

### Gaps
- None.

## 2. What do 6,447 and 5,390 count, and which is current?

### Takeaway
Both count tokens in the same 256-item text, under different tokenizers. 5,390 is current. 6,447 belongs to the old word-piece tokenizer (807 tokens, 1,000 merges), which commit 4ae5927 replaced. The current vocabulary is 937, as the report claimed.

### Cited Findings
- Current: 5,390 tokens, vocabulary 937, 1,781 merges, 5,374 windows, 85,984 window positions. The tokens are 4,887 words plus 503 punctuation marks (401 `.`, 96 `,`, 6 `'`) — [p1](#p1), [p5](#p5).
- Only 3 tokens lack a leading space (`.`, `,`, `'`), which matches the report — [p1](#p1).
- The saved weights in `transformer-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-v4.json` hold the same 937 tokens in the same order, with `vocabSize` 937 — [p1](#p1).
- Applying the old regex `/\s\w+|[^\w\s]/g` with 1,000 merges to today's `TRAIN_TEXTS` gives exactly 6,447 tokens, vocabulary 807, 6,431 windows and 102,896 window positions — [p1](#p1). These equal the figures in [repo_design_fit.md L9, L127](../Semantic%20loss%20with%20hard%20logit%20constraints/repo_design_fit.md).
- The old regex and 1,000 merges are in [`4ae5927^:src/routes/train-transformer/train.ts`](../../src/routes/train-transformer/train.ts), then with `STORIES` as its text. Commit 4ae5927 (2026-11-02) added `TRAIN_TEXTS` and `buildVocabulary(2000)`. HEAD on 2026-11-01 was c42da07, so the 2026-11-01 probe appears to have run the old tokenizer settings on uncommitted text; the reflog shows no commit between them. `STORIES` alone gives 3,966 tokens and vocabulary 782, so it is not the source of 6,447 — [p1](#p1).
- sha256 of `TRAIN_TEXTS.join("\n")` starts `bf9d5315` — [p1](#p1). This matches the hash in the v4 weights filename and the "corpus hash" in repo_design_fit.md L9, which is why the text is known to be the same.
- The stale figures remain in [chapter 07 L9](../../docs/progress/07-neurosymbolic-code-2b.md), [docs/progress/README.md L173](../../docs/progress/README.md) and [chapter 05 L55, L133](../../docs/progress/05-implementation-and-evaluation.md), plus 6,431 in [chapter 03 L49](../../docs/progress/03-reasoning-gap.md). Line 97 of docs/progress/README.md still says 807. The current [README L194-196](../../README.md) says 937 and 5,374. [README L238-241](../../README.md) also lists 807 and 6,431, but it sits under "Superseded baseline", so it is correctly labelled.

### Inferences
- The chapter 07 mismatch 5 claim (`creditor`, `buyer`, `seller` split; "450 single-token words") belongs to the same old tokenizer. All of them are single tokens now (question 3).
- The "132 of 6,447 (2.05%)" ceiling has no direct current equivalent as a percentage. On today's stream 13 role words I could name total 121: court 49, landlord 22, trader 11, consumer 10, tenant 7, defendant 5, claimant 4, debtor 4, customer 4, supplier 2, and creditor, buyer and seller 1 each. These match the counts that note did name — [p1](#p1).
- If its total of 132 still holds, the percentage is now 132 of 5,390 (2.45%), an increase caused only by the smaller denominator.

### Gaps
- The 14th role word in the old count is not named in the notes. It would need 11 occurrences, and `judge` and `neighbour` both have 11, so I cannot say which — [p2b output in p2](#p2).
- I did not reproduce the earlier note's "4,899 word occurrences". Joining the old pieces and splitting on whitespace gives 4,887 — [p1](#p1).

## 3. Does the frame-scoped KB reproduce?

### Takeaway
Yes, every figure I re-ran reproduces exactly: 8 of 5,390 positions, 86 of 85,984 window positions, 0 conflicts, and all 8 roles and verbs as single tokens.

### Cited Findings
- KB rebuilt from the report's table: 26 base facts and 5 rules close to 100 facts, with 56 `not_defined_by` facts, exactly 7 per role, and 0 `defined_by` versus `not_defined_by` contradictions — [p2](#p2); same figures in [the earlier report](../../reports/Civil%20law%20KB%20M1%20M5%20plan.md) and [repo_probes_2026-11-03.md](../Civil%20law%20KB%20M1%20M5%20plan/repo_probes_2026-11-03.md).
- Token stream: fires at 8 of 5,390 (0.148%), 0 conflicts, target in the supported set at all 8, `unenforceable` empty — [p2](#p2).
- Windows: 86 of 85,984 (0.100%), 0 conflicts — [p2](#p2).
- The 8 positions are [L23, L24, L27, L28, L31, L32, L37, L38](../../src/routes/train-embed/corpus.ts#L23). All are definition lines; no story line matches — [p2](#p2).
- The window count is 86 and not 8 × 12 = 96 because these lines sit at stream indices 6 to 127, so early positions have fewer covering windows. Brute force over windows and my formula `windowsFor` both give 86 — [p2](#p2), [p4](#p4).
- All 8 roles and the verbs brings, answers, owns, rents, sells, buys, is, owes and owed are single tokens in both tokenizers — [p2](#p2).

### Inferences
- The chapter 07 engine needed no change: `is_owed` was added to the exported `SURFACE` map at run time, and the `lives_in` branch never runs for these relations. The earlier note says the branch was removed; that makes no difference to these numbers.
- Strictly, position 0 has no target, so 5,389 positions are available. The report's denominator of 5,390 is the token count. The difference is immaterial.

### Gaps
- The earlier notes describe the triggers in prose, not as code. I implemented them as one ban and one support pattern for each of `?x is the person who`, `?x is a person who` and `?x is a business that`.
- The mass, sample and mask round-trip figures in repo_probes were not re-run; they need weights and fall outside this brief.

## 4. How much of the CIVIL_LAW_CORPUS concept and tree vocabulary can the model represent?

### Takeaway
About 41% of word types and 73.5% of word tokens are single tokens, and the rest is effectively unrepresentable. Splitting does not help: 0 types under the transformer tokenizer, and 7 accidental ones under LAW. Digits are absent entirely, and most of the contract-breach and private-nuisance vocabulary is missing.

### Cited Findings
Measurement choices: lower-cased; `[...]` tags and entry-ID prefixes removed; words matched by `/\w+(?:'\w+)*/`; pre-tokens containing a digit counted separately. There are 63 concept entries, 11 trees and 44 fact patterns — [p3](#p3).

| Subset | Alpha tokens / types | Single token (types, tokens) | Split, all pieces in vocabulary: LAW / transformer (types) | Not representable (types, tokens): LAW / transformer |
|---|---|---|---|---|
| Concepts + trees (main) | 3,650 / 967 | 395 (40.8%), 2,681 (73.5%) | 7 / 0 | 565 (58.4%), 960 (26.3%) / 572 (59.2%), 969 (26.5%) |
| Concepts only | 2,359 / 792 | 352 (44.4%), 1,736 (73.6%) | 6 / 0 | 434, 616 / 440, 623 |
| Trees only | 1,291 / 467 | 232 (49.7%), 945 (73.2%) | 2 / 0 | 233, 344 / 235, 346 |
| FP-01 to FP-44 | 2,691 / 885 | LAW 424, 1,773 (65.9%); transformer 426, 1,776 (66.0%) | 7 / 0 | 454, 867 / 459, 915 |
| Concepts + trees, tags and IDs kept | 4,244 / 1,106 | 414 (37.4%), 2,871 (67.6%) | 10 / 0 | 682, 1,360 / 692, 1,373 |

- The single-token sets for concepts + trees are identical in both tokenizers (395 types) — [p3](#p3).
- The 7 LAW "split" types are coincidental fragments, not morphology: offeror=offer+or, soon=so+on, undertaken=under+taken, seatbelt=seat+belt, ownership=owner+ship, issued=is+sued, issue=is+sue — [p3](#p3).
- Spelling by string concatenation of vocabulary tokens adds nothing under the transformer tokenizer (0 of 572). Only `.`, `,` and `'` can follow a leading-space token, so a word cannot continue across tokens. LAW allows 12 of 572 — [p3](#p3).
- All 295 numeric pre-tokens (100 types, such as 10, 000, s214, r26) are unrepresentable in both tokenizers — [p3](#p3).
- If this text went through today's pipeline, pieces outside the vocabulary would be dropped silently by the `idx !== undefined` filter in [train.ts L287-291](../../src/routes/train-transformer/train.ts). Examples: `warranty` becomes `" warrant"` alone, `claimants` becomes `" claimant"`, and `repudiation` disappears entirely — [p3](#p3).
- Of the 572 missing types, 59 have a simple inflected neighbour in the vocabulary, such as claimant's, sanctions, tracks, courts, offers, purposes — [p3](#p3).

**Important terms missing (no single token in either tokenizer unless marked). The selection is mine, with counts in concepts + trees:**
- Contract: warranty 2, condition 2, innominate 2, terminate 3, termination 1, repudiation 1, nominal 1, specific 3, performance 9, equitable 3, discretionary 2, injunction 1, offeree 4, offeror 2 (LAW only by the accidental split offer+or), remedy 7, innocent 5, rejection 2, recoverable 3.
- Negligence and limitation: liability 6, proximity 1, proximate 1, volenti 2, latent 2, accrual 1, accrued 3, disapply 1, barred 1, defence 4.
- Consumer: perishable 1, installation 2.
- Procedure: expert 2, experts 4, mesothelioma 2, disrepair 2, psla 2, rta 5, adr 10, hmcts 2, referral 4, sanctions 4, stay 2, protocol 1, pre 2, churchill 3, specified 4.
- Deposit and nuisance: custodial 1, prescribed 1, repayment 1, private 3, proprietary 1, interference 2, locality 2.

**Important terms present as single tokens:** offer, acceptance, invitation, treat, unilateral, counter, revocation, postal, consideration, intention, breach, duty, negligence, foreseeable, standard, causation, contributory, liable, remote, remoteness, limitation, knowledge, satisfactory, quality, fit, purpose, description, reject, refund, repair, replacement, reduction, presumption, conform, the five track words, trial, mediation, sanction, caparo, deposit, scheme, penalty, nuisance — [p3](#p3).

**Multi-word terms (training count / concepts + trees count):** specific performance 0/2, private nuisance 0/3, innocent party 0/5, no liability 0/6, no breach 0/3, repeat performance 0/4, time barred 0/1, clinical negligence 0/2, economic loss 0/2, nominal damages 0/1. Present in training: invitation to treat 4/2, counter offer 4/2, duty of care 4/2, personal injury 3/10, price reduction 4/4. Training-only terms: statutory nuisance 3/0, contributory negligence 4/0, breach of contract 3/0 — [p3](#p3).

### Inferences
- A rule whose conclusion uses a missing word ("no liability", "may terminate", "nominal damages") cannot be enforced as written. The token does not exist, so the mask has nothing to allow or ban. "Damages only" and "no breach" are spellable from existing tokens, though neither phrase occurs in training as a verdict.
- High token share (73.5%) probably overstates the fit, since common function words are all covered; I did not measure that split. The type share, and the missing-term list above, are closer to what a KB would need.

### Gaps
- The selection of "important" terms is my judgement, not a legal source's. The frequency-ranked list of missing words is in [p3](#p3), for checking against it.

## 5. Could rules derived from the decision trees fire on the training text?

### Takeaway
Yes, at a few exact sentences only. A 33-rule sample covering 10 trees fires at 35 distinct positions (0.649%) with gold allowed at all of them, except one rule deliberately written with a closed allow-list. Two of the trees (K-BREACH, NUIS) do not fire, because their key words or phrases are not in the training text.

### Cited Findings
The rules are my own lowering. They are listed in full in `rules.ts` under [p4](#p4), and were written after reading the training text, so these are not blind tests. Each tree figure such as £10,000 is lowered by hand to the first number word in the corpus's spelling, because digits are not in the vocabulary. `NUM` is all number words, of which nine, eleven and forty are not in the vocabulary.

| Tree | Sample rule, as `trigger → constraint` | Fired | Gold allowed | Lines |
|---|---|---|---|---|
| P-TRACK Q4 | `small claims track is for claims up to` → NUM minus ten | 1 | 1 | [L89](../../src/routes/train-embed/corpus.ts#L89) |
| P-TRACK Q4 | `small claims track is for claims of no more than` → NUM minus ten | 1 | 1 | [L296](../../src/routes/train-embed/corpus.ts#L296) |
| P-TRACK Q5 | `fast track is for claims up to` → NUM minus twenty | 2 | 2 | L90, L296 |
| P-TRACK Q6 | `intermediate track is for claims up to` → NUM minus one | 2 | 2 | L91, L296 |
| P-TRACK Q4 applied | `the court put it on the`, with "claimed six thousand pounds" in the prior 30 words → ban fast, intermediate, multi | 1 | 1 | L296 |
| P-LIMITATION Q1 | `personal injury has`; `personal injury must be brought within` → NUM minus three | 2 | 2 | L197, L322 |
| P-LIMITATION Q2-Q3 | `breach of contract has`; `most other torts must be brought within`; `claim in tort usually has` → NUM minus six | 3 | 3 | L195, L322, L196 |
| CRA-GOODS Q2 | `right to reject lasts`; `right to reject the goods , which lasts` → NUM minus thirty | 2 | 2 | L152, L310 |
| CRA-GOODS Q2 | `refund within` → NUM minus fourteen | 0 | n/a | none |
| DEP Q1 | `protect the deposit within`; `protect the deposit in a government approved scheme within` → NUM minus thirty | 2 | 2 | L207, L325 |
| DEP Q1 | `the penalty is one to`; `between one and` → NUM minus three | 2 | 2 | L215, L326 |
| K-FORMATION Q1 | `shop window are an`; `shop shelf are an` → ban offer | 3 | 3 | L122, L302, L123 |
| K-FORMATION Q2, open | `a counter offer` → ban accepts, creates, binds (the last two out of vocabulary) | 4 | 4 | L127, L128, L304 |
| K-FORMATION Q2, closed | `a counter offer` → allow only rejects, destroys | 4 | **3** | false ban at L304 |
| K-FORMATION Q5 | `agreements in the family are presumed` → allow only not; `agreements in business are presumed` → ban not | 3 | 3 | L135, L306, L136 |
| K-BREACH Q2-Q3 | `warranty` → ban terminate; `breach of a condition` → ban only | 0 | n/a | words absent |
| N-NEGLIGENCE Q3 | `happened anyway there is no` → allow only causation, liability; `but for the` → allow only breach | 2 | 2 | L184, L320 |
| CRA-SERVICES Q1 | `reasonable care and` → allow only skill | 2 | 2 | L166, L314 |
| NUIS Q1 | `private nuisance` → ban anyone; `interest in the` → allow only land | 0 | n/a | none |
| P-ADR Q2 | `free mediation is for claims of` → NUM minus ten; `appointment lasts up to`; `appointment lasted up to` → NUM minus one | 3 | 3 | L97, L98, L291 |

- Totals: 39 firings, 35 distinct positions (0.649%), 416 window positions (0.484%), and 1 false-ban firing, from the closed-list rule only — [p4](#p4), [p5](#p5).
- The one false ban: [L304](../../src/routes/train-embed/corpus.ts#L304) `...cannot be accepted after a counter offer >>.<< mia's last message`.
- Distinct positions by tree: K-FORMATION 10, P-TRACK 7, P-LIMITATION 5, DEP 4, P-ADR 3, CRA-GOODS 2, N-NEGLIGENCE 2, CRA-SERVICES 2, K-BREACH 0, NUIS 0 — [p5](#p5).
- Absent from the training text: warranty, condition, terminate, innominate, private, injunction, nominal, specific, performance, expert, experts — [p4](#p4). K-REMEDY was not sampled.

### Inferences
- The numeric rules constrain only the first number word. `one` is correct after the intermediate track frame, but the mask cannot tell "one hundred thousand" from "one thousand", so it does not actually enforce the limit. Enforcing it needs a multi-token automaton, or a chain of triggers for the following number words.
- Only TC05 uses reasoning over the context (an amount compared with a limit). The rest repeat a sentence the model has already memorised, which is the same limit the report noted for its 8 positions.
- The `a counter offer` pair shows the trade-off in one place: the closed allow-list is the informative form and it false-bans; the open ban-list is safe and bans words that were never likely, two of which are not even in the vocabulary (see question 7).

### Gaps
- Chained constraints across number words were not measured.
- Whether the rules remove any probability mass needs weights and was not measured.

## 6. For each trigger class, how many positions fire and how many are false bans?

### Takeaway
Narrow, subject-bound frames have 0 false bans and very low reach. Loose triggers get more reach, and false bans appear as soon as a ban list or allow-list has to hold across different sentence types. No subject-bound frame fires at all on held-out CIVIL_LAW_CORPUS text.

### Cited Findings
Class definitions are in `rules.ts` under [p4](#p4); the two C3 classes are mined in `p4_rules.ts`. Held-out means the same rules run over `CIVIL_LAW_CORPUS` as a word stream (lower-cased, tags dropped), which the rules were not written against; its digits and other unrepresentable words still count as gold.

| Class | Definition | Positions (% of 5,390) | Defs / stories | False bans | Window positions (%) | Window false | LAW fired / false | Held-out concepts + trees fired / false | Held-out FP fired / false |
|---|---|---|---|---|---|---|---|---|---|
| C1a | One word: role, report's 7 verbs, `is_owed` → " is" | 64 (1.187) | 30/34 | **7** | 1,006 (1.170) | 94 | 61/7 | 35/2 | 10/0 |
| C1a2 | Same, `is_owed` → " owed" | 64 (1.187) | 30/34 | 0 | 1,006 (1.170) | 0 | 61/0 | 35/0 | 10/0 |
| C1b | One word: payee role cannot pay (pays, pay) | 41 (0.761) | 17/24 | **2** | 642 (0.747) | 32 | 39/2 | 14/0 | 8/0 |
| C2a | Role + modal: other roles' base verbs (chapter 07's T-CAN shape) | 20 (0.371) | 9/11 | 0 | 300 (0.349) | 0 | 20/0 | 8/0 | 1/0 |
| C2b | Role + verb: other domains' object nouns as next token | 13 (0.241) | 9/4 | 0 | 195 (0.227) | 0 | 13/0 | 1/0 | 0/0 |
| C3a | Definition frames: report's KB | 8 (0.148) | 8/0 | 0 | 86 (0.100) | 0 | 8/0 | 0/0 | 0/0 |
| C3b | Mined: term + copula → closed {next word of first definition} | 113 (2.096) | 102/11 | **22** | 1,621 (1.885) | 316 | 113/22 | 34/25 | 12/8 |
| C3c | Mined: term + copula → closed {next words of all definitions} | 113 (2.096) | 102/11 | **15** | 1,621 (1.885) | 213 | 113/15 | 34/24 | 12/7 |
| C4a | Numeric: `track is for claims up to` or `of no more than`, bound to the track | 6 (0.111) | 3/3 | 0 | 56 (0.065) | 0 | 6/0 | 0/0 | 0/0 |
| C4b | Numeric, loose: `claim(s) up to` | 6 (0.111) | 3/3 | **1** | 84 (0.098) | 14 | 6/1 | 0/0 | 0/0 |
| C4c | Numeric: subject-bound time, penalty and mediation frames | 14 (0.260) | 8/6 | 0 | 166 (0.193) | 0 | 13/0 | 0/0 | 0/0 |
| C4d | One word: `within` → limit numbers only | 19 (0.353) | 6/13 | **3** | 304 (0.354) | 48 | 19/3 | 23/22 | 9/6 |
| C4e | `up to` → track numbers only | 12 (0.223) | 6/6 | **5** | 180 (0.209) | 75 | 12/5 | 4/3 | 0/0 |
| C4f | Subject-free: `must be brought within` → three, six | 2 (0.037) | 0/2 | 0 | 26 (0.030) | 0 | 2/0 | 0/0 | 1/0 |
| C5a | `the x pays the` → ban others' payables | 4 (0.074) | 4/0 | 0 | 52 (0.060) | 0 | 4/0 | 0/0 | 0/0 |
| C5b | `the x v the` → closed object list (19 pairs) | 15 (0.278) | 14/1 | 0 | 195 (0.227) | 0 | 15/0 | 0/0 | 0/0 |
| C5c | Shorter: `the x pays` → closed {the} | 5 (0.093) | 4/1 | **1** | 70 (0.081) | 14 | 5/1 | 0/0 | 0/0 |
| C5d | Counterpart bans: `the landlord pays the` not rent, and similar | 0 | 0/0 | 0 | 0 | 0 | 0/0 | 0/0 | 0/0 |

All from [p4](#p4). The window false column counts window positions at falsely banned tokens. The LAW columns are for comparison only; Skip-gram has no mask. C4c differs by one on LAW because that stream has no comma for `the goods , which lasts`.

**Concrete false-ban lines on the training text ( `>>gold<<` is banned; line numbers are in [corpus.ts](../../src/routes/train-embed/corpus.ts); from [p4](#p4)):**

- **C1a, all 7 from the `is_owed` → " is" surface choice:**
  - L23 `the claimant >> is<< the person who`
  - L24 `the defendant >> is<< the person who`
  - L27 `the landlord >> is<< the person who`
  - L28 `the tenant >> is<< the person who`
  - L31 `the trader >> is<< a business that`
  - L32 `the consumer >> is<< a person who`
  - L38 `the debtor >> is<< the person who`
- **C1b:**
  - L161 `the trader >> pays<< the cost of`
  - L326 `an order that the landlord >> pays<< between one and`
- **C4b:**
  - L295 `a claim up to >> three<< hundred pounds costs`
- **C4d:**
  - L298 `hari paid everything within >> the<< month`
  - L311 `the trader had to do it within >> a<< reasonable time`
  - L314 `the trader must do it within >> a<< reasonable time`
- **C4e:**
  - L243 `trim branches up to >> the<< boundary`
  - L252 `businesses can agree up to >> sixty<< days to pay`
  - L295 `a claim up to >> three<< hundred pounds costs`
  - L333 `only up to >> the<< property boundary`
  - L334 `can usually agree up to >> sixty<< days`
- **C5c:**
  - L326 `an order that the landlord pays >> between<< one and three`
- **C3b and C3c, 22 and 15 positions; the first 14 of each are in [p4](#p4). Examples:**
  - L208 `a deposit is >> protected<<`, where the first definition said "money"
  - L212 `the deposit is >> returned<<`
  - L88 `every defended claim is >> put<<`
  - L99 `an agreement made in mediation is >> legally<<`
  - L125 `a unilateral offer is >> accepted<<`
  - L156 `the first six months is >> taken<<`
  - L295 `the fee is >> five<<`

**Held-out false bans, examples ( [p4](#p4), [p6](#p6) ):**
- C1a: `the defendant >>is<< liable only for` and `that the consumer >>is<< entitled`.
- C4d: 28 of 32 fired are false, but 14 of these 28 have a digit gold (`within 14 days`, `within 30 days`) and so are spelling artefacts. The other 14 are genuine word-level bans such as `within >>a<< reasonable time` and `within >>the<< period`.

**Disagreements with earlier documents:**
- The report says one-word triggers "fail on evidence" because `landlord pays` and `trader pays` occur. Those occur, as C1b shows, but `pays` is not in the report's KB. The KB's own ban set at a one-word trigger has its only false bans from the " is" surface (C1a); moving to " owed" gives 0 (C1a2).
- The one-word trigger's weakness is therefore not this text-level conflict. See question 7.
- [repo_design_fit.md L128](../Semantic%20loss%20with%20hard%20logit%20constraints/repo_design_fit.md) says the `pays` example touches 3 positions (tenant, buyer, customer). The frame `the x pays the` fires at 4; the fourth is trader at L161.

### Inferences
- The one-word C1a result gives direct support to the report's suggestion to change the `is_owed` surface form; that suggestion was stated as untested.
- False bans come from the same structure each time: a trigger that matches several sentence types. The word "within" takes both durations and "a reasonable time"; "up to" takes amounts and places; a term + copula takes both a definition and a passive verb.
- The mined classes C3b and C3c mainly show that one definition does not fix the next word after its term. Of C3b's 22 false bans, 16 are in the definition block itself and 6 in stories; for C3c, 10 and 5 — [p7](#p7).

### Gaps
- All rule tables are mine and were written after reading the text. A different but equally reasonable set would change counts, particularly for C5b and C2b.
- The held-out text is in a different register (citations, digits, questions), so it tests wording stability rather than law.

## 7. What is the highest coverage reachable with zero false bans?

### Takeaway
It depends on which rules you accept. Rules I would defend reach 58 positions (1.076% of tokens, 0.811% of windows). Adding classes that are legally unsound and close to vacuous reaches 155 (2.876%). Pruning any rule that false-bans reaches 237 (4.397%), but that is corpus tuning. A memorising mask reaches 100% by construction, which shows that "zero false bans" alone is not a useful target.

### Cited Findings

| Set (0 false bans in every row) | Positions | % of 5,390 | Window positions | % of 85,984 | Status |
|---|---|---|---|---|---|
| C3a, report's frames | 8 | 0.148 | 86 | 0.100 | Reproduced figure |
| + C4a, track limits | 14 | 0.260 | 142 | 0.165 | Subject-bound |
| + C4c, time, penalty and mediation | 28 | 0.519 | 308 | 0.358 | Subject-bound |
| + C5a, `the x pays the` | 32 | 0.594 | 360 | 0.419 | Subject-bound |
| + C5b, `the x v the` | 43 | 0.798 | 503 | 0.585 | Closed lists fitted to the corpus |
| + tree sample without its closed rule TC21 | **58** | **1.076** | **697** | **0.811** | Highest I would defend |
| All 9 classes with 0 false bans (adds C1a2, C2a, C2b, C4f, without the tree sample) | 140 | 2.597 | 2,004 | 2.331 | Includes unsound classes |
| Same + tree sample | **155** | **2.876** | **2,198** | **2.556** | Highest with rules fixed in advance |
| Every class, each false-banning rule removed | 237 | 4.397 | 3,388 | 3.940 | Corpus-tuned, without the tree sample |
| Closed allow-list = observed next tokens after the last n words | 5,386 to 5,389 | ~100 | not computed | | Memorising bound; false 0 by construction |

Sources: [p4](#p4), [p5](#p5). For comparison, classes with false bans (positions / false bans): C1a 64/7, C1b 41/2, C3b 113/22, C3c 113/15, C4b 6/1, C4d 19/3, C4e 12/5, C5c 5/1 — [p4](#p4).

**Leave-one-text-out on the memorising mask (built from the other 255 texts, tested on the held-out text) — [p4](#p4):**

| n (context words) | Fires at | Gold banned, of those fired |
|---|---|---|
| 1 | 4,941 of 5,389 (91.7%) | 1,910 (38.7%) |
| 2 | 3,031 of 5,388 (56.3%) | 1,575 (52.0%) |
| 3 | 1,456 of 5,387 (27.0%) | 714 (49.0%) |
| 4 | 742 of 5,386 (13.8%) | 333 (44.9%) |

**Evidence that some zero-false-ban classes are close to vacuous at the text level:**
- C1a2: in training, a defining verb follows a role word directly only once, `debtor owes` at L68, and that is the debtor's own verb. Role words are followed mostly by must, can, who, is. On held-out text, no banned verb followed a role word — [p5](#p5). So 0 false bans here reflects that these verbs do not occur next to role words, and little else.
- C2b: next tokens are `the` (11 of 13), `a` and `between` — [p5](#p5). Object nouns never immediately follow the verb, so the ban cannot conflict. `C2a` also bans the out-of-vocabulary `answer`.

**Evidence that one-word and role + modal classes are legally unsound, from the corpus itself:**
- [L329](../../src/routes/train-embed/corpus.ts#L329) says "a landlord wanted his flat back so that he could sell it". C1a2 and C2a would ban "the landlord sells" and "the landlord can sell", and they miss L329 only because `he could` is not adjacent to the role word.
- [L295, in the report's fact table](../../reports/Civil%20law%20KB%20M1%20M5%20plan.md) gives a creditor who makes a claim, and L326 a tenant who claims against a landlord. C2a would ban "the tenant can bring" and "the creditor can bring", which these lines make plainly possible.

**Extension estimates. These are arithmetic, not measurements; the corpus was not changed:**
- Base: the 32 positions of the subject-bound frames. Adding k sentences of 10 tokens with one firing each gives (32 + k) / (5,390 + 10k):

| k added sentences | Coverage (estimate) |
|---|---|
| 8 | 40 / 5,470 = 0.73% |
| 24 | 56 / 5,630 = 0.99% |
| 50 | 82 / 5,890 = 1.39% |
| 100 | 132 / 6,390 = 2.07% |
| 500 | 532 / 10,390 = 5.12% |
| 2,000 | 2,032 / 25,390 = 8.00% |

- The limit under this assumption is 10%, one firing per 10-token sentence. At today's mean of 13.44 tokens per sentence (401 sentences) it would be 7.4% — [p4](#p4).
- Window share is about the token share × (17 − n)/16 for an n-word trigger, because a window has to hold the whole trigger. At n = 5 that is 0.75 × the token share. C3a's 0.100 / 0.148 = 0.68 is lower because of its position at the start of the stream.
- Appending CIVIL_LAW_CORPUS as it stands (9,691 word and punctuation tokens, tags dropped) would barely help: the narrow classes fire 0 times there, giving 32 / 15,081 = 0.212%, lower than today. Zero-false classes reach 196 / 15,081 = 1.300%. The figures ignore retraining the tokenizer. Most of that held-out text is not expressible in today's vocabulary anyway (question 4) — [p4](#p4).

### Inferences
- Coverage rises only if the corpus is written to contain the frames. Importing the legal text does not reach them, because frames depend on exact wording. The earlier report's sparse-coverage conclusion holds. The added frames raise it about sevenfold in tokens (8 to 58), which is still about 1%.
- The gap between in-sample and held-out behaviour for mined masks (0 false bans against 39 to 52% of fired positions) is the main warning: any zero-false-ban figure on this corpus measures fit to this text. These hold-out rates are still optimistic, because stories repeat definition wording.
- Fired positions are memorised training sentences. The earlier probes found that at the report's frames, at T = 1 and top-p 0.6 on e2000, the mask has nothing to remove, and that violations appear at wider nucleus settings and earlier checkpoints ([repo_probes](../Civil%20law%20KB%20M1%20M5%20plan/repo_probes_2026-11-03.md)). A more informative test would be on contexts the model has not memorised.

### Gaps
- Coverage does not measure effect. Banned mass at the 58 or 155 positions was not measured; it requires weights and a forward pass, and the brief scoped this to text and tokenizer.
- "Defend" is my judgement, not a legal review; C5b's closed lists in particular were written to fit the corpus.
- The extension estimates assume one firing per added sentence and no change in tokenizer, which is an assumption of mine.

## 8. Does chapter 07 carry the civil-law KB, as the earlier report says?

### Takeaway
No. The observation is confirmed: chapter 07 has no sign of the KB in the working tree, in HEAD, or in any git object I could check. The evidence does not show why.

### Cited Findings
- Report, [L134](../../reports/Civil%20law%20KB%20M1%20M5%20plan.md): "Chapter 07 now carries this KB, the figure-to-code map, the M1 steps, the 'by analogy' section, the M1 and M5 comparison, and the §6 to §10 changes".
- Working tree [chapter 07](../../docs/progress/07-neurosymbolic-code-2b.md): 0 lines match `claimant` or `landlord` (case-insensitive); 0 match `not_defined_by`. §2 still holds the eagle, fish and fly KB. Mismatch 5 still says `creditor`, `buyer` and `seller` split, which the report called "out of date".
- `HEAD:docs/progress/07-neurosymbolic-code-2b.md`: 0 matches for `claimant|landlord`. The file has one commit, 4ae5927 (2026-11-02), and `git log --all -S'claimant'` on it returns nothing.
- `git diff` of chapter 07 (45 insertions, 50 deletions): 0 changed lines mention `claimant` or `landlord`. What is visible is table re-spacing, new names for the mechanisms (such as "Hard Logit Mask"), and an ASCII diagram replaced by `fig-design-pipeline.png`.
- `git stash show --stat stash@{0}`: the stash (2026-10-31, on c42da07) does not include chapter 07. In `docs/progress/` it touches only chapters 04 and 05, with 0 lines matching `not_defined_by|landlord`. It has no untracked-files parent, and it predates the report.
- `git fsck --unreachable --no-reflogs` found 599 unreachable blobs. Of those under 400 KB, none contains `not_defined_by`, `neurosymbolic-code` or `Code for the symbolic layer`.
- `not_defined_by` appears in only four places in README.md, docs, reports, research_notes, tests and src: README.md, the earlier report, `kb_facts_against_sources.md` and `repo_probes_2026-11-03.md`. In README.md it is a new, uncommitted line.
- File times: report 19:36:58, chapter 07 21:37:52 on 2026-11-03, README 21:26, `src/routes/neural-symbolic/` stubs 21:34 to 21:35.
- Chapter 07 names its path `src/routes/neuro-symbolic/`, while the empty stubs are in `src/routes/neural-symbolic/`.

### Inferences
- The report's claim does not hold for any version I can find. The later modification time of chapter 07 is consistent with it having been overwritten or never saved, but it does not distinguish between these, so I do not assert either. The 13-test claim in the same sentence cannot be checked either: it says "from a scratch copy", and `tests/` has no neuro-symbolic test file.
- Until chapter 07 is updated, its §2 and mismatch table are wrong for this repo on the KB and the tokenizer.

### Gaps
- Editor local history and session scratchpads were outside what I checked, as the brief named git only.

## 9. Which script and command produces each number?

### Takeaway
Every number above comes from the scripts below, run with bun 1.3.13 in about three seconds each. Source and raw output are copied here because the scratchpad is temporary.

### Cited Findings
- Scripts directory: `/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes`. All commands run with that as the current directory.
- `git status --short` at the end of the run shows only this notes file as new, compared with the start.
- `src/routes/train-transformer/.train-worker.mjs` keeps its 2026-11-02 16:46:33 timestamp, so importing the trainer did not rebuild the worker.

### Inferences
- Bun's module resolution is what lets the scripts import `.js`-suffixed paths from the repo's `.ts` sources. `package.json` has no probe or test script, and the repo has both `bun.lock` and `tsx` on the path; I used bun.

### Gaps
- The scratchpad will not persist. To re-run, copy the sources below into any directory and adjust nothing except the current directory.

### Extracting the chapter 07 engine

`symbolic_ch07.ts` is not copied here; it is §2's code block, extracted unchanged from the working-tree chapter 07:

```bash
cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && awk '/^## 2\. /{s=1} s&&/^```ts/{f=1;next} f&&/^```/{exit} f{print}' /Users/nedpham/Projects/neural_symbolic_nlp/docs/progress/07-neurosymbolic-code-2b.md > symbolic_ch07.ts
```

Read-only git checks for question 8 were run directly: `git status --short`, `git log --all -S'claimant' -- docs/progress/07-neurosymbolic-code-2b.md`, `git diff`, `git stash show --stat stash@{0}`, `git diff 'stash@{0}^' 'stash@{0}' -- docs/progress/`, `git rev-parse --verify -q 'stash@{0}^3'`, and `git fsck --unreachable --no-reflogs --no-progress` with `git cat-file` over its blobs under 400 KB.

<a id="common"></a>

### common.ts (shared helpers)

Command: `cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && imported by the others`

Source (`/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes/common.ts`):

```ts
// Shared helpers for read-only probes. Imports repo code by absolute path; writes nothing to the repo.
import { readFileSync } from "node:fs";
export const REPO = "/Users/nedpham/Projects/neural_symbolic_nlp";
import { CORPUS, CIVIL_LAW_CORPUS, CIVIL_LAW_DEFINITIONS, STORIES, LAW_DATASET, buildVocab, mergesFor, tokenize as lawTokenize }
  from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-embed/corpus.ts";
import { TRAIN_TEXTS, buildVocabulary }
  from "/Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-transformer/train.ts";
export { CORPUS, CIVIL_LAW_CORPUS, CIVIL_LAW_DEFINITIONS, STORIES, LAW_DATASET, buildVocab, mergesFor, lawTokenize, TRAIN_TEXTS, buildVocabulary };

const corpusLines = readFileSync(`${REPO}/src/routes/train-embed/corpus.ts`, "utf8").split("\n");
/** corpus.ts line number holding this text (definition or story). */
export function corpusLineOf(text: string): number {
  const key = text.replace(/\.$/, "").slice(0, 60);
  for (let i = 0; i < corpusLines.length; i++) if (corpusLines[i].includes(key)) return i + 1;
  return -1;
}

/** Transformer stream: exactly what trainTransformer builds. */
export function tfStream() {
  const v = buildVocabulary();
  const ids: number[] = [], toks: string[] = [], textIdx: number[] = [];
  TRAIN_TEXTS.forEach((s, ti) => {
    for (const tok of v.tokenize(s)) {
      const id = v.wordToIndex.get(tok);
      if (id !== undefined) { ids.push(id); toks.push(tok); textIdx.push(ti); }
    }
  });
  return { ...v, ids, toks, textIdx, words: toks.map((t) => t.trim()) };
}

/** Word-level view: one list per sentence of LAW_DATASET (Skip-gram training text). */
export function lawSentences() {
  return LAW_DATASET.sentences.map((s) => lawTokenize(s, LAW_DATASET));
}

export type Rule = { id: string; cls: string; pat: string[]; ban?: string[]; allow?: string[] };

export const seqLen = 16;
/** Windows of the transformer that contain target position p with the whole n-word trigger in the context. */
export function windowsFor(p: number, n: number, N: number): number {
  const lo = Math.max(0, p - seqLen), hi = Math.min(N - seqLen - 1, p - n);
  return Math.max(0, hi - lo + 1);
}

export type Hit = { p: number; rule: Rule; gold: string; falseBan: boolean };
/** A rule fires at p when the n words before p equal its pattern. A false ban: gold is banned. */
export function apply(rules: Rule[], words: string[]): Hit[] {
  const out: Hit[] = [];
  const byLast = new Map<string, Rule[]>();
  for (const r of rules) { const k = r.pat[r.pat.length - 1]; byLast.set(k, [...(byLast.get(k) ?? []), r]); }
  for (let p = 1; p < words.length; p++) {
    const cand = byLast.get(words[p - 1]); if (!cand) continue;
    for (const r of cand) {
      const n = r.pat.length; if (p < n) continue;
      let ok = true;
      for (let k = 0; k < n; k++) if (words[p - n + k] !== r.pat[k]) { ok = false; break; }
      if (!ok) continue;
      const gold = words[p];
      const fb = r.ban ? r.ban.includes(gold) : r.allow ? !r.allow.includes(gold) : false;
      out.push({ p, rule: r, gold, falseBan: fb });
    }
  }
  return out;
}

export function summarise(hits: Hit[], N: number) {
  const pos = new Map<number, { n: number; fb: boolean }>();
  for (const h of hits) {
    const e = pos.get(h.p) ?? { n: 0, fb: false };
    e.n = Math.max(e.n, h.rule.pat.length); e.fb = e.fb || h.falseBan; pos.set(h.p, e);
  }
  let win = 0, winFb = 0, fb = 0;
  for (const [p, e] of pos) {
    const w = windowsFor(p, e.n, N); win += w;
    if (e.fb) { fb++; winFb += w; }
  }
  return { positions: pos.size, falseBans: fb, windows: win, windowFalse: winFb, set: pos };
}

/** Held-out word stream from CIVIL_LAW_CORPUS: lower case, bracket tags dropped, same pre-token shape as the transformer. */
export function civilWordStream(entries: string[]) {
  const words: string[] = [];
  for (const e of entries) {
    const t = e.replace(/\[[^\]]*\]/g, " ").toLowerCase();
    for (const m of t.match(/\w+(?:'\w+)*|[^\w\s]/g) ?? []) words.push(m);
  }
  return words;
}
```


<a id="rules"></a>

### rules.ts (constraints and classes, written out)

Command: `cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && imported by p4, p5, p6`

Source (`/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes/rules.ts`):

```ts
// Candidate constraints, written out in full. Written after reading the training text, so narrow frames are not blind tests.
import type { Rule } from "./common";
export const NUM_ALL = ["one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","twenty","thirty","forty","fifty","sixty","hundred","thousand"];
const numBan = (...keep: string[]) => NUM_ALL.filter((n) => !keep.includes(n));
const pat = (s: string) => s.split(" ");

// ---- Q5: tree-derived sample. Lowering choice: tree amount/period -> first number word in the corpus's spelling.
export const TREE: (Rule & { tree: string })[] = [
  { id:"TC01", tree:"P-TRACK Q4 (<=10,000 small)", cls:"tree", pat:pat("small claims track is for claims up to"), ban:numBan("ten") },
  { id:"TC02", tree:"P-TRACK Q4", cls:"tree", pat:pat("small claims track is for claims of no more than"), ban:numBan("ten") },
  { id:"TC03", tree:"P-TRACK Q5 (<=25,000 fast)", cls:"tree", pat:pat("fast track is for claims up to"), ban:numBan("twenty") },
  { id:"TC04", tree:"P-TRACK Q6 (<=100,000 intermediate)", cls:"tree", pat:pat("intermediate track is for claims up to"), ban:numBan("one") },
  { id:"TC05", tree:"P-TRACK Q4 applied: amount in context <=10,000", cls:"tree", pat:pat("the court put it on the"), ban:["fast","intermediate","multi"] },
  { id:"TC06", tree:"P-LIMITATION Q1 (PI 3 years)", cls:"tree", pat:pat("personal injury has"), ban:numBan("three") },
  { id:"TC07", tree:"P-LIMITATION Q1", cls:"tree", pat:pat("personal injury must be brought within"), ban:numBan("three") },
  { id:"TC08", tree:"P-LIMITATION Q2 (contract 6 years)", cls:"tree", pat:pat("breach of contract has"), ban:numBan("six") },
  { id:"TC09", tree:"P-LIMITATION Q2-Q3", cls:"tree", pat:pat("most other torts must be brought within"), ban:numBan("six") },
  { id:"TC10", tree:"P-LIMITATION Q3 (tort 6 years)", cls:"tree", pat:pat("claim in tort usually has"), ban:numBan("six") },
  { id:"TC11", tree:"CRA-GOODS Q2 (30 days)", cls:"tree", pat:pat("right to reject lasts"), ban:numBan("thirty") },
  { id:"TC12", tree:"CRA-GOODS Q2", cls:"tree", pat:["right","to","reject","the","goods",",","which","lasts"], ban:numBan("thirty") },
  { id:"TC13", tree:"CRA-GOODS Q2 (refund within 14 days)", cls:"tree", pat:pat("refund within"), ban:numBan("fourteen") },
  { id:"TC14", tree:"DEP Q1 (30 days)", cls:"tree", pat:pat("protect the deposit within"), ban:numBan("thirty") },
  { id:"TC15", tree:"DEP Q1", cls:"tree", pat:pat("protect the deposit in a government approved scheme within"), ban:numBan("thirty") },
  { id:"TC16", tree:"DEP Q1 (1-3x)", cls:"tree", pat:pat("the penalty is one to"), ban:numBan("three") },
  { id:"TC17", tree:"DEP Q1 (1-3x)", cls:"tree", pat:pat("between one and"), ban:numBan("three") },
  { id:"TC18", tree:"K-FORMATION Q1 (display is not an offer)", cls:"tree", pat:pat("shop window are an"), ban:["offer"] },
  { id:"TC19", tree:"K-FORMATION Q1", cls:"tree", pat:pat("shop shelf are an"), ban:["offer"] },
  { id:"TC20", tree:"K-FORMATION Q2, open ban", cls:"tree", pat:pat("a counter offer"), ban:["accepts","creates","binds"] },
  { id:"TC21", tree:"K-FORMATION Q2, closed allow-list", cls:"tree", pat:pat("a counter offer"), allow:["rejects","destroys"] },
  { id:"TC22", tree:"K-FORMATION Q5 (domestic)", cls:"tree", pat:pat("agreements in the family are presumed"), allow:["not"] },
  { id:"TC23", tree:"K-FORMATION Q5 (commercial)", cls:"tree", pat:pat("agreements in business are presumed"), ban:["not"] },
  { id:"TC24", tree:"K-BREACH Q3 (warranty: damages only)", cls:"tree", pat:["warranty"], ban:["terminate"] },
  { id:"TC25", tree:"K-BREACH Q2 (condition: may terminate)", cls:"tree", pat:pat("breach of a condition"), ban:["only"] },
  { id:"TC26", tree:"N-NEGLIGENCE Q3 (causation fails)", cls:"tree", pat:pat("happened anyway there is no"), allow:["causation","liability"] },
  { id:"TC27", tree:"N-NEGLIGENCE Q3", cls:"tree", pat:pat("but for the"), allow:["breach"] },
  { id:"TC28", tree:"CRA-SERVICES Q1", cls:"tree", pat:pat("reasonable care and"), allow:["skill"] },
  { id:"TC29", tree:"NUIS Q1 (standing)", cls:"tree", pat:pat("private nuisance"), ban:["anyone"] },
  { id:"TC30", tree:"NUIS Q1", cls:"tree", pat:pat("interest in the"), allow:["land"] },
  { id:"TC31", tree:"P-ADR Q2 (<=10,000 mediation)", cls:"tree", pat:pat("free mediation is for claims of"), ban:numBan("ten") },
  { id:"TC32", tree:"P-ADR Q2 (one-hour)", cls:"tree", pat:pat("appointment lasts up to"), ban:numBan("one") },
  { id:"TC33", tree:"P-ADR Q2 (one-hour)", cls:"tree", pat:pat("appointment lasted up to"), ban:numBan("one") },
];

export const ROLES8 = ["claimant","defendant","landlord","tenant","trader","consumer","creditor","debtor"];
const DEF: Record<string,string> = { claimant:"brings", defendant:"answers", landlord:"owns", tenant:"rents", trader:"sells", consumer:"buys", creditor:"is", debtor:"owes" };
const BASE: Record<string,string> = { claimant:"bring", defendant:"answer", landlord:"own", tenant:"rent", trader:"sell", consumer:"buy", debtor:"owe" };
const others = (x: string, m: Record<string,string>) => Object.entries(m).filter(([r]) => r !== x).map(([, v]) => v);

const c1a: Rule[] = ROLES8.map((x) => ({ id:`C1a-${x}`, cls:"C1a", pat:[x], ban:others(x, DEF) }));
const DEF2 = { ...DEF, creditor:"owed" };
const c1a2: Rule[] = ROLES8.map((x) => ({ id:`C1a2-${x}`, cls:"C1a2", pat:[x], ban:others(x, DEF2) }));
const c1b: Rule[] = ["landlord","trader","seller","supplier","creditor","claimant"].map((x) => ({ id:`C1b-${x}`, cls:"C1b", pat:[x], ban:["pays","pay"] }));

const MODALS = ["can","could","may","must","should","will"];
const c2a: Rule[] = ROLES8.flatMap((x) => MODALS.map((m) => ({ id:`C2a-${x}-${m}`, cls:"C2a", pat:[x,m], ban:others(x, BASE) })));

const DOMAIN: Record<string,string[]> = { court:["claim","court","judgment","case","hearing"], housing:["rent","home","deposit","tenancy","flat","possession"], trade:["goods","price","refund","repair","product","kettle"], debt:["money","debt","invoice"] };
const ROLE_DOMAIN: Record<string,string> = { claimant:"court", defendant:"court", landlord:"housing", tenant:"housing", trader:"trade", consumer:"trade", seller:"trade", buyer:"trade", creditor:"debt", debtor:"debt", supplier:"debt", customer:"debt" };
const VERBS = ["pays","owes","gets","owns","rents","sells","buys","brings","answers","supplies","sends","makes"];
const otherObjects = (x: string) => Object.entries(DOMAIN).filter(([d]) => d !== ROLE_DOMAIN[x]).flatMap(([, o]) => o);
const c2b: Rule[] = Object.keys(ROLE_DOMAIN).flatMap((x) => VERBS.map((v) => ({ id:`C2b-${x}-${v}`, cls:"C2b", pat:[x,v], ban:otherObjects(x) })));

const frames = [["is","the","person","who"],["is","a","person","who"],["is","a","business","that"]];
const c3a: Rule[] = ROLES8.flatMap((x) => frames.map((f, i) => ({ id:`C3a-${x}-${i}`, cls:"C3a", pat:[x,...f], ban:others(x, DEF) })));

const c4a: Rule[] = TREE.filter((r) => ["TC01","TC02","TC03","TC04"].includes(r.id)).map((r) => ({ ...r, cls:"C4a" }));
const c4b: Rule[] = [{ id:"C4b-claims", cls:"C4b", pat:pat("claims up to"), ban:numBan("ten","twenty","one") }, { id:"C4b-claim", cls:"C4b", pat:pat("claim up to"), ban:numBan("ten","twenty","one") }];
const c4c: Rule[] = TREE.filter((r) => ["TC06","TC07","TC08","TC09","TC10","TC11","TC12","TC14","TC15","TC16","TC17","TC31","TC32","TC33"].includes(r.id)).map((r) => ({ ...r, cls:"C4c" }));
const LIMIT_NUMS = ["three","six","thirty","fourteen","ten","seven","one"];
const c4d: Rule[] = [{ id:"C4d-within", cls:"C4d", pat:["within"], allow:LIMIT_NUMS }];
const c4e: Rule[] = [{ id:"C4e-upto", cls:"C4e", pat:pat("up to"), allow:["ten","twenty","one"] }];
const c4f: Rule[] = [{ id:"C4f-must-be-brought", cls:"C4f", pat:pat("must be brought within"), allow:["three","six"] }];

const REL: [string,string,string[]][] = [
  ["tenant","pays",["rent"]],["buyer","pays",["price"]],["customer","pays",["invoice"]],["trader","pays",["cost","costs"]],["landlord","pays",["deposit","penalty"]],
  ["landlord","gets",["rent"]],["seller","supplies",["goods"]],["supplier","sends",["invoice"]],["landlord","owns",["home","house","flat"]],["tenant","rents",["home","flat"]],
  ["judge","decides",["case","facts"]],["homeowner","owns",["house","home"]],["auditor","checks",["accounts"]],["manufacturer","makes",["product"]],["customer","makes",["offer"]],
  ["defendant","answers",["claim"]],["claimant","brings",["claim"]],["debtor","owes",["money"]],["creditor","gets",["money"]],
];
const PAYABLES = ["rent","price","invoice","cost","costs","penalty","deposit","money"];
const c5a: Rule[] = REL.filter(([, v]) => v === "pays").map(([x, v, o]) => ({ id:`C5a-${x}`, cls:"C5a", pat:["the",x,v,"the"], ban:PAYABLES.filter((p) => !o.includes(p)) }));
const c5b: Rule[] = REL.map(([x, v, o]) => ({ id:`C5b-${x}-${v}`, cls:"C5b", pat:["the",x,v,"the"], allow:o }));
const c5c: Rule[] = ["tenant","buyer","customer","trader","landlord","consumer","debtor","claimant","defendant"].map((x) => ({ id:`C5c-${x}`, cls:"C5c", pat:["the",x,"pays"], allow:["the"] }));
const c5d: Rule[] = [{ id:"C5d-l", cls:"C5d", pat:pat("the landlord pays the"), ban:["rent"] }, { id:"C5d-t", cls:"C5d", pat:pat("the tenant gets the"), ban:["rent"] }, { id:"C5d-s", cls:"C5d", pat:pat("the seller pays the"), ban:["price"] }, { id:"C5d-b", cls:"C5d", pat:pat("the buyer gets the"), ban:["price"] }];

export const CLASSES: Record<string, { label: string; rules: Rule[] }> = {
  C1a:{ label:"one-word role, report's 7 verbs per role, is_owed -> is", rules:c1a },
  C1a2:{ label:"one-word role, same but is_owed -> owed", rules:c1a2 },
  C1b:{ label:"one-word role, payee cannot pay (pays|pay)", rules:c1b },
  C2a:{ label:"role + modal, other roles' base verbs (ch07 T-CAN shape)", rules:c2a },
  C2b:{ label:"role + verb, other domains' object nouns as next token", rules:c2b },
  C3a:{ label:"definition frames, report's KB (3 frames x 8 roles)", rules:c3a },
  C4a:{ label:"numeric: track is for claims up to|of no more than", rules:c4a },
  C4b:{ label:"numeric, loose: claim(s) up to", rules:c4b },
  C4c:{ label:"numeric: subject-bound time, penalty and mediation frames", rules:c4c },
  C4d:{ label:"numeric, one word: within -> limit numbers only", rules:c4d },
  C4e:{ label:"numeric, two words: up to -> track numbers only", rules:c4e },
  C4f:{ label:"numeric, subject-free: must be brought within", rules:c4f },
  C5a:{ label:"relation: the x pays the -> ban others' payables", rules:c5a },
  C5b:{ label:"relation: the x v the -> closed object list (19 pairs)", rules:c5b },
  C5c:{ label:"relation, shorter: the x pays -> closed {the}", rules:c5c },
  C5d:{ label:"relation, counterpart bans: the landlord pays the !rent etc.", rules:c5d },
};
```


<a id="p1"></a>

### p1: counts, tokenizer reconstruction, old KB words

Command: `cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && bun run p1_counts.ts`

Source (`/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes/p1_counts.ts`):

```ts
// Q1, Q2: token and vocabulary counts, old KB firing, and reconstruction of the 6,447 figure.
import { tfStream, lawSentences, buildVocab, mergesFor, LAW_DATASET, TRAIN_TEXTS, CIVIL_LAW_DEFINITIONS, STORIES, CORPUS, windowsFor, REPO } from "./common";
import { trainBpeOnText, applyMerges } from "/Users/nedpham/Projects/neural_symbolic_nlp/src/server/lib/bpe.ts";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const tf = tfStream();
const N = tf.ids.length;
console.log("== Transformer stream (TRAIN_TEXTS + buildVocabulary())");
console.log({ texts: TRAIN_TEXTS.length, defs: CIVIL_LAW_DEFINITIONS.length, stories: STORIES.length, tokens: N, vocab: tf.indexToWord.length, merges: tf.bpeMerges.length,
  windows: N - 16, windowPositions: (N - 16) * 16,
  noLeadingSpace: tf.indexToWord.filter((t) => !t.startsWith(" ")) });
const hash = createHash("sha256").update(TRAIN_TEXTS.join("\n")).digest("hex").slice(0, 8);
console.log("sha256(join \\n) first 8:", hash);

console.log("== LAW_DATASET stream (CORPUS, Skip-gram)");
const law = lawSentences();
const lawV = buildVocab(LAW_DATASET);
const lawN = law.reduce((a, s) => a + s.length, 0);
console.log({ sentences: CORPUS.length, tokens: lawN, vocab: lawV.indexToWord.length, merges: mergesFor(LAW_DATASET).length,
  multiCharOnly: lawV.indexToWord.filter((t) => t.length === 1) });

// saved weights vocabulary
const f = `${REPO}/.data/transformer-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-v4.json`;
const j = JSON.parse(readFileSync(f, "utf8"));
const same = j.vocab.length === tf.indexToWord.length && j.vocab.every((t: string, i: number) => t === tf.indexToWord[i]);
console.log("weights vocab", j.vocab.length, "identical to rebuilt:", same, "config", JSON.stringify(j.config));

console.log("== Q2 reconstruct 6,447: old regex /\\s\\w+|[^\\w\\s]/g, 1000 merges");
function old(texts: string[], merges: number, join: "bare" | "sp") {
  const RE = /\s\w+|[^\w\s]/g;
  const body = join === "bare" ? texts.map((s) => s).join(" ") : texts.map((s) => ` ${s}`).join("");
  const { merges: m } = trainBpeOnText(body.toLowerCase(), merges, RE);
  const toks: string[] = [];
  for (const s of texts) toks.push(...applyMerges(` ${s}`.toLowerCase(), m, RE));
  return { toks, vocab: new Set(toks).size, merges: m.length };
}
for (const [name, texts] of [["TRAIN_TEXTS", TRAIN_TEXTS], ["STORIES", STORIES]] as const) {
  for (const j of ["sp", "bare"] as const) {
    const r = old(texts as string[], 1000, j);
    console.log(name, j, "tokens", r.toks.length, "vocab", r.vocab, "merges", r.merges, "windows", r.toks.length - 16, "windowPos", (r.toks.length - 16) * 16);
  }
}
const oldR = old(TRAIN_TEXTS, 1000, "sp");
const oldTail = (w: string) => w.trim();
// rebuild words from the old pieces the way contextWords does
const oldWords = oldR.toks.join("").trim().split(/\s+/);
console.log("old stream word occurrences (join, whitespace split):", oldWords.length, "tf word tokens excluding pure punctuation:", tf.words.filter((w) => /\w/.test(w)).length);
const ROLES14 = ["court","landlord","tenant","claimant","defendant","trader","consumer","creditor","debtor","buyer","seller","supplier","customer"];
const counts: Record<string, number> = {};
for (const w of tf.words) if (ROLES14.includes(w)) counts[w] = (counts[w] ?? 0) + 1;
console.log("role-word counts, current stream (exact word):", counts, "sum", Object.values(counts).reduce((a, b) => a + b, 0));

console.log("== Q1 old KB surface and entity occurrences");
const ENT = ["eagle","bird","fish","girl","boy","king","queen","human","bear","wolf"];
const SF = ["fly","flies","flew","flying","swim","swims","swam","swimming"];
const OBJ = ["animal","forest"];
const lawWords = law.flat();
for (const w of [...ENT, ...SF, ...OBJ]) {
  const a = tf.words.filter((x) => x === w).length, b = lawWords.filter((x) => x === w).length;
  const sub = TRAIN_TEXTS.join(" ").toLowerCase().split(w).length - 1;
  console.log(w.padEnd(10), "tf", a, "law", b, "substring", sub);
}
```

Raw output:

```text
== Transformer stream (TRAIN_TEXTS + buildVocabulary())
{
  texts: 256,
  defs: 222,
  stories: 34,
  tokens: 5390,
  vocab: 937,
  merges: 1781,
  windows: 5374,
  windowPositions: 85984,
  noLeadingSpace: [ ".", ",", "'" ],
}
sha256(join \n) first 8: bf9d5315
== LAW_DATASET stream (CORPUS, Skip-gram)
{
  sentences: 401,
  tokens: 4887,
  vocab: 924,
  merges: 1625,
  multiCharOnly: [ "a", "i" ],
}
weights vocab 937 identical to rebuilt: true config {"vocabSize":937,"contextLen":32,"embDim":32,"numHeads":2,"ffDim":128,"numLayers":2}
== Q2 reconstruct 6,447: old regex /\s\w+|[^\w\s]/g, 1000 merges
TRAIN_TEXTS sp tokens 6447 vocab 807 merges 1000 windows 6431 windowPos 102896
TRAIN_TEXTS bare tokens 6447 vocab 807 merges 1000 windows 6431 windowPos 102896
STORIES sp tokens 3966 vocab 782 merges 1000 windows 3950 windowPos 63200
STORIES bare tokens 3966 vocab 782 merges 1000 windows 3950 windowPos 63200
old stream word occurrences (join, whitespace split): 4887 tf word tokens excluding pure punctuation: 4887
role-word counts, current stream (exact word): {
  claimant: 4,
  defendant: 5,
  court: 49,
  landlord: 22,
  tenant: 7,
  trader: 11,
  consumer: 10,
  seller: 1,
  buyer: 1,
  supplier: 2,
  customer: 4,
  creditor: 1,
  debtor: 4,
} sum 121
== Q1 old KB surface and entity occurrences
eagle      tf 0 law 0 substring 0
bird       tf 0 law 0 substring 0
fish       tf 0 law 0 substring 1
girl       tf 0 law 0 substring 0
boy        tf 0 law 0 substring 0
king       tf 0 law 0 substring 9
queen      tf 0 law 0 substring 0
human      tf 0 law 0 substring 0
bear       tf 0 law 0 substring 0
wolf       tf 0 law 0 substring 0
fly        tf 0 law 0 substring 0
flies      tf 0 law 0 substring 0
flew       tf 0 law 0 substring 0
flying     tf 0 law 0 substring 0
swim       tf 0 law 0 substring 0
swims      tf 0 law 0 substring 0
swam       tf 0 law 0 substring 0
swimming   tf 0 law 0 substring 0
animal     tf 0 law 0 substring 0
forest     tf 0 law 0 substring 0
```

<a id="p2"></a>

### p2: chapter 07 engine with the old KB and the frame-scoped KB

Command: `cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && bun run p2_engine.ts; bun run p2b.ts`

Source (`/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes/p2_engine.ts`):

```ts
// Q1 and Q3: run chapter 07's own allowed() engine with the old KB and with the frame-scoped KB.
import { tfStream, lawSentences, corpusLineOf, TRAIN_TEXTS, LAW_DATASET, buildVocab } from "./common";
import { KnowledgeBase, RULES, TRIPLES, TRIGGERS, SURFACE, buildTokenIndex, allowed, type Rule, type Triple, type Trigger } from "./symbolic_ch07";

const tf = tfStream();
const N = tf.ids.length;
const tokenIndex = buildTokenIndex(tf.indexToWord);

function runStream(kb: KnowledgeBase, trig: Trigger[], label: string) {
  let fired = 0, ban = 0, conflict = 0, targetSupported = 0; const lines: string[] = []; const unenf = new Set<string>();
  for (let p = 1; p < N; p++) {
    const a = allowed(kb, tf.ids.slice(Math.max(0, p - 16), p), tf.indexToWord, tokenIndex, trig);
    if (a.fired.length || a.unenforceable.length) {
      fired++; a.unenforceable.forEach((u) => unenf.add(u));
      if (a.banned.length) ban++;
      if (a.banned.includes(tf.ids[p])) conflict++;
      if (a.supported.includes(tf.ids[p])) targetSupported++;
      lines.push(`p=${p} L${corpusLineOf(TRAIN_TEXTS[tf.textIdx[p]])} "${tf.toks.slice(Math.max(0,p-6), p).join("")}" -> "${tf.toks[p]}" banned=${a.banned.length} supported=${a.supported.map((i)=>tf.indexToWord[i]).join("|")}`);
    }
  }
  console.log(`[${label}] token stream: fired ${fired} of ${N}, conflicts ${conflict}, target supported ${targetSupported}, unenforceable [${[...unenf]}]`);
  lines.slice(0, 20).forEach((l) => console.log("  " + l));
  return { fired };
}
function runWindows(kb: KnowledgeBase, trig: Trigger[], label: string) {
  let fired = 0, conflict = 0, total = 0;
  for (let i = 0; i + 16 < N; i++) {
    const input = tf.ids.slice(i, i + 16), target = tf.ids.slice(i + 1, i + 17);
    for (let t = 0; t < 16; t++) {
      total++;
      const a = allowed(kb, input.slice(0, t + 1), tf.indexToWord, tokenIndex, trig);
      if (a.fired.length) { fired++; if (a.banned.includes(target[t])) conflict++; }
    }
  }
  console.log(`[${label}] windows: fired ${fired} of ${total} (${(100*fired/total).toFixed(3)}%), conflicts ${conflict}`);
}

console.log("=== OLD chapter 07 KB, unmodified TRIPLES/RULES/TRIGGERS");
const oldKb = new KnowledgeBase(TRIPLES, RULES);
console.log("facts", oldKb.facts.size, "entities", [...oldKb.entities()].join(","), "surface forms", Object.values(SURFACE).flat().length);
runStream(oldKb, TRIGGERS, "old");
runWindows(oldKb, TRIGGERS, "old");

console.log("=== FRAME-SCOPED KB, as in repo_probes_2026-11-03.md and the report");
const def: [string, string][] = [["claimant","brings"],["defendant","answers"],["landlord","owns"],["tenant","rents"],["trader","sells"],["consumer","buys"],["creditor","is_owed"],["debtor","owes"]];
const cls: Record<string, string> = { claimant:"court_party", defendant:"court_party", landlord:"housing_party", tenant:"housing_party", trader:"trade_party", consumer:"trade_party", creditor:"debt_party", debtor:"debt_party" };
const pairs = [["claimant","defendant"],["landlord","tenant"],["trader","consumer"],["creditor","debtor"]];
const classes = ["court_party","housing_party","trade_party","debt_party"];
const facts: Triple[] = [
  ...def.map(([a,b]) => ({ rel:"defined_by", a, b })),
  ...Object.entries(cls).map(([a,b]) => ({ rel:"is_a", a, b })),
  ...pairs.map(([a,b]) => ({ rel:"counterpart", a, b })),
];
for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) facts.push({ rel:"disjoint", a: classes[i], b: classes[j] });
console.log("base facts", facts.length);
const rules: Rule[] = [
  { id:"R-SYM-COUNTERPART", if:[{rel:"counterpart",a:"?x",b:"?y"}], then:{rel:"counterpart",a:"?y",b:"?x"} },
  { id:"R-SYM-DISJOINT", if:[{rel:"disjoint",a:"?c",b:"?d"}], then:{rel:"disjoint",a:"?d",b:"?c"} },
  { id:"R-CLASS", if:[{rel:"is_a",a:"?y",b:"?d"},{rel:"defined_by",a:"?y",b:"?v"}], then:{rel:"class_verb",a:"?d",b:"?v"} },
  { id:"R-COUNTER", if:[{rel:"counterpart",a:"?x",b:"?y"},{rel:"defined_by",a:"?y",b:"?v"}], then:{rel:"not_defined_by",a:"?x",b:"?v"} },
  { id:"R-OTHER-DOMAIN", if:[{rel:"is_a",a:"?x",b:"?c"},{rel:"disjoint",a:"?c",b:"?d"},{rel:"class_verb",a:"?d",b:"?v"}], then:{rel:"not_defined_by",a:"?x",b:"?v"} },
];
const kb = new KnowledgeBase(facts, rules);
const nd = [...kb.facts.values()].filter((f) => f.t.rel === "not_defined_by");
console.log("closure facts", kb.facts.size, "not_defined_by", nd.length,
  "per role", Object.keys(cls).map((r) => `${r}:${kb.objects("not_defined_by", r).length}`).join(" "),
  "contradictions", [...kb.facts.values()].filter((f) => f.t.rel === "defined_by" && kb.has("not_defined_by", f.t.a, f.t.b)).length);
(SURFACE as Record<string,string[]>).is_owed = ["is"];
const frames = [["?x","is","the","person","who"],["?x","is","a","person","who"],["?x","is","a","business","that"]];
const trig: Trigger[] = frames.flatMap((pat, i) => [
  { id:`T-F${i}-BAN`, pattern: pat, rel:"not_defined_by", mode:"ban" as const },
  { id:`T-F${i}-SUP`, pattern: pat, rel:"defined_by", mode:"support" as const },
]);
runStream(kb, trig, "frame");
runWindows(kb, trig, "frame");

console.log("=== Single-token check under both tokenizers");
const words = [...Object.keys(cls), "brings","answers","owns","rents","sells","buys","is","owes","owed"];
const lawV = buildVocab(LAW_DATASET);
for (const w of words) console.log(w.padEnd(10), "tf:", JSON.stringify(tf.tokenize(w)), tf.wordToIndex.has(` ${w}`), "law:", lawV.wordToIndex.has(w));
```

Raw output:

```text
=== OLD chapter 07 KB, unmodified TRIPLES/RULES/TRIGGERS
facts 19 entities eagle,bird,fish,girl,boy,king,queen,human,bear,wolf surface forms 8
[old] token stream: fired 0 of 5390, conflicts 0, target supported 0, unenforceable []
[old] windows: fired 0 of 85984 (0.000%), conflicts 0
=== FRAME-SCOPED KB, as in repo_probes_2026-11-03.md and the report
base facts 26
closure facts 100 not_defined_by 56 per role claimant:7 defendant:7 landlord:7 tenant:7 trader:7 consumer:7 creditor:7 debtor:7 contradictions 0
[frame] token stream: fired 8 of 5390, conflicts 0, target supported 8, unenforceable []
  p=6 L23 " the claimant is the person who" -> " brings" banned=7 supported= brings
  p=16 L24 " the defendant is the person who" -> " answers" banned=7 supported= answers
  p=43 L27 " the landlord is the person who" -> " owns" banned=7 supported= owns
  p=53 L28 " the tenant is the person who" -> " rents" banned=7 supported= rents
  p=75 L31 " the trader is a business that" -> " sells" banned=7 supported= sells
  p=84 L32 " the consumer is a person who" -> " buys" banned=7 supported= buys
  p=117 L37 " the creditor is the person who" -> " is" banned=7 supported= is
  p=127 L38 " the debtor is the person who" -> " owes" banned=7 supported= owes
[frame] windows: fired 86 of 85984 (0.100%), conflicts 0
=== Single-token check under both tokenizers
claimant   tf: [" claimant"] true law: true
defendant  tf: [" defendant"] true law: true
landlord   tf: [" landlord"] true law: true
tenant     tf: [" tenant"] true law: true
trader     tf: [" trader"] true law: true
consumer   tf: [" consumer"] true law: true
creditor   tf: [" creditor"] true law: true
debtor     tf: [" debtor"] true law: true
brings     tf: [" brings"] true law: true
answers    tf: [" answers"] true law: true
owns       tf: [" owns"] true law: true
rents      tf: [" rents"] true law: true
sells      tf: [" sells"] true law: true
buys       tf: [" buys"] true law: true
is         tf: [" is"] true law: true
owes       tf: [" owes"] true law: true
owed       tf: [" owed"] true law: true
```

p2b source and output (11-occurrence words):

```ts
import { tfStream } from "./common";
const tf = tfStream();
const c = new Map<string, number>();
for (const w of tf.words) c.set(w, (c.get(w) ?? 0) + 1);
console.log("words with exactly 11 occurrences:", [...c].filter(([, n]) => n === 11).map(([w]) => w).join(" "));
```

```text
words with exactly 11 occurrences: trader judge neighbour before costs ten order thirty duty three tenancy notice
```

<a id="p3"></a>

### p3: CIVIL_LAW_CORPUS vocabulary coverage

Command: `cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && bun run p3_vocab.ts`

Source (`/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes/p3_vocab.ts`):

```ts
// Q4: how much of CIVIL_LAW_CORPUS can each tokenizer represent?
// Choices: lower-cased; bracket tags [STD...] and the entry-ID prefix removed; pre-token regex /\w+(?:'\w+)*/;
// numeric = pre-token containing a digit. Tags-kept variant also printed.
import { tfStream, buildVocab, LAW_DATASET, lawTokenize, CIVIL_LAW_CORPUS } from "./common";
const tf = tfStream();
const lawV = buildVocab(LAW_DATASET);
const isTree = (e: string) => e.startsWith("TREE ");
const isFP = (e: string) => /^FP-\d+/.test(e);
const concepts = CIVIL_LAW_CORPUS.filter((e) => !isTree(e) && !isFP(e));
const trees = CIVIL_LAW_CORPUS.filter(isTree);
const fps = CIVIL_LAW_CORPUS.filter(isFP);
console.log({ total: CIVIL_LAW_CORPUS.length, concepts: concepts.length, trees: trees.length, fps: fps.length });

function preTokens(entries: string[], keepTags = false) {
  const out: string[] = [];
  for (let e of entries) {
    if (!keepTags) e = e.replace(/\[[^\]]*\]/g, " ");
    if (!keepTags) e = e.replace(/^TREE [A-Z-]+/, " ").replace(/^[A-Z][A-Z0-9-]*\.\s/, " ");
    out.push(...(e.toLowerCase().match(/\w+(?:'\w+)*/g) ?? []));
  }
  return out;
}
type Cat = "single" | "split" | "none";
const memo = new Map<string, { tf: Cat; law: Cat }>();
function classify(w: string) {
  let m = memo.get(w);
  if (m) return m;
  const a = tf.tokenize(w);
  const tfc: Cat = a.every((t) => tf.wordToIndex.has(t)) ? (a.length === 1 ? "single" : "split") : "none";
  const b = lawTokenize(w, LAW_DATASET);
  const lc: Cat = b.every((t) => lawV.wordToIndex.has(t)) ? (b.length === 1 ? "single" : "split") : "none";
  m = { tf: tfc, law: lc }; memo.set(w, m); return m;
}
function report(label: string, toks: string[]) {
  const alpha = toks.filter((t) => !/\d/.test(t)), num = toks.filter((t) => /\d/.test(t));
  const types = [...new Set(alpha)];
  const row = (k: "tf" | "law", c: Cat) => {
    const ty = types.filter((w) => classify(w)[k] === c).length;
    const to = alpha.filter((w) => classify(w)[k] === c).length;
    return `${c}: types ${ty}/${types.length} (${(100 * ty / types.length).toFixed(1)}%), tokens ${to}/${alpha.length} (${(100 * to / alpha.length).toFixed(1)}%)`;
  };
  console.log(`-- ${label}: alpha tokens ${alpha.length}, alpha types ${types.length}; numeric tokens ${num.length}, numeric types ${new Set(num).size} (all digits absent from both vocabularies: ${[...new Set(num)].every((n) => classify(n).tf === "none" && classify(n).law === "none")})`);
  for (const k of ["law", "tf"] as const) { console.log(`   ${k === "law" ? "LAW_DATASET" : "transformer"}  ` + (["single", "split", "none"] as Cat[]).map((c) => row(k, c)).join(" | ")); }
}
const ct = preTokens([...concepts, ...trees]);
report("concepts + trees (main measure)", ct);
report("concepts only", preTokens(concepts));
report("trees only", preTokens(trees));
report("FP-01..44 only", preTokens(fps));
report("concepts + trees, tags and IDs kept", preTokens([...concepts, ...trees], true));

// split-category examples and concatenation spelling
const types = [...new Set(ct.filter((t) => !/\d/.test(t)))];
console.log("LAW split examples:", types.filter((w) => classify(w).law === "split").slice(0, 25).map((w) => `${w}=${lawTokenize(w, LAW_DATASET).join("+")}`).join(" "));
console.log("TF split examples:", types.filter((w) => classify(w).tf === "split").slice(0, 25).map((w) => `${w}=${tf.tokenize(w).join("+")}`).join(" "));
function spellable(s: string, vocab: string[]) {
  const ok = new Array(s.length + 1).fill(false); ok[0] = true;
  for (let i = 0; i < s.length; i++) if (ok[i]) for (const t of vocab) if (t && s.startsWith(t, i)) ok[i + t.length] = true;
  return ok[s.length];
}
const lawVocab = lawV.indexToWord, tfVocab = tf.indexToWord;
const miss = types.filter((w) => classify(w).law !== "single");
const lawSp = miss.filter((w) => spellable(w, lawVocab));
const missT = types.filter((w) => classify(w).tf !== "single");
const tfSp = missT.filter((w) => spellable(" " + w, tfVocab));
console.log(`non-single types spellable by concatenating vocabulary tokens (string level, not what the tokenizer emits): LAW ${lawSp.length}/${miss.length}; TF ${tfSp.length}/${missT.length}`);
console.log("LAW spellable sample:", lawSp.slice(0, 40).join(" "));
console.log("TF spellable sample:", tfSp.slice(0, 40).join(" "));

// what the tokenizer does to an unseen word in the training pipeline: pieces not in vocab are dropped by train.ts's idx !== undefined filter
for (const w of ["warranty", "acceptance", "repudiation", "claimants", "nuisance"]) {
  console.log(`  ${w}: tf pieces ${JSON.stringify(tf.tokenize(w))} kept ${JSON.stringify(tf.tokenize(w).filter((t) => tf.wordToIndex.has(t)))}; law pieces ${JSON.stringify(lawTokenize(w, LAW_DATASET))}`);
}

// missing terms by frequency
const freq = new Map<string, number>();
for (const w of ct) if (!/\d/.test(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
const missing = [...freq].filter(([w]) => classify(w).tf !== "single").sort((a, b) => b[1] - a[1]);
const missingLaw = [...freq].filter(([w]) => classify(w).law !== "single").sort((a, b) => b[1] - a[1]);
console.log(`missing (TF) types ${missing.length}; top 90:`, missing.slice(0, 90).map(([w, n]) => `${w}:${n}`).join(" "));
console.log(`missing (LAW) types ${missingLaw.length}`);
const onlyTf = missingLaw.filter(([w]) => classify(w).tf === "single").map(([w]) => w);
const onlyLaw = missing.filter(([w]) => classify(w).law === "single").map(([w]) => w);
console.log("single in TF but not LAW:", onlyTf.join(" "), "| single in LAW but not TF:", onlyLaw.join(" "));
// near-miss inflections
const inVocab = (w: string) => tf.wordToIndex.has(` ${w}`);
const stems = (w: string) => [w.replace(/'s$/, ""), w.replace(/s$/, ""), w.replace(/es$/, ""), w.replace(/ed$/, ""), w.replace(/d$/, ""), w.replace(/ing$/, ""), w.replace(/ing$/, "e"), w + "s", w + "d", w + "ed"].filter((x) => x !== w);
const near = missing.filter(([w]) => stems(w).some(inVocab));
console.log(`missing with a simple inflectional neighbour in the vocabulary: ${near.length}/${missing.length}; sample:`, near.slice(0, 30).map(([w]) => w).join(" "));

const CURATED = ["offer","offeror","offeree","acceptance","invitation","treat","unilateral","counter","revocation","postal","consideration","intention","certainty","condition","warranty","innominate","terminate","termination","repudiation","remoteness","remote","nominal","specific","performance","equitable","discretionary","injunction",
 "duty","negligence","foreseeable","proximity","proximate","breach","standard","causation","volenti","contributory","liability","liable","latent","accrual","accrued","limitation","knowledge","disapply","time","barred",
 "satisfactory","quality","fit","purpose","description","reject","rejection","refund","repair","replacement","reduction","perishable","presumption","conform","installation",
 "track","small","fast","intermediate","multi","allocation","expert","experts","trial","mesothelioma","disrepair","psla","rta","mediation","adr","hmcts","sanction","sanctions","stay","protocol","pre","churchill","caparo","referral",
 "deposit","scheme","custodial","prescribed","penalty","repayment","nuisance","private","proprietary","interference","locality","injunction","standing","trader","consumer","claimant","defendant"];
console.log("CURATED term status (word: freq in concepts+trees; tf/law):");
console.log([...new Set(CURATED)].map((w) => `${w}:${freq.get(w) ?? 0}:${classify(w).tf[0]}/${classify(w).law[0]}`).join(" "));

// multi-word terms in the training stream
const hay = " " + tf.words.join(" ") + " ";
const lawHay = " " + ct.join(" ") + " ";
const MW = ["specific performance","invitation to treat","counter offer","postal rule","private nuisance","statutory nuisance","innocent party","duty of care","but for","price reduction","final right to reject","short term right to reject","time barred","reasonably foreseeable","contributory negligence","breach of contract","breach of duty","no contract","no liability","no breach","in time","right to repair","repeat performance","mesothelioma claims","clinical negligence","personal injury","small claims","fast track","intermediate track","multi track","letter before claim","pre action","date of knowledge","satisfactory quality","fair just and reasonable","fit for","nominal damages","economic loss","causation fails","volenti non fit injuria"];
console.log("multi-word term: train count / concepts+trees count");
for (const t of MW) console.log(`  ${t}: ${hay.split(" " + t + " ").length - 1} / ${lawHay.split(" " + t + " ").length - 1}`);
```

Raw output:

```text
{
  total: 118,
  concepts: 63,
  trees: 11,
  fps: 44,
}
-- concepts + trees (main measure): alpha tokens 3650, alpha types 967; numeric tokens 295, numeric types 100 (all digits absent from both vocabularies: true)
   LAW_DATASET  single: types 395/967 (40.8%), tokens 2681/3650 (73.5%) | split: types 7/967 (0.7%), tokens 9/3650 (0.2%) | none: types 565/967 (58.4%), tokens 960/3650 (26.3%)
   transformer  single: types 395/967 (40.8%), tokens 2681/3650 (73.5%) | split: types 0/967 (0.0%), tokens 0/3650 (0.0%) | none: types 572/967 (59.2%), tokens 969/3650 (26.5%)
-- concepts only: alpha tokens 2359, alpha types 792; numeric tokens 159, numeric types 76 (all digits absent from both vocabularies: true)
   LAW_DATASET  single: types 352/792 (44.4%), tokens 1736/2359 (73.6%) | split: types 6/792 (0.8%), tokens 7/2359 (0.3%) | none: types 434/792 (54.8%), tokens 616/2359 (26.1%)
   transformer  single: types 352/792 (44.4%), tokens 1736/2359 (73.6%) | split: types 0/792 (0.0%), tokens 0/2359 (0.0%) | none: types 440/792 (55.6%), tokens 623/2359 (26.4%)
-- trees only: alpha tokens 1291, alpha types 467; numeric tokens 136, numeric types 56 (all digits absent from both vocabularies: true)
   LAW_DATASET  single: types 232/467 (49.7%), tokens 945/1291 (73.2%) | split: types 2/467 (0.4%), tokens 2/1291 (0.2%) | none: types 233/467 (49.9%), tokens 344/1291 (26.6%)
   transformer  single: types 232/467 (49.7%), tokens 945/1291 (73.2%) | split: types 0/467 (0.0%), tokens 0/1291 (0.0%) | none: types 235/467 (50.3%), tokens 346/1291 (26.8%)
-- FP-01..44 only: alpha tokens 2691, alpha types 885; numeric tokens 274, numeric types 76 (all digits absent from both vocabularies: true)
   LAW_DATASET  single: types 424/885 (47.9%), tokens 1773/2691 (65.9%) | split: types 7/885 (0.8%), tokens 51/2691 (1.9%) | none: types 454/885 (51.3%), tokens 867/2691 (32.2%)
   transformer  single: types 426/885 (48.1%), tokens 1776/2691 (66.0%) | split: types 0/885 (0.0%), tokens 0/2691 (0.0%) | none: types 459/885 (51.9%), tokens 915/2691 (34.0%)
-- concepts + trees, tags and IDs kept: alpha tokens 4244, alpha types 1106; numeric tokens 487, numeric types 163 (all digits absent from both vocabularies: true)
   LAW_DATASET  single: types 414/1106 (37.4%), tokens 2871/4244 (67.6%) | split: types 10/1106 (0.9%), tokens 13/4244 (0.3%) | none: types 682/1106 (61.7%), tokens 1360/4244 (32.0%)
   transformer  single: types 414/1106 (37.4%), tokens 2871/4244 (67.6%) | split: types 0/1106 (0.0%), tokens 0/4244 (0.0%) | none: types 692/1106 (62.6%), tokens 1373/4244 (32.4%)
LAW split examples: offeror=offer+or soon=so+on undertaken=under+taken seatbelt=seat+belt ownership=owner+ship issued=is+sued issue=is+sue
TF split examples: 
non-single types spellable by concatenating vocabulary tokens (string level, not what the tokenizer emits): LAW 12/572; TF 0/572
LAW spellable sample: offeror soon assent undertaken termination seatbelt ownership rejection action issued information issue
TF spellable sample: 
  warranty: tf pieces [" warrant","y"] kept [" warrant"]; law pieces ["warrant","y"]
  acceptance: tf pieces [" acceptance"] kept [" acceptance"]; law pieces ["acceptance"]
  repudiation: tf pieces [" rep","u","d","i","ation"] kept []; law pieces ["rep","u","di","ation"]
  claimants: tf pieces [" claimant","s"] kept [" claimant"]; law pieces ["claimant","s"]
  nuisance: tf pieces [" nuisance"] kept [" nuisance"]; law pieces ["nuisance"]
missing (TF) types 572; top 90: y:38 v:21 ac:13 adr:10 qb:9 performance:9 period:8 action:8 para:8 pd:8 such:7 remedy:7 liability:6 innocent:5 applies:5 non:5 apply:5 scotland:5 rta:5 pilot:5 offeree:4 benefit:4 causing:4 this:4 claimant's:4 defence:4 consider:4 unreasonable:4 repeat:4 simple:4 cause:4 per:4 experts:4 sanctions:4 amended:4 referral:4 specified:4 generally:3 communicated:3 wlr:3 some:3 sufficient:3 sum:3 social:3 certain:3 terminate:3 consequences:3 recoverable:3 specific:3 equitable:3 unique:3 normally:3 appeal:3 wales:3 novel:3 established:3 cases:3 uksc:3 practice:3 occurred:3 traffic:3 require:3 including:3 cra:3 accrued:3 normal:3 cpr:3 churchill:3 october:3 automatic:3 modified:3 private:3 factors:3 pac:3 statement:2 offeror:2 separate:2 silence:2 posting:2 responsibility:2 suffered:2 adequate:2 support:2 create:2 relations:2 domestic:2 present:2 commercial:2 rebutted:2 kb:2
missing (LAW) types 572
single in TF but not LAW:  | single in LAW but not TF: 
missing with a simple inflectional neighbour in the vocabulary: 59/572; sample: claimant's cause sanctions cases posting judged include purposes trader's treated performed founded tracks courts stay timing fail willing offers performing requested receives goes root arises contracted persons imposed lowered acted
CURATED term status (word: freq in concepts+trees; tf/law):
offer:14:s/s offeror:2:n/s offeree:4:n/n acceptance:13:s/s invitation:3:s/s treat:2:s/s unilateral:3:s/s counter:2:s/s revocation:3:s/s postal:2:s/s consideration:8:s/s intention:5:s/s certainty:0:n/n condition:2:n/n warranty:2:n/n innominate:2:n/n terminate:3:n/n termination:1:n/n repudiation:1:n/n remoteness:1:s/s remote:2:s/s nominal:1:n/n specific:3:n/n performance:9:n/n equitable:3:n/n discretionary:2:n/n injunction:1:n/n duty:11:s/s negligence:6:s/s foreseeable:5:s/s proximity:1:n/n proximate:1:n/n breach:20:s/s standard:4:s/s causation:4:s/s volenti:2:n/n contributory:0:s/s liability:6:n/n liable:3:s/s latent:2:n/n accrual:1:n/n accrued:3:n/n limitation:3:s/s knowledge:5:s/s disapply:1:n/n time:11:s/s barred:1:n/n satisfactory:2:s/s quality:3:s/s fit:2:s/s purpose:3:s/s description:4:s/s reject:5:s/s rejection:2:n/n refund:4:s/s repair:7:s/s replacement:6:s/s reduction:4:s/s perishable:1:n/n presumption:4:s/s conform:3:s/s installation:2:n/n track:14:s/s small:7:s/s fast:3:s/s intermediate:2:s/s multi:4:s/s allocation:0:n/n expert:2:n/n experts:4:n/n trial:4:s/s mesothelioma:2:n/n disrepair:2:n/n psla:2:n/n rta:5:n/n mediation:7:s/s adr:10:n/n hmcts:2:n/n sanction:2:s/s sanctions:4:n/n stay:2:n/n protocol:1:n/n pre:2:n/n churchill:3:n/n caparo:3:s/s referral:4:n/n deposit:10:s/s scheme:5:s/s custodial:1:n/n prescribed:1:n/n penalty:1:s/s repayment:1:n/n nuisance:6:s/s private:3:n/n proprietary:1:n/n interference:2:n/n locality:2:n/n standing:0:n/n trader:7:s/s consumer:13:s/s claimant:6:s/s defendant:6:s/s
multi-word term: train count / concepts+trees count
  specific performance: 0 / 2
  invitation to treat: 4 / 2
  counter offer: 4 / 2
  postal rule: 2 / 2
  private nuisance: 0 / 3
  statutory nuisance: 3 / 0
  innocent party: 0 / 5
  duty of care: 4 / 2
  but for: 3 / 2
  price reduction: 4 / 4
  final right to reject: 3 / 3
  short term right to reject: 2 / 2
  time barred: 0 / 1
  reasonably foreseeable: 1 / 3
  contributory negligence: 4 / 0
  breach of contract: 3 / 0
  breach of duty: 1 / 1
  no contract: 3 / 8
  no liability: 0 / 6
  no breach: 0 / 3
  in time: 4 / 1
  right to repair: 0 / 1
  repeat performance: 0 / 4
  mesothelioma claims: 0 / 0
  clinical negligence: 0 / 2
  personal injury: 3 / 10
  small claims: 4 / 7
  fast track: 2 / 3
  intermediate track: 2 / 2
  multi track: 2 / 4
  letter before claim: 2 / 1
  pre action: 0 / 2
  date of knowledge: 3 / 3
  satisfactory quality: 3 / 1
  fair just and reasonable: 1 / 2
  fit for: 2 / 1
  nominal damages: 0 / 1
  economic loss: 0 / 2
  causation fails: 0 / 1
  volenti non fit injuria: 0 / 1
```

<a id="p4"></a>

### p4: tree-derived rules, trigger classes, unions, memorising bound, estimates

Command: `cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && bun run p4_rules.ts`

Source (`/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes/p4_rules.ts`):

```ts
// Q5, Q6, Q7: fire tree-derived and candidate rules over the training text; held-out check on CIVIL_LAW_CORPUS.
import { tfStream, lawSentences, corpusLineOf, apply, summarise, windowsFor, civilWordStream, TRAIN_TEXTS, CIVIL_LAW_CORPUS, CIVIL_LAW_DEFINITIONS, type Rule, type Hit } from "./common";
import { TREE, CLASSES, NUM_ALL } from "./rules";

const tf = tfStream();
const W = tf.words, N = W.length;
const defCount = CIVIL_LAW_DEFINITIONS.length;
const law = lawSentences();
const lawN = law.reduce((a, s) => a + s.length, 0);
const isTree = (e: string) => e.startsWith("TREE "), isFP = (e: string) => /^FP-\d+/.test(e);
const heldCT = civilWordStream(CIVIL_LAW_CORPUS.filter((e) => !isFP(e)));
const heldFP = civilWordStream(CIVIL_LAW_CORPUS.filter(isFP));

const vocab = (w: string) => tf.wordToIndex.has(` ${w}`) || tf.wordToIndex.has(w);
const ctx = (p: number) => `${tf.toks.slice(Math.max(0, p - 8), p).join("")} >>${tf.toks[p]}<<${tf.toks.slice(p + 1, p + 4).join("")}`;
const lineOf = (p: number) => corpusLineOf(TRAIN_TEXTS[tf.textIdx[p]]);

console.log("NUM words in vocab:", NUM_ALL.filter(vocab).join(" "), "| not in vocab:", NUM_ALL.filter((w) => !vocab(w)).join(" "));

// ---- Q5
console.log("\n=== Q5 tree-derived sample");
let fq5 = 0, fb5 = 0; const q5pos = new Set<number>();
for (const r of TREE) {
  let hits = apply([r], W);
  if (r.id === "TC05") hits = hits.filter((h) => W.slice(Math.max(0, h.p - 30), h.p).join(" ").includes("claimed six thousand pounds"));
  const fbs = hits.filter((h) => h.falseBan);
  const miss = [...r.pat, ...(r.ban ?? []), ...(r.allow ?? [])].filter((w) => !vocab(w));
  fq5 += hits.length; fb5 += fbs.length; hits.forEach((h) => q5pos.add(h.p));
  console.log(`${r.id} | ${r.tree} | ${r.pat.join(" ")} | ${r.ban ? "ban " + (r.ban.length > 6 ? `NUM minus {${NUM_ALL.filter((n) => !r.ban!.includes(n)).join(",")}}` : r.ban.join(",")) : "allow only " + r.allow!.join(",")} | fired ${hits.length} | false bans ${fbs.length} | gold ${[...new Set(hits.map((h) => h.gold))].join(",")} | lines ${[...new Set(hits.map((h) => "L" + lineOf(h.p)))].join(",")} | oov ${miss.join(",")}`);
  for (const h of fbs) console.log(`    FALSE L${lineOf(h.p)}: ${ctx(h.p)}`);
}
console.log(`Q5 total: rule firings ${fq5}, distinct positions ${q5pos.size}, false-ban firings ${fb5}`);
const treeOnly = TREE.filter((r) => r.id !== "TC21");
console.log("Q5 excluding closed-list TC21:", new Set(treeOnly.flatMap((r) => { let h = apply([r], W); if (r.id==="TC05") h = h.filter((x)=>W.slice(Math.max(0,x.p-30),x.p).join(" ").includes("claimed six thousand pounds")); return h.map((x) => x.p); })).size);
console.log("key tree words in training text:", ["warranty","condition","terminate","innominate","private","injunction","nominal","specific","performance","expert","experts","uksc"].map((w) => `${w}:${W.filter((x) => x === w).length}`).join(" "));

// ---- mined definition frames C3b/C3c
const copula = ["is","are","means"];
const defFrames = new Map<string, { first: string; all: Set<string> }>();
for (const line of CIVIL_LAW_DEFINITIONS) {
  const w = line.split(" ");
  for (let k = 1; k <= 4 && k < w.length - 1; k++) {
    if (copula.includes(w[k])) {
      const start = ["a","an","the"].includes(w[0]) ? 1 : 0;
      if (k - start < 1 || k - start > 3) break;
      const term = w.slice(start, k + 1).join(" ");
      const e = defFrames.get(term) ?? { first: w[k + 1], all: new Set<string>() };
      e.all.add(w[k + 1]); defFrames.set(term, e);
      break;
    }
  }
}
const c3b: Rule[] = [...defFrames].map(([t, e]) => ({ id:`C3b-${t}`, cls:"C3b", pat:t.split(" "), allow:[e.first] }));
const c3c: Rule[] = [...defFrames].map(([t, e]) => ({ id:`C3c-${t}`, cls:"C3c", pat:t.split(" "), allow:[...e.all] }));
console.log("\nmined definition terms:", defFrames.size);
CLASSES.C3b = { label:"mined: term + copula -> closed {first definition's next word}", rules:c3b };
CLASSES.C3c = { label:"mined: term + copula -> closed {all definition lines' next words}", rules:c3c };

// ---- Q6
console.log("\n=== Q6 classes");
const stats: Record<string, ReturnType<typeof summarise> & { hits: Hit[] }> = {};
console.log("class | positions | % of 5390 | defs/stories | false bans | window positions | % of 85984 | window false | LAW fired/false | held-out concepts+trees fired/false | held-out FP fired/false | oov ban words");
for (const [c, { label, rules }] of Object.entries(CLASSES)) {
  const hits = apply(rules, W);
  const s = summarise(hits, N);
  stats[c] = { ...s, hits };
  const pos = [...s.set.keys()];
  const defs = pos.filter((p) => tf.textIdx[p] < defCount).length;
  let lf = 0, lb = 0;
  for (const sent of law) { const r = summarise(apply(rules, sent), sent.length); lf += r.positions; lb += r.falseBans; }
  const h1 = summarise(apply(rules, heldCT), heldCT.length), h2 = summarise(apply(rules, heldFP), heldFP.length);
  const oov = [...new Set(rules.flatMap((r) => r.ban ?? []))].filter((w) => !vocab(w));
  console.log(`${c} | ${s.positions} | ${(100 * s.positions / N).toFixed(3)} | ${defs}/${s.positions - defs} | ${s.falseBans} | ${s.windows} | ${(100 * s.windows / 85984).toFixed(3)} | ${s.windowFalse} | ${lf}/${lb} | ${h1.positions}/${h1.falseBans} | ${h2.positions}/${h2.falseBans} | ${oov.join(",")}   -- ${label}`);
}
console.log(`denominators: transformer ${N} tokens, 85984 window positions; LAW ${lawN}; held-out concepts+trees ${heldCT.length} word/punct tokens; held-out FP ${heldFP.length}`);

console.log("\n=== Q6 false-ban lines (training text)");
for (const [c, st] of Object.entries(stats)) {
  const fb = st.hits.filter((h) => h.falseBan);
  if (!fb.length) continue;
  const uniq = new Map<number, Hit>(); fb.forEach((h) => uniq.set(h.p, h));
  console.log(`--- ${c}: ${uniq.size} positions`);
  [...uniq.values()].slice(0, c === "C1a" ? 8 : 14).forEach((h) => console.log(`  L${lineOf(h.p)} [${h.rule.id}] ${ctx(h.p)}`));
}

console.log("\n=== Held-out false bans (CIVIL_LAW_CORPUS)");
for (const [c, { rules }] of Object.entries(CLASSES)) {
  for (const [name, words] of [["concepts+trees", heldCT], ["FP", heldFP]] as const) {
    const fb = apply(rules, words).filter((h) => h.falseBan);
    if (!fb.length) continue;
    const seen = new Set<number>();
    const lines = fb.filter((h) => !seen.has(h.p) && seen.add(h.p));
    console.log(`--- ${c} ${name}: ${lines.length}`);
    lines.slice(0, 6).forEach((h) => console.log(`   [${h.rule.id}] ${words.slice(Math.max(0, h.p - 7), h.p).join(" ")} >>${h.gold}<< ${words.slice(h.p + 1, h.p + 4).join(" ")}`));
  }
}

// ---- which held-out rules fired at all for narrow classes
for (const c of ["C3a","C4a","C4c","C5a","C5b"]) {
  const a = apply(CLASSES[c].rules, heldCT), b = apply(CLASSES[c].rules, heldFP);
  console.log(`held-out firings ${c}: concepts+trees ${a.map((h) => h.rule.id).join(",") || "none"}; FP ${b.map((h) => h.rule.id).join(",") || "none"}`);
}

// ---- Q7 unions
console.log("\n=== Q7 unions");
function unionStat(cs: string[], extra: Hit[] = []) {
  const hits = [...cs.flatMap((c) => stats[c].hits), ...extra];
  return summarise(hits, N);
}
const fmt = (s: ReturnType<typeof summarise>) => `${s.positions} positions (${(100 * s.positions / N).toFixed(3)}%), false ${s.falseBans}, windows ${s.windows} (${(100 * s.windows / 85984).toFixed(3)}%), window false ${s.windowFalse}`;
const narrow = ["C3a","C4a","C4c","C5a"];
const zero = Object.keys(stats).filter((c) => stats[c].falseBans === 0 && stats[c].positions > 0);
console.log("classes with fires and 0 false bans:", zero.join(","));
console.log("C3a alone:", fmt(unionStat(["C3a"])));
console.log("C3a + C4a:", fmt(unionStat(["C3a","C4a"])));
console.log("C3a + C4a + C4c:", fmt(unionStat(["C3a","C4a","C4c"])));
console.log("C3a + C4a + C4c + C5a:", fmt(unionStat(narrow)));
console.log("... + C5b:", fmt(unionStat([...narrow,"C5b"])));
console.log("... + tree sample (without TC21):", fmt(unionStat([...narrow,"C5b"], apply(TREE.filter((r) => r.id !== "TC21"), W).filter((h) => h.rule.id !== "TC05" || W.slice(Math.max(0,h.p-30),h.p).join(" ").includes("claimed six thousand pounds")))));
console.log("all zero-false classes:", fmt(unionStat(zero)));
// per-rule pruning of classes with false bans
function pruned(c: string) {
  const bad = new Set(stats[c].hits.filter((h) => h.falseBan).map((h) => h.rule.id));
  return stats[c].hits.filter((h) => !bad.has(h.rule.id));
}
for (const c of Object.keys(stats).filter((c) => stats[c].falseBans > 0)) {
  const bad = new Set(stats[c].hits.filter((h) => h.falseBan).map((h) => h.rule.id));
  const s = summarise(pruned(c), N);
  console.log(`pruned ${c}: rules with a false ban removed ${bad.size}: ${[...bad].slice(0, 30).join(",")}; left ${s.positions} positions, false ${s.falseBans}`);
}
const allPruned = Object.keys(stats).flatMap((c) => pruned(c));
console.log("all classes, every false-banning rule pruned (corpus-tuned):", fmt(summarise(allPruned, N)));

// ---- memorising bound and leave-one-text-out
console.log("\n=== memorising bound: closed allow-list from observed n-gram continuation");
for (const n of [1, 2, 3, 4]) {
  const m = new Map<string, Map<number, number>>();
  const add = (p: number) => { const k = W.slice(p - n, p).join(" "); const e = m.get(k) ?? new Map<number, number>(); e.set(tf.textIdx[p], (e.get(tf.textIdx[p]) ?? 0)); m.set(k, e); };
  const cont = new Map<string, Map<string, Set<number>>>();
  for (let p = n; p < N; p++) {
    const k = W.slice(p - n, p).join(" ");
    const c = cont.get(k) ?? new Map<string, Set<number>>();
    const s = c.get(W[p]) ?? new Set<number>(); s.add(tf.textIdx[p]); c.set(W[p], s); cont.set(k, c);
  }
  let seen = 0, wrong = 0, total = 0;
  for (let p = n; p < N; p++) {
    total++;
    const k = W.slice(p - n, p).join(" ");
    const c = cont.get(k)!;
    const ti = tf.textIdx[p];
    let contextSeenElsewhere = false, goldSeenElsewhere = false;
    for (const [g, s] of c) {
      const other = s.size > 1 || !s.has(ti);
      if (other) { contextSeenElsewhere = true; if (g === W[p]) goldSeenElsewhere = true; }
    }
    if (contextSeenElsewhere) { seen++; if (!goldSeenElsewhere) wrong++; }
  }
  console.log(`n=${n}: in-sample fired ${total}, false 0 (by construction). Leave-one-text-out: mask built from the other 255 texts fires at ${seen}/${total} (${(100 * seen / total).toFixed(1)}%), gold banned at ${wrong} (${(100 * wrong / Math.max(1, seen)).toFixed(1)}% of fired).`);
}

// ---- extension estimates
console.log("\n=== extension estimates");
const sentences = tf.toks.filter((t) => t === ".").length;
console.log("sentence-ending tokens:", sentences, "mean tokens per sentence", (N / sentences).toFixed(2));
const add = (k: number, L: number, F: number) => `${F + k} / ${N + k * L} = ${(100 * (F + k) / (N + k * L)).toFixed(2)}%`;
const base = unionStat(narrow).positions;
for (const k of [8, 24, 50, 100, 500, 2000]) console.log(`add ${k} frame sentences of 10 tokens, one firing each, on narrow union base ${base}: ${add(k, 10, base)}`);
const h = (cs: string[]) => { const hs = cs.flatMap((c) => apply(CLASSES[c].rules, [...heldCT, ...heldFP])); return summarise(hs, heldCT.length + heldFP.length).positions; };
const hOnly = h(narrow), hAll = h(zero);
const hN = heldCT.length + heldFP.length;
console.log(`append CIVIL_LAW_CORPUS as is (word/punct tokens, tags dropped, ${hN}): narrow classes fire ${hOnly}, so ${base + hOnly} / ${N + hN} = ${(100 * (base + hOnly) / (N + hN)).toFixed(3)}%; zero-false classes fire ${hAll}, so ${unionStat(zero).positions + hAll} / ${N + hN} = ${(100 * (unionStat(zero).positions + hAll) / (N + hN)).toFixed(3)}%`);
```

Raw output:

```text
NUM words in vocab: one two three four five six seven eight ten twelve thirteen fourteen fifteen twenty thirty fifty sixty hundred thousand | not in vocab: nine eleven forty

=== Q5 tree-derived sample
TC01 | P-TRACK Q4 (<=10,000 small) | small claims track is for claims up to | ban NUM minus {ten} | fired 1 | false bans 0 | gold ten | lines L89 | oov nine,eleven,forty
TC02 | P-TRACK Q4 | small claims track is for claims of no more than | ban NUM minus {ten} | fired 1 | false bans 0 | gold ten | lines L296 | oov nine,eleven,forty
TC03 | P-TRACK Q5 (<=25,000 fast) | fast track is for claims up to | ban NUM minus {twenty} | fired 2 | false bans 0 | gold twenty | lines L90,L296 | oov nine,eleven,forty
TC04 | P-TRACK Q6 (<=100,000 intermediate) | intermediate track is for claims up to | ban NUM minus {one} | fired 2 | false bans 0 | gold one | lines L91,L296 | oov nine,eleven,forty
TC05 | P-TRACK Q4 applied: amount in context <=10,000 | the court put it on the | ban fast,intermediate,multi | fired 1 | false bans 0 | gold small | lines L296 | oov 
TC06 | P-LIMITATION Q1 (PI 3 years) | personal injury has | ban NUM minus {three} | fired 1 | false bans 0 | gold three | lines L197 | oov nine,eleven,forty
TC07 | P-LIMITATION Q1 | personal injury must be brought within | ban NUM minus {three} | fired 1 | false bans 0 | gold three | lines L322 | oov nine,eleven,forty
TC08 | P-LIMITATION Q2 (contract 6 years) | breach of contract has | ban NUM minus {six} | fired 1 | false bans 0 | gold six | lines L195 | oov nine,eleven,forty
TC09 | P-LIMITATION Q2-Q3 | most other torts must be brought within | ban NUM minus {six} | fired 1 | false bans 0 | gold six | lines L322 | oov nine,eleven,forty
TC10 | P-LIMITATION Q3 (tort 6 years) | claim in tort usually has | ban NUM minus {six} | fired 1 | false bans 0 | gold six | lines L196 | oov nine,eleven,forty
TC11 | CRA-GOODS Q2 (30 days) | right to reject lasts | ban NUM minus {thirty} | fired 1 | false bans 0 | gold thirty | lines L152 | oov nine,eleven,forty
TC12 | CRA-GOODS Q2 | right to reject the goods , which lasts | ban NUM minus {thirty} | fired 1 | false bans 0 | gold thirty | lines L310 | oov nine,eleven,forty
TC13 | CRA-GOODS Q2 (refund within 14 days) | refund within | ban NUM minus {fourteen} | fired 0 | false bans 0 | gold  | lines  | oov nine,eleven,forty
TC14 | DEP Q1 (30 days) | protect the deposit within | ban NUM minus {thirty} | fired 1 | false bans 0 | gold thirty | lines L207 | oov nine,eleven,forty
TC15 | DEP Q1 | protect the deposit in a government approved scheme within | ban NUM minus {thirty} | fired 1 | false bans 0 | gold thirty | lines L325 | oov nine,eleven,forty
TC16 | DEP Q1 (1-3x) | the penalty is one to | ban NUM minus {three} | fired 1 | false bans 0 | gold three | lines L215 | oov nine,eleven,forty
TC17 | DEP Q1 (1-3x) | between one and | ban NUM minus {three} | fired 1 | false bans 0 | gold three | lines L326 | oov nine,eleven,forty
TC18 | K-FORMATION Q1 (display is not an offer) | shop window are an | ban offer | fired 2 | false bans 0 | gold invitation | lines L122,L302 | oov 
TC19 | K-FORMATION Q1 | shop shelf are an | ban offer | fired 1 | false bans 0 | gold invitation | lines L123 | oov 
TC20 | K-FORMATION Q2, open ban | a counter offer | ban accepts,creates,binds | fired 4 | false bans 0 | gold rejects,destroys,. | lines L127,L128,L304 | oov creates,binds
TC21 | K-FORMATION Q2, closed allow-list | a counter offer | allow only rejects,destroys | fired 4 | false bans 1 | gold rejects,destroys,. | lines L127,L128,L304 | oov 
    FALSE L304:  offer cannot be accepted after a counter offer >>.<< mia's last message
TC22 | K-FORMATION Q5 (domestic) | agreements in the family are presumed | allow only not | fired 2 | false bans 0 | gold not | lines L135,L306 | oov 
TC23 | K-FORMATION Q5 (commercial) | agreements in business are presumed | ban not | fired 1 | false bans 0 | gold to | lines L136 | oov 
TC24 | K-BREACH Q3 (warranty: damages only) | warranty | ban terminate | fired 0 | false bans 0 | gold  | lines  | oov warranty,terminate
TC25 | K-BREACH Q2 (condition: may terminate) | breach of a condition | ban only | fired 0 | false bans 0 | gold  | lines  | oov condition
TC26 | N-NEGLIGENCE Q3 (causation fails) | happened anyway there is no | allow only causation,liability | fired 1 | false bans 0 | gold causation | lines L184 | oov liability
TC27 | N-NEGLIGENCE Q3 | but for the | allow only breach | fired 1 | false bans 0 | gold breach | lines L320 | oov 
TC28 | CRA-SERVICES Q1 | reasonable care and | allow only skill | fired 2 | false bans 0 | gold skill | lines L166,L314 | oov 
TC29 | NUIS Q1 (standing) | private nuisance | ban anyone | fired 0 | false bans 0 | gold  | lines  | oov private
TC30 | NUIS Q1 | interest in the | allow only land | fired 0 | false bans 0 | gold  | lines  | oov 
TC31 | P-ADR Q2 (<=10,000 mediation) | free mediation is for claims of | ban NUM minus {ten} | fired 1 | false bans 0 | gold ten | lines L97 | oov nine,eleven,forty
TC32 | P-ADR Q2 (one-hour) | appointment lasts up to | ban NUM minus {one} | fired 1 | false bans 0 | gold one | lines L98 | oov nine,eleven,forty
TC33 | P-ADR Q2 (one-hour) | appointment lasted up to | ban NUM minus {one} | fired 1 | false bans 0 | gold one | lines L291 | oov nine,eleven,forty
Q5 total: rule firings 39, distinct positions 35, false-ban firings 1
Q5 excluding closed-list TC21: 35
key tree words in training text: warranty:0 condition:0 terminate:0 innominate:0 private:0 injunction:0 nominal:0 specific:0 performance:0 expert:0 experts:0 uksc:0

mined definition terms: 91

=== Q6 classes
class | positions | % of 5390 | defs/stories | false bans | window positions | % of 85984 | window false | LAW fired/false | held-out concepts+trees fired/false | held-out FP fired/false | oov ban words
C1a | 64 | 1.187 | 30/34 | 7 | 1006 | 1.170 | 94 | 61/7 | 35/2 | 10/0 |    -- one-word role, report's 7 verbs per role, is_owed -> is
C1a2 | 64 | 1.187 | 30/34 | 0 | 1006 | 1.170 | 0 | 61/0 | 35/0 | 10/0 |    -- one-word role, same but is_owed -> owed
C1b | 41 | 0.761 | 17/24 | 2 | 642 | 0.747 | 32 | 39/2 | 14/0 | 8/0 |    -- one-word role, payee cannot pay (pays|pay)
C2a | 20 | 0.371 | 9/11 | 0 | 300 | 0.349 | 0 | 20/0 | 8/0 | 1/0 | answer   -- role + modal, other roles' base verbs (ch07 T-CAN shape)
C2b | 13 | 0.241 | 9/4 | 0 | 195 | 0.227 | 0 | 13/0 | 1/0 | 0/0 |    -- role + verb, other domains' object nouns as next token
C3a | 8 | 0.148 | 8/0 | 0 | 86 | 0.100 | 0 | 8/0 | 0/0 | 0/0 |    -- definition frames, report's KB (3 frames x 8 roles)
C4a | 6 | 0.111 | 3/3 | 0 | 56 | 0.065 | 0 | 6/0 | 0/0 | 0/0 | nine,eleven,forty   -- numeric: track is for claims up to|of no more than
C4b | 6 | 0.111 | 3/3 | 1 | 84 | 0.098 | 14 | 6/1 | 0/0 | 0/0 | nine,eleven,forty   -- numeric, loose: claim(s) up to
C4c | 14 | 0.260 | 8/6 | 0 | 166 | 0.193 | 0 | 13/0 | 0/0 | 0/0 | nine,eleven,forty   -- numeric: subject-bound time, penalty and mediation frames
C4d | 19 | 0.353 | 6/13 | 3 | 304 | 0.354 | 48 | 19/3 | 23/22 | 9/6 |    -- numeric, one word: within -> limit numbers only
C4e | 12 | 0.223 | 6/6 | 5 | 180 | 0.209 | 75 | 12/5 | 4/3 | 0/0 |    -- numeric, two words: up to -> track numbers only
C4f | 2 | 0.037 | 0/2 | 0 | 26 | 0.030 | 0 | 2/0 | 0/0 | 1/0 |    -- numeric, subject-free: must be brought within
C5a | 4 | 0.074 | 4/0 | 0 | 52 | 0.060 | 0 | 4/0 | 0/0 | 0/0 |    -- relation: the x pays the -> ban others' payables
C5b | 15 | 0.278 | 14/1 | 0 | 195 | 0.227 | 0 | 15/0 | 0/0 | 0/0 |    -- relation: the x v the -> closed object list (19 pairs)
C5c | 5 | 0.093 | 4/1 | 1 | 70 | 0.081 | 14 | 5/1 | 0/0 | 0/0 |    -- relation, shorter: the x pays -> closed {the}
C5d | 0 | 0.000 | 0/0 | 0 | 0 | 0.000 | 0 | 0/0 | 0/0 | 0/0 |    -- relation, counterpart bans: the landlord pays the !rent etc.
C3b | 113 | 2.096 | 102/11 | 22 | 1621 | 1.885 | 316 | 113/22 | 34/25 | 12/8 |    -- mined: term + copula -> closed {first definition's next word}
C3c | 113 | 2.096 | 102/11 | 15 | 1621 | 1.885 | 213 | 113/15 | 34/24 | 12/7 |    -- mined: term + copula -> closed {all definition lines' next words}
denominators: transformer 5390 tokens, 85984 window positions; LAW 4887; held-out concepts+trees 5416 word/punct tokens; held-out FP 4275

=== Q6 false-ban lines (training text)
--- C1a: 7 positions
  L23 [C1a-claimant]  the claimant >> is<< the person who
  L24 [C1a-defendant]  person who brings a claim. the defendant >> is<< the person who
  L27 [C1a-landlord]  pay or defend the claim. the landlord >> is<< the person who
  L28 [C1a-tenant]  person who owns the home. the tenant >> is<< the person who
  L31 [C1a-trader]  the tenant pays the rent. the trader >> is<< a business that
  L32 [C1a-consumer]  a business that sells goods. the consumer >> is<< a person who
  L38 [C1a-debtor]  person who is owed money. the debtor >> is<< the person who
--- C1b: 2 positions
  L161 [C1b-trader]  goods of the same kind. the trader >> pays<< the cost of
  L326 [C1b-landlord]  the court for an order that the landlord >> pays<< between one and
--- C4b: 1 positions
  L295 [C4b-claim]  the amount claimed. a claim up to >> three<< hundred pounds costs
--- C4d: 3 positions
  L298 [C4d-within]  to get credit. hari paid everything within >> the<< month, so
  L311 [C4d-within]  and the trader had to do it within >> a<< reasonable time,
  L314 [C4d-within] , and the trader must do it within >> a<< reasonable time.
--- C4e: 5 positions
  L243 [C4e-upto]  tall. you may trim branches up to >> the<< boundary. you
  L252 [C4e-upto]  the invoice. businesses can agree up to >> sixty<< days to pay
  L295 [C4e-upto]  the amount claimed. a claim up to >> three<< hundred pounds costs
  L333 [C4e-upto]  into her property, but only up to >> the<< property boundary.
  L334 [C4e-upto]  later. businesses can usually agree up to >> sixty<< days, and
--- C5c: 1 positions
  L326 [C5c-landlord]  court for an order that the landlord pays >> between<< one and three
--- C3b: 22 positions
  L37 [C3b-person who is] . the creditor is the person who is >> owed<< money. the
  L75 [C3b-claim is]  last resort. a letter before claim is >> sent<< before going to
  L88 [C3b-claim is]  to get credit. every defended claim is >> put<< on a track
  L93 [C3b-costs are] . on the small claims track costs are >> limited<<. mediation is
  L97 [C3b-mediation is]  help both sides agree. free mediation is >> for<< claims of ten
  L99 [C3b-mediation is]  hour. an agreement made in mediation is >> legally<< binding. a
  L125 [C3b-offer is]  at the till. a unilateral offer is >> accepted<< by doing the
  L156 [C3b-six months is]  a fault in the first six months is >> taken<< to be there
  L187 [C3b-damages are]  claimant was partly to blame. damages are >> reduced<< for contributory negligence
  L191 [C3b-injury is]  harm to the body. personal injury is >> injury<< to a person
  L208 [C3b-deposit is]  deposit within thirty days. a deposit is >> protected<< in a government
  L212 [C3b-deposit is]  is an approved scheme. the deposit is >> returned<< within ten days
  L237 [C3b-nuisance is]  enjoying your home. a statutory nuisance is >> reported<< to the council
  L240 [C3b-court is]  talk to your neighbour first. court is >> the<< last resort for
--- C3c: 15 positions
  L37 [C3c-person who is] . the creditor is the person who is >> owed<< money. the
  L75 [C3c-claim is]  last resort. a letter before claim is >> sent<< before going to
  L88 [C3c-claim is]  to get credit. every defended claim is >> put<< on a track
  L93 [C3c-costs are] . on the small claims track costs are >> limited<<. mediation is
  L97 [C3c-mediation is]  help both sides agree. free mediation is >> for<< claims of ten
  L99 [C3c-mediation is]  hour. an agreement made in mediation is >> legally<< binding. a
  L125 [C3c-offer is]  at the till. a unilateral offer is >> accepted<< by doing the
  L156 [C3c-six months is]  a fault in the first six months is >> taken<< to be there
  L191 [C3c-injury is]  harm to the body. personal injury is >> injury<< to a person
  L237 [C3c-nuisance is]  enjoying your home. a statutory nuisance is >> reported<< to the council
  L295 [C3c-fee is] . above ten thousand pounds the fee is >> five<< percent of the
  L296 [C3c-claim is]  help with fees. every defended claim is >> put<< on a track
  L296 [C3c-costs are]  the small claims track, where costs are >> limited<< and people often
  L298 [C3c-judgment is]  pounds. the record of a judgment is >> kept<< for six years

=== Held-out false bans (CIVIL_LAW_CORPUS)
--- C1a concepts+trees: 2
   [C1a-defendant] ] n - remote . the defendant >>is<< liable only for
   [C1a-consumer] 14 days of agreeing that the consumer >>is<< entitled to a
--- C4d concepts+trees: 22
   [C4d-within] delay , and in any event within >>14<< days of agreeing
   [C4d-within] , the trader must do it within >>a<< reasonable time ,
   [C4d-within] replacement is impossible or not done within >>a<< reasonable time without
   [C4d-within] to reject ( none if exercised within >>6<< months , except
   [C4d-within] performance is impossible or not done within >>a<< reasonable time without
   [C4d-within] ) . if the person dies within >>the<< period , it
--- C4d FP: 6
   [C4d-within] : only the ordinary loss was within >>reasonable<< contemplation ( k
   [C4d-within] of satisfactory quality and she is within >>the<< 30 - day
   [C4d-within] of s10 ; she can reject within >>30<< days . because
   [C4d-within] track q2 : an rta claim within >>r26<< . 10 (
   [C4d-within] £ 3 , 000 would fall within >>the<< £ 5 ,
   [C4d-within] : the deposit was not protected within >>30<< days ( dep
--- C4e concepts+trees: 3
   [C4e-upto] simple procedure " ( generally up to >>£<< 5 , 000
   [C4e-upto] adjustments , with defendant interest up to >>"<< 10 % above
   [C4e-upto] reduction , which may be up to >>the<< full price (
--- C3b concepts+trees: 25
   [C3b-invitation to treat is] itt . an invitation to treat is >>an<< invitation to others
   [C3b-acceptance is] ; no separate notice of acceptance is >>needed<< . c -
   [C3b-consideration is] . c - consideration . consideration is >>"<< some right ,
   [C3b-consideration is] c - past . past consideration is >>no<< consideration . an
   [C3b-damages are] remoteness - k . contract damages are >>recoverable<< only for loss
   [C3b-damages are] is usually granted only where damages are >>inadequate<< , for example
--- C3b FP: 8
   [C3b-acceptance is] : under the postal rule acceptance is >>complete<< on posting (
   [C3b-consideration is] was made , and past consideration is >>no<< consideration ( k
   [C3b-damages are] sam is liable , but damages are >>reduced<< ( guideline 25
   [C3b-injury is] - claims limit . personal injury is >>also<< excluded from mandatory
   [C3b-trial is] from one customer . the trial is >>expected<< to take two
   [C3b-claim is] track . because : the claim is >>over<< £ 25 ,
--- C3c concepts+trees: 24
   [C3c-invitation to treat is] itt . an invitation to treat is >>an<< invitation to others
   [C3c-acceptance is] ; no separate notice of acceptance is >>needed<< . c -
   [C3c-consideration is] . c - consideration . consideration is >>"<< some right ,
   [C3c-consideration is] c - past . past consideration is >>no<< consideration . an
   [C3c-damages are] remoteness - k . contract damages are >>recoverable<< only for loss
   [C3c-damages are] is usually granted only where damages are >>inadequate<< , for example
--- C3c FP: 7
   [C3c-acceptance is] : under the postal rule acceptance is >>complete<< on posting (
   [C3c-consideration is] was made , and past consideration is >>no<< consideration ( k
   [C3c-injury is] - claims limit . personal injury is >>also<< excluded from mandatory
   [C3c-trial is] from one customer . the trial is >>expected<< to take two
   [C3c-claim is] track . because : the claim is >>over<< £ 25 ,
   [C3c-trial is] 100 , 000 , the trial is >>within<< three days ,
held-out firings C3a: concepts+trees none; FP none
held-out firings C4a: concepts+trees none; FP none
held-out firings C4c: concepts+trees none; FP none
held-out firings C5a: concepts+trees none; FP none
held-out firings C5b: concepts+trees none; FP none

=== Q7 unions
classes with fires and 0 false bans: C1a2,C2a,C2b,C3a,C4a,C4c,C4f,C5a,C5b
C3a alone: 8 positions (0.148%), false 0, windows 86 (0.100%), window false 0
C3a + C4a: 14 positions (0.260%), false 0, windows 142 (0.165%), window false 0
C3a + C4a + C4c: 28 positions (0.519%), false 0, windows 308 (0.358%), window false 0
C3a + C4a + C4c + C5a: 32 positions (0.594%), false 0, windows 360 (0.419%), window false 0
... + C5b: 43 positions (0.798%), false 0, windows 503 (0.585%), window false 0
... + tree sample (without TC21): 58 positions (1.076%), false 0, windows 697 (0.811%), window false 0
all zero-false classes: 140 positions (2.597%), false 0, windows 2004 (2.331%), window false 0
pruned C1a: rules with a false ban removed 7: C1a-claimant,C1a-defendant,C1a-landlord,C1a-tenant,C1a-trader,C1a-consumer,C1a-debtor; left 1 positions, false 0
pruned C1b: rules with a false ban removed 2: C1b-trader,C1b-landlord; left 8 positions, false 0
pruned C4b: rules with a false ban removed 1: C4b-claim; left 5 positions, false 0
pruned C4d: rules with a false ban removed 1: C4d-within; left 0 positions, false 0
pruned C4e: rules with a false ban removed 1: C4e-upto; left 0 positions, false 0
pruned C5c: rules with a false ban removed 1: C5c-landlord; left 4 positions, false 0
pruned C3b: rules with a false ban removed 16: C3b-person who is,C3b-claim is,C3b-costs are,C3b-mediation is,C3b-offer is,C3b-six months is,C3b-damages are,C3b-injury is,C3b-deposit is,C3b-nuisance is,C3b-court is,C3b-high hedge is,C3b-statutory interest is,C3b-fee is,C3b-judgment is,C3b-dispute is; left 82 positions, false 0
pruned C3c: rules with a false ban removed 11: C3c-person who is,C3c-claim is,C3c-costs are,C3c-mediation is,C3c-offer is,C3c-six months is,C3c-injury is,C3c-nuisance is,C3c-fee is,C3c-judgment is,C3c-dispute is; left 94 positions, false 0
all classes, every false-banning rule pruned (corpus-tuned): 237 positions (4.397%), false 0, windows 3388 (3.940%), window false 0

=== memorising bound: closed allow-list from observed n-gram continuation
n=1: in-sample fired 5389, false 0 (by construction). Leave-one-text-out: mask built from the other 255 texts fires at 4941/5389 (91.7%), gold banned at 1910 (38.7% of fired).
n=2: in-sample fired 5388, false 0 (by construction). Leave-one-text-out: mask built from the other 255 texts fires at 3031/5388 (56.3%), gold banned at 1575 (52.0% of fired).
n=3: in-sample fired 5387, false 0 (by construction). Leave-one-text-out: mask built from the other 255 texts fires at 1456/5387 (27.0%), gold banned at 714 (49.0% of fired).
n=4: in-sample fired 5386, false 0 (by construction). Leave-one-text-out: mask built from the other 255 texts fires at 742/5386 (13.8%), gold banned at 333 (44.9% of fired).

=== extension estimates
sentence-ending tokens: 401 mean tokens per sentence 13.44
add 8 frame sentences of 10 tokens, one firing each, on narrow union base 32: 40 / 5470 = 0.73%
add 24 frame sentences of 10 tokens, one firing each, on narrow union base 32: 56 / 5630 = 0.99%
add 50 frame sentences of 10 tokens, one firing each, on narrow union base 32: 82 / 5890 = 1.39%
add 100 frame sentences of 10 tokens, one firing each, on narrow union base 32: 132 / 6390 = 2.07%
add 500 frame sentences of 10 tokens, one firing each, on narrow union base 32: 532 / 10390 = 5.12%
add 2000 frame sentences of 10 tokens, one firing each, on narrow union base 32: 2032 / 25390 = 8.00%
append CIVIL_LAW_CORPUS as is (word/punct tokens, tags dropped, 9691): narrow classes fire 0, so 32 / 15081 = 0.212%; zero-false classes fire 56, so 196 / 15081 = 1.300%
```

<a id="p5"></a>

### p5: firings, role next-token tallies, tree breakdown, unions with the tree sample

Command: `cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && bun run p5_extra.ts`

Source (`/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes/p5_extra.ts`):

```ts
// Follow-ups to p4: which rules fired, tree breakdown, unions including the tree sample, role occurrence detail.
import { tfStream, corpusLineOf, apply, summarise, civilWordStream, TRAIN_TEXTS, CIVIL_LAW_CORPUS, CIVIL_LAW_DEFINITIONS } from "./common";
import { TREE, CLASSES, ROLES8 } from "./rules";
const tf = tfStream(); const W = tf.words, N = W.length;
const ctx = (p: number) => `${tf.toks.slice(Math.max(0, p - 5), p).join("")} >>${tf.toks[p]}<<`;
const line = (p: number) => "L" + corpusLineOf(TRAIN_TEXTS[tf.textIdx[p]]);
for (const c of ["C2a", "C2b", "C5a", "C5b"]) {
  console.log(`--- ${c} firings`);
  for (const h of apply(CLASSES[c].rules, W)) console.log(`  ${line(h.p)} [${h.rule.id}] ${ctx(h.p)}`);
}
console.log("--- C1a2 next-token tally per role (training)");
for (const r of ROLES8) {
  const t = new Map<string, number>();
  for (let p = 1; p < N; p++) if (W[p - 1] === r) t.set(W[p], (t.get(W[p]) ?? 0) + 1);
  console.log(`  ${r} (${[...t.values()].reduce((a, b) => a + b, 0)}):`, [...t].sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w}:${n}`).join(" "));
}
const isFP = (e: string) => /^FP-\d+/.test(e);
const held = civilWordStream(CIVIL_LAW_CORPUS);
console.log("--- C1a2 next-token tally, held-out CIVIL_LAW_CORPUS (all 118 entries)");
const hh = apply(CLASSES.C1a2.rules, held); const t2 = new Map<string, number>();
hh.forEach((h) => t2.set(h.gold, (t2.get(h.gold) ?? 0) + 1));
console.log("  ", hh.length, [...t2].sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w}:${n}`).join(" "));
// tree breakdown
const treeHits = TREE.filter((r) => r.id !== "TC21").flatMap((r) => {
  let h = apply([r], W);
  if (r.id === "TC05") h = h.filter((x) => W.slice(Math.max(0, x.p - 30), x.p).join(" ").includes("claimed six thousand pounds"));
  return h;
});
const by = new Map<string, Set<number>>();
for (const h of treeHits) { const k = (h.rule as any).tree.split(" ")[0]; (by.get(k) ?? by.set(k, new Set()).get(k)!).add(h.p); }
console.log("--- tree sample, distinct positions by tree:", [...by].map(([k, s]) => `${k}:${s.size}`).join(" "), "total", new Set(treeHits.map((h) => h.p)).size);
// verdict word only frames: all tree rules with a numeric ban
const fmt = (s: ReturnType<typeof summarise>) => `${s.positions} (${(100 * s.positions / N).toFixed(3)}%), false ${s.falseBans}, windows ${s.windows} (${(100 * s.windows / 85984).toFixed(3)}%)`;
const zero = ["C1a2", "C2a", "C2b", "C3a", "C4a", "C4c", "C4f", "C5a", "C5b"];
const allZero = [...zero.flatMap((c) => apply(CLASSES[c].rules, W)), ...treeHits];
console.log("union all zero-false classes + tree sample:", fmt(summarise(allZero, N)));
const narrowest = ["C3a", "C4a", "C4c", "C4f", "C5a", "C5b"];
console.log("union frame-only (C3a,C4a,C4c,C4f,C5a,C5b) + tree sample:", fmt(summarise([...narrowest.flatMap((c) => apply(CLASSES[c].rules, W)), ...treeHits], N)));
console.log("tree sample alone:", fmt(summarise(treeHits, N)));
console.log("target positions available (N-1):", N - 1, "word tokens:", W.filter((w) => /\w/.test(w)).length, "punct tokens:", W.filter((w) => !/\w/.test(w)).length, "commas", W.filter((w) => w === ",").length, "periods", W.filter((w) => w === ".").length, "apostrophes", W.filter((w) => w === "'").length);
const ct = CIVIL_LAW_CORPUS.filter((e) => e.startsWith("TREE ")).join(" ").toLowerCase();
console.log("tree text mentions contributory:", ct.split("contributory").length - 1, "; concepts+FP:", CIVIL_LAW_CORPUS.join(" ").toLowerCase().split("contributory").length - 1);
console.log("defs", CIVIL_LAW_DEFINITIONS.length);
```

Raw output:

```text
--- C2a firings
  L26 [C2a-defendant-may]  money. the defendant may >> pay<<
  L77 [C2a-defendant-should]  why. the defendant should >> usually<<
  L80 [C2a-claimant-can]  not respond the claimant can >> ask<<
  L157 [C2a-trader-must]  delivery. the trader must >> prove<<
  L158 [C2a-consumer-can]  delivery. the consumer can >> ask<<
  L207 [C2a-landlord-must]  tenancy. the landlord must >> protect<<
  L222 [C2a-tenant-can]  abolished. a tenant can >> leave<<
  L225 [C2a-tenant-can]  rent. a tenant can >> challenge<<
  L228 [C2a-landlord-can]  allowed. a landlord can >> ask<<
  L289 [C2a-defendant-should]  resort and a defendant should >> usually<<
  L312 [C2a-trader-may]  reject, the trader may >> reduce<<
  L314 [C2a-consumer-can]  done properly the consumer can >> first<<
  L314 [C2a-trader-must] , and the trader must >> do<<
  L314 [C2a-consumer-can]  time, the consumer can >> ask<<
  L325 [C2a-landlord-must]  flat. the landlord must >> protect<<
  L325 [C2a-landlord-must]  the tenancy the landlord must >> return<<
  L326 [C2a-tenant-can]  deposit, the tenant can >> ask<<
  L327 [C2a-tenant-can]  on. a tenant can >> end<<
  L328 [C2a-landlord-can]  new rules a landlord can >> raise<<
  L328 [C2a-landlord-can]  allowed. a landlord can >> also<<
--- C2b firings
  L29 [C2b-landlord-gets]  home. the landlord gets >> the<<
  L30 [C2b-tenant-pays]  rent. the tenant pays >> the<<
  L33 [C2b-seller-supplies]  goods. the seller supplies >> the<<
  L34 [C2b-buyer-pays]  goods. the buyer pays >> the<<
  L35 [C2b-supplier-sends]  price. the supplier sends >> the<<
  L36 [C2b-customer-pays]  invoice. the customer pays >> the<<
  L68 [C2b-debtor-owes]  says that the debtor owes >> the<<
  L124 [C2b-customer-makes]  treat. the customer makes >> the<<
  L161 [C2b-trader-pays]  kind. the trader pays >> the<<
  L302 [C2b-customer-makes]  window. the customer makes >> the<<
  L313 [C2b-consumer-makes] . when a consumer makes >> a<<
  L326 [C2b-landlord-pays]  order that the landlord pays >> between<<
  L334 [C2b-customer-gets]  days after the customer gets >> the<<
--- C5a firings
  L30 [C5a-tenant] . the tenant pays the >> rent<<
  L34 [C5a-buyer] . the buyer pays the >> price<<
  L36 [C5a-customer] . the customer pays the >> invoice<<
  L161 [C5a-trader] . the trader pays the >> cost<<
--- C5b firings
  L29 [C5b-landlord-gets] . the landlord gets the >> rent<<
  L30 [C5b-tenant-pays] . the tenant pays the >> rent<<
  L33 [C5b-seller-supplies] . the seller supplies the >> goods<<
  L34 [C5b-buyer-pays] . the buyer pays the >> price<<
  L35 [C5b-supplier-sends] . the supplier sends the >> invoice<<
  L36 [C5b-customer-pays] . the customer pays the >> invoice<<
  L39 [C5b-judge-decides] . the judge decides the >> case<<
  L46 [C5b-homeowner-owns] . the homeowner owns the >> house<<
  L50 [C5b-auditor-checks] . the auditor checks the >> accounts<<
  L53 [C5b-manufacturer-makes] . the manufacturer makes the >> product<<
  L66 [C5b-judge-decides]  where the judge decides the >> facts<<
  L68 [C5b-debtor-owes]  that the debtor owes the >> money<<
  L124 [C5b-customer-makes] . the customer makes the >> offer<<
  L161 [C5b-trader-pays] . the trader pays the >> cost<<
  L302 [C5b-customer-makes] . the customer makes the >> offer<<
--- C1a2 next-token tally per role (training)
  claimant (4): is:1 asks:1 can:1 was:1
  defendant (5): should:2 is:1 may:1 does:1
  landlord (22): must:3 can:3 who:2 asked:2 wanted:2 is:1 gets:1 .:1 a:1 never:1 fails:1 pays:1 to:1 did:1 tried:1
  tenant (7): can:4 is:1 pays:1 you:1
  trader (11): must:2 is:1 .:1 pays:1 proves:1 had:1 may:1 ,:1 who:1 to:1
  consumer (10): can:3 rights:2 is:1 .:1 uses:1 makes:1 of:1
  creditor (1): is:1
  debtor (4): is:1 owes:1 pay:1 still:1
--- C1a2 next-token tally, held-out CIVIL_LAW_CORPUS (all 118 entries)
   45 ,:4 may:4 must:3 is:2 against:2 ):2 should:2 (:2 fails:1 makes:1 a:1 did:1 proves:1 requires:1 cannot:1 interest:1 to:1 ":1 fall:1 fully:1 and:1 had:1 fail:1 within:1 ?:1 have:1 where:1 pleads:1 sues:1 twice:1 ignores:1 never:1
--- tree sample, distinct positions by tree: P-TRACK:7 P-LIMITATION:5 CRA-GOODS:2 DEP:4 K-FORMATION:10 N-NEGLIGENCE:2 CRA-SERVICES:2 P-ADR:3 total 35
union all zero-false classes + tree sample: 155 (2.876%), false 0, windows 2198 (2.556%)
union frame-only (C3a,C4a,C4c,C4f,C5a,C5b) + tree sample: 58 (1.076%), false 0, windows 697 (0.811%)
tree sample alone: 35 (0.649%), false 0, windows 416 (0.484%)
target positions available (N-1): 5389 word tokens: 4887 punct tokens: 503 commas 96 periods 401 apostrophes 6
tree text mentions contributory: 0 ; concepts+FP: 2
defs 222
```

<a id="p6"></a>

### p6: digit artefacts in held-out false bans

Command: `cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && bun run p6_heldout.ts`

Source (`/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes/p6_heldout.ts`):

```ts
// How many held-out false bans of C4d and C4e are digit-spelling artefacts rather than wrong content?
import { apply, civilWordStream, CIVIL_LAW_CORPUS } from "./common";
import { CLASSES } from "./rules";
const held = civilWordStream(CIVIL_LAW_CORPUS);
for (const c of ["C4d", "C4e"]) {
  const hits = apply(CLASSES[c].rules, held);
  const fb = hits.filter((h) => h.falseBan);
  const digit = fb.filter((h) => /\d/.test(h.gold) || h.gold === "£");
  const t = new Map<string, number>(); fb.forEach((h) => t.set(h.gold, (t.get(h.gold) ?? 0) + 1));
  console.log(c, "held-out fired", hits.length, "false", fb.length, "digit or currency gold", digit.length, "word gold", fb.length - digit.length, [...t].map(([w, n]) => `${w}:${n}`).join(" "));
}
```

Raw output:

```text
C4d held-out fired 32 false 28 digit or currency gold 14 word gold 14 14:4 a:7 6:2 the:4 r26:2 30:5 10:1 an:1 pd:1 reasonable:1
C4e held-out fired 4 false 3 digit or currency gold 1 word gold 2 £:1 ":1 the:1
```

<a id="p7"></a>

### p7: mined-class false bans by block

Command: `cd /private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes && bun run p7_split.ts`

Source (`/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/probes/p7_split.ts`):

```ts
// Where do the mined-class false bans fall: definition block or stories? Which distinct rules produce them?
import { tfStream, apply, CIVIL_LAW_DEFINITIONS, type Rule } from "./common";
const tf = tfStream(); const W = tf.words;
const copula = ["is", "are", "means"];
const defFrames = new Map<string, { first: string; all: Set<string> }>();
for (const line of CIVIL_LAW_DEFINITIONS) {
  const w = line.split(" ");
  for (let k = 1; k <= 4 && k < w.length - 1; k++) {
    if (copula.includes(w[k])) {
      const start = ["a", "an", "the"].includes(w[0]) ? 1 : 0;
      if (k - start < 1 || k - start > 3) break;
      const term = w.slice(start, k + 1).join(" ");
      const e = defFrames.get(term) ?? { first: w[k + 1], all: new Set<string>() };
      e.all.add(w[k + 1]); defFrames.set(term, e);
      break;
    }
  }
}
for (const [name, mk] of [["C3b", (e: any) => [e.first]], ["C3c", (e: any) => [...e.all]]] as const) {
  const rules: Rule[] = [...defFrames].map(([t, e]) => ({ id: t, cls: name, pat: t.split(" "), allow: mk(e) }));
  const fb = new Map<number, string>();
  for (const h of apply(rules, W)) if (h.falseBan) fb.set(h.p, h.rule.id);
  const defs = [...fb.keys()].filter((p) => tf.textIdx[p] < CIVIL_LAW_DEFINITIONS.length).length;
  console.log(name, "false bans", fb.size, "in definition block", defs, "in stories", fb.size - defs);
}
```

Raw output:

```text
C3b false bans 22 in definition block 16 in stories 6
C3c false bans 15 in definition block 10 in stories 5
```
