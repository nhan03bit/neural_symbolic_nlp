# Neural-Symbolic NLP: a small transformer from scratch, and what it cannot explain

A from-scratch TypeScript pipeline (no ML libraries) that climbs from a rule-based chatbot to a GPT-style transformer, plus a design for adding a symbolic layer on top.

![Pipeline and status of each stage](docs/images/fig-pipeline.png)

*Teal = built (stages 2–3 measured, stage 4 implemented). Violet = designed, not built. Border style repeats the colour for greyscale.*

## The idea in three sentences

1. A transformer starts from random weights and is trained only to predict the next token. Nothing in that objective represents *why* a token is right.
2. So it can produce plausible text it cannot justify. The study note behind this project puts it as "the model guessing the best weight to achieved 'Target Error' But lack the Critical Reasoning to its own".
3. A feasible fix at this scale is not to make the network reason, but to put a **checkable symbolic layer** beside it: a logit mask from a small knowledge base, and a verifier that leaves a trace (Sheth, Roy and Gaur, 2023).

## Status

| Stage | What                                   | State                                                             |
| ----- | -------------------------------------- | ----------------------------------------------------------------- |
| 0     | ELIZA pattern-matching chat            | Works                                                             |
| 1     | BPE tokenizer                          | Works                                                             |
| 2     | XOR network, 2→4→1 with backprop     | Works, measured                                                   |
| 3     | Skip-gram word embeddings              | Fixed (was collapsed), measured                                   |
| 4     | Decoder-only transformer               | **Done** (forward, backward, Adam, top-p generation, multi-threaded training) |
| 5     | Symbolic layer (mask, verifier, trace) | **Designed only**                                           |
| 6     | Experiments E1–E3 on the transformer  | **Not run, no results**                                     |

Stages 2 and 3 have measured results. The transformer has a recorded training baseline (see PRE TRAINING below), but no experiment has been run on it yet. Every number measured in this project comes from code, not typed in by hand: XOR and the seed comparison from `bun tests/ieee-data.ts`, the civil-law Skip-gram from the saved model (`.data/embedding-weights.json`). Figures quoted from papers are attributed to them.

## What was measured

### XOR: same function, unrelated weights

A single layer cannot learn XOR (loss 0.2845 → 0.2842). A 2→4→1 network can. Four seeds, same data and settings:

| Epochs           | Seed 42 | Seed 1  | Seed 2                           | Seed 3  |
| ---------------- | ------- | ------- | -------------------------------- | ------- |
| 500 (final MSE)  | 0.0144  | 0.0227  | **0.1506** (not converged) | 0.0110  |
| 5000 (final MSE) | 0.00028 | 0.00027 | 0.00031                          | 0.00022 |

At 5000 epochs all seeds compute the same function, but the first hidden unit's weights differ completely (for example `[5.84, −1.49, 6.18, −0.28]` for seed 42 against `[0, −6.50, −1.93, 5.29]` for seed 1).

![XOR loss and weights across seeds](docs/images/fig-xor-loss.png)

### Skip-gram: the civil-law vocabulary, and a wrong answer

The first version gave every word pair cosine 1.0. Five independent bugs were the cause (an off-by-one in the sampling table, a missing positive update, the wrong row updated for negatives, a wrong analogy sign, and a corpus join that never lower-cased). The fix was first checked on a toy corpus of fairy tales. That corpus is gone: the model now trains only on England & Wales civil-dispute text (222 definitions plus 34 dispute stories, 401 sentences; vocab 924 whole-word tokens from 5000 BPE merges; dim 32, window 2, 17,142 training pairs; 10,000 epochs; seed 42).

| Pair                | Cosine | Pair               | Cosine |
| ------------------- | ------ | ------------------ | ------ |
| buyer / customer    | 0.76   | defendant / tenant | 0.54   |
| seller / buyer      | 0.74   | claimant / defendant | 0.44 |
| claimant / creditor | 0.69   | trader / consumer  | 0.42   |
| landlord / tenant   | 0.59   | trader / court     | −0.02  |
| creditor / debtor   | 0.58   | judge / contract   | −0.13  |

Words that share sentences end up close: the consumer-rights roles (buyer, customer, seller) form one cluster, and the claimant sits next to the creditor because most claims in the corpus are debt claims. But the analogies fail. None of the five returns a role word:

| Query                          | Expected  | Returned (cosine)  |
| ------------------------------ | --------- | ------------------ |
| landlord − tenant + consumer   | trader    | *renters* (0.57)   |
| trader − consumer + tenant     | landlord  | *return* (0.65)    |
| claimant − defendant + debtor  | creditor  | *whether* (0.61)   |
| creditor − debtor + defendant  | claimant  | *between* (0.58)   |
| seller − buyer + customer      | supplier  | *proves* (0.72)    |

The model learned co-occurrence, not the relation "the party who supplies or lends, against the party who receives or owes". Moderate similarity, wrong relation. That is the gap the symbolic layer is meant to make visible.

![PCA and cosine matrix of 15 civil-law word vectors](docs/images/fig-skipgram-civil-law.png)

*Drawn by `docs/images/make_civil_law_figures.py` from `.data/embedding-weights.json`. The script recomputes the five analogies and prints them, so the table above can be checked against the saved vectors.*

### Four seeds: the geometry agrees, the coordinates do not

*Measured on the earlier toy corpus (`bun tests/ieee-data.ts`); not yet re-run on the civil-law corpus.*

| Measure (6 seed pairs)                                | Range          |
| ----------------------------------------------------- | -------------- |
| Cosine of the *same word* across seeds              | −0.28 to 0.09 |
| Correlation of the *pairwise geometry* across seeds | 0.977 to 0.984 |
| Analogies correct (our answer key)                    | 5/7 to 6/7     |

![Seed agreement](docs/images/fig-seed-agreement.png)

This cuts against a strong reading of "random weights". The learned *function* is stable across seeds; the *weights* are not. So the internal solution is neither unique nor designed, and you cannot read a reason off it. Stability also does not mean correctness: the *lion* error appears on every seed.

## The transformer

Follows the study note: each token gets a query, key and value; attention weights are `softmax(QKᵀ/√d_k + M)V` with a causal mask `M`; several heads run in parallel; a feed-forward net refines each token; blocks stack.

![Query, key and value](docs/images/fig-attn-qkv.png)

Pre-LN block, as built in GPT-2:

```
x'  = x  + MHA(LN1(x))
x'' = x' + W2 · ReLU(W1 · LN2(x') + b1) + b2
```

![Transformer block](docs/images/fig-transformer-block.png)

Config: context 32 (training windows of 16 tokens), d = 32, 2 heads, feed-forward width 128, 1–6 layers (default 2), Adam lr 0.001, one full-batch step per epoch. That is **12,704 parameters per block**. With the whole-word BPE vocabulary built from the civil-law text (937 tokens, 1781 merges) the model has 87,401 parameters at 2 layers and 138,217 at 6. The baseline below uses this vocabulary. Training signal is next-token cross-entropy, nothing else.

Implementation, in `src/routes/train-transformer/`:

| File | Role |
| ---- | ---- |
| `matrix.ts` | `matmul`, `matmulTransA/B`, Xavier init, seeded `rand` on flat row-major `Float32Array`s |
| `transformer.ts` | LayerNorm, causal multi-head attention, FFN, block forward/backward, cross-entropy, Adam, top-p generation |
| `weigth-layout.ts` | Packs all weights into one `SharedArrayBuffer`; zero-copy views for every thread |
| `train-worker.ts` | Worker thread: forward + backward on its slice of sequences, gradients into shared memory |
| `train.ts` | BPE vocab, sliding windows, spawns `cpus − 2` workers, sums gradients, Adam step, samples, checkpoints every 100 epochs to `.data/` |
| `index.ts` | `POST /train-transformer`, streams `init`, `epoch` and `done` events over SSE |

UML class and sequence diagrams of all of this are in [`docs/architecture.md`](docs/architecture.md).

## The reasoning gap

- **The objective has no notion of truth.** It rewards sounding like the corpus. Nothing in the loss forbids "the kitten barked".
- **Weights come from a random start.** XOR and Skip-gram above show equal behaviour from unrelated weights.
- **"Pure emergent, not designed" means opaque.** Attention maps show where the model looked, not a justification it could be held to.
- **More layers do not change the objective.** Whether reasoning emerges at scale is open. We claim only that nothing in *this* small model asks for it or exposes it.

### Does adding semantic loss close the gap? No

*From the literature and our own derivations. Nothing here has been run on this transformer.*

The obvious next step is to change the objective: train on cross-entropy plus a semantic loss (M5, below), `CE + λ_s · (−log P_A)`, where `P_A` is the total probability the model gives to the tokens the knowledge base allows at that position. That still leaves the transformer's ambiguity unresolved, but not because the loss is random. It is a deterministic function of the probabilities: the same logits always give the same value. The randomness in this repo is elsewhere, in the seeded weight initialisation and in top-p sampling, and this approach leaves both in place (see below).

The limits come from what the term can see and reach:

- **It cannot choose among allowed tokens.** Next-token entropy splits as `H(p) = H_b(P_A) + P_A·H(q_A) + (1−P_A)·H(q_B)`, where `q_A` and `q_B` are `p` renormalised over the allowed and banned tokens. The loss depends only on `P_A`, so `H(q_A)` is outside its objective (our derivation). In the words of van Krieken et al. (2024), a constraint "only specifies what worlds are possible but does not specify which one is correct".
- **It is a soft penalty.** When the data and a rule conflict, the optimum at one context keeps banned mass `f_B / (1 + λ_s)`, where `f_B` is the banned tokens' frequency in the data (our derivation). There is no guarantee at test time (Ahmed et al., 2022). Xu et al. (2018) report that 69.89% of test predictions satisfied the constraint on grid paths and 55.28% on preference rankings: large gains, far from complete.
- **It acts only where it is applied.** Allowed sets come from corpus prefixes, so nothing constrains a prefix the model generates and the corpus never contains. Where the target is already allowed, `CE = masked CE + (−log P_A)`, so the term re-weights something cross-entropy already optimises (our derivation). It changes the speed of learning there, not the optimum.
- **It inherits the knowledge.** A missing rule constrains nothing, and a wrong one is trained in. Even with correct constraints, the generalisation benefit comes with a bias toward a suboptimal model (Wang et al., 2023).
- **It can amplify seed differences.** Zombori et al. (2024) prove for softmax regression that, with no other supervision, this form of loss concentrates mass on whichever allowed token starts largest. Which token wins then depends on the initial weights. Whether this happens in a shared-weight transformer has to be measured.

Adding the mask and verifier narrows the gap without closing it. The mask makes a covered banned token impossible, but only for token IDs the knowledge base bans and only when a trigger fires. The guarantee is relative to the knowledge base, and the verifier adds its own parsing errors. Neither can tell which of several valid tokens is right, and a wrong rule is then enforced absolutely.

**The two sources of randomness also stay.** None of M1–M5 removes either one:

| Source | Where | What the approach does to it | What is left |
| ------ | ----- | ---------------------------- | ------------ |
| **Weight initialisation** | Xavier init from the seeded `rand` (`matrix.ts`) | The semantic loss constrains outputs, not coordinates, so it adds a term to training that still starts from random weights. The mask, trace and verifier never touch the weights. | Seeds still end at unrelated weights, as XOR shows above, and may disagree more among allowed tokens (Zombori et al., above). |
| **Top-p sampling** | The draw in `generateText` (`transformer.ts`), from the same `rand` | The semantic loss changes the probabilities drawn from, and the mask removes banned tokens before temperature and top-p. The draw itself stays. The verifier only checks text after it is drawn. | The next token is still picked at random from whatever remains in the nucleus. |

Two ways of removing them only appear to work. Fixing the seed makes a run repeatable, not justified: seed 42 is no more correct than seed 1, and repeating an answer gives no reason for it. Greedy decoding removes the draw, but the output is then one fixed point of one seed's distribution, so the disagreement between seeds is still there, just out of sight. Both can be measured across seeds, but not removed while the network writes the output. The only route that removes them from an output's content is to stop the network authoring it (a formal query, a reasoner and a template), which gives up generation and still repeats every knowledge-base error.

Removing all uncertainty would be the wrong goal anyway, because language has many acceptable continuations and ambiguity is a normal feature of it (Piantadosi et al., 2012; Holtzman et al., 2020). The realistic target is **zero mass on rule-excluded tokens and a calibrated spread over the rest**, with each guarantee stated next to its coverage.

## The neuro-symbolic design

Mapped onto the taxonomy of Sheth et al.: **lowering** compresses symbolic knowledge into the neural side, **lifting** lifts neural output into symbols.

![Taxonomy mapping](docs/images/fig-taxonomy-mapping.png)

| Mechanism                  | What it does                                                                          | Position                      |
| -------------------------- | ------------------------------------------------------------------------------------- | ----------------------------- |
| M1 Hard logit mask         | Sets logits of knowledge-base-violating tokens to −∞ before temperature and softmax | 1a-style lowering, by analogy |
| M2 Soft bias               | Adds +λ to tokens the knowledge base supports                                        | 1a-style lowering, by analogy |
| M3 Reasoning trace         | Per step: rules fired, tokens blocked, probability mass before and after              | Part of 2a                    |
| M4 Verifier                | Parses generated text into triples, checks them against the knowledge base            | 2a decoupled lifting          |
| M5 Semantic loss (stretch) | Training term rewarding mass on allowed tokens                                        | Toward 2b                     |

![Neuro-symbolic data flow](docs/images/fig-neurosymbolic-flow.png)

The knowledge base is a few hand-written relations (`is_a`, `lives_in`, `can`, `cannot`, …) and Horn rules such as `is_a(x, fish) ⇒ cannot(x, fly)`, applied by forward chaining. The useful number in the trace is `massBefore`: how much probability the network *wanted* to put on a token the knowledge base rejected.

**What this does not do.** A mask is not understanding. It blocks a class of outputs and leaves the weights unchanged. The trace explains the symbolic decision, not the network's internal computation. Constraints work cleanly only on whole-word tokens.

Four predictions the design must survive:

| #  | Prediction                                                                | Refuted if            |
| -- | ------------------------------------------------------------------------- | --------------------- |
| P1 | With the hard mask on, violations are 0 for token-expressible constraints | any such violation    |
| P2 | With the processor off, output equals the baseline at the same seed       | any difference        |
| P3 | The unconstrained model violates the knowledge base at a non-trivial rate | rate near 0           |
| P4 | Seeds give similar loss but different weights                             | weights agree closely |

## PRE TRAINING: the baseline before the symbolic layer

This is the reference point for comparison. Everything here was trained by next-token or context prediction alone, with **no** knowledge base, mask, bias, trace, verifier or semantic loss. When the neuro-symbolic layer is built, the same commands and settings are run again and compared with this section. The Skip-gram was recorded on 2026-10-31 on the working tree of commit `c42da07`. The transformer was recorded on 2026-11-02 with the source at commit `f4a3926`.

### What was measured

**Skip-gram (stage 3)**, from the `/train-embed` page with the words `claimant defendant landlord tenant`: 10,000 epochs (the route's default), seed 42.

| Corpus | Value |
| ------ | ----- |
| Sentences | 401 |
| Vocabulary | 924 |
| Dimensions | 32 |
| Window | 2 |
| Training pairs | 17,142 |
| Loss at epoch 0 | 4.102625 |

| Word | Five nearest neighbours (cosine) |
| ---- | -------------------------------- |
| claimant | creditor 0.69, remoteness 0.67, limitation 0.67, evidence 0.66, test 0.64 |
| defendant | noise 0.69, loser 0.66, authorities 0.64, hearing 0.62, talking 0.62 |
| landlord | tenant 0.59, protect 0.59, higher 0.57, thought 0.57, loss 0.56 |
| tenant | income 0.67, area 0.66, disputed 0.64, buyer 0.63, price 0.62 |

| Pair | Cosine |
| ---- | ------ |
| landlord ↔ tenant | 0.59 |
| defendant ↔ tenant | 0.54 |
| claimant ↔ defendant | 0.44 |
| defendant ↔ landlord | 0.44 |
| claimant ↔ tenant | 0.43 |
| claimant ↔ landlord | 0.40 |

Analogies: 0 of 5 correct (the table is in the Skip-gram section above).

<details>
<summary>Screenshots of the run</summary>

![Corpus statistics and first epoch](docs/images/pretrain-embed-corpus.png)
![Nearest neighbours](docs/images/pretrain-embed-neighbors.png)
![Pairwise similarity and vector analogies](docs/images/pretrain-embed-similarity.png)

</details>

**Transformer (stage 4)**: 2000 epochs, 2 layers, temperature 1, top-p 0.6, 20 tokens, seed 42, sent from the Train Transformer page as `2000 1 0.6 2 20` (about 86 minutes, estimated from checkpoint timestamps). This replaces the earlier 300-epoch run, as the guardrail below requires, because `transformer.ts` and the vocabulary have changed.

| Measure | Value |
| ------- | ----- |
| Training text | 256 items (222 definitions + 34 stories) |
| Vocabulary | 937 tokens (1781 BPE merges, one token per word or punctuation mark) |
| Parameters | 87,401 |
| Training windows | 5,374 windows of 16 tokens |
| Loss at epoch 0 | 6.868 (ln 937 = 6.843, a uniform guess, as expected) |
| Loss at epochs 100, 300, 500, 1000, 1500 | 4.850, 2.217, 1.051, 0.391, 0.287 |
| Lowest logged loss | 0.248 at epoch 1980 |
| Final loss, epoch 2000 | 0.2489 (perplexity ≈ 1.28) |
| Held-out loss | Not measured: this run trained on all 256 items |

Sample at epoch 2000, prompt `the claimant is`:

> the claimant is the person who brings a claim. the defendant is the person who answers a claim. the claimant asks

**This loss shows memorisation, not generalisation.** The whole sample above is an unbroken stretch of the training text. As the loss falls, the samples turn into copies:

| Epochs | Samples | Generated tokens copied, mean | Samples entirely copied |
| ------ | ------- | ----------------------------- | ----------------------- |
| 0–300 | 31 | 0.0% | 0 |
| 310–500 | 20 | 5.5% | 0 |
| 510–1000 | 50 | 79.7% | 0 |
| 1010–1500 | 50 | 99.5% | 15 |
| 1510–2000 | 50 | 100% | 38 |

A token counts as copied if it sits inside a run of 8 or more tokens found verbatim in the training token stream. Samples are the ones saved every 10 epochs in the weights file's history.

**Fluent text is not always correct.** Samples from earlier in the run state definitions that are not in the corpus and contradict its definition of a claimant as "the person who brings a claim":

> the claimant is the person who owns the home. the tenant is the person who rents the home. the landlord gets *(epochs 1000 and 1370)*
>
> the claimant is the person who rents the home. the landlord gets the rent. the tenant pays the rent. the *(epoch 1380)*

These samples, from one seed, show that this happens, not how often. Measuring the rate is E2's job.

Weights: `.data/transformer-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-v4.json`. Replaying them through the cached path gives a final loss of 0.248851.

<details>
<summary>Screenshots of the run</summary>

![Architecture for 2000 1 0.6 2 20: vocabulary 937, 87,401 parameters, 5,374 sequences](docs/images/pretrain-transformer-config.png)
![Training loss from epoch 80 to epoch 350](docs/images/pretrain-transformer-loss.png)
![Samples at epochs 1370, 1380 and 1390](docs/images/pretrain-transformer-samples.png)
![Sample at epoch 2000 and final loss 0.2489](docs/images/pretrain-transformer-final.png)

</details>

<details>
<summary>Superseded baseline: 300 epochs, with defects D1–D3 present (2026-10-31)</summary>

Kept as the record of the transformer before its fixes. Do not compare new runs with it. It ran headless through `trainTransformer` at temperature 0.8, top-p 0.9 and 40 tokens (710 s on 10 cores), on commit `c42da07`.

| Measure | Value |
| ------- | ----- |
| Vocabulary | 807 tokens (1000 BPE merges) |
| Parameters | 78,951 |
| Training windows | 6,431 windows of 16 tokens |
| Loss at epoch 0 | 6.717 (ln 807 = 6.693) |
| Lowest loss | 5.637 at epoch 210 |
| Final loss, epoch 300 | 5.678 (perplexity ≈ 292) |

Sample at epoch 300, prompt `the claimant is`:

> the claimant is. the and. six.. on of to track the the. takes of of founds tenant usually. th needs. fromy paid you tenant did the the t to learner. agreement. she

The loss stops falling after about 100 epochs and the text is domain words in no order, as expected from the three forward/backward defects present at the time, since fixed (the first residual multiplied instead of adding, attention skipped the token itself, the K gradient used `K`). Weights: `.data/transformer-weights-e300-l2-d32-h2-ff128-ctx32-cbf9d5315.json`.

</details>

### What this baseline does not include

- No symbolic component of any kind (M1–M5 are all off).
- No held-out score: the transformer trained on all the text, so its loss says nothing about unseen text.
- One seed only. The Skip-gram and the transformer use different BPE settings (5000 against 2000 merges requested), so their vocabularies (924 against 937) are not comparable with each other. Compare each model only with its own neuro-symbolic run.

### Risks to a fair comparison, and the guardrail for each

| Risk | Guardrail |
| ---- | --------- |
| `transformer.ts` or the tokeniser changes before the neuro-symbolic run, so any gain comes from that change, not the symbolic layer | If the code changes, raise `MODEL_VERSION`, re-run this baseline first and replace the numbers here |
| A lower training loss is read as a better model, when this baseline shows it can mean more copying | Compare E2, E3 and the copied share as well as the loss |
| The corpus changes | The transformer weights file name carries the corpus hash (`-cbf9d5315`); a different hash means a new baseline is needed |
| Different epochs (the UI defaults to 10,000 Skip-gram epochs; the transformer route defaults to 300, and this baseline uses 2000) | Compare at the epochs recorded here |
| A difference smaller than the seed-to-seed spread | Treat it as noise until E1 measures that spread |
| The intermediate checkpoints (`…-e100-…-v4.json`, `…-e200-…-v4.json`) have no corpus hash in their names, so they can be mistaken for a different corpus's run | Use only the hashed final file as the baseline |

### How to reproduce it

1. Skip-gram: `bun run dev`, open `/train-embed`, send `claimant defendant landlord tenant`, and check that the four tables above come back.
2. Skip-gram figure and analogies: `python3 docs/images/make_civil_law_figures.py`. It must print `renters (0.57)`, `return (0.65)`, `whether (0.61)`, `between (0.58)` and `proves (0.72)`.
3. Transformer: run
   `curl -N -X POST localhost:5173/train-transformer -H 'content-type: application/json' -d '{"epochs":2000,"temperature":1,"topP":0.6,"numLayers":2,"maxTokens":20}'`.
   With the hashed weights file present this replays the saved run in seconds. It should report vocabulary 937, 87,401 parameters, 5,374 sequences, loss 6.867592 at epoch 0 and a final loss of 0.248851. Delete that file to train again (about 86 minutes); this retraining has not been repeated yet.
4. Regression check: `bun test tests/train-embed.test.ts` (5 pass).

### Comparison table (to fill in after the neuro-symbolic run)

| Metric | PRE TRAINING (this section) | Neuro-symbolic |
| ------ | --------------------------- | -------------- |
| Skip-gram analogies correct | 0 / 5 | — |
| landlord ↔ tenant cosine | 0.59 | — |
| Transformer final loss (2000 epochs) | 0.2489 | — |
| Generated tokens copied from the corpus, epochs 1510–2000 | 100% | — |
| Knowledge-base violation rate (E2) | not measured (needs the verifier) | — |
| Banned-token probability mass, `massBefore` (E3) | not measured (needs the trace) | — |

## Not done yet

1. **Measure the transformer on unseen text.** The baseline above is re-recorded on the fixed transformer, but it trained on all the text and its samples are copies. The search for the configuration that scores best on held-out stories (`tests/search-transformer.ts`) has not been run. The five gates pass (`tests/train-transformer.test.ts`): finite-difference gradient check (error < 10⁻³), initial loss ≈ ln V, overfit a single sequence, causal-mask test, same seed gives same weights. They needed three forward/backward fixes in `transformer.ts`, made on 2026-11-02 (see [architecture §9](docs/architecture.md#9-defects-found-while-drawing-the-diagrams)): the first residual multiplied instead of adding (line 494), attention skipped the token itself (`j < i`, line 482), and the gradient for K used `K` instead of `Q` (line 668). Older weights stay in `.data` but are not loaded, because filenames now carry `MODEL_VERSION`.
2. **Build the symbolic layer** (`symbolic.ts`, `constraints.ts`, verifier).
3. **Run E1–E3**: E1 seed sensitivity (weight and logit distance), E2 violation rate with the mask off and on, E3 one full trace. Until then, no claim is made about the transformer or the symbolic layer.
4. **Rewrite `tests/ieee-data.ts` for the civil-law corpus.** It still measures king/queen/cat, so the seed comparison and the IEEE paper figures cannot be regenerated until it is.

## Limits of the evidence

Small corpora (the seed comparison used a 107-sentence toy corpus; the civil-law Skip-gram is 401 sentences and one seed), four seeds, one configuration, no significance tests, an answer key we chose ourselves, no held-out set. The results show a mechanism, not behaviour at scale. The study note is the author's own, not peer reviewed.

## Run it

```bash
bun install
bun run dev                          # app at http://localhost:5173
bun test tests/train-embed.test.ts   # 5 Skip-gram sanity tests
bun tests/probe-xor.ts               # XOR across seeds 42/1/2/3
bun tests/probe-embed.ts 300         # Skip-gram, 300 epochs, about 85 s
bun tests/ieee-data.ts               # regenerate every number and table (about 25 s)
python3 docs/images/make_figures.py  # redraw figures (needs matplotlib, numpy)
python3 docs/images/make_civil_law_figures.py  # civil-law Skip-gram figure
```

Train the transformer at `http://localhost:5173/train-transformer`. Send `300 0.8 0.9 2 40` (epochs, temperature, top-p, layers, max tokens), or nothing for those defaults. The same thing from the shell:

```bash
curl -N -X POST localhost:5173/train-transformer -H 'content-type: application/json' \
  -d '{"epochs":300,"temperature":0.8,"topP":0.9,"numLayers":2,"maxTokens":40}'
```

`bunx tsc -b --noEmit` passes.

A 5-page IEEE-format paper of this report is in [`docs/progress/ieee/main.pdf`](docs/progress/ieee/main.pdf), built from the same data.

## References

- Sheth, A., Roy, K., Gaur, M. (2023). Neurosymbolic Artificial Intelligence (Why, What, and How). *IEEE Intelligent Systems* 38(3), 56–62.
- Xu, J., Zhang, Z., Friedman, T., Liang, Y., Van den Broeck, G. (2018). A Semantic Loss Function for Deep Learning with Symbolic Knowledge. *ICML*. [arXiv:1711.11157](https://arxiv.org/abs/1711.11157).
- Semantic loss limits: van Krieken et al. (2024), [On the Independence Assumption in Neurosymbolic Learning](https://arxiv.org/abs/2404.08458), *ICML*. Ahmed et al. (2022), [Semantic Probabilistic Layers for Neuro-Symbolic Learning](https://arxiv.org/abs/2206.00426), *NeurIPS*. Wang et al. (2023), [On Regularization and Inference with Label Constraints](https://arxiv.org/abs/2307.03886), *ICML*. Zombori et al. (2024), [Towards Unbiased Exploration in Partial Label Learning](https://arxiv.org/abs/2307.00465), *JMLR* 25(412).
- Ambiguity in language: Piantadosi, Tily, Gibson (2012), The communicative function of ambiguity in language, *Cognition* 122(3). Holtzman et al. (2020), [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751), *ICLR*.
- Weizenbaum (1966), ELIZA. Sennrich et al. (2016), BPE. Rumelhart et al. (1986), backpropagation. Mikolov et al. (2013a, b), Skip-gram. Vaswani et al. (2017), attention. Ba et al. (2016), LayerNorm. Kingma and Ba (2014), Adam.
- This research was based up on simple NLP model from  [w3cj/how-llms-work](https://github.com/w3cj/how-llms-work).
- Papers are in `docs/paper/`. Figures are in `docs/images/`: the `fig-*.png` files are drawn by `make_figures.py`; the rest are cut from the papers for study and credited in [`docs/progress/references.md`](docs/progress/references.md).
- Longer chapter-by-chapter write-up, if you want the detail: [`docs/progress/`](docs/progress/README.md). Software architecture with UML diagrams: [`docs/architecture.md`](docs/architecture.md).
