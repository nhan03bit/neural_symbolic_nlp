# M1 hard logit mask: "1a-style lowering, by analogy", and what inference-time token masks can and cannot guarantee

Scope note. This extends [the earlier report](../../reports/Semantic%20loss%20with%20hard%20logit%20constraints.md) (cited below as "earlier report") and does not re-derive it. Already established there, so only cited here: the ordering rules, the -inf versus finite-penalty point, the BPE probe on the project's tokenizer, the word-banning perplexity problem, the Pseudo-SL table, and the 41.5% to 30.8% GSM8K result. "Own check" under Inferences means arithmetic or a lookup run for these notes, not a source's claim. Quotes were taken from PDFs converted with `pdftotext`, so ligatures and hyphenation are normalised.

## How do Sheth et al. define category 1a, what do real 1a methods do, and what must a "1a-style, by analogy" claim disclaim?

### Takeaway
Category 1a is "compressed knowledge graph representations for integration with neural patterns", with two families: KG embeddings and KG masks. A logit mask shares only two things with this: the direction of knowledge flow, and the form "binary mask times a neural distribution" (with TDLR). It compresses nothing, reasons outside the network, leaves the weights unchanged, and sits after the last layer. Its hard guarantee comes from those differences, so the guarantee cannot be credited to 1a and 1a's claimed benefits cannot be credited to M1.

### Cited Findings

**The definition (verbatim)**
- Category 1: "methods that compress structured symbolic knowledge to integrate with neural patterns and reason using the integrated neural patterns" — [Sheth et al. 2023, p. 57](https://doi.org/10.1109/MIS.2023.3268724)
- Category 1a: "compressed knowledge graph representations for integration with neural patterns" — [Sheth et al. 2023, p. 57](https://doi.org/10.1109/MIS.2023.3268724)
- Category 1b: "compressed formal logic-based representations for integration with neural patterns"; these "use matrix and higher-order tensor-factorization methods to obtain compressed representations of objects and formal logic statements" — [Sheth et al. 2023, p. 57-58](https://doi.org/10.1109/MIS.2023.3268724)
- **"Lowering" is never defined.** In the numbered definitions only category 2 carries a tag, "(lifting)". The word "lowering" appears once in the paper, in the Fig. 1 caption: "The two primary types of neurosymbolic techniques, lowering and lifting, can be further divided into four subcategories." — [Sheth et al. 2023, p. 57-58](https://doi.org/10.1109/MIS.2023.3268724) (case-insensitive search of the local PDF text)

**The two 1a families (verbatim)**
- "One approach is to use knowledge graph-embedding methods, which compress knowledge graphs by embedding them in high-dimensional, real-valued vector spaces using techniques such as graph neural networks. This enables integration with the hidden representations of the neural network. The other approach is to use knowledge graph-masking methods, which encode the knowledge graphs in a way suitable for integration with the inductive biases of the neural network." — [Sheth et al. 2023, p. 58](https://doi.org/10.1109/MIS.2023.3268724)
- Fig. 2 caption: "The other method involves encoding knowledge graphs as masks to modify the neural network's inductive biases. An example of an inductive bias is the correlation information stored in the self-attention matrices of a transformer neural network." Fig. 2 labels the two "Inductive Bias-level" and "Representation-level Structured Knowledge Compression". It draws a concept-by-concept 0/1 matrix joined to the attention matrix with a "+". — [Sheth et al. 2023, Fig. 2, p. 59](https://doi.org/10.1109/MIS.2023.3268724)
- Fig. 1 names one example of each: "Knowledge Graph Embedding Based Methods (e.g., K-Adapter)" and "Knowledge Graph Mask Based Methods (e.g., TDLR)". — [Sheth et al. 2023, Fig. 1, p. 58](https://doi.org/10.1109/MIS.2023.3268724)

**What Sheth says about 1a's properties (each one bears on the disclaimer)**
- Compression is lossy: improvements in cognition are "modest [(M) in Figure 1] due to lossy compression of the full semantics in the knowledge graph". — [Sheth et al. 2023, p. 58](https://doi.org/10.1109/MIS.2023.3268724)
- "its full semantics are no longer explicitly retained", hence low explainability. — [Sheth et al. 2023, p. 59](https://doi.org/10.1109/MIS.2023.3268724)
- Domain constraints score only (M), "because large neural networks have multiple processing layers and moving parts [(M) in Figure 1]. It is challenging to determine whether modifications made to the network are retained throughout the various processing layers." — [Sheth et al. 2023, p. 59](https://doi.org/10.1109/MIS.2023.3268724)
- The (H) for large-scale perception refers to "processing millions and billions of nodes and edges". — [Sheth et al. 2023, p. 58](https://doi.org/10.1109/MIS.2023.3268724)
- Sheth's stated preference on timing: "To ensure rigorous safety standards, it is necessary to incorporate appropriate background knowledge to set guardrails during training rather than as a posthoc measure." — [Sheth et al. 2023, p. 57](https://doi.org/10.1109/MIS.2023.3268724)

**What the named 1a papers actually do**
- TDLR, the mask exemplar. Steps include "Explicitly encode the desired semantics from relevant knowledge graphs in the self-attention mechanism of LMs" and "Train the LM as before". Mask entries select what attends to what: "we ensure that the word 'war' attends to the word 'great' by setting the corresponding entry in the mask to 1 while masking out the rest of the entries with 0". Then "we execute the forward-backward training pass as usual in an LM", and wider scope "requires the simple addition of multiple attention masks at different layers". It is built on BERT with ConceptNet and WordNet, evaluated on GLUE tasks. — [Rawte, Roy et al. 2022](https://par.nsf.gov/biblio/10429264)
- TDLR frames the mask as Bayes: "we can liken the application of the mask to a likelihood prior product that is proportional to the posterior probability", accepting that "the row and column sums are no longer = 1". — [Rawte, Roy et al. 2022](https://par.nsf.gov/biblio/10429264). Note that this "product" reading differs from the "+" in [Sheth's Fig. 2](https://doi.org/10.1109/MIS.2023.3268724).
- K-Adapter, the embedding exemplar. "RoBERTa is fixed during training and the parameters of adapters are trainable". The factual knowledge comes from "automatically aligned text-triplets on Wikipedia and Wikidata", injected by pre-training "a knowledge-specific adapter called facAdapter on the relation classification task". TransE appears in the paper only in the description of prior work. — [Wang et al. 2020](https://arxiv.org/abs/2002.01808)
- Classical KG embedding, not named by Sheth and added here as the textbook case: TransE "models relationships by interpreting them as translations operating on the low-dimensional embeddings of the entities". — [Bordes et al. 2013](https://papers.nips.cc/paper/2013/hash/1cecc7a77928ca8133fa24680a88d2f9-Abstract.html)

**Citation wrinkles in Sheth**
- Ref. 8 reads "K. Roy et al., 'TDLR: Top (Semantic)-down (Syntactic) language representation'", and Fig. 1 expands TDLR as "Top (semantic) Down (syntactic) Learning Representations". The paper's byline starts with Vipula Rawte, with Roy second (both starred), and its title says "Language Representation". — [Sheth et al. 2023, p. 58, 62](https://doi.org/10.1109/MIS.2023.3268724); [Rawte, Roy et al. 2022](https://par.nsf.gov/biblio/10429264)

**Better-fitting vocabulary elsewhere**
- A survey organised around goals treats output-guarantee methods as their own group: works that "have the goal of guaranteeing the satisfaction of the constraints, and thus they apply the constraints directly on the outputs". It says loss-based methods "obviously cannot guarantee the satisfaction of the constraints". — [Giunchiglia et al. 2022](https://arxiv.org/abs/2205.00523)
- Earlier report: the established names for the two-layer pattern are constrained learning plus constrained inference. — [earlier report](../../reports/Semantic%20loss%20with%20hard%20logit%20constraints.md)

### Inferences

**M1 against the definition, clause by clause (my reading)**

| Sheth 1a clause | Real 1a (TDLR, K-Adapter) | M1 | Holds? |
|---|---|---|---|
| Symbolic knowledge flows toward the neural side | Yes | Yes, as a constraint on the network's output | **Yes**. This is the basis of the analogy |
| "compress" | Masks or adapters encode the graph lossily | Nothing is compressed: the KB stays exact, and the reasoner runs at every step | **No** |
| "knowledge graph" | ConceptNet, WordNet, Wikidata | Triples plus Horn rules | **Partly**. The rules are logic, but M1 uses no tensor factorisation, so it is not 1b either |
| Integrated with "hidden representations" or "inductive biases" | Inside the layers | After the last layer, on a copy of the logits | **No**. The closest link is the autoregressive one: a masked choice re-enters as context on the next step, but only as a token |
| "reason using the integrated neural patterns" | The network does the reasoning | Forward chaining happens outside the network | **No**. This is the strongest mismatch |
| Weights shaped by the knowledge | "Train the LM as before" with the mask; adapters are trained | Weights unchanged | **No** |
| Binary mask combined with a neural distribution | Yes, for TDLR | Yes | **Yes**. On TDLR's prior-times-likelihood reading, this is the same form as conditioning, though over attention entries and not next tokens |

**Three consequences**
- **The guarantee is not a 1a property.** Sheth rates 1a at (M) on constraints because edits may not survive the layers. M1 avoids that by acting after the last layer. An attention mask gives no guarantee about any output token. So the hard guarantee should be presented as coming from M1's distance from 1a.
- **Sheth's 1a ratings must not be inherited.** That covers large-scale perception (H), scalability (H), continual (H), and the modest cognition gains. They describe compressed representations in the network. M1 uses a small hand-written KB and leaves the weights alone. The low explainability (L) also does not apply, since M1 keeps the KB explicit and M3 traces it.
- **Sheth's own framing leans against M1.** The p. 57 sentence prefers guardrails "during training rather than as a posthoc measure". M1 acts during decoding, not after it, but it is not a training-time guardrail. A careful reader may raise this, so the section should say so first. M5 is the training-side counterpart.

**Corrections to consider for chapter 04 and the section text**
- Chapter 04 §1 calls TDLR-style attention masking "the closest published analogue to our logit mask". This is defensible only as "closest within Sheth's taxonomy". Mechanically closer precedents exist (next question: GENRE, grammar-constrained decoding, word filtering), and none of them uses Sheth's terms.
- Chapter 04 glosses "Lowering" in a table as if it were the paper's defined term. The gloss is a reasonable reading, inferred by parallel with "(lifting)" and the Fig. 1 caption, and it should be stated as such.
- Do not write that "strict 1a means a learned KG embedding" (chapter 04 §2 is close to this). 1a also contains the mask family, and that family is what the analogy rests on. Also, K-Adapter is not a classical KG embedding, so "KG embedding" should not be illustrated with it without qualification.

**Suggested disclaimer content for "1a-style lowering, by analogy"**
1. The label is ours. Sheth et al. never classify token masks, and do not define "lowering" beyond a figure caption.
2. The analogy covers direction of knowledge flow and mask form only.
3. Nothing is compressed, and the KB stays symbolic and exact.
4. The reasoning is done by a symbolic procedure outside the network, not by "integrated neural patterns".
5. The mask acts at generation only, after the last layer, and the weights are unchanged.
6. It is a decoding constraint. The literal name in the constrained-decoding literature is word banning or constrained inference, and this name should appear first.
7. Sheth's L/M/H ratings for 1a do not transfer, in either direction.
8. The guarantee has a scope (see the last question), and it comes from the output-layer position, not from 1a.

**Terminology trap.** Willard and Louf say "It may also be possible to 'lift' the masks computed by this approach into the language models themselves" and that their formulation "only applies the masks at the lowest level" ([Willard and Louf 2023](https://arxiv.org/abs/2307.09702)). There, "lift" means moving a mask up the architecture, which has nothing to do with Sheth's lifting.

### Gaps
- I found no source that places logit masks or constrained decoding under Sheth's taxonomy, for or against. One search and the citation chains I read turned up nothing, which is not proof of absence. A 2026 preprint applies a −∞ logit mask at inference ([Soleimani et al.](https://arxiv.org/abs/2609.17064)), but a text search found no use of "lowering" or Sheth, and I did not read it further.
- TDLR says how the mask enters training. It does not discuss inference separately. I assume the mask stays in the forward pass.
- Whether Sheth's "+" (Fig. 2) or TDLR's "product" is the intended operation cannot be settled from the text. TDLR's own text is the better source for what TDLR does.

## What are the published precedents for masking or banning tokens at inference time?

### Takeaway
The closest direct precedent for M1 is word filtering, which sets logits to −∞ (Gehman et al. 2020, reused by Schick et al. 2021 and Ahmed et al. 2023). The closest precedent for a mask derived from a knowledge base is GENRE's trie over Wikipedia titles, along with grammar-constrained decoding over Wikidata names. GeDi and FUDGE are learned, soft reweighting methods, and FUDGE explicitly disclaims a guarantee. Hugging Face's `LogitsProcessor` stack is the standard engineering form, and it applies bans before temperature and top-p.

### Cited Findings

| Family | Source | Mechanism (their words where quoted) | Hard? | Stated guarantee or limit |
|---|---|---|---|---|
| Word filter | [Gehman et al. 2020](https://arxiv.org/abs/2009.11462) | "we first encode each word as a sequence of BPE tokens. During generation, we set any vocabulary logits that would complete the token sequence for a banned word to −∞." | Yes, on the encoded form | Shown not to solve toxicity (next question) |
| Word filter | [Schick et al. 2021](https://arxiv.org/abs/2103.00453) | The same, with 403 words on GPT2-XL | Yes | "completely prevents the generation of all words on this list – even if they are entirely harmless in a given context" |
| Word filter | [Ahmed et al. 2023](https://arxiv.org/abs/2312.03905) | "sets the probability of generating any of the words ... to zero during decoding" | Yes | See [earlier report](../../reports/Semantic%20loss%20with%20hard%20logit%20constraints.md) for the table |
| Finite-state beam | [Anderson et al. 2017](https://arxiv.org/abs/1612.00576) | "an approximate search algorithm capable of enforcing any constraints over resulting output sequences that can be expressed in a finite-state machine" | Inclusion | "to guarantee the inclusion of selected words or phrases" |
| Lexical beam | [Hokamp and Liu 2017](https://arxiv.org/abs/1704.07138) | "Lexical constraints take the form of phrases or words that must be present in the output sequence" | Inclusion | Works with any token-by-token model, no change to parameters |
| Lexical beam | [Post and Vilar 2018](https://arxiv.org/abs/1804.06609) | Dynamic beam allocation, O(1) in the number of constraints | Inclusion | NMT, implemented in Sockeye |
| Logic decoding | [Lu et al. 2021](https://arxiv.org/abs/2010.12884) | CNF over D(a, y). "We first discard any h with irreversible unsatisfied clauses". Negative literal example: "'bean' cannot be generated" | Negative clauses pruned; positive clauses approximate | "ensures the satisfaction of given constraints" is an empirical claim. The paper's own Coverage is 97.7% for GPT-2 on CommonGen, measured on lemmatised outputs |
| Learned reweighting | [Krause et al. 2020](https://arxiv.org/abs/2009.06367) | "Pw(xt\|x<t, c) ∝ PLM(xt\|x<t)Pθ(c\|xt, x<t)^ω", then "We then zero out probabilities of tokens not in Vk and re-scale" | Partly: zeroing is real, but the set is chosen by a learned classifier | "heuristics ... not necessarily optimal" |
| Learned reweighting | [Yang and Klein 2021](https://arxiv.org/abs/2104.05218) | "We then modify the output logits of G by simply adding the log-probabilities" from predictors | No | "FUDGE cannot fully guarantee that all outputs possess the desired attribute a" |
| Static logit offset | [Gehman et al. 2020](https://arxiv.org/abs/2009.11462), VOCAB-SHIFT | "we add the term βW · t" to the logits, with β = 3 | No | Direct precedent for M2's additive bias, though with learned weights |
| KB-derived trie | [De Cao et al. 2021 (GENRE), ICLR](https://arxiv.org/abs/2010.00904) | "we define our constrain in terms of a prefix tree T (aka trie)"; about 6M Wikipedia titles, about 17M internal nodes, about 600MB | Yes, at inference only, for the listed names | "We employed the constraints masking the log-probabilities of the invalid tokens and not their logits (i.e., we do not re-normalize the probability over the vocabulary)" |
| Grammar | [Geng et al. 2023](https://arxiv.org/abs/2305.13971) | "pruning the probability distribution to include only the subset of tokens that are allowed by the formal grammar"; closed IE over "2.7 million Wikidata entity names" | Yes | "the LM-generated sequences will be guaranteed to be valid" |
| Grammar | [Scholak et al. 2021 (PICARD)](https://arxiv.org/abs/2109.05093) | "rejecting inadmissible tokens at each decoding step" | Yes, among the top-k tokens it checks | "helps to find valid output sequences" |
| Regex and CFG index | [Willard and Louf 2023](https://arxiv.org/abs/2307.09702) | "applying a boolean mask ... that restricts the support of the original distribution", with an FSM tracked across tokens | Yes | "guaranteeing the structure of the generated text" |
| Aligned grammar | [Beurer-Kellner et al. 2024](https://arxiv.org/abs/2403.06988) | "enforce constraints in a fully subword-aligned fashion" | Yes | Defines "minimally invasive" (Definition 2.1) |
| Unbiased grammar | [Park et al. 2024, NeurIPS](https://arxiv.org/abs/2405.21047) | ASAp "guarantees the output to be grammatical while provably producing outputs that match the conditional probability" in the limit | Yes | "exact GAD is intractable in general" |

**Hugging Face** (docs and source fetched 2026-11-03, `main` branch)
- `NoBadWordsLogitsProcessor`: "enforces that specified sequences will never be selected". Source comment: "Forbidding a sequence is equivalent to setting its bias to -inf". — [HF docs](https://huggingface.co/docs/transformers/main/en/internal/generation_utils); [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py)
- `SuppressTokensLogitsProcessor`: "This processor can be used to suppress a list of tokens. The processor will set their log probs to `-inf` so that they are not generated. Originally created for Whisper". — [HF docs](https://huggingface.co/docs/transformers/main/en/internal/generation_utils)
- `PrefixConstrainedLogitsProcessor`: "enforces constrained generation and is useful for prefix-conditioned constrained generation", pointing to Autoregressive Entity Retrieval. — [HF docs](https://huggingface.co/docs/transformers/main/en/internal/generation_utils)
- Order in `_get_logits_processor`: bans are appended first, user processors are merged next, then the block commented "Processors previously known as `LogitsWarpers`, only applied with sampling strategies" adds temperature, top-k and top-p, and "`LogitNormalization` should always be the last logit processor". — [generation/utils.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/utils.py). The docs page itself states no ordering rule. — [HF docs](https://huggingface.co/docs/transformers/main/en/internal/generation_utils)

**Beam and search caveat**
- Ahmed et al. tried NeuroLogic on 100k prompts: an estimated 165 hours, and "we obtained empty generations for at least 30% of the prompts" on a sampled subset. — [Ahmed et al. 2023](https://arxiv.org/abs/2312.03905). This is one group's run, and the paper does not diagnose it.

### Inferences
- M1 is the simplest member of this family: negative only, single-token, per-position, with no search. Word filtering, not TDLR, should be its first citation.
- GENRE and Geng et al. show that a mask derived from a large KB is workable, and that the output space can be restricted to listed names. They are allowlists on specific tasks (entity retrieval and extraction), not free text. M1 on free text is a denylist, so these show feasibility of the mechanism, not of the use.
- The GENRE quote matters in one place: with beam search, masking log-probabilities without renormalising keeps hypothesis scores comparable, while renormalising raises masked hypotheses' scores. M1 samples, so it does not face this choice, but the term "mask" does not mean one single operation across this literature.
- NeuroLogic's "ensures" should not be cited as a formal guarantee for all constraints. Its negative-clause pruning is hard by construction, while its positive constraints are approximate and measured at 97.7% coverage. The same table gives Hokamp and Liu 97.2% and Post and Vilar 97.4%, on a lemmatised, concept-level metric, so those coverage figures do not directly test the inclusion claims in the original papers.
- M2 is closer to VOCAB-SHIFT than to GeDi or FUDGE, because M2's offset is fixed and rule-based, with no per-step classifier.

### Gaps
- Venues for Gehman, Schick, Krause, Scholak, Geng and Beurer-Kellner were not confirmed from the pages I read, so those rows give year and arXiv link only.
- I did not trace who first introduced word filtering. Gehman et al. is the earliest source I read that spells out the −∞ rule, which does not make it the origin.

## How do token masks leak: alternate spellings, a banned word spelled from other tokens under BPE, paraphrase, multi-token words?

### Takeaway
A token mask bans IDs, so anything that reaches the same meaning or the same string through other IDs passes. Documentation, an issue report and vocabulary checks establish each route, and detoxification studies show residual harm after banning. I found no study measuring how often a model routes around a ban in pieces, so that rate is unknown.

### Cited Findings

**Alternate surface forms**
- HF: "At a token-level, biasing a word is different from biasing a word with a space before it." Its example marks `get_tokens("Trump")` with "will fail to apply bias" and `get_tokens(" Trump")` with "will work". — [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py)
- `NoBadWordsLogitsProcessor` carries the matching tip: "make sure to set `add_prefix_space=True`" and "only supported for some slow tokenizers". — [HF docs](https://huggingface.co/docs/transformers/main/en/internal/generation_utils)
- Ahmed et al. built their constraint from "the list of bad words and their space-prefixed variants", which gave "871 unique possibly-bad tokens (some tokens are only bad when considered in context with other tokens)". — [Ahmed et al. 2023](https://arxiv.org/abs/2312.03905)

**Banned word spelled from other tokens**
- Issue "bad_words_ids not working" (2022): banning the token for "badword" still allowed `["bad", "word"]`. Covering variants "results in thousands of permutations per bad_word". This is one user's report, with no measured rate. — [transformers #17504](https://github.com/huggingface/transformers/issues/17504)
- Maintainer reply: "It is intentional that sub-words do NOT get banned", and "The solution for banning subwords is to explicitly add them to the list of bad_word_ids". A later maintainer suggested "banning a normalized string". The issue closed through the stale bot, not through a fix. — [transformers #17504](https://github.com/huggingface/transformers/issues/17504)
- Project tokenizer: all 450 single-token words can also be spelled from other tokens (probe, not a recorded experiment). — [earlier report](../../reports/Semantic%20loss%20with%20hard%20logit%20constraints.md)

**Masks push output toward odd segmentations**
- A naive constrained decoder selects unusual tokens: Fig. 1 of Beurer-Kellner et al. shows greedy constraining "can distort tokenization, leading to different output than with unconstrained decoding", with splits such as "So ftware" in the figure. "By introducing such sub-optimal tokens, the distribution of a badly-constrained LLM can easily diverge from the unconstrained case". This is a JSON grammar setting, not word banning. — [Beurer-Kellner et al. 2024](https://arxiv.org/abs/2403.06988)

**Multi-token words**
- A sequence ban acts only at the end of the sequence: "The bias is applied to the last token of a sequence when the next generated token can complete it. Consequently, to take the most of biasing sequences with more than one token, consider using beam methods (to gracefully work around partially completed sequences that have a negative bias) and applying the bias to their prefixes". — [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py)
- Chapter 07 instead reports split words as `unenforceable` "rather than over-banning its first piece". — [chapter 07](../../docs/progress/07-neurosymbolic-code-2b.md)

**Paraphrase and meaning**
- "Simple solutions such as using a list of banned words ... fall short of mitigating this problem for at least two reasons. First, they do not reliably keep language models from generating biased text: Examples in Figure 1 show that biased text can easily be generated by using only words that are, by themselves, completely unproblematic." — [Schick et al. 2021](https://arxiv.org/abs/2103.00453)
- "It is therefore inherently difficult to ban words without doing harm to a model's capabilities." — [Schick et al. 2021](https://arxiv.org/abs/2103.00453)
- Measured residual, as toxicity probability over 25 generations, plain GPT-2 to WORD FILTER: unprompted 0.33 to 0.27, toxic prompts 0.88 to 0.81, non-toxic prompts 0.48 to 0.43. — [Gehman et al. 2020, Table 3](https://arxiv.org/abs/2009.11462)
- Their summary: "certain controllable methods (e.g., toxicity control tokens, swearword filters) are less successful than more computationally or data-intensive methods (e.g., finetuning on non-toxic corpora). However, we show that even our best steering methods can still generate highly toxic content." — [Gehman et al. 2020](https://arxiv.org/abs/2009.11462)
- Schick reports the opposite ranking for one pair: "Banning potentially toxic words is about as effective as self-debiasing with λ = 10", with domain-adaptive pretraining "less effective than both". — [Schick et al. 2021](https://arxiv.org/abs/2103.00453). This conflicts with Gehman's ordering of filters below finetuning. The settings differ (403-word list on GPT2-XL, and a different DAPT setup), so it is not a clean contradiction.
- NeuroLogic handles variants only by enumeration: "inflection or synonyms ('beef' or 'steak' both satisfy the constraint...)", through disjunctions, with "all inflections of ai" listed. — [Lu et al. 2021](https://arxiv.org/abs/2010.12884)

**Over-blocking, the opposite failure**
- Word filtering blocks words "even if they are entirely harmless in a given context". — [Schick et al. 2021](https://arxiv.org/abs/2103.00453)
- List contents can be broad: the list used includes "tied up" and "make me some". — [Schick et al. 2021](https://arxiv.org/abs/2103.00453)

### Inferences

**Leak routes for the write-up, with who caught what**

| Route | Example for this project (hypothetical) | Single-token ID mask | Sequence ban (Gehman, HF) | String-level automaton (Outlines style) | Verifier (M4) |
|---|---|---|---|---|---|
| Case or space variant | ` Court`, `court` | Leaks unless listed | Leaks unless listed | Stopped if case-folded | Only if parsed |
| Same word in other pieces | ` c` + `ourt` | **Leaks** | Leaks unless that split is listed | Stopped | Only if parsed |
| Multi-token word | a word the tokenizer splits | Not enforceable | One split only, and may strand a prefix | Stopped | Only if parsed |
| Misspelling, homoglyph | `cuort` | Leaks | Leaks | Leaks unless modelled | Probably unparsed |
| Inflection | `pays` versus `paid` | Leaks unless listed | Leaks unless listed | Leaks unless listed | Depends on lexicon |
| Paraphrase | `remits` for `pays` | Leaks | Leaks | Leaks | Depends on patterns |
| Trigger miss: the subject is itself spelled unusually | the rule never fires | Leaks | Leaks | Leaks unless the trigger is string-level too | Depends |
| Negation | a true "X cannot fly" contains the banned `fly` | **Over-blocks** | Over-blocks | Over-blocks | Could allow it |

The string-level column is my extrapolation from how FSM masking works. I found no paper testing it on word banning.

**Own check on GPT-2 vocabulary (no generation run; shows that IDs exist, not how often they are used)**
- `mess` has four single-token forms: `mess` 37348, ` mess` 2085, `Mess` 36479, ` Mess` 10626. So the HF docstring's one-ID ban of " mess" leaves three other IDs open.
- `court` has five: `court`, ` court`, `Court`, ` Court`, ` COURT`.
- The pieces for re-spelling exist: ` me` + `ss`, ` m` + `ess`, ` c` + `ourt`, ` cou` + `rt`.
- Split status depends on the tokenizer. ` buyer`, ` seller` and ` creditor` are single GPT-2 tokens, while the earlier report's probe found the same three words split under the project's tokenizer. Any claim about which words are enforceable is therefore specific to one vocabulary.

**Other inferences**
- The Gehman and Schick numbers bound what a filter does to a downstream metric. They do not measure leakage of listed words. Perspective's score is not the word list, and Gehman notes "detectors' over-reliance on lexical cues". The residual toxicity most likely mixes paraphrase with content that was never on the list, and these papers do not separate the two.
- For civil law the paraphrase problem may be sharper than for profanity, because a legal falsehood is rarely one forbidden word: "the buyer pays" and "payment falls on the buyer" assert the same thing. Mask scope should therefore be stated as "token-expressible" (chapter 04 already uses this phrase), with M4 named as the only layer that even attempts a claim-level check.
- A completion ban (Gehman, HF) is an available upgrade over `unenforceable`, but under plain sampling it can strand a prefix, since HF's advice to work around partial sequences relies on beam methods. This trade-off is untested in this project, and chapter 07's refusal is the more conservative choice.

### Gaps
- **No rate data.** I found no paper measuring how often a language model, once a token is banned, emits the same word through other tokens. Domino's figure is suggestive only. A project-level measurement would be new: decode masked generations and search the strings for banned words. This is cheap and not currently in E2's description.
- I found no study of mask leakage in a small from-scratch model or in a legal domain. All evidence above comes from GPT-2-class or larger models.
- I did not test the HF processors by running them, since `torch` is not installed here. Statements about their behaviour come from source and documentation.

## What does a mask guarantee formally, relative to what, and why must it precede temperature and top-p?

### Takeaway
At each unmasked-fallback-free step, the mask gives exactly: P(banned token ID) = 0 and, on the allowed tokens, the model's distribution conditioned on being allowed. That is a statement about token IDs relative to the compiled ban set, and not about strings, meanings or truth. Across a whole sequence it does not sample from the model conditioned on the constraint. The mask must precede softmax and top-p. **Preceding temperature is not actually required for a pure −∞ mask, since the two orders give identical results for T > 0**. The temperature order matters for the finite M2 bias and for any finite penalty.

### Cited Findings
- The support statement: a boolean mask "restricts the support of the original distribution", and "The resulting conditional distribution implied by s̃t+1 encodes constraints on the support of st+1". — [Willard and Louf 2023](https://arxiv.org/abs/2307.09702)
- Step-level masking is not sequence-level conditioning: such methods "can distort the LLM's distribution, leading to outputs that are grammatical but appear with likelihoods that are not proportional to the ones given by the LLM". — [Park et al. 2024](https://arxiv.org/abs/2405.21047)
- Park et al. define the unbiased target as sampling "from the LLM-induced probability conditioned on the outputs being accepted by the grammar", and say "exact GAD is intractable in general (similar to rejection sampling)". — [Park et al. 2024](https://arxiv.org/abs/2405.21047)
- A property that masking may lack: a method is "minimally invasive, if every valid output that can be generated by an unconstrained model (for any given prompt), is also generated by the constrained model". — [Beurer-Kellner et al. 2024, Def. 2.1](https://arxiv.org/abs/2403.06988)
- Guarantees are described as syntactic in this literature: constrained decoding "guarantees that generated output will always adhere to the specified syntactic constraints". — [Beurer-Kellner et al. 2024](https://arxiv.org/abs/2403.06988)
- Finite penalties: masking is "usually accomplished by replacing the logits of the actions to be masked by a large negative number M (e.g. M = −1 × 10^8)", with a resulting probability that "should be a small number". — [Huang and Ontañón 2020](https://arxiv.org/abs/2006.14171)
- HF's top-p and temperature processors are ordered after bans ([generation/utils.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/utils.py)), and top-p itself writes "`filter_value` ... defaults to -inf" ([logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py)). So in HF, top-p is itself a mask of this kind.
- `InfNanRemoveLogitsProcessor` maps −inf to the dtype's minimum, and its docs say "there shouldn't be a correct combination of flags that warrants its use". — [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py)
- Already established, cited only: masked target gives infinite perplexity; the empty-set guard and counting fallbacks; top-p after mask can leave nothing when a banned token holds the nucleus; loss must see unmasked probabilities. — [earlier report](../../reports/Semantic%20loss%20with%20hard%20logit%20constraints.md)

### Inferences

**Statement of the guarantee (my formulation; elementary, and checked numerically below)**

Let z be the last-position logits, B_t the ban set compiled at step t from the KB and the prefix, A_t its complement, T > 0, and p = softmax(z/T). With A_t non-empty and no fallback:
1. p̃_i = 0 for i in B_t.
2. p̃_i = p_i / P(A_t) for i in A_t, which is exact conditioning at this step, so ratios among allowed tokens are unchanged.
3. Top-p then keeps a subset of A_t, since the mass of a masked token is zero.
4. So, for every seed and any T > 0 and top_p, no generated token at step t lies in B_t, and every generated sequence satisfies y_t ∉ B_t(y_<t) at all steps without fallback.

**What it is relative to** (each item is an assumption the claim needs)
- The vocabulary and tokenizer, since it is an ID statement.
- The compile step from KB to B_t, including its list of surface forms.
- Trigger matching on the prefix: no trigger means an empty B_t and a vacuous pass.
- Correct IEEE arithmetic in the sampler, and T > 0.
- No fallback step. Fallback steps must be counted (chapter 04 §3).

**What it does not say**
- Nothing about decoded strings (a banned string may be assembled from allowed IDs).
- Nothing about meaning or truth. The guarantee is only as good as the KB, as chapter 04 §8 already states.
- Nothing about the sequence-level distribution. Step-wise conditioning is not P(y | y satisfies all constraints), as Park et al. show for grammars. The mask does not look ahead, so it can steer into prefixes whose allowed continuations are poor.
- Nothing about being minimally invasive. A context-blind ban can exclude valid outputs (the negation row above), so M1 would fail Definition 2.1 in those cases.
- Nothing about weights or understanding (chapter 04 §8).
- It is not evidence about the model. Chapter 04 §9 already notes that P1 tests the implementation, which means a 0% violation count on covered tokens adds no empirical information about the network.

**Why the order matters, stated precisely (own check)**

| Order question | Result | Basis |
|---|---|---|
| Mask before or after dividing by T, with −∞ and T > 0 | **Identical**. Max difference 0.0 at T = 0.5, 0.8, 1, 2, on logits [2, 1, 0.5, −1, 0.2] with A = {0, 2, 4} | −∞/T = −∞ |
| Masked softmax against conditioning p on A | Same within 3e-17 | Point 2 above |
| Mask before softmax versus after | After is fine only with renormalisation, and it is the same distribution then | Algebra |
| Mask before or after top-p | **Different**. With p = [0.5 banned, 0.3, 0.15, 0.05] and top_p = 0.8: top-p then mask keeps one token, while mask then top-p keeps two (renormalised 0.6, 0.3) | Banned mass uses up the nucleus budget. Earlier report gives the extreme case, where nothing remains |
| Finite bias M2 before or after T | **Different**, exp(λ/T) versus exp(λ) | Earlier report and chapter 04 §5 |
| Finite penalty M instead of −∞ | Depends on T and float width. M = −10 leaves 7.4e-6 on a small example, which grows at higher T because M/T shrinks. M = −1e8 gives exact 0.0 in doubles through underflow | This refines the earlier report's point on finite penalties: at −1e8 the non-zero mass is mathematical, not numerical, in double precision, but −∞ removes the need to argue about T and precision |
| T < 0 | −∞ / −0.5 = +∞, so a masked token becomes the winner | Reject T ≤ 0 before the seam |
| All tokens banned | −∞ − (−∞) = NaN | Earlier report's guard |

**Consequences for the wording**
- Chapter 04 §3's two listed properties are correct. A write-up should avoid saying the mask "must" precede temperature for the guarantee to hold. Better: "the mask must precede softmax normalisation and top-p; placing it before temperature as well gives one seam shared with the M2 bias, whose effect depends on that order, and the −∞ value makes the temperature order irrelevant for M1 itself."
- Do not copy Outlines' notation literally. Written as α̃ = m ⊙ α with a 0/1 mask on α, it is correct for unnormalised probabilities. If α holds log-domain logits, multiplying by 0 gives logit 0, which is a non-zero probability. The paper calls α "output logits", so an implementer should use −∞ assignment.
- Keeping −∞ through the pipeline matters for HF-style finite conversion: mapping every −inf to `finfo.min` would make an all-banned step uniform over banned tokens instead of failing visibly. This is reasoned from the source, not run, because equal values give a uniform softmax. It argues for the project's explicit counted fallback.

**A claim the evidence supports for the section**
"With the mask on, and with no fallback step, the sampler cannot select a token ID in the compiled ban set at any step where a rule fired, at any temperature above zero and any top-p. We report N fired positions and F fallback steps. This does not stop the same word being spelled from other token IDs, does not cover words the tokenizer splits, and does not cover paraphrase. Decoded-string checks and M4 measure those separately." This extends the coverage-statement approach in the [earlier report](../../reports/Semantic%20loss%20with%20hard%20logit%20constraints.md).

### Gaps
- I found no paper that states the step-level guarantee as a theorem for word banning. It seems treated as too obvious to state. The formulation above is mine, so it should be presented as a derivation.
- I did not run the numbers in the project's TypeScript sampler. Chapter 07 line 591 states the same −∞ reasoning for it, and the earlier report's unit tests would confirm it once the code exists.
- HF's ordering is shown for current `main` only. I did not trace how it changed over versions.
