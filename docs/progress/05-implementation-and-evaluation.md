# 05. Implementation and evaluation

This chapter records the implementation state honestly, specifies the experiments, and states which results exist. **No experiment on the transformer or the symbolic layer has been run.**

## 1. Implementation status and known issues

### 1.1 Done and verified

| Item | Evidence |
|---|---|
| Shared seeded RNG `src/server/lib/rng.ts` (`mulberry32`) | Used by `matrix.ts`, `train-embed/train.ts`, `neural-net/train.ts`; seeded runs are deterministic |
| Skip-gram collapse repaired | chapter 01 §4; `tests/train-embed.test.ts`: 4 tests pass |
| XOR seeded, default 5000 epochs | chapter 01 §3 |
| `cosineSimilarity` returns 0 for a zero vector | `src/server/lib/math.ts` |
| `zod` declared in `package.json` | was imported but only present transitively |
| `trainSkipGram` takes an optional `seed` (default 42) | lets the four-seed comparison run (chapter 01 §4.5) |
| `tests/ieee-data.ts` regenerates every number, table and plot input | `docs/progress/ieee/data/*`; two runs gave identical output |
| `docs/images/make_figures.py` draws the diagrams and plots | reads only `ieee/data/`; no number is typed in |

### 1.2 The transformer file, as of this report

`src/routes/train-transformer/transformer.ts` is written by hand by the project owner. It currently has the config, weight, gradient and Adam types, `BLOCK_KEYS`, `BlockCache`, `ForwardCache`, `initBlockWeights` and `zeroBlockGrads`. The type-check reports unused symbols (expected while it is unfinished) and one real error: `matmulTransAm` is not exported by `matrix.ts` (the function is `matmulTransA`).

Defects visible in the code written so far, listed for the owner and **not changed** by this report:

| Location | Defect | Fix |
|---|---|---|
| import, line 19 | `matmulTransAm` does not exist | `matmulTransA` |
| `initBlockWeights`, `ln1Beta` | initialised with `ones(D)` | LayerNorm shift $\beta$ should start at zero: `zeros(D)` |
| `initBlockWeights`, `ff1B` | `zeros(D)`, but `ff1W` is $D\times F$ and `zeroBlockGrads` allocates `ff1B` as $F$ | `zeros(F)` |
| Names | `TransfomerConfig`, field `numLayes` | spelling; keep consistent wherever they are used |
| `weigth-layout.ts` | empty, misspelled file | delete if not needed |

`ln1Beta` and `ff1B` would not crash. They would give a subtly wrong model (a non-zero starting shift; a shape mismatch against the gradient buffer), which is the kind of defect that a finite-difference gradient check is meant to catch.

### 1.3 Not yet written

LayerNorm forward/backward, `softmaxRows`, block forward/backward, `forward`, `crossEntropyLoss`, `backward`, `adamUpdate`, `generateText`, `train.ts`, the SSE route and schema, the client hook and its mounting, and the whole symbolic layer (`symbolic.ts`, `constraints.ts`, the verifier).

### 1.4 Other open items

- The ELIZA route emits its first event after a 10 000 ms delay (`src/routes/simple-chat.ts`, the `start` emit). That is probably a typo for 1000 but may be a deliberate "thinking" pause. Left unchanged; the owner should confirm.
- `bun run lint` fails. Besides the unfinished transformer file, `src/client/routes.tsx:23` references a rule that does not exist (`ts/consistent-type-definitions`), which predates this work, and the probe scripts in `tests/` use `any`.
- `package.json` contains a `test` dependency (a `node:test` polyfill) that was not added by this work. `bun test` does not need it.
- `.data/embedding-weights.json` still holds the old collapsed model until training is re-run with saving on.

## 2. Experiments

All experiments run locally and are seeded.

### E1. Seed sensitivity (tests chapter 03 §2)

- **Question.** Does the same data, architecture and loss reach similar loss through very different weights?
- **Protocol.** Train the transformer with seeds 42, 1, 2, 3 under identical settings. For each seed record final loss. For each pair of seeds compute the L2 distance and the cosine between the flattened weight vectors, and the cosine between the *output logits* on a fixed held-out set of prompts.
- **Interpretation.** Similar loss with large weight distance supports the claim; large logit distance too would mean the models also *behave* differently. Weight distance can also be large only because of symmetries (permuting hidden units), so a logit-level comparison is required before concluding anything.
- **Status.** Not run. The XOR analogue is measured (chapter 01 §3).

### E2. Constraint violation rate (tests P1, P3)

- **Question.** How often does the unconstrained model generate text that contradicts the knowledge base, and what does the mask cost?
- **Protocol.** For each seed, generate $N$ samples with the processor off and with the hard mask on, at fixed temperature and top-p. Report violation rate (via the verifier), perplexity on held-out text, and distinct-token ratio.
- **Status.** Not run.

### E3. Trace demonstration

- **Protocol.** One generation with the full per-step trace table (`rulesFired`, `maskedTokens`, `massBefore`, `massAfter`, `chosen`).
- **Status.** Not run.

## 3. Verification gates for the transformer

Before any experiment is trusted:

1. A finite-difference gradient check for every parameter group (token and position embeddings, LayerNorm, Q/K/V/O, feed-forward, head), with relative error below $10^{-3}$.
2. Initial loss close to $\ln V$ (a uniform guess).
3. A single repeated sequence overfits to near-zero loss.
4. Causal mask: changing a future token leaves earlier logits unchanged.
5. The same seed gives the same weights.

## 4. Results

| Experiment | Result |
|---|---|
| E1 | none yet |
| E2 | none yet |
| E3 | none yet |

The only measured results in this report are those of stages 2 and 3, in [chapter 01](01-background.md). Their summary, all from `bun tests/ieee-data.ts`:

| Stage | Metric | Seeds | Range observed |
|---|---|---|---|
| 2 XOR, 2→4→1 | MSE at 5000 epochs | 42, 1, 2, 3 | 2.2e-4 to 3.1e-4 |
| 2 XOR, 2→4→1 | MSE at 500 epochs | 42, 1, 2, 3 | 0.0110 to 0.1506 |
| 2 XOR, single layer | MSE, 500 epochs | 42 | 0.2845 → 0.2842 |
| 3 Skip-gram | loss, epoch 0 → 300 | 42, 1, 2, 3 | 4.07–4.08 → 1.244–1.271 |
| 3 Skip-gram | analogies correct (our key) | 42, 1, 2, 3 | 5/7 to 6/7 |
| 3 Skip-gram | same-word cosine across seeds | 6 seed pairs | −0.28 to 0.09 |
| 3 Skip-gram | pairwise-geometry Pearson r | 6 seed pairs | 0.977 to 0.984 |
| 4 Transformer | parameters per block, D=32, F=128 | analytic | 12 704 (not a measurement of a trained model) |

![Pipeline and status](../images/fig-pipeline.png)

*Figure 5.1. Where the measured results sit in the pipeline (same as Figure 1.1).*

## 5. Threats to validity (anticipated)

- **Corpus size.** 34 stories (or 107 short sentences) is a toy. Behaviour at scale will differ.
- **Few seeds.** Four seeds give a spread, not a distribution.
- **KB authored by us.** A knowledge base written by the same person who writes the test makes P1 easy to satisfy and P3 easy to inflate. The verifier and the processor should share the KB deliberately and the report should say so, and a few held-out constraints should be written without looking at model output.
- **Whole-word constraints.** Described in chapter 04 §8.
