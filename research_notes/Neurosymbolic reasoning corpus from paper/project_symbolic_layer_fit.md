# Project symbolic layer fit: what the neurosymbolic pipeline can extract, check and explain, and what corpus it needs

Scope note: local, read-only analysis of `/Users/nedpham/Projects/neural_symbolic_nlp`. No web sources were used (project constraint: local-only). Citations are `path:line`, relative to the repo root. Numbers marked "measured locally" come from a scratch script that imported the project's own `bpe.ts`, `reasoning-corpus.ts` and `corpus.ts` and tokenised them the way `train.ts` does (pre-token regex `/\s\w+|[^\w\s]/g`, 1000 merges). They were not typed in by hand. `bun test tests/reasoning-corpus.test.ts` was also run: 7 pass, 0 fail, 224 expect() calls.

## 1. What does the symbolic layer do (facts, relations, rules, constraints, explanation outputs, parsed sentence patterns)?

### Takeaway
The symbolic layer is **designed but not built**. On paper it has five parts: a hard logit mask (M1), a soft bias (M2), a per-step trace (M3), a post-hoc verifier that turns text into triples (M4), and an optional semantic loss (M5). The design uses a 5–8 relation KB of triples plus Horn rules applied by forward chaining. The design docs never say which sentence patterns the verifier parses. The only concrete parser in the repo is the untracked draft `UNIT_PATTERNS`, and it covers `is_a`, `can`/`cannot`, routes and addition. It has no `lives_in` and no "if … then".

### Cited Findings
- Chapter 04 is marked "**design only. None of the code in this chapter exists yet.**" — `docs/progress/04-neurosymbolic-design.md:3`. README stage 5 says "Symbolic layer (mask, verifier, trace) | **Designed only**" — `README.md:24`. Chapter 05 lists `symbolic.ts`, `constraints.ts` and the verifier as "Not yet written" — `docs/progress/05-implementation-and-evaluation.md:38`. A file search found no `symbolic.ts`, `constraints.ts` or verifier module under `src/`.
- Mechanisms:
  - M1 hard mask: sets violating tokens' logits to −∞ before temperature and softmax.
  - M2: adds +λ to supported tokens.
  - M3: a trace of rules fired and tokens blocked.
  - M4: a verifier that "parses generated text into triples and checks them against the knowledge base". "Parsing is by rule over whole words."
  - M5: semantic loss (stretch goal).
  - Sources: `docs/progress/04-neurosymbolic-design.md:41-47`, `README.md:112-118`.
- Candidate relations, explicitly "illustrative":
  - `is_a(kitten, animal)`, `lives_in(bear, forest)` (from "the bear lives in the forest"), `can(eagle, fly)`, `cannot(fish, fly)` ("authored; the corpus implies it"), `opposite_of(king, queen)`, `agrees_with(king, he)`.
  - Source: `docs/progress/04-neurosymbolic-design.md:88-97`.
- Rules are Horn clauses `body ⇒ head`. The one example is `is_a(x, fish) ⇒ cannot(x, fly)`, chained forward — `docs/progress/04-neurosymbolic-design.md:99-103`, `README.md:122`.
- KB interface sketch: `Triple {rel,a,b}`, `Rule {id, if: Triple[], then: Triple}`, `entail(context) → {facts, fired}`, `allowed(context, idToToken) → {banned, supported, fired}` — `docs/progress/04-neurosymbolic-design.md:107-117`.
- Constraint seam: the mask is applied to a copy of the last-position logits before temperature. With the processor absent, output must be byte-identical (prediction P2). If every token is banned, the mask falls back to the unmasked logits and records it — `docs/progress/04-neurosymbolic-design.md:79-84`.
- Trace output per step: `rulesFired`, `maskedTokens`, `massBefore`, `massAfter`, `chosen`, `fallback` — `docs/progress/04-neurosymbolic-design.md:139-148`. `massBefore` is "how much probability the network *wanted* to put on a token the knowledge base rejected" — `docs/progress/04-neurosymbolic-design.md:151`.
- Verifier output: `verify(text) => { violations: { sentence, triple, rule }[] }`. It parses "by pattern" and checks against the KB and its entailments, with optional rejection sampling up to N retries — `docs/progress/04-neurosymbolic-design.md:155`.
- Stated limits:
  - whole-word tokens only; a word split into several BPE tokens is constrained only on its first token
  - small hand-authored KB
  - a mask is not understanding
  - the trace explains the symbolic decision, not the logits
  - Source: `docs/progress/04-neurosymbolic-design.md:169-173`.
- Planned experiments: E2 (violation rate, mask off vs on) and E3 (one full trace table). Both are "Not run" — `docs/progress/05-implementation-and-evaluation.md:58-67`, `docs/progress/05-implementation-and-evaluation.md:81-85`.
- Bias risk the docs flag themselves: "A knowledge base written by the same person who writes the test makes P1 easy to satisfy and P3 easy to inflate … a few held-out constraints should be written without looking at model output" — `docs/progress/05-implementation-and-evaluation.md:108`.

### Inferences
- A rule-shaped sentence such as "if … then …" or "all X can Y" lives only inside the KB as a `Rule` object. Nothing in the design parses rules from text. M4 only lifts *facts* (triples) out of generated text. A corpus can show rules in text so the model learns to state them, but the verifier will check facts and conclusions, not rule sentences, unless a rule-sentence pattern is added.
- The design says nothing about how text maps to triples. So the corpus template set *becomes* the parser specification. Free-form sentences in the corpus make M4 impossible to define.

### Gaps
- There are no implemented `entail()` or `allowed()` functions, so it is unknown how `allowed` will map a forward-chained fact to a banned or supported *token* at each step. For example, does it ban "can" after "so the emu"? This is design-level only.
- The design does not say whether the KB is closed-world, i.e. whether a fact that is absent counts as false. The draft checker treats it as "KB is silent", which is a failure, not false: `src/routes/train-transformer/reasoning-corpus.ts:440`.

## 2. Model size and context length, and the limits they put on sentence length and vocabulary

### Takeaway
The model has D=32, 2 heads, FF 128, and 1–6 layers (default 2), with `contextLen: 32`. In the **current working tree, training and generation use a 16-token window**, not 32. The vocabulary is built only from the training text with up to 1000 BPE merges. On the fairy tales that gives V=392. On the draft reasoning corpus it gives V=95, with every word a single token. A corpus unit therefore needs premises and conclusion within about 16 tokens (or 32 if `seqLen` is raised). Every answer token must also appear in the training text, or the model cannot emit it at all.

### Cited Findings
- Config: `contextLen: 32, embDim: 32, numHeads: 2, ffDim: 128, numLayers` — `src/routes/train-transformer/train.ts:217-224`.
- Effective window: `const seqLen = Math.min(cfg.contextLen, 16);` — `src/routes/train-transformer/train.ts:234`. The README says "context 32 (training windows of 16 tokens)" — `README.md:84`. Generation slices the context to `windowSize = seqLen ?? cfg.contextLen` and `ids.slice(-windowSize)` — `src/routes/train-transformer/transformer.ts:953`, `src/routes/train-transformer/transformer.ts:957`. Training windows use stride 1 — `src/routes/train-transformer/train.ts:236-241`.
- Weights filename encodes `e{epochs}-l{layers}-d32-h2-ff128-ctx32`. It does not encode the corpus — `src/routes/train-transformer/train.ts:243`. A cached file is reloaded by name, so after a code fix "delete `.data/transformer-weights-*.json`" — `README.md:137`.
- Parameters: 12,704 per block. With V=392 the model has 51,976 parameters at 2 layers and 102,792 at 6 — `README.md:84`.
- Tokenizer:
  - `PRE_TOKEN_RE = /\s\w+|[^\w\s]/g`, so a leading space is attached to each word and each punctuation mark is its own token — `src/routes/train-transformer/train.ts:191`.
  - BPE is trained on the training text with 1000 merges — `src/routes/train-transformer/train.ts:195`.
  - The vocabulary is built only from tokens seen in training — `src/routes/train-transformer/train.ts:201-213`.
  - Unknown tokens are silently dropped from the training stream (`if (idx !== undefined)`) — `src/routes/train-transformer/train.ts:229-230`.
- Generation seed: the first 3 corpus tokens (`allTokenIds.slice(0, 3)`) — `src/routes/train-transformer/train.ts:310`.
- Weights `e300-l2-...-ctx32.json` (fairy tales): vocab 392, 783 merges. Weights `e300-l2-...-ctx32-c287cec4b.json` (reasoning corpus): vocab 95, 235 merges, same config (read locally from `.data/`).
- Measured locally, current fairy-tale `STORIES`: 34 stories and 258 sentences. Tokens per sentence range 6–23, mean 12.4, and 10 sentences exceed 16 tokens. Each story is 81–109 tokens, 3,195 tokens in total. A whole story is therefore 5–7× longer than the 16-token window.
- Measured locally, draft reasoning corpus:

  | Rule | Training units | Tokens per unit | Units over 32 tokens |
  |---|---|---|---|
  | R-TRANS | 23 | 19 | 0 |
  | R-INHERIT | 56 | 17–23 | 0 |
  | R-EXCEPT | 16 | 23 | 0 |
  | R-CHECK | 64 | 23–24 | 0 |
  | R-ADD | 49 | 28–37, mean 31.1 | 17 |

  Totals: 208 training units, 17 held out, 4,822 training tokens, V=95, and no word splits into more than one BPE token.
- The draft test tells R-ADD apart, allowing up to 40 tokens against 32 for every other rule ("the whole unit must still fit in the context window") — `tests/reasoning-corpus.test.ts:85-94`. The test title says "32-token training window", but train.ts uses 16 — `tests/reasoning-corpus.test.ts:85` vs `src/routes/train-transformer/train.ts:234`.
- The longest example measured locally, 37 tokens: "question : ready in one hour , then castle to river . how long ? fact : castle to river is three hours . math : one plus three is four . answer : four hours ."
- Known model defects, still present in the working tree:
  - the first residual multiplies instead of adds (`x1[i] = input[i] * attnOut[i]`) — `src/routes/train-transformer/transformer.ts:494`
  - attention skips the current token (`j < i`) — `src/routes/train-transformer/transformer.ts:482`
  - dK uses `bc.K` instead of `Q` — `src/routes/train-transformer/transformer.ts:668`
  - all three are listed as open in `README.md:137`.

### Inferences
- With a 16-token window, every draft unit except some R-INHERIT units (17 tokens minimum) is longer than the window. At the conclusion token, the first premise is already out of view. R-CHECK at 23 tokens and R-ADD at up to 37 tokens cannot see their own question when producing the verdict or answer. A new corpus should either keep each premise-to-decision span ≤16 tokens, or the owner should change `seqLen` to 32. The corpus spec should name the window explicitly.
- Even at a 32-token window, 17 R-ADD units do not fit. The `≤40` test exemption only holds because the "math :" line repeats the operands near the answer. The "question :" part still falls out of view.
- V≈100 whole-word tokens suits M1, because all constraints are whole-word, the case the design says works cleanly (`docs/progress/04-neurosymbolic-design.md:169`). New entity names should be checked so each stays one BPE token; with this tokenizer, words that occur often enough in the corpus get merged into a single token.
- With about 30k–50k parameters and about 5k training tokens, the measured result for the draft corpus is unigram-entropy loss (see section 4). Corpus design alone will not produce reasoning while the three transformer defects remain.

### Gaps
- No measurement exists of how many training examples per template the 2-layer model needs. No experiment has been run (`docs/progress/05-implementation-and-evaluation.md:81-85`).
- I could not confirm which state of `train.ts` produced the `-c287cec4b` weights. The current `train.ts` has no corpus hash and still imports `STORIES` (`src/routes/train-transformer/train.ts:32`, `src/routes/train-transformer/train.ts:243`).

## 3. Where is the current corpus (`src/routes/train-embed/corpus.ts`) weak for reasoning?

### Takeaway
The current transformer corpus is `STORIES`: 34 fairy tales, plus the 107-sentence Skip-gram `CORPUS`. Both are flat descriptive and narrative text. Measured locally, they contain 0 "if", 0 "cannot", 0 question marks, 2 "because", and no rule sentences. They have no multi-hop chains, no exceptions, no contradictions and no questions with derivable answers. Only `is_a` (23 "is a/an" in `CORPUS`) and `lives_in` (2) are extractable as triples. Several stories contradict any `can`/`cannot` KB.

### Cited Findings
- The transformer trains on `STORIES` only: `import { STORIES } from "../train-embed/corpus"` — `src/routes/train-transformer/train.ts:32`, used at `src/routes/train-transformer/train.ts:192`, `:202` and `:227`.
- The corpus header says sentences are designed for "co-occur within small windows" and analogy, not inference — `src/routes/train-embed/corpus.ts:1-16`.
- Flat descriptive facts, all one-hop with no rule linking them:
  - "the lion is a wild animal" — `src/routes/train-embed/corpus.ts:43`
  - "the kitten is a baby cat" — `src/routes/train-embed/corpus.ts:27`
  - "the bear lives in the forest" — `src/routes/train-embed/corpus.ts:48`
  - "the eagle flies in the sky" — `src/routes/train-embed/corpus.ts:50`
  - "birds fly and fish swim" — `src/routes/train-embed/corpus.ts:52`
- A generic is mixed with an exception, with no override marked: "birds fly" (`src/routes/train-embed/corpus.ts:52`) is never qualified. The corpus has no flightless birds at all.
- Category errors a KB would reject as training targets:
  - "the kitten is a baby cat" and "the puppy is a baby dog" (`src/routes/train-embed/corpus.ts:27-28`) mix `is_a` with `young_of`. This is the relation Skip-gram failed on: `kitten − cat + dog` → *lion* on all four seeds — `README.md:53`.
  - "lions and tigers are big cats" (`src/routes/train-embed/corpus.ts:47`) puts lion under cat, which conflicts with "the cat is small" (`src/routes/train-embed/corpus.ts:113`) under naive inheritance.
- Stories contain statements that a `can`/`cannot` or `is_a` KB would flag or cannot represent:
  - "the bird slept on the mat … the bird flew into the sky" — `src/routes/train-embed/corpus.ts:167`
  - "then a great bird came down from the sky and said climb on my back" — `src/routes/train-embed/corpus.ts:189`
  - talking animals throughout, e.g. "the dog said i am lost and hungry" — `src/routes/train-embed/corpus.ts:157`
  - "the old man … works as an engineer" — `src/routes/train-embed/corpus.ts:214`
- Measured locally, counts in `STORIES`:

  | Word | Count |
  |---|---|
  | "if" | 0 |
  | "then" | 3 (narrative "then", e.g. `corpus.ts:161`) |
  | "because" | 2 |
  | "not" | 5 |
  | "cannot" | 0 |
  | "so" | 9 (narrative "so") |
  | "but" | 7 |
  | "?" | 0 |
  | "all" | 3 |
  | "every" | 11 (mostly "every day") |

  Counts in the Skip-gram `CORPUS`: "if" 0, "because" 0, "not" 0, "?" 0, "is a/an" 23, "lives in" 2.
- The only causal "because" sentences:
  - "the queen ate sushi and rice because she loved japanese food" — `src/routes/train-embed/corpus.ts:174`
  - "the tiger eats meat because it is a wild animal" — `src/routes/train-embed/corpus.ts:216`, the only one with a rule-like reason.
- Story sentences are 6–23 tokens and a story is 81–109 tokens (measured locally). Narrative facts depend on referents outside the 16-token window, for example pronoun "she" and "they".
- Chapter 05 flags the size: "34 stories (or 107 short sentences) is a toy" — `docs/progress/05-implementation-and-evaluation.md:106`.

### Inferences
- Gap analysis against the designed layer:

  | Designed capability | Present in `STORIES`/`CORPUS`? |
  |---|---|
  | `is_a` triples | Partial: about 23 "X is a Y", mixed with adjectival "is a small pet" and "is a baby cat" |
  | `lives_in` | 2 sentences |
  | `can` | Implicit as verbs ("flies", "swims"), not as "can" |
  | `cannot` | Absent |
  | `opposite_of`, `agrees_with` | Not stated; only implied by parallel structure |
  | Horn rules | Absent |
  | Multi-hop chains | Absent |
  | Exceptions | Absent |
  | Contradictions as data | Absent |
  | Questions with derivable answers | Absent |

  P3 ("the unconstrained model violates the KB at a non-trivial rate") would be measured against a KB the corpus never states, so violations would be uninterpretable.
- Fairy-tale semantics (talking animals, a bird giving a ride) conflict with any realistic `can`/`cannot` KB. M4 would flag the training text itself, so the corpus cannot be the KB's ground truth.

### Gaps
- The design's `opposite_of(king, queen)` and `agrees_with(king, he)` have no sentence pattern defined anywhere, so it is unknown what text would carry them.

## 4. What is in the untracked draft `reasoning-corpus.ts` and its test, and do the tests constrain the format?

### Takeaway
The draft is a small KB plus a generator for five fixed templates with rule ids:

| Rule id | What it does |
|---|---|
| R-TRANS | 2-hop `is_a` chain |
| R-INHERIT | ability inherited from the class |
| R-EXCEPT | `but` overrides the inherited default |
| R-CHECK | `claim : … so the claim is true/false` |
| R-ADD | Sheth Fig. 3 style `question / fact / math / answer`, plus a pet-count variant |

It also has an executable checker: `UNIT_PATTERNS` with `checkReasoningUnit`. The 7 tests (all pass) do constrain the format: whole-template regex match, KB agreement, held-out leakage, R-CHECK true share of 40–60 %, and token length. But they have defects. The held-out sums all equal "nine", a word that never appears in training, so the model cannot emit the answer. R-CHECK balance sits just at the 40 % edge (26/64). The length test assumes a 32-token window that `train.ts` does not use.

### Cited Findings
- Purpose: "The fairy-tale corpus had no premises, rules or conclusions, so the symbolic layer … had nothing to check. Every unit here is one short, fixed-template reasoning step that names the rule it uses" — `src/routes/train-transformer/reasoning-corpus.ts:4-8`. The module is meant to be the "single source of truth: the future `symbolic.ts` should import the facts below" — `src/routes/train-transformer/reasoning-corpus.ts:16-18`.
- KB:
  - `RuleId` covers the five rules — `src/routes/train-transformer/reasoning-corpus.ts:22`.
  - `ABILITIES = fly, swim, walk, bark, purr` — `:25`.
  - `IS_A` is a single-parent tree of 27 entries (animal → bird/fish/mammal → cat/dog → leaves) — `:41-73`.
  - Class `DEFAULTS` — `:76-82`.
  - Entity `EXCEPTIONS`: penguin, ostrich, kiwi and emu cannot fly; penguin, duck and swan can swim; bat can fly; whale cannot walk — `:85-94`.
  - `ROUTES` with hours — `:97-104`.
  - Number words zero–twelve — `:114-128`.
- Inference semantics: `isA` is transitive along parents (`:157-162`). `ability()` returns the nearest level that states a value (entity exception → class → parent) plus the deciding `source`, or `undefined` if the KB is silent (`:169-180`).
- Templates (exact strings, `. ` separated, lower case, spaces around punctuation):
  - R-TRANS: `the X is a Y . a Y is a Z . so the X is a Z .` — `:205`
  - R-INHERIT: one-level or two-level premise, then `a C can|cannot A . so the X can|cannot A .` — `:212-219`
  - R-EXCEPT: `the X is a C . a C can A . but the X cannot A . so the X cannot A .` — `:228`
  - R-CHECK: `claim : the X <verb-3sg> . <reason> . so the claim is true|false .` — `:242`
  - R-ADD route: `question : ready in N hours , then P to Q . how long ? fact : P to Q is H hours . math : N plus H is S . answer : S hours .` — `:251`
  - R-ADD count: `question : the OWNER has A PETS and B PETS . how many pets ? math : A plus B is S . answer : S pets .` — `:263`
- Held-out probes: all ability facts for owl (where inheritance is right) and emu (where the exception is hidden, so inheriting "can fly" is a KB violation), plus the sums {4,5} and {3,6} — `:132-146`. `SAMPLE_PROMPT` is the held-out 3+6 route question — `:270-271`. The corpus is shuffled deterministically with `mulberry32(7)` — `:320-324`.
- Exceptions are pushed twice into the training set "so the 'but … cannot' override is seen often enough" — `:292-297`.
- Checker failure reasons, which work as explanation strings:
  - "terms do not chain"
  - "premise not in KB"
  - "conclusion not entailed"
  - "class rule not in KB"
  - "conclusion contradicts an exception"
  - "exception does not differ from the default"
  - "exception not in KB"
  - "conclusion ignores the exception"
  - "reason is about a different entity"
  - "KB is silent on the claim"
  - "wrong verdict"
  - "fact is about a different route"
  - "route fact not in KB"
  - "math does not use the facts"
  - "wrong sum"
  - "answer differs from the sum"
  - Source: `src/routes/train-transformer/reasoning-corpus.ts:368-462`.
- Matching is whole-unit and anchored (`^…$`); anything else fails with "does not match any … template" — `src/routes/train-transformer/reasoning-corpus.ts:332-351`, `:371-372`.
- Test constraints:
  1. Deterministic — `tests/reasoning-corpus.test.ts:20-22`.
  2. Covers all five rule ids — `:24-27`.
  3. Every training and held-out unit passes `checkReasoningUnit` — `:29-34`.
  4. The checker rejects 4 hand-made bad units: wrong sum, wrong verdict, ignored exception, and penguin inheriting "can fly" — `:36-56`.
  5. Held-out facts never appear as `the owl|emu (can|cannot|flies|…)` and held-out sums never appear as "A plus B is" — `:58-75`.
  6. R-CHECK true share is in [0.4, 0.6] — `:77-83`.
  7. Token length ≤32, or ≤40 for R-ADD, using 1000 merges and the train.ts regex — `:85-95`.
- Measured locally:
  - R-CHECK true = 26/64 = 0.406, just above the 0.4 floor.
  - "nine" occurs 0 times in the training text. So does "zero". Every other number word from one to twelve occurs (one 42 … twelve 2).
  - All 5 held-out sums equal nine (4+5, 3+6).
  - Tokenising the held-out units with the training merges gives out-of-vocabulary pieces `" ", "n", "in", "e"`, so " nine" is not a vocabulary token.
  - owl and emu each appear in training only in R-TRANS units ("the owl is a bird . a bird is an animal . so the owl is an animal ."), so their name tokens are in the vocabulary.
- References to "docs/progress/05 §1.5" (`src/routes/train-transformer/reasoning-corpus.ts:366`, `tests/reasoning-corpus.test.ts:2`) point to a section that does not exist. Chapter 05 §1 stops at 1.4 (`docs/progress/05-implementation-and-evaluation.md:40`).
- A project memory note, `.claude/memory/reasoning-corpus-symbolic-checks.md`, says `STORIES` "has been deleted", that weights filenames carry `-c<sha1>` and that `seqLen = contextLen (32) and stride 8`. The working tree contradicts all three: `STORIES` is still present and imported (`src/routes/train-embed/corpus.ts:144`, `src/routes/train-transformer/train.ts:32`), there is no hash in the filename (`train.ts:243`), and `seqLen` is 16 with stride 1 (`train.ts:234-236`). The same note records a measured run on the reasoning corpus: 2 layers, 300 epochs, V=95, 32,671 parameters. Loss went 4.82 → 3.67, which "equals the corpus unigram entropy of 3.70 nats … samples are word salad". The note calls the link to the transformer defects "a hypothesis, not a measured cause". I could not re-verify this run; the `-c287cec4b` weight files exist in `.data/` with V=95.

### Inferences
- The draft already fixes the format that M4 can parse: one unit = one fixed template, words separated by single spaces, punctuation as its own token, and the decision point a single closed-class token (`can`/`cannot`, `true`/`false`, a number word). This suits M1, whose allowed set at the decision point is a small closed set. It also suits M3, whose `massBefore` on the banned alternative is directly interpretable.
- The held-out sum design is broken for E2/P3. The answer "nine" is not in V, so the model's probability of the correct answer is structurally zero. M1 can only mask existing tokens and cannot supply it. Held-out sums should use operand pairs whose *sum word* appears elsewhere in training (e.g. hold out 2+5 while 7 is seen via 3+4). Alternatively, the held-out answer word could be added to training in an unrelated template.
- The `Unit.rule` id is metadata and never appears in the text. A verifier on generated text must work out the rule by trying every pattern. The patterns look mutually exclusive, but no test checks that.
- The checker is all-or-nothing per unit: any wording drift fails the template match and no fact is extracted. For model output, a sentence-level (per `.`) triple parser would give partial credit and finer traces than the whole-unit regex.
- Exception units appear twice in training, while 6 of 23 R-TRANS units involve exception entities. The R-CHECK balance at 0.406 will fall below 0.4 if any false-verdict template is added. The test is fragile.

### Gaps
- No test checks the effective window used by train.ts, that answer tokens are in vocabulary, that patterns are disjoint, or that rule-level coverage is balanced (counts range from 16 R-EXCEPT to 64 R-CHECK).
- I cannot tell from the repo whether the owner intends to keep `STORIES`, replace it with this corpus, or mix the two. The memory note and the working tree disagree.

## 5. Which reasoning types can the symbolic layer verify and explain, and which can it not?

### Takeaway
With the draft KB and checker, the layer can verify and explain:
- one-step deduction (class rule to instance)
- 2-hop `is_a` transitivity
- default inheritance with entity exceptions (nearest level wins)
- polarity of `can`/`cannot`
- claim checking against the KB (true/false)
- two-operand addition from looked-up facts

It cannot handle:
- chains longer than the fixed templates
- `is not a` negation
- detecting contradiction *between premises* (only claim versus KB)
- causal "because" chains
- analogy
- counting over sets or quantified rules ("all", "no")
- `lives_in`, `opposite_of` and `agrees_with`, which are in the design but have no draft templates

### Cited Findings
- Deduction (modus ponens, class to instance): R-INHERIT checks that the premise `is_a` is a direct KB fact, that the class rule is in `DEFAULTS`, and that the conclusion matches `ability()` — `src/routes/train-transformer/reasoning-corpus.ts:383-410`. Design example rule: `is_a(x,fish) ⇒ cannot(x,fly)` — `docs/progress/04-neurosymbolic-design.md:101-103`.
- Transitivity: R-TRANS is fixed at exactly 2 hops, and both premises must be *direct* parent links — `src/routes/train-transformer/reasoning-corpus.ts:199-207`, `:376-382`. `isA()` is transitive to any depth (`:157-162`), but no template expresses a 3-hop chain such as kitten → cat → mammal → animal. `transUnit` returns undefined unless a grandparent exists (`:201-202`).
- Inheritance with exceptions: R-EXCEPT and `ability()` implement nearest-level-wins with explicit `source` — `src/routes/train-transformer/reasoning-corpus.ts:169-180`, `:411-421`. The test confirms "penguin … so the penguin can fly" is rejected — `tests/reasoning-corpus.test.ts:47-52`.
- Negation: polarity only exists inside the ability relation as `can`/`cannot` and the booleans in `DEFAULTS`/`EXCEPTIONS` — `src/routes/train-transformer/reasoning-corpus.ts:76-94`, `:194`. There is no `is not a` and no negated `is_a`. A query the KB has no answer for returns `undefined`, and the checker says "KB is silent on the claim" (`:439-440`). That is three-valued, not closed-world negation.
- Contradiction detection: the checker detects a *unit* that contradicts the KB ("wrong verdict", "conclusion contradicts an exception", "exception not in KB") — `src/routes/train-transformer/reasoning-corpus.ts:409`, `:418-420`, `:441`. False claims (R-CHECK with `false`) are the nearest form to contradiction in the corpus — `:242`. No template states two inconsistent premises and asks the model to detect the inconsistency. The design's verifier is per-triple against the KB (`docs/progress/04-neurosymbolic-design.md:155`) and has no cross-sentence consistency check.
- Causal chains: there is no `because`/`causes` relation in the design (`docs/progress/04-neurosymbolic-design.md:90-97`), in the draft KB or in the templates. The fairy tales have 2 "because" sentences (section 3).
- Analogy: the only analogy work is in the Skip-gram embedding evaluation (`king − man + woman → queen`; `kitten − cat + dog → lion`, wrong) — `README.md:53`. It is not a symbolic relation. The 04 taxonomy rates the 2a "Analogy" feature M, as the paper's rating, not a project capability — `docs/progress/04-neurosymbolic-design.md:20-25`.
- Counting and arithmetic: R-ADD checks that the two operands come from the question or from the route fact, that the sum is right, and that the answer equals the sum — `src/routes/train-transformer/reasoning-corpus.ts:443-461`. Operands are 1–6 and sums ≤12, limited by `NUMBER_WORDS` (zero–twelve) — `:114-128`, `:305-318`. There is no counting over listed entities (e.g. "how many of the birds can fly"), no subtraction and no comparison.
- Relations in the design but not in the draft: `lives_in`, `opposite_of`, `agrees_with` — `docs/progress/04-neurosymbolic-design.md:93-97`. The draft's ROUTES "hours" relation is not in the design table — `src/routes/train-transformer/reasoning-corpus.ts:97-104`.
- Explanation outputs available today: the checker's failure reason strings (section 4) and `ability().source` (the deciding level). The designed M3 trace fields (`rulesFired`, `maskedTokens`, `massBefore`) need the unbuilt `constraints.ts` — `docs/progress/04-neurosymbolic-design.md:139-148`.

### Inferences
- Summary matrix:

  | Reasoning type | Verify (draft) | Explain | What a new corpus needs |
  |---|---|---|---|
  | Deduction | Yes | Rule id, plus `source` class | Keep as is |
  | Transitivity | 2-hop only | Yes | Variable-hop chains need a new template and checker branch; within ≤16 or ≤32 tokens that allows about 3 hops at most |
  | Inheritance with exceptions | Yes | Yes (`source` = entity or class) | Keep; add held-out exceptions |
  | Negation | Ability polarity only | Partial | Explicit negated `is_a`, "no X can Y" |
  | Contradiction detection | Against KB only | Reason string | A template where premises conflict, answered "contradiction" |
  | Causal chains | No | No | A new relation (`causes`) and rule type |
  | Analogy | No | No | Out of scope for the symbolic layer |
  | Counting | Two-operand addition | Yes | Counting over KB-derived sets needs a new checker |

- For an explanation demo (E3), the most informative decision tokens are those where inheritance and exception disagree: emu/fly, penguin/fly, bat/fly, whale/walk. There, `massBefore` on the inherited-but-wrong token is the evidence chapter 04 asks for (`docs/progress/04-neurosymbolic-design.md:151`).

### Gaps
- Whether M1's `allowed()` should cover the *intermediate* premise tokens (e.g. ban "a fish" in "the salmon is a ___") or only the conclusion token is not specified.
- No evidence exists on whether a 2-layer, D=32 model can learn 2-hop composition at all. No experiment has run and the defects are still unfixed (`README.md:137`).

## 6. Concrete requirements for a new reasoning-focused raw-text corpus that matches the existing pipeline

### Takeaway
A corpus that lets users test explanation ability must be *generated from the KB*, not written as prose. It must use fixed, regex-parseable templates in the draft's exact surface format. It must fit each premise-to-decision span into the window `train.ts` actually uses. It must keep every answer token in the training vocabulary. It must end each unit at a single closed-class decision token the mask can act on, and it must carry held-out probes whose answers are reachable.

### Cited Findings (the pipeline facts each requirement is derived from)
- Surface format: lower case, single spaces, and punctuation `. , : ?` as separate tokens, because `train.ts` lower-cases and tokenises with `/\s\w+|[^\w\s]/g` — `src/routes/train-transformer/train.ts:191-199`. The draft writes " . " between sentences (`src/routes/train-transformer/reasoning-corpus.ts:205`).
- Window: training and generation use 16 tokens — `src/routes/train-transformer/train.ts:234`, `src/routes/train-transformer/transformer.ts:953-957`. The positional capacity is 32 — `train.ts:219`.
- Vocabulary is built from training text only, and unseen tokens are dropped — `src/routes/train-transformer/train.ts:201-230`.
- Whole-word constraint limit — `docs/progress/04-neurosymbolic-design.md:169`.
- One template per rule, and the regex must change with the template — `src/routes/train-transformer/reasoning-corpus.ts:16-18`, `:331-351`.
- The KB is the source of truth, and the corpus must pass `checkReasoningUnit` — `tests/reasoning-corpus.test.ts:29-34`.
- A held-out set written without looking at model output — `docs/progress/05-implementation-and-evaluation.md:108`.
- The weights cache key ignores the corpus — `src/routes/train-transformer/train.ts:243`.

### Inferences (requirements)
1. **Generation, not authoring.** Every unit is produced by a template function from KB tables, as in `IS_A`/`DEFAULTS`/`EXCEPTIONS`. Each unit must pass a checker. No free prose; fairy-tale text should be excluded from the reasoning training set or kept strictly separate.
2. **Exact surface format.**
   - lower case, ASCII words, single spaces
   - every sentence ends with ` .`
   - field markers `claim :`, `question :`, `fact :`, `math :`, `answer :`
   - `?` only after a question
   - articles a/an chosen by rule
   - one entity, relation word and value per sentence
3. **Length.** If `seqLen` stays 16, the span from the first premise to the decision token should be ≤16 tokens. That rules out the current R-CHECK (23 tokens) and R-ADD (28–37) unless they are shortened, for example by dropping the repeated `the X is a C` premise or the route question. If the owner raises `seqLen` to 32, every unit should be ≤32 including R-ADD, with no ≤40 exemption. The test should read the window from `train.ts` rather than hard-code 32.
4. **Vocabulary.** Keep V at about 100–150 whole-word tokens. Check that every word tokenises to one BPE token. **Every possible decision or answer token must occur in training**, which fixes the "nine" defect. Add a test that tokenises held-out units with the training merges and asserts there are no out-of-vocabulary pieces.
5. **The decision is a single closed-class token at the end of the unit:**
   - `can` or `cannot`
   - `true` or `false`, plus `unknown` if the KB is silent
   - a class name
   - a number word
   - `contradiction`, if added

   This gives M1 a small allowed set and makes M3's `massBefore` meaningful.
6. **Relations.** Keep `is_a`, `can`/`cannot` and route hours. Add `lives_in` only if a rule uses it, e.g. `lives_in(x, sea) ⇒ can(x, swim)`, so it is checkable rather than decorative. `opposite_of` and `agrees_with` have no checkable rule in the design. Leave them out or specify a rule first.
7. **Rule coverage per reasoning type**, each with its own rule id and regex:
   - R-INHERIT (deduction)
   - R-TRANS, extended to a 3-hop variant only if it fits the window
   - R-EXCEPT
   - R-CHECK, with true, false and (optionally) unknown verdicts
   - a negated `is_a` or "no X can Y" form
   - a premise-conflict template ending in `contradiction` or `consistent`
   - R-ADD within the window
   - optionally a counting template over KB-derived sets

   Causal chains need a new `causes` relation and rule before they are checkable. Analogy stays out of scope.
8. **Balance.** Keep each rule's unit count within a stated ratio. Keep R-CHECK true/false in 40–60 % with margin, not at 0.406. Repeat exceptions deliberately and document the factor.
9. **Held-out probes for explanation tests:**
   - Hold out entities whose inheritance is correct (owl) and whose exception is hidden (emu, and ideally one more), as the draft does.
   - Hold out arithmetic pairs whose answer word is seen elsewhere.
   - Keep the entity name itself in training (as R-TRANS does) so the probe is answerable at the token level.
   - Add held-out constraints written without looking at model output.
10. **Determinism and caching.** Use a seeded shuffle, as now. Encode a corpus hash in the weights filename so stale `.data/` checkpoints are not reloaded silently.
11. **A parser contract usable by M4.** Patterns are disjoint, which needs a test. Ideally there is also a per-sentence parser (one triple per ` . `-delimited sentence), so a partly malformed generation still yields checkable triples and a fine-grained violation list.

### Gaps
- What M1's allowed set is at each non-final token is not specified, so how much each template exercises the mask cannot be fixed yet.
- There is no data on how many examples per template a 2-layer, D=32 model needs. The only recorded run (memory note, not re-verified) ended at unigram entropy with the transformer defects still present.
