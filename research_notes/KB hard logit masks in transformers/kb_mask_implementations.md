# How knowledge-base-derived hard logit masks are implemented on transformer and seq2seq decoders

Scope and method. This extends [the earlier M1 notes](../Civil%20law%20KB%20M1%20M5%20plan/m1_lowering_and_inference_masks.md) and does not re-derive word filtering, `NoBadWordsLogitsProcessor`, the formal guarantee, or mask-versus-temperature order. Repositories were shallow-cloned on 2026-11-03 and read without being executed, so links are pinned to the commit read (Hugging Face links are `main`, fetched the same day). **[code]** means I read it in source. **[paper]** means only the paper says it. "Own reading" and everything under Inferences are mine. All speed and accuracy numbers are self-reported by the authors on their own hardware, I reran none of them, and they are not comparable across rows. Paper quotes come from `pdftotext`, so ligatures and hyphenation are normalised.

## How is the knowledge source compiled to token IDs, and when?

### Takeaway
There are five compile patterns: a token-ID trie, a per-entity index of tries, a byte-level automaton intersected with the vocabulary, a live interpreter or parser call, and an enumerated candidate list. Tries and automata are usually built ahead of time, while anything that depends on the question or the entity just decoded is built on demand and often cached. The token-ID trie is by far the commonest for KB content, and it encodes exactly one tokenisation of each name.

### Cited Findings

**System by system**

| System | Knowledge source | Compiled to | When | Source |
|---|---|---|---|---|
| GENRE | Wikipedia titles, optional mention table | Nested Python dict `Trie` over token IDs. Each name is `encode`d and inserted | Static trie offline and pickled (`kilt_titles_trie_dict.pkl`). With `mention_to_candidates_dict`, a `Trie` is rebuilt inside the callback for the decoded mention. **[code]** | [trie.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/trie.py), [entity_linking.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/entity_linking.py), [README](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/README.md) |
| mGENRE | Titles in 105 languages, formatted `name >> lang` | `MarisaTrie`: each token ID is mapped to one Unicode character and stored in a succinct `marisa_trie`, or the nested dict | Offline. A temporary per-mention `Trie` is built for candidate restriction. **[code]** | [trie.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/trie.py), [examples_mgenre](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/examples_mgenre/README.md) |
| GenIE | Wikidata entity names and relation names | Two separate tries from `get_trie_from_strings` (leading space added, BOS removed) | Offline and pickled. **[code]** The paper says the composed target space is too large "to pre-compute the necessary trie", about 10^15 triplets, hence two tries. **[paper]** | [trie.py](https://github.com/epfl-dlab/GenIE/blob/c53d52f598c2940e00f753c97b3baf4ba144fc03/genie/constrained_generation/trie.py), [ie_prefix_constraints.py](https://github.com/epfl-dlab/GenIE/blob/c53d52f598c2940e00f753c97b3baf4ba144fc03/genie/constrained_generation/ie_prefix_constraints.py), [paper](https://arxiv.org/abs/2112.08340) |
| Neural Symbolic Machines | Freebase subgraph as `kg[ent][prop]` | No compile. A Lisp interpreter's `valid_tokens()` runs type checks, then `autocomplete_hop` calls `get_props`, which reads `kg[ent].keys()` for the variable's stored denotation | Every step. **[code]** | [computer_factory.py](https://github.com/crazydonkey200/neural-symbolic-machines/blob/a03ff05228cfebcc818b6a901c4d7b0ed459fa7c/nsm/computer_factory.py), [executor_factory.py](https://github.com/crazydonkey200/neural-symbolic-machines/blob/a03ff05228cfebcc818b6a901c4d7b0ed459fa7c/nsm/executor_factory.py) |
| ReTraCk | Freebase schema and retrieved items per question | Grammar rules for retrieved KB items, plus `relation_to_argument`, `anchor_to_argument` and `entity_to_argument` lookup tables. Optional SPARQL mid-decode (`runtime_prune`) | Tables per question, checks every step. **[code]** | [sexpression_state.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/sexpression_state.py) |
| RnG-KBQA | Freebase | **No token mask.** Candidates are passed as input text. A plain T5 `generate` call, then execution after decoding | Not applicable. **[code]** "a vanilla T5 generation model without syntactic constraints". **[paper]** | [run_generator.py](https://github.com/salesforce/rng-kbqa/blob/ebdfb098ee2a482746bf6b2ce2892b74b41ddd9d/framework/run_generator.py), [paper](https://arxiv.org/abs/2109.08678) |
| Shin et al. | SCFG or enumerated canonical utterances | `TriePartialParse` over token IDs, or Earley grammar expanded lazily as a character or byte trie (`LazyGrammarNode`, `UInt8GrammarNode`) | Trie ahead of time, Earley lazily during decoding. **[code]** | [trie_partial_parse.py](https://github.com/microsoft/semantic_parsing_with_constrained_lm/blob/b22f5186ee6e66dfaf3808cd3e5f850f1e015469/src/semantic_parsing_with_constrained_lm/decoding/trie_partial_parse.py), [earley_partial_parse.py](https://github.com/microsoft/semantic_parsing_with_constrained_lm/blob/b22f5186ee6e66dfaf3808cd3e5f850f1e015469/src/semantic_parsing_with_constrained_lm/decoding/earley_partial_parse.py) |
| PICARD | SQL schema of the target database, registered over Thrift | Haskell parser combinators. `tableNameP` and `columnNameP` are built from the schema's names, longest first | Schema at registration, parser fed per candidate token. **[code]** | [Prelude.hs](https://github.com/ServiceNow/picard/blob/6a252386bed6d4233f0f13f4562d8ae8608e7445/picard/src/Language/SQL/SpiderSQL/Prelude.hs), [picard_model_wrapper.py](https://github.com/ServiceNow/picard/blob/6a252386bed6d4233f0f13f4562d8ae8608e7445/seq2seq/utils/picard_model_wrapper.py) |
| SPARKLE | DBpedia, Wikidata or Freebase triples | Entity trie, relation trie, plus `head_rel` and `relation_tail` indexes. These produce a per-head relation `Trie` (lazy cache) and a per-relation tail `Trie` (prebuilt at init) | Mixed. **[code]** | [trie.py](https://github.com/zzaebok/sparkle/blob/2c6656006495b056c738e26f3f4a913c7da5a68b/sparkle/trie.py), [sparql_token_generator.py](https://github.com/zzaebok/sparkle/blob/2c6656006495b056c738e26f3f4a913c7da5a68b/sparkle/sparql_token_generator.py) |
| GCR | L-hop paths around question entities | BFS or DFS paths formatted as sentences, tokenised, stored in `MarisaTrie` | Per question, offline or on demand. **[code]** "pre-constructed offline" or "built on-demand". **[paper]** | [qa_prompt_builder.py](https://github.com/RManLuo/graph-constrained-reasoning/blob/9518e8e69197d5e577a6e414060fb898771617b9/src/qa_prompt_builder.py), [paper](https://arxiv.org/abs/2410.13080) |
| DoG | Query-centric subgraph Gq | Dict trie over token IDs of `<T_BOS> triplet <T_EOS>` | Rebuilt or extended as Gq grows. **[paper]** The code appears only as Table 8 of the paper, and its text gives no repository link. | [paper](https://arxiv.org/abs/2410.18415) |
| GraphRAFT | Neo4j graph | All m-hop Cypher queries around linked entities, tokenised. **No trie**: a list of tensors scanned at each step | Per question. **[code]** | [logits_processor.py](https://github.com/AlfredClemedtson/graphraft/blob/a09bcdd6ff87b2233c30c660da7a0e76a12e4a8f/constrained_decoding/logits_processor.py) |
| Candidate expressions (Nam and Lee 2025) | KoPL and λ-DCS KBs | A distinct trie for each KB element category (for example 14,471 entities and 363 relations in KQA Pro), plus typed production rules | Ahead of time, with a per-domain set for Overnight. **[paper]** Code not read. | [paper](https://arxiv.org/abs/2410.00414) |
| Geng et al. | 2.7M Wikidata entity names, 888 relations | Grammatical Framework grammar with one token-level concrete grammar per tokenizer. An incremental parser acts as completion engine | Grammar ahead of time. Input-dependent grammars are built per input. **[paper]** GF grammars not read. | [paper](https://arxiv.org/abs/2305.13971) |
| Outlines | Any regex or JSON schema, so a KB name list becomes an alternation (own reading) | Dense DFA, then `Index`: `HashMap<state, HashMap<token, state>>`, built by walking every token's bytes from every reachable state | Ahead of generation. **[code]** | [index.rs](https://github.com/dottxt-ai/outlines-core/blob/116a7c381b446814fdfc9b2b28bea7ca4f900aae/src/index.rs) |
| XGrammar | CFG, JSON schema, structural tag | Byte-level pushdown automaton plus an `AdaptiveTokenMask` per parser state (accepted, rejected or bitset, plus `uncertain_indices`) | Mostly ahead of time, with context-dependent tokens checked at runtime. **[code]**, **[paper]** | [compiled_grammar_impl.h](https://github.com/mlc-ai/xgrammar/blob/ca1acf28bf35b9ba9092800b69aebc7d4ce1f7a7/cpp/compiled_grammar_impl.h), [paper](https://arxiv.org/abs/2411.15100) |
| llguidance | Lark-like grammar, regex, JSON schema | Lazy derivative-based lexer plus Earley parser, walked against a tokenizer trie laid flat in DFS order | At each step, with almost no compile. **[code]**, docs | [optimizations.md](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/docs/optimizations.md), [toktrie.md](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/docs/toktrie.md) |
| HF `PrefixConstrainedLogitsProcessor` | Whatever the callback does | A user callback returns allowed IDs. Nothing is compiled by HF | Every step, every beam. **[code]** | [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py) |

**How the mask is written to the logits**
- GENRE, mGENRE, GenIE and GCR all pass the allowed-ID callback to `prefix_allowed_tokens_fn`, so they reach HF's processor (or fairseq's equivalent). HF allocates `torch.full_like(scores, -math.inf)`, zeroes the allowed entries, and adds that to the scores. — [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py); [GCR model](https://github.com/RManLuo/graph-constrained-reasoning/blob/9518e8e69197d5e577a6e414060fb898771617b9/src/llms/graph_constrained_decoding_model.py)
- GraphRAFT copies only allowed entries into a fresh all-`-inf` tensor. — [logits_processor.py](https://github.com/AlfredClemedtson/graphraft/blob/a09bcdd6ff87b2233c30c660da7a0e76a12e4a8f/constrained_decoding/logits_processor.py)
- PICARD uses `masked_fill` with `-float("Inf")`. — [picard_model_wrapper.py](https://github.com/ServiceNow/picard/blob/6a252386bed6d4233f0f13f4562d8ae8608e7445/seq2seq/utils/picard_model_wrapper.py)
- XGrammar's `apply_token_bitmask_inplace` sets masked logits to `-inf` from a packed bitmask. — [matcher.py](https://github.com/mlc-ai/xgrammar/blob/ca1acf28bf35b9ba9092800b69aebc7d4ce1f7a7/python/xgrammar/matcher.py)
- NSM is the exception. It scores only valid actions by a dot product of the RNN output with memory slots, and fills padding slots with a finite value: `masked_logits = logits * logit_masks + (1 - logit_masks) * tf.float32.min`. An older `1e6` penalty remains in a comment. — [tf_utils.py](https://github.com/crazydonkey200/neural-symbolic-machines/blob/a03ff05228cfebcc818b6a901c4d7b0ed459fa7c/nsm/tf_utils.py)
- ReTraCk also scores only valid actions: "we don't need any action masks". — [linking_transition_function.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/linking_transition_function.py)
- GENRE's footnote adds one thing to the earlier notes on not renormalising: "We experimented with both versions and we find masking the log-probability more effective". — [De Cao et al. 2021](https://arxiv.org/abs/2010.00904). Current HF matches this in beam search, where `log_softmax` runs before processors, whereas sampling passes raw logits to the processors and normalises later. — [generation/utils.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/utils.py) (around lines 3242 and 3738)

**Newer finite-set compilers (papers only, code not read)**
- Trie Automata (COLM 2026) builds a character-level trie and uses Aho-Corasick matching "to precompute per-node token masks". — [arXiv 2608.12574](https://arxiv.org/abs/2608.12574)
- STATIC (KDD 2026) compiles constraints "into a static Compressed Sparse Row (CSR) matrix", and FlashTrie runs constrained beam search on the GPU. — [arXiv 2602.22647](https://arxiv.org/abs/2602.22647); [arXiv 2607.10044](https://arxiv.org/abs/2607.10044)
- GRID keys exact next-token masks on parser configurations. — [arXiv 2607.11951](https://arxiv.org/abs/2607.11951)

**Papers without a hard mask, for contrast**
- KCTS guides a frozen model through a knowledge classifier with Monte-Carlo tree search and a reward, and bans nothing. Its objective is `arg max P_LM(y|x) f(y,k)`. — [Choi et al. 2023](https://arxiv.org/abs/2310.09044). I read only the repository's file list ([ppl_mcts.py](https://github.com/HKUST-KnowComp/Knowledge-Constrained-Decoding/blob/707f4de017c12ec6145b08249362e247ba8aa486/kcd/classifier_guidance/ppl_mcts.py) exists), not its logic.
- NeuroLogic holds negative constraints in a `Trie` and hard-bans via `avoid()`, while positive clauses stay soft. — [lexical_constraints.py](https://github.com/GXimingLu/neurologic_decoding/blob/6694be96188e2abd8a712b5aa900a966024f206c/lexical_constraints.py)
- KGLM has no vocabulary mask. It samples a parent entity, looks up that entity's edges, and takes a softmax over those relations, then mixes vocabulary scores with alias copy scores. — [kglm.py](https://github.com/rloganiv/kglm-model/blob/c9cb7f995072ac990799994f1e2b62828d7e6b27/kglm/models/kglm.py); [Logan et al. 2019](https://arxiv.org/abs/1906.07241)

### Inferences
- A from-scratch TypeScript project needs none of the heavy machinery. A `Map<tokenId, node>` trie is the same structure as GENRE's nested dict, and DoG's whole implementation is 19 lines of Python. Marisa, CSR and GPU layouts exist for 10^6 to 10^9 entries, and the project KB is many orders of magnitude smaller.
- SPARKLE's `head_rel` and `relation_tail` tables are the closest code precedent for a triple store compiled to per-entity token sets. A Horn closure computed ahead of time could feed the same shape of table, so M1 would not need to run the reasoner per step. This assumes the closure is fixed for a generation. If facts are added per prompt, GCR's per-question build is the right precedent. I found no system that compiles Horn rules, so this mapping is my extrapolation.
- RnG-KBQA is the useful negative case. It reaches 99.7% top-1 executability on GrailQA with no mask, which means a mask is not the only way to get KB-consistent output when the model is large and the KB content is in the input.

### Gaps
- I did not download the pickled tries, so GENRE's "~600MB" and mGENRE's "2.2GB" were not confirmed against files.
- I did not read fairseq's constrained beam search, which GENRE's paper results used through a [fork](https://github.com/nicola-decao/fairseq/tree/fixing_prefix_allowed_tokens_fn).

## What decoding state is tracked, and how does it choose the constraint for the current position?

### Takeaway
Two designs exist. Trie-based KB decoders are mostly stateless: at each step they rescan the whole prefix, count delimiter tokens to find the mode, then re-walk the trie. Grammar engines and interpreters keep state per hypothesis. Stateless is slower per step but trivially correct under beam reordering, and with short sequences the cost is small. Every KB decoder I read locates its constraint using reserved delimiter tokens or a formal output language, not free text.

### Cited Findings

| System | State | How the constraint is selected |
|---|---|---|
| GENRE (end-to-end linking) | None stored | `status = sum(e in c for e in sent) % 4` over `{ } [ ]` gives outside, mention or entity. `get_pointer_end` re-aligns the output against the source to find the next copy token. **[code]** [entity_linking.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/entity_linking.py) |
| GenIE | None stored | Counts complete `<tag>` triples, `% 4`, mapped to `ob, s, r, o`. Inside a tag, the next tag token is forced. Otherwise it picks the entity or relation trie and queries with the tokens after the last tag. **[code]** [ie_prefix_constraints.py](https://github.com/epfl-dlab/GenIE/blob/c53d52f598c2940e00f753c97b3baf4ba144fc03/genie/constrained_generation/ie_prefix_constraints.py) |
| SPARKLE | None stored, plus Trie caches | `Status` enum from token indices and `num_wrap_tokens % 6`, giving `HEAD_ENTITY`, `RELATION`, `TAIL_ENTITY`, `CONTINUE_OR_NOT`, `NORMAL`. **[code]** [sparql_token_generator.py](https://github.com/zzaebok/sparkle/blob/2c6656006495b056c738e26f3f4a913c7da5a68b/sparkle/sparql_token_generator.py) |
| GCR | Rescans for last start token | Constrained if a start token has no later end token, then `trie.get(sent.tolist()[L_input:])`. **[code]** [graph_constrained_decoding.py](https://github.com/RManLuo/graph-constrained-reasoning/blob/9518e8e69197d5e577a6e414060fb898771617b9/src/graph_constrained_decoding.py) |
| DoG | Gq, a growing subgraph, per chain | `<T_BOS>` turns the constraint on, a complete triplet lifts it for free text, and `<EOS>` ends. Eq. 1 adds triplets touching the entities just generated. **[paper]** [DoG](https://arxiv.org/abs/2410.18415) |
| GraphRAFT | None | Finds the marker string in `input_ids`, then compares a prefix tensor against every candidate query. **[code]** [logits_processor.py](https://github.com/AlfredClemedtson/graphraft/blob/a09bcdd6ff87b2233c30c660da7a0e76a12e4a8f/constrained_decoding/logits_processor.py) |
| NSM | Interpreter: expression stack, namespace, variable denotations | `exp_stack`, `args[pos]` and type ancestors give the type wanted, then autocomplete filters by KB. `clone()` for each sampled or beam environment. **[code]** [computer_factory.py](https://github.com/crazydonkey200/neural-symbolic-machines/blob/a03ff05228cfebcc818b6a901c4d7b0ed459fa7c/nsm/computer_factory.py) |
| ReTraCk | `GrammarStatelet` plus `SExpressionState`: `node_table`, `node_queue`, action history | Grammar first, then the checker, which reads the left-hand nonterminal and recent actions to choose instance, type, virtual-execution and runtime checks. **[code]** [grammar_based_state.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/grammar_based_state.py), [sexpression_state.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/sexpression_state.py) |
| Shin et al. | Immutable `PartialParse` per hypothesis | `allowed_next` and `append`, which returns a new object, so beam branching is free. **[code]** [partial_parse.py](https://github.com/microsoft/semantic_parsing_with_constrained_lm/blob/b22f5186ee6e66dfaf3808cd3e5f850f1e015469/src/semantic_parsing_with_constrained_lm/decoding/partial_parse.py) |
| PICARD | Server-side `HashMap InputIds PartialParse` | The key is the full ID list. Cached partial parses are extended by one token. The cache is cleared on a counter. **[code]** [Main.hs](https://github.com/ServiceNow/picard/blob/6a252386bed6d4233f0f13f4562d8ae8608e7445/picard/exe/Main.hs) |
| Outlines | One `Guide` per batch index, an FSM state ID | `advance(last_token_id)`, then fill the bitmask for that state. **[code]** [outlines_core.py](https://github.com/dottxt-ai/outlines/blob/c52af8472c6fe8a607a733ec11b709476af77a96/src/outlines/backends/outlines_core.py) |
| XGrammar | `GrammarMatcher` per batch index with persistent stacks and rollback | `accept_token(input_ids[i][-1])`, then `fill_next_token_bitmask`. The HF wrapper asserts acceptance and "can only be used once". **[code]** [contrib/hf.py](https://github.com/mlc-ai/xgrammar/blob/ca1acf28bf35b9ba9092800b69aebc7d4ce1f7a7/python/xgrammar/contrib/hf.py) |
| llguidance | Earley rows plus lexer state, pushed and popped during the trie walk | `compute_mask()`, with per-terminal `temperature`, `lazy`, `suffix` and `stop`. **[code]**, docs [constraint.rs](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/parser/src/constraint.rs), [syntax.md](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/docs/syntax.md) |

**Free text plus constrained regions**
- GCR: "After a valid reasoning path is generated, we switch back to the regular decoding process". — [Luo et al. 2025](https://arxiv.org/abs/2410.13080)
- XGrammar's `triggered_tags` "Allows arbitrary text until a trigger is encountered, then dispatches to one of several tags", and "each trigger should be an unambiguous prefix of the tag(s) it dispatches to". — [structural_tag.md](https://github.com/mlc-ai/xgrammar/blob/ca1acf28bf35b9ba9092800b69aebc7d4ce1f7a7/docs/structural_tag/structural_tag.md)
- HF's docstring example shows the same idea with no markup: if `input_ids[-1] == entity[0]`, force the entity's next token, otherwise allow all. — [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py)
- Parser state does not always imply early rejection. PICARD's guards depend on SQL's order, because a column in `select` can only be checked when `from` appears, so it rejects "at the earliest possible time". — [Scholak et al. 2021](https://arxiv.org/abs/2109.05093)

**Local validity is not viability**
- "Local token masking prevents transitions into ⊥ but does not guarantee b-viability" under a length budget. Accepting-path decoding improves Smatch++ over local masking by 5.1 and 2.4 points on DRS under tight limits. — [Structural Automata, arXiv 2610.13896](https://arxiv.org/abs/2610.13896)

### Inferences
- **M1's real gap against this literature is trigger detection.** All the KB decoders above select the constraint using delimiters the model was trained or prompted to emit (`{ }`, `<sub>`, `<T_BOS>`, PATH tokens), or a formal language whose parser tells them where they are. M1 runs on free legal prose with neither. The only free-text analogue I found is HF's toy example and XGrammar's string triggers, which still need a literal prefix. So M1 is a free-text surface-trigger design without a close precedent in KB decoding. This should be stated rather than borrowing GENRE's or DoG's results as if the setting matched.
- Two options follow, both untested here. Keep surface triggers and report the trigger-miss rate, as the earlier notes propose. Or add reserved tokens and retrain the model to mark facts, as DoG and GCR do with prompting or fine-tuning, which changes the corpus and tokenizer.
- M1 samples one hypothesis, so it can use either state design. A stateful automaton needs no clone or rollback, and a stateless scan is simplest and hard to get wrong. At the corpus's sequence lengths, a rescan seems affordable, but I have no measurement.
- Stateful per-batch-index wrappers look unsafe for beam search, since `input_ids[i]` can change parent between steps. XGrammar's HF wrapper and Outlines' `process_logits` take the last token by index and do not track reordering in the code I read. This does not affect M1, and I did not test it.

### Gaps
- I did not read ReTraCk's `is_valid` definition or the full early-stop logic, only the call sites.
- I did not trace how DoG's unpublished implementation resets the trie between triplets. The paper says only that it updates "on-the-fly".

## How are multi-token words and entities aligned with the tokenizer, including when the tokenizer ignores word boundaries?

### Takeaway
Two alignment strategies exist. **Token-space tries** encode each name once and permit exactly that ID sequence, which is simple, leak-free for allowlists, and blind to alternate segmentations. **Byte-space automata** walk each vocabulary token's bytes through the constraint, so a name may be reached by any segmentation and token boundaries need not match word boundaries. For a banlist, only the byte-space design would close the "same word from other pieces" leak (own inference, as the earlier notes also say for string-level automata).

### Cited Findings

**Token-space alignment**
- GENRE fixes delimiter IDs through `encode_fn(" {}".format(c))[1]`, encoding with a leading space and taking the first real token. — [entity_linking.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/entity_linking.py)
- GenIE's builder has `add_leading_space_flag=True` and `remove_leading_bos=True`. — [trie.py](https://github.com/epfl-dlab/GenIE/blob/c53d52f598c2940e00f753c97b3baf4ba144fc03/genie/constrained_generation/trie.py)
- GenIE handles multi-token tags (`<`, `sub`, `>`) by asserting all tags encode to the same length with the same first and last token, then treating the middle ID as the tag code. — [ie_prefix_constraints.py](https://github.com/epfl-dlab/GenIE/blob/c53d52f598c2940e00f753c97b3baf4ba144fc03/genie/constrained_generation/ie_prefix_constraints.py)
- End of name is encoded as a token in the trie. GENRE tests `codes["EOS"] in ment_next` to allow closing a mention. GenIE swaps that EOS for the start-of-tag token. GCR appends `eos_token_id` to each path in one builder. — [entity_linking.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/entity_linking.py); [ie_prefix_constraints.py](https://github.com/epfl-dlab/GenIE/blob/c53d52f598c2940e00f753c97b3baf4ba144fc03/genie/constrained_generation/ie_prefix_constraints.py); [qa_prompt_builder.py](https://github.com/RManLuo/graph-constrained-reasoning/blob/9518e8e69197d5e577a6e414060fb898771617b9/src/qa_prompt_builder.py)
- SPARKLE avoids the problem for syntax: "we tokenize each SPARQL terms ... as individual tokens". — [Lee and Shin 2024 (SPARKLE)](https://arxiv.org/abs/2407.01626)
- Entity-level consequences appear as a `>> lang` suffix in mGENRE, where 1.65% of names need the language to disambiguate. — [De Cao et al. 2022 (mGENRE)](https://arxiv.org/abs/2103.12528)
- DoG's Table 8 inserts every suffix of each triplet into the trie: `for suffix in [triplet[i:] for i in range(len(triplet))]`. The paper does not explain why. A footnote says of its worked example, "sub-tokens is not considered here". — [Li et al. 2025 (DoG)](https://arxiv.org/abs/2410.18415)
- GraphRAFT explains its choice: "the tokenizers used by the majority of modern LLMs do not have a one-to-one mapping from words and query keywords to the tokens", so constraints are applied "at the token-level". — [Clemedtson and Shi 2025](https://arxiv.org/abs/2504.05478)

**Byte-space alignment**
- Outlines-core walks each token's bytes: `for transition_byte in token { next_state = dfa.next_state(...) }`, skipping on dead or quit states. — [index.rs](https://github.com/dottxt-ai/outlines-core/blob/116a7c381b446814fdfc9b2b28bea7ca4f900aae/src/index.rs)
- GPT-2-style `Ġ` characters map back to byte 0x20 through `TokenProcessor`. — [processor.rs](https://github.com/dottxt-ai/outlines-core/blob/116a7c381b446814fdfc9b2b28bea7ca4f900aae/src/vocabulary/processor.rs)
- llguidance's trie walk prunes a whole subtree when the byte is rejected: "if the lexer or parser don't allow a given byte in the trie, the entire sub-tree can be skipped". — [optimizations.md](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/docs/optimizations.md)
- Shin intersects the grammar's byte trie with the vocabulary trie in `valid_tokens_from_grammar`. It first tries the top-ranked model tokens against the grammar. — [earley_partial_parse.py](https://github.com/microsoft/semantic_parsing_with_constrained_lm/blob/b22f5186ee6e66dfaf3808cd3e5f850f1e015469/src/semantic_parsing_with_constrained_lm/decoding/earley_partial_parse.py)
- PICARD detokenises the whole sequence and takes the string difference: `decode (inputIds ++ [token])`, then `Text.stripPrefix decodedInputIds decoded`. If the old text is not a prefix of the new text, it throws a fatal `TokenizerPrefixException`. — [Main.hs](https://github.com/ServiceNow/picard/blob/6a252386bed6d4233f0f13f4562d8ae8608e7445/picard/exe/Main.hs)
- Geng et al. take a third route: "the token-level grammar Gtok is tokenizer-dependent", with GF concrete grammars per tokenizer. — [Geng et al. 2023](https://arxiv.org/abs/2305.13971)

**Named as a research problem only recently**
- Trie Automata: "a single BPE token can span multiple trie nodes", which it reduces to multi-pattern matching. "prior trie-based work (De Cao et al., 2021) sidesteps it by operating at token granularity". — [arXiv 2608.12574](https://arxiv.org/abs/2608.12574). My reading of GENRE's code agrees with this description.

**Token-level bans exist in engines**
- XGrammar `exclude_token`: "Matches any single token except those in `exclude_tokens`". — [structural_tag.md](https://github.com/mlc-ai/xgrammar/blob/ca1acf28bf35b9ba9092800b69aebc7d4ce1f7a7/docs/structural_tag/structural_tag.md)
- llguidance supports negated numeric ranges such as `<[^128000,128130-128170]>`. — [syntax.md](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/docs/syntax.md)
- NeuroLogic's `NegativeState` tracks partial phrases as trie states and bans only final tokens: `self.root.final().union(*[state.final() for state in self.state])`. That is the state-tracked form of multi-token banning. — [lexical_constraints.py](https://github.com/GXimingLu/neurologic_decoding/blob/6694be96188e2abd8a712b5aa900a966024f206c/lexical_constraints.py)

### Inferences
- **For an allowlist, the token-space trie is safe but narrow.** It cannot emit a name in a different segmentation, and any other segmentation is simply blocked. The price is the distortion the earlier notes cite from Domino.
- **For a banlist the logic inverts.** A token-space ban covers only the encoded form, which is the leak the earlier notes document. M1 is a banlist on ~937 tokens, with whole-word leading-space tokens, so token-space banning is natural for those words and blind to re-spellings.
- **A byte-level upgrade path looks cheap at this scale (untested).** Build an Aho-Corasick automaton over banned surface strings. For each automaton state, precompute which of the 937 token IDs would complete a banned string, by walking each token's bytes. The state update per step is one token's bytes. This is NeuroLogic's trie state applied at byte level and Outlines' index applied to a banlist. I found no paper or repository that does exactly this.
- **One boundary trap would need handling.** Banning the word ` pay` at byte level must not ban ` payment`. If the token is ` pay`, the decoder cannot yet know the word has ended, so the check moves to the next step: after ` pay`, ban tokens that begin with a non-letter and EOS. Any system that enforces word boundaries at byte level has this problem. It would make the ban fire one token later than the plan's current per-token form. I did not find this written down, so treat it as a design note to test.
- The "all single-token words can be re-spelled" probe in the earlier report is what makes this relevant. It does not measure how often the model actually does it, and a rate is still unknown.

### Gaps
- I found no study comparing token-space and byte-space KB constraints on the same task and metric.
- I found no KB-masked decoder working with a vocabulary near 937 tokens. Everything surveyed uses 32K or more.
- DoG's reason for suffix insertion is unstated. Own reading: it lets a prefix start from any token within a triplet, which would also weaken the constraint at a triplet's start unless the prefix always begins at `<T_BOS>`. I could not check this without their runtime code.

## What is the per-step time and memory cost?

### Takeaway
Reported per-step mask times run from under 1 µs to about 3 ms, and storage from under 1 KB to 2.2 GB, and they scale with the vocabulary or KB far above this project's. Interpreter and execution checks are the slow end, at seconds per query. Full mask allocation is O(V) per hypothesis in Python implementations regardless of the structure. At V = 937, cost is very unlikely to constrain M1, but no one has measured that scale.

### Cited Findings

**Mask computation**

| System | Per-step or per-token | Setting | Source |
|---|---|---|---|
| Trie Automata | 0.65 µs valid-token computation, vs 5.8 µs for XGrammar | Finite sets, 32K–262K vocabularies, flat in set size | [arXiv 2608.12574](https://arxiv.org/abs/2608.12574) |
| GRID | 3.6–6.7 µs median per-token mask | Author's benchmark. Single-author preprint | [arXiv 2607.11951](https://arxiv.org/abs/2607.11951) |
| STATIC | 0.033 ms per step, 0.25% of inference time, 948× over a CPU trie | 20M items on accelerators | [arXiv 2602.22647](https://arxiv.org/abs/2602.22647) |
| FlashTrie | Under 3 ms trie-search latency | 800M keywords, beam widths up to 1000, GPU | [arXiv 2607.10044](https://arxiv.org/abs/2607.10044) |
| XGrammar | Under 40 µs per token for JSON schema and JSON CFG, under 200 µs for XML and a Python DSL | Ryzen 9 7950X, Llama-3.1-8B | [Dong et al. 2024](https://arxiv.org/abs/2411.15100) |
| llguidance | 60 µs mean. 28 µs for 0–2% full masks, 576 µs for 2–85% unsliced, 1,577 µs for 85%+ unsliced, 61 µs for 85%+ sliced | About 2M masks in MaskBench | [optimizations.md](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/docs/optimizations.md) |
| llguidance baseline | 13 cycles per trie node, about 2 × n_vocab nodes, about 1.5 ms for a simple regex at 128k vocab | AMD EPYC at 2 GHz | [optimizations.md](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/docs/optimizations.md) |

**End to end**

| System | Number | Source |
|---|---|---|
| Time per output token, LM only | 15–17 ms | [JSONSchemaBench](https://arxiv.org/abs/2501.10868) (HF backend for XGrammar is compared separately) |
| Guidance | 6.4–9.5 ms, below LM only because of fast-forwarding, compile 0.00–0.01 s | [JSONSchemaBench](https://arxiv.org/abs/2501.10868) |
| Outlines | 30–47 ms, compile 3.5–8.1 s | [JSONSchemaBench](https://arxiv.org/abs/2501.10868) |
| Llama.cpp grammar | 27–30 ms, compile 0.05–0.06 s | [JSONSchemaBench](https://arxiv.org/abs/2501.10868) |
| PICARD | 2.5 → 3.1 s per sample, T5-3B, beam 4, A100 | [Scholak et al. 2021](https://arxiv.org/abs/2109.05093) |
| Nam and Lee | 152.52 → 165.12 ms per sequence at batch 1 (ΨNONE to ΨHYBR, beam 1). 5.43 → 13.43 ms at batch 64. Computing the mask tensor "is the bottleneck of parallel computing" | [arXiv 2410.00414](https://arxiv.org/abs/2410.00414) |
| ReTraCk | 1.62 s per query average, against 115.5 s for a ranking baseline | [Chen et al. 2021](https://aclanthology.org/2021.acl-demo.39.pdf) |
| GCR | 3.60 s per question, total. KG-Trie on-demand build about 0.28 s including NER and linking | [Luo et al. 2025](https://arxiv.org/abs/2410.13080) |
| Structural Automata | Bounded decoders take "about 30–40% longer per graph" than unconstrained greedy | [arXiv 2610.13896](https://arxiv.org/abs/2610.13896) |
| SPARKLE | "under 1 second" inference | [SPARKLE](https://arxiv.org/abs/2407.01626) |

**Memory and storage**

| System | Size | Source |
|---|---|---|
| GENRE trie | ~6M leaves, ~17M internal nodes, ~600 MB on disk. 2.1 GB in total with the model, vs 30.1 GB for BLINK | [De Cao et al. 2021](https://arxiv.org/abs/2010.00904) |
| mGENRE | 2.2 GB for ~89M names | [mGENRE](https://arxiv.org/abs/2103.12528) |
| GenIE | ≈200 MB for the prefix trie | [GenIE](https://arxiv.org/abs/2112.08340) |
| GCR | 0.5 MB rising to 7.5 MB average per KG-Trie as hops go from 1 to 4 | [Luo et al. 2025](https://arxiv.org/abs/2410.13080) |
| XGrammar mask cache | 160 MB → 0.46 MB with adaptive storage (Llama-3.1, JSON grammar) | [Dong et al. 2024](https://arxiv.org/abs/2411.15100) |
| Trie Automata | <1 KB against a ~47 MB FSM transition table, in the paper's concrete example | [arXiv 2608.12574](https://arxiv.org/abs/2608.12574) |

**Complexity claims that need care**
- Outlines claims mask lookup "only O(1) on average" with a hash map. — [Willard and Louf 2023](https://arxiv.org/abs/2307.09702). The binding iterates `allowed_tokens_iter` for the state, so filling a bitmask scales with allowed tokens (own reading of [mod.rs](https://github.com/dottxt-ai/outlines-core/blob/116a7c381b446814fdfc9b2b28bea7ca4f900aae/src/python_bindings/mod.rs)). The state lookup is O(1), and the mask fill is not.
- GCR says "constant time (O(|Wz|))", which is not constant. The paper's worst-case build is O(E^L) time and O(E^L × T) space. — [Luo et al. 2025](https://arxiv.org/abs/2410.13080)
- GENRE says retrieval time "does not depend on the size of E, but only on the size of the beams and the average length of entity representations". — [De Cao et al. 2021](https://arxiv.org/abs/2010.00904). That holds for model calls. `MarisaTrie.get` calls `self.trie.keys(key)` and builds a set of next characters, so the lookup scales with the number of names below that prefix (own reading of [trie.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/trie.py)). The class caches the first two levels (`cache_fist_branch`), presumably because those subtrees are the largest. SPARKLE precomputes three levels for the same reason. The README calls the dict "fast but memory inefficient" and marisa "much more memory efficient but a little slower".

**Code-level costs I read**
- HF's processor allocates a full `-inf` tensor and calls Python once per beam per step. It is also not supported in continuous batching. — [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py); [generation/utils.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/utils.py)
- GraphRAFT's `allowed_next_ids` compares against every candidate query at every step for every hypothesis. — [logits_processor.py](https://github.com/AlfredClemedtson/graphraft/blob/a09bcdd6ff87b2233c30c660da7a0e76a12e4a8f/constrained_decoding/logits_processor.py)
- ReTraCk's virtual execution does `pickle.loads(pickle.dumps(self.node_table))` for each candidate rule, and caps set growth at `MAXIMUM_PARAMETER_LEN = 1000`, above which it collapses to `ANY`. That cap weakens the constraint in exchange for speed. — [sexpression_state.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/sexpression_state.py)
- PICARD and Shin cap work by testing only top-ranked tokens. PICARD's default in the processor is `max_tokens_to_check=1`, and the paper uses top-2 for its best results. Shin's loop checks `first_n_tokens_from_lm_to_check = 100` before falling back to a full intersection. — [picard_model_wrapper.py](https://github.com/ServiceNow/picard/blob/6a252386bed6d4233f0f13f4562d8ae8608e7445/seq2seq/utils/picard_model_wrapper.py); [earley_partial_parse.py](https://github.com/microsoft/semantic_parsing_with_constrained_lm/blob/b22f5186ee6e66dfaf3808cd3e5f850f1e015469/src/semantic_parsing_with_constrained_lm/decoding/earley_partial_parse.py)
- Shin's GPT-3 client only ever sees the API's 100 top logprobs, with all other tokens set to `-inf` before constraints run. — [lm_openai_gpt3.py](https://github.com/microsoft/semantic_parsing_with_constrained_lm/blob/b22f5186ee6e66dfaf3808cd3e5f850f1e015469/src/semantic_parsing_with_constrained_lm/lm_openai_gpt3.py)
- Top-k has a known cost: "valid tokens with low probabilities are ignored", which hurts early weak-supervision search. — [arXiv 2410.00414](https://arxiv.org/abs/2410.00414)
- Reports disagree on whether the mask is the bottleneck. [GRID](https://arxiv.org/abs/2607.11951) reports +1.51% time per output token under vLLM at batch 32, while [Nam and Lee](https://arxiv.org/abs/2410.00414) call mask tensor construction the bottleneck when batching on a GPU. Both can hold, since the two implementations and batch paths differ.

### Inferences
- **Own extrapolation, arithmetic only.** Using llguidance's figures at V = 937 gives 13 × 2 × 937 ≈ 24,000 cycles, about 12 µs at 2 GHz, for a full automaton walk in optimised Rust. JavaScript will be slower by an unknown factor. A token-space lookup needs no walk at all, only a copy of 937 values plus k writes. On that basis the per-step cost is likely negligible beside a forward pass, but the project should time it rather than cite these numbers.
- GCR's on-demand build time and small tries are the nearest analogue to a small KB. DoG's average 119 triplets per subgraph is closer still in size, and neither reports a per-step figure.
- A copy-then-write mask on a fresh array, as M1 plans, is the same O(V) pattern as HF. Nothing in these sources suggests it needs optimising at this vocabulary.

### Gaps
- I found no per-step timing for GENRE, mGENRE, GenIE, DoG, SPARKLE, NSM or Shin. They report totals or storage only.
- I found no timing for any KB mask in JavaScript or TypeScript, or for a vocabulary under 32K.
- The GCR Table 10 header shows both "Total time (s)" and "Total Time (min)" over one column of values (4.03 falling to 1.92 at 1 to 20 threads), so I cannot state its unit with confidence.

## What happens when the allowed set is empty?

### Takeaway
There is no standard behaviour. I found eight: raise, leave all `-inf`, drop the hypothesis, stop at EOS, force a substitute such as `NIL`, reject at compile time, silently lift the constraint, or backtrack. Beam search makes emptiness cheap, because a dead hypothesis just disappears. M1 samples one hypothesis, so it does not have that escape and must choose explicitly.

### Cited Findings

| Behaviour | System | Detail |
|---|---|---|
| **Raise an error** | HF `PrefixConstrainedLogitsProcessor` | `raise ValueError(... "the constraint is unsatisfiable" ...)` when the callback returns an empty list. **[code]** [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py) |
| **Force allowed tokens** | HF, a distinct case | If every allowed token of every beam is already `-inf`, the mask itself replaces the scores ("force them with a score of 0 so the constraint holds"). **[code]** [logits_process.py](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py) |
| **Return `[]` and let `-inf` stand** | GENRE, GenIE, SPARKLE | GENRE's `get_trie_*` functions return `[]`. GenIE returns `[]` after EOS, with a TODO in the code about why. GenIE then discards results: `if score != -1e9 and score != -math.inf: pred = ...`, otherwise no prediction. SPARKLE's `Trie.get` wraps everything in a bare `except: return []`. **[code]** [entity_linking.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/entity_linking.py), [genie_base_pl.py](https://github.com/epfl-dlab/GenIE/blob/c53d52f598c2940e00f753c97b3baf4ba144fc03/genie/models/genie_base_pl.py), [sparkle/trie.py](https://github.com/zzaebok/sparkle/blob/2c6656006495b056c738e26f3f4a913c7da5a68b/sparkle/trie.py) |
| **All `-inf` with no guard** | GraphRAFT, DoG | GraphRAFT indexes with an empty list, leaving all `-inf` (own reading). DoG's `v.get(k, {})` returns no keys on a mismatch, and the paper does not say what follows. [logits_processor.py](https://github.com/AlfredClemedtson/graphraft/blob/a09bcdd6ff87b2233c30c660da7a0e76a12e4a8f/constrained_decoding/logits_processor.py), [DoG](https://arxiv.org/abs/2410.18415) |
| **Substitute a sentinel** | GENRE | `mention_to_candidates_dict.get(mention, ["NIL"])`: an unknown mention can only link to `NIL`. **[code]** [entity_linking.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/entity_linking.py) |
| **Keep EOS available** | PICARD | "Do not mask the EOS token because otherwise production can continue indefinitely if all other tokens are masked". EOS is exempt from the top-k cut, though it is still rejected if it is in the top-k and fails the parser. **[code]** Also, "only 2% of the predictions are unusable. In these cases, beam search exited without finding a valid SQL prediction". **[paper]** [picard_model_wrapper.py](https://github.com/ServiceNow/picard/blob/6a252386bed6d4233f0f13f4562d8ae8608e7445/seq2seq/utils/picard_model_wrapper.py), [paper](https://arxiv.org/abs/2109.05093) |
| **Treat timeout as rejection** | PICARD | `FeedTimeoutFailure` marks the token for removal. **[code]** [picard_model_wrapper.py](https://github.com/ServiceNow/picard/blob/6a252386bed6d4233f0f13f4562d8ae8608e7445/seq2seq/utils/picard_model_wrapper.py) |
| **End the episode as an error** | NSM | "If no valid actions are available, then stop": `self.done = True; self.error = True`. At limits, the interpreter returns only `END_TK`. **[code]** [env_factory.py](https://github.com/crazydonkey200/neural-symbolic-machines/blob/a03ff05228cfebcc818b6a901c4d7b0ed459fa7c/nsm/env_factory.py), [computer_factory.py](https://github.com/crazydonkey200/neural-symbolic-machines/blob/a03ff05228cfebcc818b6a901c4d7b0ed459fa7c/nsm/computer_factory.py) |
| **Drop from the beam** | ReTraCk, Shin | ReTraCk: if every action would be removed and no global actions exist, `self.early_stop = True`, the original actions are restored, and the beam later skips states failing `is_valid()`, remembering `last_valid_state`. Virtual execution with an empty result: "the action sequence is removed from the beam". Shin: `allowed_next` can return an empty tensor and the node yields no children. A TODO notes the case is not specially handled. **[code]**, **[paper]** [sexpression_state.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/sexpression_state.py), [early_stop_beam_search.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/train_utils/early_stop_beam_search.py), [search.py](https://github.com/microsoft/semantic_parsing_with_constrained_lm/blob/b22f5186ee6e66dfaf3808cd3e5f850f1e015469/src/semantic_parsing_with_constrained_lm/search.py) |
| **Stop the parser** | llguidance | `if allowed_tokens.is_zero() { infoln!(self, "no tokens allowed, stopping"); return Err(self.stop("", StopReason::NoExtensionBias)); }`, which the constraint layer reports as a stop result. **[code]** [tokenparser.rs](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/parser/src/tokenparser.rs), [constraint.rs](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/parser/src/constraint.rs) |
| **Reject at compile time** | Outlines | States with no valid transitions and no match raise `Error::IncompatibleVocabulary`, naming the missing characters. "Useful state" pruning keeps tokens from stranding the DFA. **[code]** [index.rs](https://github.com/dottxt-ai/outlines-core/blob/116a7c381b446814fdfc9b2b28bea7ca4f900aae/src/index.rs) |
| **Silently lift the constraint** | GCR | `allow_tokens = self.trie.get(...)`, then `if len(allow_tokens) == 0: return self.all_tokens`. **[code]** [graph_constrained_decoding.py](https://github.com/RManLuo/graph-constrained-reasoning/blob/9518e8e69197d5e577a6e414060fb898771617b9/src/graph_constrained_decoding.py) |
| **Backtrack** | Rollback decoders | XGrammar exposes `rollback(num_tokens)`, and I saw no use of it in the HF wrapper. Structural Automata avoids retraction by keeping a verified completion as a fallback, and reports a rollback decoder performing comparably under the same limit. [matcher.py](https://github.com/mlc-ai/xgrammar/blob/ca1acf28bf35b9ba9092800b69aebc7d4ce1f7a7/python/xgrammar/matcher.py), [arXiv 2610.13896](https://arxiv.org/abs/2610.13896) |

**Empty at the system level, after decoding**
- RnG-KBQA and ReTraCk's post-beam check execute top-k forms until one returns an answer. RnG then falls back to the top-ranked enumerated candidate, "guaranteed to be executable". SPARKLE also executes queries "in turn until a non-empty query result is obtained". — [RnG-KBQA](https://arxiv.org/abs/2109.08678); [kb_parser.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/kb_parser.py); [SPARKLE](https://arxiv.org/abs/2407.01626)

### Inferences
- **GCR's fallback conditions its headline claim.** The paper reports "zero reasoning hallucination" and a 100% faithful reasoning ratio. In the code, an empty trie result opens the full vocabulary. On a correct path, a leaf with no EOS is probably how the decoder deliberately goes free, since one builder appends EOS and another does not ([qa_prompt_builder.py](https://github.com/RManLuo/graph-constrained-reasoning/blob/9518e8e69197d5e577a6e414060fb898771617b9/src/qa_prompt_builder.py), around lines 65–71 and 176–180). That matches the paper's "switch back" sentence, so this is design and not a bug, but constraint exhaustion and constraint failure are not told apart, and the guarantee covers path text only.
- **M1 should not copy that pattern silently.** The earlier report's counted fallback is the more honest form, and GCR is the cautionary precedent. PICARD's EOS exemption and NSM's `error` flag are both more visible alternatives. For a banlist, emptiness needs all 937 tokens banned, so the likely real case is a top-p interaction already covered by the earlier notes.
- With a blocklist on free text, emptiness is rare and the design question is smaller than for the allowlists above. It grows only if M1 later adopts allowlist regions.

### Gaps
- I did not find where XGrammar handles an all-zero mask. `fill_next_token_bitmask` returns only `need_apply`. The HF wrapper's `assert accept_token` would fail on a token the grammar rejects, and I did not read the full matcher to see if an empty mask can arise for a valid compiled grammar.
- HF's current `ValueError` is newer than GENRE and GenIE, which return `[]` as part of ordinary operation. I did not trace the version where it arrived or which pinned version those repositories need. Both requirements files leave `transformers` unpinned, so their code may raise on current HF. Not tested, since `torch` is not installed here per the earlier notes.

## Is each system an allowlist or a blocklist, and is it used in greedy, beam or sampled decoding?

### Takeaway
Nearly every KB-derived mask is an allowlist, and nearly all use beam search, because beam search both produces ranked retrieval results and absorbs dead ends. Blocklists appear as engine features or subtractive steps. M1 is unusual in being a blocklist, on free text, under sampling.

### Cited Findings

| System | List type | Decoding | Basis |
|---|---|---|---|
| GENRE, mGENRE | Allowlist | Beam ("Constrained BS"). Top-k beams are the retrieval ranking | [De Cao et al. 2021](https://arxiv.org/abs/2010.00904), [hf_model.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/hf_model.py) |
| GenIE | Allowlist | Beam | [GenIE](https://arxiv.org/abs/2112.08340) |
| WebIE | Allowlist, entity and relation tries following GenIE | Beam | [Whitehouse et al. 2023](https://arxiv.org/abs/2305.14293) |
| NSM | Allowlist from the interpreter | Sampling and beam, both in training and evaluation | [agent_factory.py](https://github.com/crazydonkey200/neural-symbolic-machines/blob/a03ff05228cfebcc818b6a901c4d7b0ed459fa7c/nsm/agent_factory.py) |
| ReTraCk | Allowlist from the grammar, then `actions_to_remove`, a blocklist step | Beam | [sexpression_state.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/sexpression_state.py) |
| RnG-KBQA | None | Beam, then execute | [run_generator.py](https://github.com/salesforce/rng-kbqa/blob/ebdfb098ee2a482746bf6b2ce2892b74b41ddd9d/framework/run_generator.py) |
| Shin et al. | Allowlist | Length-normalised beam for constrained runs. Unconstrained baselines use greedy sampling at temperature 0, with beam size 10 tried only on the calendar domain | [search.py](https://github.com/microsoft/semantic_parsing_with_constrained_lm/blob/b22f5186ee6e66dfaf3808cd3e5f850f1e015469/src/semantic_parsing_with_constrained_lm/search.py), [paper](https://arxiv.org/abs/2104.08768) |
| PICARD | Allowlist within top-k. "the rest is automatically dismissed" | Beam, greedy also allowed | [Scholak et al. 2021](https://arxiv.org/abs/2109.05093) |
| SPARKLE | Allowlist | Beam, then execute | [SPARKLE](https://arxiv.org/abs/2407.01626) |
| GCR | Allowlist within path regions | Beam, top-10 paths | [Luo et al. 2025](https://arxiv.org/abs/2410.13080) |
| DoG | Allowlist within triplets | Token and triplet beam. "greedy search is not allowed here as it only returns at most one sequence" for token-level use, and top-k/p sampling is named as an alternative | [Li et al. 2025](https://arxiv.org/abs/2410.18415) |
| GraphRAFT | Allowlist | Greedy or beam. Lemma: "When beam width = M, exactly all valid queries are generated" | [Clemedtson and Shi 2025](https://arxiv.org/abs/2504.05478) |
| Geng et al. | Allowlist | "any decoding algorithm", greedy and beam named | [Geng et al. 2023](https://arxiv.org/abs/2305.13971) |
| Outlines | Allowlist | Sampling in the paper's Algorithm 2, and any backend through processors | [Willard and Louf 2023](https://arxiv.org/abs/2307.09702) |
| XGrammar | Allowlist, plus `exclude_token` as a token-level ban | Sampled or greedy through the wrapper | [hf.py](https://github.com/mlc-ai/xgrammar/blob/ca1acf28bf35b9ba9092800b69aebc7d4ce1f7a7/python/xgrammar/contrib/hf.py) |
| llguidance | Allowlist, plus `<[^...]>` | Mask per step, and sampling temperature per terminal | [syntax.md](https://github.com/guidance-ai/llguidance/blob/3d698ee07b3a67b0aef50fb6058612e8fd30aca2/docs/syntax.md) |
| NeuroLogic | Blocklist for negative literals, soft reward for positive | Beam-based search | [Lu et al. 2021](https://arxiv.org/abs/2010.12884) |
| KGLM | Not a mask. Restricted relation choice | Sampled latent variables | [kglm.py](https://github.com/rloganiv/kglm-model/blob/c9cb7f995072ac990799994f1e2b62828d7e6b27/kglm/models/kglm.py) |
| KCTS | Soft | MCTS | [Choi et al. 2023](https://arxiv.org/abs/2310.09044) |

**Beam matters for these masks**
- PICARD: "Note that, without PICARD, these models do not benefit from beam search". Increases are "the strongest for the step from beam size 1 to 2", and "Even with greedy search (beam size 1), PICARD allows for some modest improvements". — [Scholak et al. 2021](https://arxiv.org/abs/2109.05093)
- Nam and Lee: test accuracy with ΨHYBR rises from 92.60 to 92.81 at beam 4 under strong supervision, and from 77.99 to 81.28 under weak supervision. — [arXiv 2410.00414](https://arxiv.org/abs/2410.00414)

### Inferences
- **Allowlist results should not be cited as evidence for a blocklist.** An allowlist turns the decoder into a retriever over a closed set, and its accuracy gain comes partly from that closure. M1 leaves an open vocabulary, so it inherits the mechanism but not the size of these gains.
- **Sampling under a hard mask is the least-studied cell here.** Structural results from beam search need not carry over. A mask that traps a sampled hypothesis in a poor prefix has no alternative beam to rescue it, and the PICARD result suggests a large part of the gain in constrained decoding depends on keeping alternatives.
- A blocklist on a KB fact has a semantic problem that allowlists avoid: it can only say what must not appear, so it needs a closed-world claim about the fact it bans. An allowlist on an entity position avoids that by construction.

### Gaps
- I found no KB-derived blocklist evaluated under sampling in any system I read.
- I found no KB-masked system in the legal domain. My searches were not targeted at legal text, so this is weak evidence of absence.

## Is the mask also used at training time, and what is the measured effect?

### Takeaway
Transformer systems apply KB masks at inference only. Older grammar-based semantic parsers put the grammar in the training distribution, and ReTraCk keeps the grammar in training but switches its KB checker off. The most direct measurement, from a 2026 preprint on one seed, shows masked training barely helps with the mask on and fails badly without it. Weak-supervision search is where training-time constraints seem to pay off.

### Cited Findings

**Inference only**
- PICARD: "entirely absent from pre-training or fine-tuning of the model". — [Scholak et al. 2021](https://arxiv.org/abs/2109.05093)
- GenIE: `training_step` uses `labels` with no constraint function, and `prefix_allowed_tokens_fn` appears in the test path. **[code]** — [genie_base_pl.py](https://github.com/epfl-dlab/GenIE/blob/c53d52f598c2940e00f753c97b3baf4ba144fc03/genie/models/genie_base_pl.py)
- GENRE: the model is trained as a seq2seq and "inference is done using constrained beam search". — [De Cao et al. 2021](https://arxiv.org/abs/2010.00904)
- SPARKLE: "constrained decoding during inference", with `maximizing logpθ(y|x)` for training. `prefix_allowed_tokens_fn` in its training script sits in the generation call used for evaluation (own reading of [train_sparkle.py](https://github.com/zzaebok/sparkle/blob/2c6656006495b056c738e26f3f4a913c7da5a68b/scripts/training/train_sparkle.py), around line 590). — [SPARKLE](https://arxiv.org/abs/2407.01626)
- GraphRAFT: "at the level of logits processor at inference time". — [Clemedtson and Shi 2025](https://arxiv.org/abs/2504.05478)
- DoG: pretrained, "we do not modify the parameters or operating mechanism of LLMs". — [Li et al. 2025](https://arxiv.org/abs/2410.18415)
- GCR: fine-tuned on paths. The constraint code does not appear in `finetune_kg_specialized_llm.py` per a text search. — [repository](https://github.com/RManLuo/graph-constrained-reasoning/tree/9518e8e69197d5e577a6e414060fb898771617b9/workflow)
- Shin: constraint is in beam search, and fine-tuned BART trains separately (own reading of the search and config code).

**Used in training**
- NSM: REINFORCE and iterative ML train through the same `valid_indices`, so the softmax in the loss is over the masked set. It treats exploration pruning and the training distribution separately: "Add the actions that are filtered by cache into the training example because at test time, they will be there". **[code]** — [env_factory.py](https://github.com/crazydonkey200/neural-symbolic-machines/blob/a03ff05228cfebcc818b6a901c4d7b0ed459fa7c/nsm/env_factory.py)
- NSM's paper says the interpreter "prunes the 'programmer''s search space by orders of magnitude, and enables learning from weak supervision on a large KB". **[paper]** No ablation in the sections I read, and the number is unquantified. — [Liang et al. 2017](https://arxiv.org/abs/1611.00020)
- Krishnamurthy et al.: "Type constraints prevent these errors", and baselines' 7.4% and 6.6% execution failures do "not ... fully explain the 9% accuracy improvement". They hypothesise "type constraints also increase the effective capacity of the model, as both the seq2seq and seq2tree models must use some of their capacity to learn the type constraints". The architectures also differ, so this is not a clean mask ablation. — [Krishnamurthy et al. 2017](https://aclanthology.org/D17-1160.pdf)
- ReTraCk splits the two. Its comment reads "if in training, no checking is executed", and the code is `self.enabled = (not model_in_training) & (...)`. The grammar stays on through `get_valid_actions`, which training also uses. Removing the checker at inference drops F1 by 21.1 on GrailQA and 14.1 on WebQSP, with the grammar still in place. — [sexpression_state.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/sexpression_state.py); [Chen et al. 2021](https://aclanthology.org/2021.acl-demo.39.pdf)
- Nam and Lee, weak supervision: constraints sit inside the training search step ("each Ψ ∈ Ψ finds a different set Â"). Test accuracy: ΨNONE 74.89, ΨTYPE 74.21, ΨHYBR 77.99. Under strong supervision, where one model is trained and each Ψ evaluated, the same comparison is about 91.75 to 92.60. — [arXiv 2410.00414](https://arxiv.org/abs/2410.00414)

**Direct measurements of masked training**
- Structural Automata (DRS parsing, 2026 preprint, one seed for masked likelihood): "Masked likelihood scores 3.23 without the mask at inference and 76.80 with it, against 77.86 for standard training" under the local mask. — [arXiv 2610.13896](https://arxiv.org/abs/2610.13896)
- Same paper: "Masked candidates receive no gradient, so the unmasked model is not taught to avoid them and inference still needs the mask". On rejected-token probability mass, cross-entropy ends at 0.05–0.09%, an unlikelihood penalty near 0.04%, and masked likelihood at 3–4%. An unlikelihood penalty leads by 3.6–11.0 development points after 10% of training, and "this advantage diminishes", with final test effects varying by seed. — [arXiv 2610.13896](https://arxiv.org/abs/2610.13896)
- Same result from reinforcement learning (µRTS, not language). An agent trained with a mask and evaluated without it scored 33.53, 25.93, 17.32 and 17.37 on 4×4 to 24×24 maps, against 40.00 with the mask. — [Huang and Ontañón 2020](https://arxiv.org/abs/2006.14171)
- The opposite direction has been studied too: a 2026 reinforcement-learning paper is summarised as finding that unmasked training suppresses valid actions at states not yet visited. I saw only a search summary of this and did not read the paper. — [arXiv 2603.09090](https://arxiv.org/abs/2603.09090)

### Inferences
- **For M1 and M5, this supports inference-only masking and a separate training-side loss.** Training through the mask teaches nothing about banned tokens, in agreement with the earlier report's rule that the loss must see unmasked probabilities. A penalty on banned tokens (M5's direction) is the form with a measured benefit, though the Structural Automata result says it mostly speeds early training and may vanish with enough data.
- The project's data is small, so the early-training regime may be the relevant one. That is an extrapolation from one DRS preprint and should be presented as a hypothesis.
- The weak-supervision result does not apply to M1, since the model is trained with ordinary cross-entropy on text and there is no search step to prune.
- The Krishnamurthy "effective capacity" idea is attractive for a small model but is an untested hypothesis in the original paper, and it concerns a grammar-structured decoder rather than a logit mask.

### Gaps
- I found no controlled experiment with the same model, data and KB mask applied at training versus inference only, in a KB decoding setting. Structural Automata is the closest, and it uses structural rules on DRS, not KB content.
- I found no NSM ablation of code assistance in the sections I read, and did not read MAPO or later NSM work.
- Krishnamurthy's training procedure is described at the level of a grammar-defined decoder distribution. That training also respects the constraint is my reading, since I did not check its AllenNLP-era code.

## Does the mask use the KB's content dynamically, and how much does that add?

### Takeaway
Yes in about half the systems, at three levels: static catalogue, per-question subgraph, and per-decoded-entity lookup. Measured ablations favour the extra dynamic layer: SPARKLE gains up to 7.3 F1 from KB connectivity alone on one dataset, and ReTraCk's checker gains 14–21 F1. The gain is larger with weaker or less-trained models.

### Cited Findings

**Level 1: static catalogue (any name in the KB, regardless of context)**
- GENRE's title trie and GenIE's tries. GenIE's relation trie has no dependence on the subject just generated, as `_get_allowed_tokens` uses the global `relations_trie` and `entities_trie`, so it validates names and not facts. **[code]** — [ie_prefix_constraints.py](https://github.com/epfl-dlab/GenIE/blob/c53d52f598c2940e00f753c97b3baf4ba144fc03/genie/constrained_generation/ie_prefix_constraints.py)
- Geng et al.'s grammar and Nam and Lee's per-category tries are the same level (own reading of the papers). — [Geng et al. 2023](https://arxiv.org/abs/2305.13971); [arXiv 2410.00414](https://arxiv.org/abs/2410.00414)
- PICARD lexing and parsing without guards check schema names only. — [Scholak et al. 2021](https://arxiv.org/abs/2109.05093)

**Level 2: per-input subgraph or candidate set**
- GENRE's `mention_to_candidates_dict` builds a trie for the decoded mention. — [entity_linking.py](https://github.com/facebookresearch/GENRE/blob/08af8d0119ed60692e428791be98a17db73996b7/genre/entity_linking.py)
- GCR's per-question L-hop path trie. — [qa_prompt_builder.py](https://github.com/RManLuo/graph-constrained-reasoning/blob/9518e8e69197d5e577a6e414060fb898771617b9/src/qa_prompt_builder.py)
- GraphRAFT's enumerated queries around linked entities. — [logits_processor.py](https://github.com/AlfredClemedtson/graphraft/blob/a09bcdd6ff87b2233c30c660da7a0e76a12e4a8f/constrained_decoding/logits_processor.py)
- Geng's input-dependent grammars. — [Geng et al. 2023](https://arxiv.org/abs/2305.13971)

**Level 3: depends on what was just decoded (the question asked)**
- **NSM, the original form.** After `( Hop r`, "the next available token is restricted to properties {p | ∃e, e′ : e ∈ r, (e, p, e′) ∈ K} that are reachable from entities in r in the KB". Code confirms it: `autocomplete_hop` gets `valid_props(source_mids, ...)`, then `self.kg[ent].keys()`. It uses executed denotations, so it filters on intermediate results, not just names. — [Liang et al. 2017](https://arxiv.org/abs/1611.00020); [executor_factory.py](https://github.com/crazydonkey200/neural-symbolic-machines/blob/a03ff05228cfebcc818b6a901c4d7b0ed459fa7c/nsm/executor_factory.py)
- **SPARKLE, the closest transformer form.** After a head, the relation trie comes from `head_rel_cache[head_entity]`. After a relation, the tail trie comes from `relation_tail_cache[relation]`. Tails depend on the relation only and not on the head and relation together, so it can admit a valid-looking `(h, r, t)` that is absent from the KB (own reading). — [sparql_token_generator.py](https://github.com/zzaebok/sparkle/blob/2c6656006495b056c738e26f3f4a913c7da5a68b/sparkle/sparql_token_generator.py)
- **ReTraCk, four layers.** Instance-level: `anchor_in_relations`, `anchor_out_relations`. Ontology-level: `satisfy_require` over type sets. Virtual execution: bottom-up on types, pruned on an empty result. Real execution: `runtime_prune` runs SPARQL and keeps only `accept_slots`. — [sexpression_state.py](https://github.com/microsoft/KC/blob/84cfbb6a6cddfd004e6d088687109a3be6fc5f41/papers/ReTraCk/parser/sexpression_state.py)
- **PICARD guards.** Only a column belonging to a bound table is accepted. — [Parse.hs](https://github.com/ServiceNow/picard/blob/6a252386bed6d4233f0f13f4562d8ae8608e7445/picard/src/Language/SQL/SpiderSQL/Parse.hs); [Scholak et al. 2021](https://arxiv.org/abs/2109.05093)
- **DoG growth.** After each triplet, `Gq ← Gq ∪ {(e, r, e′) ∈ G | {e, e′} ∩ {ei, e′i} ≠ ∅}`. — [Li et al. 2025](https://arxiv.org/abs/2410.18415)
- **Non-mask contrast.** KGLM's `_knowledge_graph_lookup(parent_ids)` retrieves relations for the sampled parent, which is the same dependency as a soft latent choice. — [kglm.py](https://github.com/rloganiv/kglm-model/blob/c9cb7f995072ac990799994f1e2b62828d7e6b27/kglm/models/kglm.py)

**Reported ablations (each row removes the constraint layer named)**

| System | Setting | With | Without | Source |
|---|---|---|---|---|
| SPARKLE, connectivity pruning only | LCQuAD 1.0 F1 | 72.2 | 64.9 (no pruning), 57.3 (no constraints) | [SPARKLE](https://arxiv.org/abs/2407.01626) |
| SPARKLE | SimpleQuestions-Wiki F1 | 79.6 | 78.7, 65.5 | [SPARKLE](https://arxiv.org/abs/2407.01626) |
| SPARKLE | WebQSP F1 | 71.2 | 70.3, 64.0 | [SPARKLE](https://arxiv.org/abs/2407.01626) |
| ReTraCk checker | GrailQA F1 | 65.3 | 44.2 | [Chen et al. 2021](https://aclanthology.org/2021.acl-demo.39.pdf) |
| ReTraCk checker | WebQSP F1 (no 2-hop assumption) | 71.0 | 56.9 | [Chen et al. 2021](https://aclanthology.org/2021.acl-demo.39.pdf) |
| PICARD | Spider EM, T5-Base / Large / 3B | 65.8 / 69.1 / 74.1 | 57.2 / 65.3 / 69.9 | [Scholak et al. 2021](https://arxiv.org/abs/2109.05093) |
| GenIE, static | REBEL micro F1 (random init) | 68.93 | 66.20. FewRel recall 30.77 vs 26.15 | [GenIE](https://arxiv.org/abs/2112.08340) |
| Geng, static | cIE few-shot F1, LLaMA-33B | 36.0 | 17.5 | [Geng et al. 2023](https://arxiv.org/abs/2305.13971) |
| Shin, GPT-3 few-shot | Overnight canonical, Blocks / Calendar / Social | 0.62 / 0.82 / 0.72 | 0.46 / 0.68 / 0.55 | [Shin et al. 2021](https://arxiv.org/abs/2104.08768) |
| Shin, fine-tuned BART | Same | 0.58 / 0.85 / 0.73 | 0.56 / 0.80 / 0.65 | [Shin et al. 2021](https://arxiv.org/abs/2104.08768) |
| GraphRAFT, fine-tuned 100% data | STaRK-Prime Hit@1, Recall@20 | 44.20, 75.87 | 43.75, 69.83 | [Clemedtson and Shi 2025](https://arxiv.org/abs/2504.05478) |
| GraphRAFT, fine-tuned 10% data | Same | 41.07, 76.11 | 35.71, 60.53 | [Clemedtson and Shi 2025](https://arxiv.org/abs/2504.05478) |
| GraphRAFT, no fine-tuning | Same | 14.73, 27.53 | 0.0, 0.0 | [Clemedtson and Shi 2025](https://arxiv.org/abs/2504.05478) |

Shin's starred values come from a subset whose sampling footnote I did not read. Its unconstrained rows also use greedy decoding ("we report results using greedy search for unconstrained decoding with models other than GPT-3", and GPT-3 is greedy except on one domain) while constrained rows use beam search, so these rows are not a pure mask comparison.

Two further results do not fit the with-and-without columns:
- GRID reports constrained decoding worth +13 execution-accuracy points on Spider at a 0.5B model and about +1 point at 7B from the mask alone. — [arXiv 2607.11951](https://arxiv.org/abs/2607.11951)
- Nam and Lee report accuracy lost on KQA Pro when all candidate expressions are removed: 4.02 at 94 training examples, 5.78 at 283, 4.03 at 944, 2.42 at 9.44k, and 0.88 at 94.4k. — [arXiv 2410.00414](https://arxiv.org/abs/2410.00414)

**Limits stated by the authors**
- GRID: "Some policy is provably not enforceable by any left-to-right context-free mask—column-level RBAC being the canonical case". — [arXiv 2607.11951](https://arxiv.org/abs/2607.11951)
- Nam and Lee on previous trie methods: they "lack constraints for compositional structures" or hard-code constraints for one logical form language, which is why they combine types with tries. — [arXiv 2410.00414](https://arxiv.org/abs/2410.00414)
- RnG-KBQA: "we find that executability of produced logical forms is not the bottleneck". — [Ye et al. 2022](https://arxiv.org/abs/2109.08678)
- A valid path is not a correct answer: "Although GCR achieves 100% trustful reasoning, there are still some failure cases due to the noise and redundant information". — [Luo et al. 2025](https://arxiv.org/abs/2410.13080)

### Inferences
- **The pattern across these rows points one way, with a caveat.** Weaker models and less data gain more: GRID at 0.5B against 7B, GraphRAFT at 10% against 100%, Nam and Lee by training size, Shin's few-shot GPT-3 against fine-tuned BART. A small from-scratch model on a small corpus lies at the favourable end. All of those are allowlists on closed-output tasks with exact-match or retrieval metrics, though, so an analogous M1 gain on free-text prose is a hypothesis to test. The authors' metrics partly reward the closure itself.
- **Static level gains are smaller than dynamic level gains where the two are separated.** SPARKLE on LCQuAD is the one clean case. On the other two SPARKLE datasets connectivity adds under 1 point, so this varies by dataset.
- **M1 as planned sits at level 3**: the banned set depends on the fact pattern detected in the prefix. The direct code precedents are NSM's `get_props` and SPARKLE's `head_rel`. Both are positive lookups and M1 is negative, so M1 inverts them: from a detected subject and predicate, the closure gives the values or roles that are false.
- **SPARKLE's tail-by-relation shortcut is a warning.** A table keyed on too little context silently admits wrong facts. For M1 the mirror failure would be over-banning, if the ban is keyed on a relation without the subject. Keying on the full (subject, predicate) pair avoids this and is cheap at this size.
- Beyond GRID's point, a left-to-right mask cannot catch facts expressed in the opposite word order, since the constraint needs the subject before the object position. This follows from the PICARD `select`/`from` delay, and in legal prose it probably covers passives. It should go in the scope statement with paraphrase. No source measures this for prose, so it is my inference.

### Gaps
- No system I read compiles Horn rules or a forward-chained closure into a mask. The nearest are ReTraCk's type inference and DoG's graph expansion, and neither is rule-based reasoning.
- No study measures a dynamic KB mask on open-ended prose. Every ablation above is on a structured or retrieval output.
- GRID, Trie Automata, STATIC, FlashTrie and Structural Automata were read through PDF text and not their code. GRID is a single-author preprint, and Structural Automata's masked-likelihood figure is from one seed.
- Survey coverage. WebSearch was unavailable for part of this session because of a usage limit, then worked. New 2025–2026 work came from five searches, citation trails, and one arXiv API query for "constrained decoding" and "trie". There may be KB-constrained systems I did not find, and I did not check venues for every preprint. An unread lead is [Soleimani et al.](https://arxiv.org/abs/2609.17064), named in the earlier notes.
