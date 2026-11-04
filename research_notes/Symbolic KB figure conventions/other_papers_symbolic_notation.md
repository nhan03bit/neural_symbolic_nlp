# How the non-process-knowledge papers draw symbolic and structured content

Scope: Xu 2018, Ahmed 2023, Weizenbaum 1966, Rumelhart 1986, Mikolov 2013 (two papers), Sennrich 2016 and the user's own "NLP Transformer Note". Sheth 2023, Sheth 2022 and Roy 2022 are covered by another researcher.

Evidence marks: **[R]** seen in a page render. **[T]** read from pdftotext only, not checked in a render. Inferences sit only under "Inferences". Page numbers are PDF pages, with the journal page in brackets for ELIZA and Rumelhart. Renders are in `/private/tmp/claude-501/-Users-nedpham-Projects-neural-symbolic-nlp/b202556a-74af-407e-a377-1ceeae55b98c/scratchpad/figs_b`; nothing was copied into the repo.

## Which figures or tables show symbolic content?

### Takeaway
Only three papers draw logic or rules at all. Xu and Ahmed draw circuits, and ELIZA's strongest symbolic content is not in a figure: it is displayed rule lines in running text. Rumelhart Fig. 2 is the closest visual precedent for a fact base, and Mikolov and Sennrich have no logic, only structured example tables.

### Cited Findings

**Xu 2018**
- [R] p.7, Figure 3, a tree of AND/OR gate glyphs over six literal leaves: "Figure 3: A compiled decomposable and deterministic circuit for the exactly-one constraint with 3 variables." [Xu p.7](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=7)
- [R] p.7, Figure 4, the same layout with + and × nodes and Pr(·) leaves: "Figure 4: The corresponding arithmetic circuit for the exactly-one constraint with 3 variables." [Xu p.7](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=7)
- [R] p.2, Figure 1, a network feeding three labelled trapezoids, each followed by a small instance glyph: "Figure 1: Outputs of a neural network feed into semantic loss functions for constraints representing a one-hot encoding, a total ranking of preferences, and paths in a grid graph." [Xu p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=2)
- [R] Not symbolic: p.4 Figure 2 ("Binary classification toy example: a linear classifier without and with semantic loss.") and p.13 Figure 5 ("FASHION pictures grouped by how confidently the supervised base model classifies them correctly. With semantic loss, the final semi-supervised model predicts all correctly and confidently."). [Xu p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=4), [Xu p.13](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=13)
- [T] Tables 1-5 are accuracy tables by caption, and Table 6 is a CNN specification ([R] for Table 6). No rule table exists. [Xu p.5](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=5)

**Ahmed 2023**
- [R] p.6, Figure 2, derivation on the left and a numbered logic circuit on the right. Caption as read: "Figure 2: An example of our pipeline. (Left) We start by sampling an assignment from the model p_θ. Our goal is to compute the pseudolikelihood of the model sample—the product of the sample's conditionals. We start by expanding the model sample to include all samples that are a Hamming distance of 1 away from the sample. We proceed by (batch) evaluating the samples through the model, obtaining the joint probability of each sample. We then normalize along each column, obtaining the conditionals. (Right) A logical circuit encoding constraint (Cat ⟹ Animal)∧(Dog ⟹ Animal), with variable A mapping to Cat, variable B mapping to dog and variable C mapping to Animal. To compute the pseudolikelihood of the constraint in the neighborhood of the sample abc, we feed the computed conditional at the corresponding literals. We push the probabilities upwards, taking products at AND nodes and sums at OR nodes. The number accumulated at the root of the circuit is the pseudolikelihood of the constraint in the neighborhood of the sample abc." [Ahmed p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/ahmed-2023-pseudo-semantic-loss.pdf#page=6)
- [R] p.2, Figure 1, a density curve with the constraint region shaded and the bracket m(α): "Figure 1: Our approach in a nutshell. Given a data point x, we approximate the likelihood of the constraint α (area shaded in pink) with the pseudolikelihood (shown in gray) of the constraint in the neighborhood of a sample (denoted ×), where m(α) denotes the region of the constraint support." [Ahmed p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/ahmed-2023-pseudo-semantic-loss.pdf#page=2)
- [R] p.7, Figure 3, constraints shown only by solved instances (terrain map with path, Sudoku with solution): "Figure 3: Example inputs and groundtruth labels for two of the three tasks considered in our experimental evaluation. (Left) Example Warcraft terrain map and a possible (non-unique) minimum-cost shortest path. (Right) Example Sudoku puzzle and its corresponding (unique) solution." [Ahmed p.7](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/ahmed-2023-pseudo-semantic-loss.pdf#page=7)
- [R] p.5, "Algorithm 1" with numbered lines and comments in a separate magenta colour. [Ahmed p.5](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/ahmed-2023-pseudo-semantic-loss.pdf#page=5)

**Weizenbaum 1966 (ELIZA)**
- [R] p.3 (38), Fig. 1, a tree with K at the root and D/R labelled leaves: "FIG. 1. Keyword and rule list structure". [ELIZA p.3](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=3)
- [R] p.4 (39), Fig. 2, a flowchart with stadium decisions, rectangular actions and YES/NO on the lines: "FIG. 2. Basic flow diagram of keyword detection". These are the paper's only two numbered figures. [ELIZA p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=4)
- [R] Uncaptioned displayed rule lines: decomposition "(0 YOU 0 ME)" and reassembly "(WHAT MAKES YOU THINK I 3 YOU)" on p.3 (38); substitution "(YOURSELF = MYSELF)." and rank "(MY = YOUR 5 (transformation rules))." on p.4 (39); tagged fact "(MOTHER DLIST (/NOUN FAMILY))." and tag-matching rule "(0 YOUR 0 (/FAMILY) 0)" on p.6 (41). [ELIZA p.3](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=3), [ELIZA p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=4), [ELIZA p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=6)
- [R] pp.9-10 (44-45), "APPENDIX. An ELIZA Script": the full rule base as monospaced capitals in parenthesised lists, with no figure number. [ELIZA p.9](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=9)

**Rumelhart 1986** (scan with no usable text layer: pdftotext returned 20 words)
- [R] p.2 (534), Fig. 2, the two family trees, with "=" for marriage. Caption: "Fig. 2 Two isomorphic family trees. The information can be expressed as a set of triples of the form ⟨person 1⟩⟨relationship⟩⟨person 2⟩, where the possible relationships are {father, mother, husband, wife, son, daughter, uncle, aunt, brother, sister, nephew, niece}. A layered net can be said to 'know' these triples if it can produce the third term of each triple when given the first two. The first two terms are encoded by activating two of the input units, and the network must then complete the proposition by activating the output unit that represents the third term." [Rumelhart p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/rumelhart-1986-backpropagation.pdf#page=2)
- [R] p.2 (534), Fig. 3, one query shown as activity levels. Caption: "Fig. 3 Activity levels in a five-layer network after it has learned. The bottom layer has 24 input units on the left for representing ⟨person 1⟩ and 12 input units on the right for representing the relationship. The white squares inside these two groups show the activity levels of the units. There is one active unit in the first group representing Colin and one in the second group representing the relationship 'has-aunt'. Each of the two input groups is totally connected to its own group of 6 units in the second layer. These groups learn to encode people and relationships as distributed patterns of activity. The second layer is totally connected to the central layer of 12 units, and these are connected to the penultimate layer of 6 units. The activity in the penultimate layer must activate the correct output units, each of which stands for a particular ⟨person 2⟩. In this case, there are two correct answers (marked by black dots) because Colin has two aunts. Both the input units and the output units are laid out spatially with the English people in one row and the isomorphic Italians immediately below." [Rumelhart p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/rumelhart-1986-backpropagation.pdf#page=2)
- [R] Not symbolic but relevant to annotation: p.2 Fig. 1 ("A network that has learned to detect mirror symmetry in the input vector. The numbers on the arcs are weights and the numbers inside the nodes are biases. ..."), p.3 (535) Fig. 4 ("The weights from the 24 input units that represent people to the 6 units in the second layer that learn distributed representations of people. White rectangles, excitatory weights; black rectangles, inhibitory weights; area of the rectangle encodes the magnitude of the weight. ..."), p.3 Fig. 5 ("A synchronous iterative net that is run for three iterations and the equivalent layered net. ..."). [Rumelhart p.3](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/rumelhart-1986-backpropagation.pdf#page=3)
- [R] The "Fig. 1" on p.4 belongs to the next article in the issue (Murphy & Mitchell, kitten amblyopia), not to Rumelhart. [Rumelhart p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/rumelhart-1986-backpropagation.pdf#page=4)

**Mikolov 2013, distributed representations: no logic, rule or constraint figure**
- [R] Relation by example: "Table 2: Examples of the analogical reasoning task for phrases (the full test set has 3218 examples). The goal is to compute the fourth phrase using the first three. Our best model achieved an accuracy of 72% on this dataset." [Mikolov b p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-distributed-representations.pdf#page=6)
- [R] "Table 5: Vector compositionality using element-wise addition. Four closest tokens to the sum of two vectors are shown, using the best Skip-gram model.", with column heads such as "Vietnam + capital". Table 4 is "Examples of the closest entities to the given short phrases, using two different models." [Mikolov b p.7](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-distributed-representations.pdf#page=7)
- [R] "Figure 2: Two-dimensional PCA projection of the 1000-dimensional Skip-gram vectors of countries and their capital cities. The figure illustrates ability of the model to automatically organize concepts and learn implicitly the relationships between them, as during the training we did not provide any supervised information about what a capital city means." [Mikolov b p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-distributed-representations.pdf#page=4)

**Mikolov 2013, word2vec efficient estimation: no logic, rule or constraint figure**
- [R] "Table 1: Examples of five types of semantic and nine types of syntactic questions in the Semantic-Syntactic Word Relationship test set." (rows are named relations, cells are word pairs). [Mikolov a p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-word2vec-efficient-estimation.pdf#page=6)
- [R] "Table 8: Examples of the word pair relationships, using the best word vectors from Table 4 (Skip-gram model trained on 783M words with 300 dimensionality)." Each row gives a relation and three "x: y" examples. The same page mentions "automatic extension of facts in Knowledge Bases". [Mikolov a p.10](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-word2vec-efficient-estimation.pdf#page=10)

**Sennrich 2016: no logic, but an ordered rule list and traced examples**
- [R] "Figure 1: BPE merge operations learned from dictionary {'low', 'lowest', 'newer', 'wider'}.": four unboxed lines reading "r · → r·", "l o → lo", "lo w → low", "e r· → er·". Algorithm 1 sits directly above it as Python source between two rules. [Sennrich p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/sennrich-2016-bpe-rare-words.pdf#page=4)
- [R] 'Table 4: English→German translation example. "|" marks subword boundaries.' and 'Table 5: English→Russian translation examples. "|" marks subword boundaries.' [Sennrich p.9](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/sennrich-2016-bpe-rare-words.pdf#page=9)

**NLP Transformer Note: 5 pages, 9 embedded raster images on pp.1-4, p.5 is text only**
- [R] All five pages were viewed. None of the images is hand-drawn, and none contains a logic formula, rule or constraint. They are dark, glowing node-and-arc illustrations of attention, feed-forward and layer stacks. [Note p.1](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/NLP%20Transformer%20Note.pdf#page=1)
- [R] The nearest thing to symbolic is typed labels: Q/K/V, "looking for..." and "offers...", a '"bank" ≠ "bank"' panel, and row labels "syntax" and "meaning" over panels titled as questions ("word order?", "part of speech?", "coreference?", "semantic role?"). [Note p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/NLP%20Transformer%20Note.pdf#page=2), [Note p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/NLP%20Transformer%20Note.pdf#page=4)

### Inferences
- The note's images look like cropped screenshots of an animated visualiser, because labels run off the right edge of each image. This is inferred from the look alone, and the note states no provenance.
- Ahmed's constraint (Cat ⟹ Animal)∧(Dog ⟹ Animal) is two definite Horn clauses, so of all these papers Figure 2 is the nearest precedent in logical form to the repo's KB. Its logic is only propositional, though, with no variables or binding.

### Gaps
- Xu's and Ahmed's numeric tables were located by caption and not all inspected (Xu Tables 1-5, Ahmed Tables 1-3). The same applies to Mikolov word2vec Tables 2-7, Mikolov distributed Tables 1, 3 and 6, and Sennrich Table 1. Their captions describe results, not symbols.
- Caption search found no figure beyond those listed, but Xu pp.9-12 and Ahmed pp.9-16 were not rendered page by page. pdfimages cannot rule out vector drawings there.

## How is a logical statement or derivation typeset?

### Takeaway
All of these authors write logic as notation, and none puts a rule in a card. Shapes are kept for components and control flow. Rules and derivations appear as displayed lines, with figures added only when the structure (a tree or circuit) carries meaning the line cannot.

### Cited Findings
- [R] Xu introduces constraints in running prose ("the form ¬X1 ∨ ¬X2 for all pairs of variables") and sets the definition as a labelled "Definition 1" followed by one centred equation. There is no box or shading. [Xu p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=2)
- [T] Axioms and propositions are run-in bold labels with one-line statements, e.g. "Axiom 1 (Monotonicity). If α |= β, then the semantic loss Ls(α,p) ≥ Ls(β,p) for any vector p." [Xu p.3](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=3)
- [R] Xu gives the same constraint in three registers on one page: a CNF formula inline, a DNF reading inline ("can be read as"), and the circuit pair as Figures 3 and 4. [Xu p.7](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=7)
- [R] Figures 3 and 4 share one layout and differ only in node labels (gates become + and ×, literals become Pr(literal)). [Xu p.7](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=7)
- [R] Ahmed's derivation is set as three rows of formulas in curly braces, joined by arrows labelled "expand", "eval." and "norm." There are no boxes. [Ahmed p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/ahmed-2023-pseudo-semantic-loss.pdf#page=6)
- [R] In the same figure the circuit's leaves show only A, ¬A, B, ¬B, ¬C and C. "Cat", "Dog" and "Animal" appear only in the caption. [Ahmed p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/ahmed-2023-pseudo-semantic-loss.pdf#page=6)
- [R] ELIZA states rule syntax as the data form itself, then explains its tokens in prose: "The '0' in the decomposition rule stands for 'an indefinite number of words'", while "the '3' in the reassembly rule indicates that the third component of the subject decomposition is to be inserted in its place". [ELIZA p.3](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=3)
- [R] ELIZA gives the key-list schema twice: as a displayed list with subscripts and vertical dots, then as Fig. 1, introduced as "A common pictorial representation of such a structure". [ELIZA p.3](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=3)
- [R] ELIZA's boxes appear only in Fig. 2, the control-flow diagram. No rule is ever boxed. [ELIZA p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=4)
- [R] ELIZA explains one compound rule as a numbered list of effects, (1) to (4), under the line "(you're = I'm ((0 I'm 0) (PRE (I AM 3) (=YOU))))". [ELIZA p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=6)
- [R] Rumelhart states the fact schema in the caption, in angle brackets with the relation vocabulary as a set, and draws no triples. The figure shows the structure they come from. Equations are centred and numbered (1)-(9). [Rumelhart p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/rumelhart-1986-backpropagation.pdf#page=2)
- [R] Sennrich's merge rules are typeset as a small unruled column list with arrows, and the labelled box-like element is the "Algorithm 1" header between rules, not a card. [Sennrich p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/sennrich-2016-bpe-rare-words.pdf#page=4)
- [R] Mikolov writes relations inline: '"Montreal":"Montreal Canadiens"::"Toronto":"Toronto Maple Leafs"' and 'vec("Russia") + vec("river")'. [Mikolov b p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-distributed-representations.pdf#page=2)
- [R] Two printed errors show how fragile inline logic is. Xu p.7 prints the CNF as "(x1 ∨ x2 ∨ x3) ∧ (¬x1 ∨ ¬x2) ∧ (¬x1 ∧ ¬x3) ∧ (¬x2 ∧ ¬x3)", with ∧ inside the last two clauses, whereas Appendix E on p.13 prints those clauses with ∨. [Xu p.7](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=7), [Xu p.13](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=13)
- [R] Appendix E's first encoding, "(¬x1 ∧ x2 ∧ x3) ∨ (x1 ∧ ¬x2 ∧ x3) ∨ (x1 ∧ x2 ∧ ¬x3)", is labelled exactly-one but as printed has two positive literals per term. [Xu p.13](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=13)

### Inferences
- The working rule across these papers: use notation for what is stated or derived, a shape for a component or a control decision, and a tree or circuit only when branching is the point.
- The p.7 ∧ is very likely a typo given the ∨ form on p.2 and p.13. The p.13 first encoding also looks wrong for exactly-one, compared with the correct DNF on p.7. These are my readings, not stated errata.

### Gaps
- No paper here uses a Horn rule in "head :- body" or inference-bar form, and none draws a proof tree over named predicates. There is no direct typesetting precedent in this set for the repo's `R-OTHER-DOMAIN` style of rule.

## How is an example shown going through a mechanism?

### Takeaway
Real-input traces exist but are rare, and the best one (ELIZA p.5, journal p.40) is typeset lines rather than a figure. Figures are mostly abstract schemas. Rumelhart Fig. 3 is the one figure here tracing a single named query through a trained system, and Sennrich Tables 4-5 trace real words across systems.

### Cited Findings
- [R] ELIZA, one input traced with a failure, as centred lines between prose: input "You are very helpful" becomes "I are very helpful". Rule "(0 I remind you of 0)" "fails to match", then "(0 I are 0)" matches, "decomposing it into the constituents (1) empty (2) I (3) are (4) very helpful." Then "(What makes you think I am 4)" yields "What makes you think I am very helpful." [ELIZA p.5](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=5)
- [R] ELIZA, the same device in its first use: "(1) It seems that (2) you (3) hate (4) me" with "only the second and fourth parts" understood. [ELIZA p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=2)
- [R] ELIZA, a class-tag match: "CONSIDER MY AGED MOTHER AS WELL AS ME" under "(0 YOUR 0 (/FAMILY) 0)" becomes "(1) CONSIDER (2) YOUR (3) AGED (4) MOTHER (5) AS WELL AS ME." [ELIZA p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=6)
- [R] ELIZA's numbered figures are both abstract: Fig. 1 uses only K, D and R symbols, and Fig. 2 uses W and P with no example. [ELIZA p.3](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=3), [ELIZA p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=4)
- [R] Rumelhart pairs structure and instance: Fig. 2 shows the facts, and Fig. 3 directly beneath shows one query (Colin, has-aunt), with white squares for activity and black dots on the two correct outputs. [Rumelhart p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/rumelhart-1986-backpropagation.pdf#page=2)
- [R] Ahmed traces one sample with real numbers but toy content: sample "abc", every intermediate probability printed, and values carried from the left derivation to the circuit's leaves (0.46, 0.54, 0.38, 0.62, 0.45, 0.55) up to the root 0.71. It is not a sentence. [Ahmed p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/ahmed-2023-pseudo-semantic-loss.pdf#page=6)
- [R] Sennrich's Tables 4-5 use rows for systems and one "sentence" column. Stages are chained inside a cell with arrows ("as|in|line situation → A|in|line-|Situation"; "asinine situation → UNK → asinine"), and a heavier rule separates the two source examples. [Sennrich p.9](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/sennrich-2016-bpe-rare-words.pdf#page=9)
- [R] Sennrich's Figure 1 is a real but toy derivation, with the input set named in the caption and the prose then applying it: "the OOV 'lower' would be segmented into 'low er·'". [Sennrich p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/sennrich-2016-bpe-rare-words.pdf#page=4)
- [R] Xu's Figure 1 is a schema with instance glyphs at the end: filled versus hollow dots, "1. Sake 2. Unagi 3. Ika", and a red path on a blue dashed grid. Figures 3 and 4 show no values, so nothing flows through them. [Xu p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=2), [Xu p.7](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=7)
- [R] Mikolov's architecture figures are pure schema (w(t), w(t-1) and so on). Example tables show inputs and outputs with nothing between. [Mikolov a p.5](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-word2vec-efficient-estimation.pdf#page=5), [Mikolov b p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-distributed-representations.pdf#page=2)
- [R] The user's note traces real sentences: "The cat sat on the mat" with "cat" as the ringed query and weights printed on the arcs (0.05, 0.10, 0.45, 0.08, 0.02, 0.30), followed by the "bank" minimal pair. It is the only source here that follows the same sentence across several mechanism panels. [Note p.1](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/NLP%20Transformer%20Note.pdf#page=1), [Note p.3](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/NLP%20Transformer%20Note.pdf#page=3)

### Inferences
- The printed weights in the note sum to 1.00 (my addition), so the arcs do read as a real distribution for one query. Whether they came from a trained model is not stated.
- ELIZA's trace is more useful than its figures because it shows a rule failing before one succeeds. A trace that shows only the winning path hides how the cascade works.
- My arithmetic on Ahmed Figure 2: the normalised conditionals check out against the printed joints (0.13/0.28 = 0.46, 0.13/0.34 = 0.38, 0.13/0.29 = 0.45), and 0.38 + 0.33 = 0.71 at the root. However, exact weighted counting of (A⟹C)∧(B⟹C) with those literal values gives 1 − 0.55 × (1 − 0.54 × 0.62) ≈ 0.63, not 0.71. The 0.84 node looks like a sum of overlapping branches. Treat this as a possible error in the figure, not a confirmed one, because I could not trace all the wiring at render resolution.

### Gaps
- No paper here traces a natural-language sentence through a fact base and rules. ELIZA is closest but has no fact base beyond tags, and Rumelhart has facts but no sentence or rule. The combination appears to be unprecedented within this set.

## What visual restraint do they show?

### Takeaway
Black hairlines, direct labels and captions that explain the encoding are the norm, and colour is rare and purposeful. Two claims in the brief need qualifying: serif type is not universal inside figures, and the older papers' monochrome probably reflects print limits rather than taste.

### Cited Findings
Colour counts are by eye from renders.

| Source and figure | Colour | Lines and type | Legend, cards | Annotation |
|---|---|---|---|---|
| [Xu p.7](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=7) Figs 3-4 | Black only | Hairlines, serif math labels | No legend, no cards | Node labels only, no values |
| [Xu p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=2) Fig 1 | Green, violet-blue, salmon, red, plus grey | Thin arrows, serif labels | No legend, square-cornered trapezoids | Labels inside shapes, instance beside each |
| [Xu p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/xu-2018-semantic-loss.pdf#page=4) Fig 2 | Red, blue, green, magenta boundary | Scatter plot | Has a rounded legend box | The one rounded box in Xu |
| [Ahmed p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/ahmed-2023-pseudo-semantic-loss.pdf#page=6) Fig 2 | Black, plus grey, magenta and pink for literals' values, dark indigo for computed values | Thin gates and wires, serif math | No legend, no cards | Values printed beside wires, tiny arrows to literals |
| [Ahmed p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/ahmed-2023-pseudo-semantic-loss.pdf#page=2) Fig 1 | Black, pink fill, grey curve, red × | Thin axes | No legend: the caption words "pink" and "gray" are set in those colours | m(α) bracket under the axis |
| [ELIZA p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/weizenbaum-1966-eliza.pdf#page=4) Figs 1-2 | Monochrome print | Thin lines, typed sans capitals in Fig 2 | No legend, stadium decisions in Fig 2 | YES/NO on lines |
| [Rumelhart p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/rumelhart-1986-backpropagation.pdf#page=2) Figs 1-3 | Monochrome | Thin lines, sans labels, serif captions | No legend, caption explains encoding | Weights on arcs, biases in nodes, names as nodes |
| [Sennrich p.9](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/sennrich-2016-bpe-rare-words.pdf#page=9) Tables 4-5 and Fig 1 | Black only | Few rules, one heavier group rule | No legend, caption defines "\|" | Marker inside the text |
| [Sennrich p.8](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/sennrich-2016-bpe-rare-words.pdf#page=8) Figs 2-3 | Orange, red, black, blue dashes | Data plots | Inset legends present | Data plots, not symbolic |
| [Mikolov b p.4](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-distributed-representations.pdf#page=4) Fig 2 | Red crosses, grey dashed arrows | Thin, sans title, gnuplot axes | No legend | Every point labelled directly |
| [Mikolov a p.5](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-word2vec-efficient-estimation.pdf#page=5) Fig 1 | Black only | Thin, sans labels, bold panel names | No legend | Column heads INPUT, PROJECTION, OUTPUT |
| [Note p.1](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/NLP%20Transformer%20Note.pdf#page=1) images | Dark brown ground, five or more node hues, gold arcs, glow | Monospaced labels | No legend, rounded panels in later images | Weights on arcs; opposite of the papers' restraint |

- [R] Grouping in tables is done with rule weight alone: a thick vertical bar between analogies in Mikolov b Table 2, and double verticals in Mikolov a Tables 1 and 8. [Mikolov b p.6](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-distributed-representations.pdf#page=6), [Mikolov a p.10](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/mikolov-2013-word2vec-efficient-estimation.pdf#page=10)
- [R] Rumelhart's "=" for marriage in Fig. 2 is never defined, and size-coded squares in Figs 3-4 are explained only in the caption. Captions of 10-plus lines carry the reading instructions. [Rumelhart p.2](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/rumelhart-1986-backpropagation.pdf#page=2), [Rumelhart p.3](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/rumelhart-1986-backpropagation.pdf#page=3)
- [R] For contrast, the repo's current figure has a title and two-item legend inside the image, rounded cards and ellipses, sans type, and teal, blue, red and purple fills. It does already put predicates and the proof in monospace. [fig-civil-law-kb.png](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/images/fig-civil-law-kb.png)

### Inferences
- Serif inside the figure appears where the drawing shares the paper's LaTeX math (Xu, Ahmed). Rumelhart, ELIZA and Mikolov use sans inside figures under serif captions. The convention that holds is not "all serif" but "the figure's symbols match the paper's math".
- Monochrome in the 1966 and 1986 papers was probably dictated by print. Those papers show that monochrome is sufficient, not that their authors chose it.
- Legends in this set go with data plots with many series (Xu Fig 2, Sennrich Figs 2-3). No structural or symbolic figure has one.
- Ahmed Figure 2's wiring was hard to follow even at 200 dpi, and Xu Figure 3 has crossing edges with just three variables. Drawn circuits scale badly. This is my reading experience, not something the authors state.

### Gaps
- Exact line weights and font names inside figures were judged by eye. I did not measure strokes or extract figure fonts, and the scanned papers would not allow it.

## What could a figure tracing one civil-law sentence through a KB borrow?

### Takeaway
Borrow ELIZA's numbered constituents and its visible rule failure, Rumelhart's pairing of fact structure with one lit-up query, Ahmed's labelled arrows and value-binding colour, and Sennrich's inline boundary marker and table-as-trace. Don't borrow circuits or ELIZA's reassembly, neither of which matches what this KB does.

### Cited Findings
The repo facts these takeaways rely on:
- The corpus sentence is "the claimant is the person who brings a claim", and its counterpart is "the defendant is the person who answers a claim". [corpus.ts L23-24](file:///Users/nedpham/Projects/neural_symbolic_nlp/src/routes/train-embed/corpus.ts)
- `R-OTHER-DOMAIN` derives `not_defined_by(?x, ?v)` from `is_a(?x, ?c)`, `disjoint(?c, ?d)` and `class_verb(?d, ?v)`. [symbolic.ts L73-79](file:///Users/nedpham/Projects/neural_symbolic_nlp/src/routes/neural-symbolic/symbolic.ts)
- The current figure already shows the checks as an ordered cascade, gives the proof of `not_defined_by(claimant, owns)`, and separates "measured / implemented" from "specified, not built". [fig-civil-law-kb.png](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/images/fig-civil-law-kb.png)

### Inferences
These are recommendations, each tied to the precedent it comes from.

1. **Number the constituents under the real sentence (ELIZA journal pp.37, 40, 41; PDF pp.2, 5, 6).** Put one line of source text, then the same words with numbered slots, then the frame in rule form. Bindings can refer to slot numbers, as ELIZA's "3" does. This replaces a "text card plus arrow plus frame card" layout.
2. **Show the rules that fail (ELIZA journal p.40, PDF p.5).** ELIZA reports "fails to match" before the success. The cascade here has the same shape: for `owns`, `defined_by` fails, the counterpart check fails, then `R-OTHER-DOMAIN` succeeds. Greying the failures would make the order visible on the instance itself, so the ellipse flowchart may become unnecessary.
3. **Trace as lines, draw only what branches.** An illustrative sketch of mine, not taken from any paper. The first lines use real corpus and KB terms, and the slot layout should be checked against the code before use:

   ```
   input    the claimant is the person who ___                 corpus.ts L23
   frame    (1) the  (2) claimant  (3) is the person who  (4) ___
   bind     x = (2) claimant        v = owns (candidate for slot 4)
   try      defined_by(claimant, owns)                         no match
            counterpart(claimant, defendant),
              defined_by(defendant, owns)                      no match
            is_a(claimant, court_party),
              disjoint(court_party, housing_party),
              class_verb(housing_party, owns)                  R-OTHER-DOMAIN
   derive   not_defined_by(claimant, owns)
   ```
4. **Pair the fact base with one lit query (Rumelhart Figs 2-3).** Use a quiet panel with the whole structure, then the same layout again with only the facts used by this query marked. The caption names the query and the answer, as "representing Colin ... 'has-aunt'" does. Keeping the two panels in identical layout follows Xu Figs 3-4.
5. **State the fact schema once, in notation (Rumelhart's caption; Mikolov a Table 8).** Draw the role-and-class structure, and give the triple form and relation vocabulary in the caption. Where facts must be listed, Table 8's format of one row per relation with "x: y" cells is much denser than one card per fact.
6. **Use labelled arrows as the stage structure (Ahmed Figure 2).** Short verbs above thin arrows ("match", "bind", "chain", "ban") can stand in for headed panels. Ahmed's three words carry the whole left half of its figure.
7. **Spend colour on one thing only (Ahmed Figures 1-2).** Give the banned verb one accent wherever it appears: the slot, `class_verb`, the derived fact and the mask outcome. Ahmed's colour binds one value across panels, and it does not encode categories. A caption word set in that colour can replace the legend, as Ahmed's "pink" and "gray" do.
8. **Use a single boundary glyph in the text (Sennrich Tables 4-5).** "|" is defined once in the caption and needs no drawn overlay. The same device could mark frame boundaries in the sentence: `the claimant | is the person who | ___`.
9. **Contrast two candidates in a table-as-trace if the figure must stay small (Sennrich Tables 4-5).** Rows are stages and columns are candidates (`brings`, `answers`, `owns`), with a heavier rule between groups and arrows inside cells. It is the same trace with three outcomes.
10. **Keep the minimal pair (the user's note, '"bank" ≠ "bank"').** Two near-identical sentences, or one frame with two verbs, show the point in a way one trace cannot. This is the one thing worth taking from the note, since its visual style is the opposite of what the papers do.
11. **Put reading instructions in the caption (Rumelhart, Ahmed).** Those captions carry the encoding and step order, which lets the drawing lose its title, legend and explanatory sentences. The current figure's in-image title and "Forward chaining: ..." sentence could move there.
12. **Print every intermediate value only if it has been checked (Ahmed Figure 2, Xu p.7).** Both papers show errors or possible errors in small printed logic and numbers. Generating lines from `symbolic.ts`, as `make_kb_figure.py` already does for facts, avoids this kind of slip.

**Limits and what not to borrow**
- ELIZA's "frame" analogy is only partial. ELIZA picks rules by keyword rank and reassembles an output sentence, while this KB decides whether a next word is permitted. Nothing is reassembled, so a "reassembly" stage would misdescribe it: the derived ban is the right final line.
- Avoid a circuit in the style of Xu or Ahmed unless a compiled circuit actually exists, since no paper here uses that drawing for anything but a compiled constraint. The current indented proof reads more easily and is already a derivation tree in notation.
- Avoid Xu Figure 1's network-into-trapezoids form. It introduces constraint types but traces nothing.
- Restraint should not remove the status distinction. "Specified, not built" is honest content in the current figure, and if the legend goes, it should stay as a direct label on the unconnected part, such as a dashed rule with those words.

### Gaps
- None of these papers tests whether readers follow a line-based trace better than a boxed one, so these recommendations rest on observed convention rather than evidence of comprehension.
- Web search was not used. The PDFs answered the questions, apart from the unverifiable points flagged above.
