# Templated natural-language reasoning datasets as models for a tiny raw-text reasoning corpus

Scope note: the target model has about 100 word-level tokens of vocabulary, a 32-token context and about 4-5k training tokens. All token counts marked "my count" were made by splitting the quoted text into words and the punctuation marks `. ? : [ ]`. They are estimates, not figures from the sources.

---

## 1. bAbI (Weston et al., 2015): which tasks involve deduction, induction, counting, yes/no and path finding; examples, vocabulary, licence

### Takeaway
bAbI is the closest match to the target scale. It has about 150 words in total and "typically 4 actors, 6 locations and 3 objects used per task". Each item is a short story of one-clause sentences, then a question, then a one-word answer. Tasks 6 (yes/no), 7 (counting), 9 (negation), 10 (indefinite "maybe"), 15 (deduction), 16 (induction), 18 (size/transitivity) and 19 (path finding) are the reasoning-relevant ones. The data is CC BY 3.0, so it may be copied with attribution. Because the sentences are so templated, imitating them is easy and avoids attribution issues altogether.

### Cited Findings
- The 20 tasks are: 1 Single Supporting Fact, 2 Two Supporting Facts, 3 Three Supporting Facts, 4 Two Argument Relations, 5 Three Argument Relations, 6 Yes/No Questions, 7 Counting, 8 Lists/Sets, 9 Simple Negation, 10 Indefinite Knowledge, 11 Basic Coreference, 12 Conjunction, 13 Compound Coreference, 14 Time Reasoning, 15 Basic Deduction, 16 Basic Induction, 17 Positional Reasoning, 18 Size Reasoning, 19 Path Finding, 20 Agent's Motivations. — [Weston et al. 2015, Tables 1-2](https://arxiv.org/abs/1502.05698)
- Verbatim examples from Tables 1-2, with the answer after "A:". Source for all of these: [Weston et al. 2015](https://arxiv.org/abs/1502.05698)
  - **Task 1 (single supporting fact):** "Mary went to the bathroom. John moved to the hallway. Mary travelled to the office. Where is Mary? A:office"
  - **Task 6 (yes/no):** "John moved to the playground. Daniel went to the bathroom. John went back to the hallway. Is John in the playground? A:no / Is Daniel in the bathroom? A:yes"
  - **Task 7 (counting):** "Daniel picked up the football. Daniel dropped the football. Daniel got the milk. Daniel took the apple. How many objects is Daniel holding? A: two"
  - **Task 9 (simple negation):** "Sandra travelled to the office. Fred is no longer in the office. Is Fred in the office? A:no / Is Sandra in the office? A:yes"
  - **Task 10 (indefinite knowledge):** "John is either in the classroom or the playground. Sandra is in the garden. Is John in the classroom? A:maybe / Is John in the office? A:no"
  - **Task 15 (basic deduction):** "Sheep are afraid of wolves. Cats are afraid of dogs. Mice are afraid of cats. Gertrude is a sheep. What is Gertrude afraid of? A:wolves"
  - **Task 16 (basic induction):** "Lily is a swan. Lily is white. Bernhard is green. Greg is a swan. What color is Greg? A:white"
  - **Task 17 (positional):** "The triangle is to the right of the blue square. The red square is on top of the blue square. The red sphere is to the right of the blue square. Is the red sphere to the right of the blue square? A:yes"
  - **Task 18 (size):** "The football fits in the suitcase. The suitcase fits in the cupboard. The box is smaller than the football. Will the box fit in the suitcase? A:yes / Will the cupboard fit in the box? A:no"
  - **Task 19 (path finding):** "The kitchen is north of the hallway. The bathroom is west of the bedroom. The den is east of the hallway. The office is south of the bedroom. How do you go from den to kitchen? A: west, north"
  - **Task 20 (motivations):** "John is hungry. John goes to the kitchen. John grabbed the apple there. Daniel is hungry. Where does Daniel go? A:kitchen / Why did John go to the kitchen? A:hungry"
- The paper describes task 15 as testing "basic deduction via inheritance of properties". Task 16 "similarly tests basic induction via inheritance of properties". Task 19 "effectively involves a search problem". — [Weston et al. 2015](https://arxiv.org/abs/1502.05698)
- Task 9 tests negation in its simplest form: a supporting fact that makes a statement false ("Fred is no longer in the office"). Task 6 is a prerequisite for it. Task 10 tests statements that describe possibilities, where the answer is "maybe". — [Weston et al. 2015](https://arxiv.org/abs/1502.05698)
- Generation:
  - The data comes from a simulation that "behaves like a classic text adventure game". The actions are go, get, get from, put in/on, give, drop, set, look, inventory and examine.
  - Commands such as "joe go playground; bob go office; joe get football" are rendered by "a simple automated grammar". Each verb gets synonyms: get becomes "picked up, got, grabbed or took", and drop becomes "dropped, left, discarded or put down".
  - Questions are answered from the true world state.
  — [Weston et al. 2015 §4](https://arxiv.org/abs/1502.05698)
- Vocabulary: "the entities and the vocabulary size is small (150 words, and typically 4 actors, 6 locations and 3 objects used per task)". The authors also say "all sentences are so far relatively short and contain little nesting". — [Weston et al. 2015 §4](https://arxiv.org/abs/1502.05698)
- Size: the paper uses "1000 questions for training, and 1000 for testing" per task. Hugging Face also provides `en-10k` with 10,000 training examples, plus Hindi (`hn`) and letter-shuffled (`shuffled`) variants. — [Weston et al. 2015](https://arxiv.org/abs/1502.05698); [HF facebook/babi_qa](https://huggingface.co/datasets/facebook/babi_qa)
- Licence: the Hugging Face card states "Creative Commons Attribution 3.0 License" (cc-by-3.0). The GitHub generator repo's LICENSE.md is a "BSD License ... For bAbI tasks software". — [HF facebook/babi_qa](https://huggingface.co/datasets/facebook/babi_qa); [facebookarchive/bAbI-tasks LICENSE.md](https://github.com/facebookarchive/bAbI-tasks)

### Inferences
- **Fit to the 32-token context (my counts):**
  - The Task 1 example is 23 tokens with 14 distinct word types.
  - The Task 15 example is 30 tokens with 14 types.
  - Both fit in 32 tokens, but only with stories of 3-4 sentences. Full bAbI stories can be longer, so stories would need truncating to the 2-3 sentences that matter.
- **Vocabulary:** the 150-word total vocabulary is over the 100-token budget. A single task's vocabulary (4 actors + 6 locations + 3 objects + a few verbs) is well under it. Choose a subset of tasks and drop the verb-synonym variation, which wastes vocabulary on a tiny model.
- **Parseability:** every bAbI sentence maps to one predicate, for example `at(Mary, office)`, `afraid_of(sheep, wolves)`, `isa(Gertrude, sheep)` or `north_of(kitchen, hallway)`. That makes bAbI-style sentences directly parseable into triples. Avoid the coreference tasks (11, 13) and synonym verbs, because they break the one-surface-form-per-predicate property a verifier needs.
- **Reasoning content:** Tasks 9 and 10 give a ready-made pattern for three answer values (yes / no / maybe). This is a minimal "critical thinking" signal: the answer can be "not known".
- **Tasks to avoid:** Task 16 (induction) is not logically valid. It generalises from one swan to all swans. If the corpus is meant to teach sound reasoning, induction items should be labelled as "likely" rather than certain, or left out.

### Gaps
- The on-disk raw-file format was not verified in this session. My recollection is numbered lines, then "question<TAB>answer<TAB>supporting-fact line ids".
- The paper gives no per-task vocabulary counts. The only figures found are the overall 150 words and the 4/6/3 entities.

---

## 2. RuleTaker / ProofWriter (Clark, Tafjord, Richardson 2020; Tafjord, Dalvi, Clark 2021): how facts, rules, negation-as-failure, CWA/OWA, proofs and depth are written

### Takeaway
RuleTaker/ProofWriter is the best model of a verifier-parseable corpus. Every fact sentence has a published "(arg1 rel arg2 polarity)" representation. Rules use only three English templates with one variable. Answers are True/False under the CWA, or True/False/Unknown under the OWA. Each question carries a proof depth. Whole theories (1-16 facts and 1-9 rules) are far too long for a 32-token context, so each item would have to be cut down to roughly 2-4 sentences.

### Cited Findings
- **Item structure:** each example is a triple (context, statement, answer). The context is facts + rules, and the answer is T if the statement "deductively follows" or F "if it does not (false under a closed-world assumption, CWA)". — [Clark et al. 2020 §3](https://arxiv.org/abs/2002.05867)
- **Verbatim RuleTaker example (Figure 1, attributes only, no negation):** "Alan is blue. Alan is rough. Alan is young. Bob is big. Bob is round. Charlie is big. Charlie is blue. Charlie is green. Dave is green. Dave is rough. Big people are rough. If someone is young and round then they are kind. If someone is round and big then they are blue. All rough people are green. Q1: Bob is green. True/false? [Answer: T] Q2: Bob is kind. True/false? [F] Q3: Dave is blue. True/false? [F]". The paper gives the reasoning as: "Bob is big, therefore rough (rule1) therefore green (rule4)". — [Clark et al. 2020 Fig. 1](https://arxiv.org/abs/2002.05867)
- **Verbatim example with relations and "not" (Figure 3):** "The bald eagle does not eat the dog. The cat chases the dog. The cat eats the bald eagle. The cat is nice. The cat likes the dog. The cat likes the rabbit. The dog is furry. The rabbit chases the bald eagle. The rabbit eats the bald eagle. If someone does not eat the cat then they do not eat the dog. If someone likes the bald eagle then they do not like the rabbit. If someone eats the bald eagle and they do not eat the rabbit then they are furry. If someone is furry then they like the cat. Q1. The bald eagle likes the cat. True/false? [F] Q2. The rabbit likes the cat. True/false? [T] Q3. The bald eagle is furry. True/false? [F]". — [Clark et al. 2020 Fig. 3](https://arxiv.org/abs/2002.05867)
- **Formal language:**
  - There are two fact types: attributes `is(e, a)`, e.g. `is(Alan,Big)`, and relations `r(e1, e2)`, e.g. `eats(Dog,Rabbit)`.
  - Rules have the form "condition [∧ condition]* → conclusion" with at most one variable, "implicitly universally quantified".
  - Example: "If someone is young and round then they are kind" = `is(?X,Young) ∧ is(?X,Round) → is(?X,Kind)`.
  - With 20% probability the first argument is an entity, which gives fully grounded rules.
  — [Clark et al. 2020 §3.2](https://arxiv.org/abs/2002.05867)
- **Vocabulary pools:**
  - Type 1 uses only `is()`, with 4 entities and 7 attributes "drawn randomly from pools of 10 names and 14 attributes".
  - Type 2 uses `is()` plus 3 relation predicates (likes, chases, ...), 4 entities (Cat, Dog, BaldEagle, ...) and 5 attributes, "drawn randomly from pools of size 6, 10, and 10".
  - Each theory has "1-16 facts and 1-9 rules".
  - Each dataset has 100k examples (25k for each combination of Type and with/without negation), split 70/10/20.
  — [Clark et al. 2020 §3.2](https://arxiv.org/abs/2002.05867)
- **English templates:** there are only three, chosen at random per rule: "If condition [and condition]* then conclusion.", "All attribute* people|things are attribute.", and "attribute* people|things are attribute." Pronouns are added for fluency. — [Clark et al. 2020 §3.4](https://arxiv.org/abs/2002.05867)
- **Negation as failure:**
  - "Negations in the rules' conditions are treated as negation as failure (NAF)". Rulebases must be stratified, and "inconsistent and unstratified rulebases are discarded".
  - Inference finds the "minimal, supported answer set".
  — [Clark et al. 2020 §3.3](https://arxiv.org/abs/2002.05867)
- **Question generation and depth:**
  - True questions are inferred facts, one at each depth from 0 to the target depth.
  - Each true question gets a false counterpart made by negating a conclusion proven at the same depth.
  - Unproven facts are false under the CWA. Half of those are "flipped by negating the fact and changing the label to true (i.e., 'f ? False' becomes 'Not f ? True')".
  - So a depth-d theory has "(up to) 4(d+1) questions, with an equal balance of true and false answers".
  - Depth is "the depth of the shallowest proof tree". D=0 is "simple lookup". There are datasets for D=0, D≤1, D≤2, D≤3 and DMax (≤5).
  — [Clark et al. 2020 §3.1, §3.4](https://arxiv.org/abs/2002.05867)
- **ProofWriter semantics (CWA vs OWA):**
  - The CWA version "uses negation as failure (NAF), so that any fact not provable is assumed false. Under this semantics, negated facts and negative rule conclusions are not allowed (redundant under the CWA)."
  - The OWA version "does allow negative facts and rule conclusions. Under this semantics, a third truth value Unknown is also possible."
  — [Tafjord et al. 2021 §3.2](https://arxiv.org/abs/2012.13048)
- **The dataset README says:**
  - In OWA, "negative rule conditions [are] treated as hard negation, rather than negation-as-failure NAF ... questions without a proof has the answer 'Unknown'".
  - Directories: `depth-N` (N=0,1,2,3,5), `birds-electricity`, `NatLang` (ParaRules), `depth-3ext`, `depth-3ext-NatLang`.
  - Files: `meta-*.jsonl` (main), `meta-stage-*.jsonl` (one depth-1 implication added at a time) and `meta-abduct-*.jsonl` (missing facts).
  — [ProofWriter dataset README, in proofwriter-dataset-V2020.12.3.zip](https://aristo-data-public.s3.amazonaws.com/proofwriter/proofwriter-dataset-V2020.12.3.zip) (landing page [allenai.org/data/proofwriter](https://allenai.org/data/proofwriter))
- **Each fact has a triple representation.** This is the most directly relevant finding for a verifier. A verbatim excerpt from the README sample entry `RelNeg-OWA-D2-1717`:
  - "triple1":{"text":"The cow is big.","representation":"(\"cow\" \"is\" \"big\" \"+\")"}
  - "rule3":{"text":"If something is big then it chases the dog.","representation":"(((\"something\" \"is\" \"big\" \"+\")) -> (\"something\" \"chases\" \"dog\" \"+\"))"}
  - Q2: "The dog does not see the rabbit.", answer false, QDep 0, strategy "inv-proof"
  - Q3: "The cow chases the dog.", answer true, QDep 1, proofs "[(((triple1) -> rule3))]"
  - Q8: "The cow is red.", answer "Unknown", QDep 0, strategy "random"
  - Q9: "The rabbit is not blue.", answer "Unknown"

  The README says the representation is "(arg1 rel arg2 polarity)" where "rel is set to 'is' for attributes, and polarity is '+' or '-'". In rule left-hand sides "a negative polarity is represented as '~', which is interpreted as negation as failure (NAF) in the CWA theories". Question strategies are "proof"/"inv-proof", "rconc"/"inv-rconc" (an unproven rule conclusion) and "random"/"inv-random". — [ProofWriter README](https://aristo-data-public.s3.amazonaws.com/proofwriter/proofwriter-dataset-V2020.12.3.zip)
- **Proof linearisation:**
  - Facts and rules are labelled sent1, sent2, .... In the paper's notation, fact identifiers are fact*, naf* ("facts not in the context and assumed false") and conc*.
  - "%" joins a rule to its conclusion, "&" joins conditions, "#" means "←", and the whole proof is written in Polish notation.
  - Example: "# rule1%conc1 & fact1 fact2". A 3-step proof: "# rule18%conc1 & fact5 # rule12%conc2 # rule11%conc3 fact16 ; with conc1: Charlie is quiet. ; conc2: Charlie is young. ; conc3: Charlie is kind."
  - A depth-0 proof is just the fact itself. When there is no proof, "None" is used.
  — [Tafjord et al. 2021 §3.4](https://arxiv.org/abs/2012.13048)
- **Verbatim OWA proof with "not" (Appendix D.1), excerpt:** "$question$ = The lion is not nice? ; $context$ = sent1: The tiger chases the lion. sent2: The lion is not big. ... sent7: If something visits the tiger and the tiger is not red then it is not nice. sent8: If something chases the dog then it is not red. ... sent16: The lion visits the tiger. sent17: If something chases the lion and it visits the dog then it chases the dog. ... sent19: If something chases the lion then it is big." Output: "$answer$ = True ; $proof$ = # sent7@int1 & sent16 # sent8@int2 # sent17@int3 & sent1 # sent5@int4 # sent19@int5 sent1 ; with int1: The lion is not nice. ; int2: The tiger is not red. ; int3: The tiger chases the dog. ; int4: The tiger visits the dog. ; int5: The tiger is big." — [Tafjord et al. 2021 App. D.1](https://arxiv.org/abs/2012.13048)
- **Abduction format (Appendix D.5):** "$question$ = Dave is rough. ; $context$ = triple1: Anne is white. triple2: Charlie is young. triple3: Dave is round. triple4: Erin is quiet. rule1: If someone is rough and young then they are blue. rule2: Rough, white people are smart. rule3: All smart people are rough. rule4: All white people are smart. rule5: If someone is young then they are smart. rule6: All smart people are rough." Output: "$answer$ = Dave is young. , Dave is smart." — [Tafjord et al. 2021 App. D.5](https://arxiv.org/abs/2012.13048)
- **Size:** "The number of implications per theory can reach 20 and above, and the proof depths go up to 10". The D5 example theory above has 20 sentences. — [Tafjord et al. 2021 App. A](https://arxiv.org/abs/2012.13048)
- **ParaRules (crowd-paraphrased) breaks the 1:1 sentence-to-triple mapping.** For example, "Bob has been blue because he's green with envy." maps to both triple1 (Bob is green) and triple2 (Bob is blue) through a `mappings` field. — [ProofWriter README](https://aristo-data-public.s3.amazonaws.com/proofwriter/proofwriter-dataset-V2020.12.3.zip); [Clark et al. 2020 Fig. 7](https://arxiv.org/abs/2002.05867)
- **Hugging Face mirror sample row (`AttNoneg-OWA-D0-3321`):** theory "Bob is furry. Dave is quiet. Harry is big. Rough things are white. All rough things are white.", question "Bob is furry.", answer True, QDep 0. The card gives no licence ("[More Information needed]"). — [HF tasksource/proofwriter](https://huggingface.co/datasets/tasksource/proofwriter)

### Inferences
- **Fit to the target scale (my counts):**
  - RuleTaker Figure 1 plus one question is about 80 tokens, using only 24 distinct word types.
  - The vocabulary is small enough. The length is about 2.5 times the 32-token context.
  - To fit, a corpus item should be a micro-theory, for example "Bob is big. Big things are rough. Bob is rough? true" (about 12 tokens). That allows depth 1-2 at most per 32-token window.
- **What to copy as a design:**
  - The `(arg rel arg polarity)` triple with an explicit "not" token is exactly what a symbolic verifier needs.
  - The three rule templates ("If someone is A then they are B.", "All A things are B.", "A things are B.") are a good, minimal rule grammar.
  - Explicit three-valued answers (true / false / unknown) carry the "critical thinking" signal: the model has to learn that an unstated fact is not automatically false.
- **CWA vs OWA:** pick one assumption and keep it fixed across the corpus. Mixing them gives contradictory labels for the same text. RuleTaker CWA says "The cow is red" is False; ProofWriter OWA says it is Unknown.
- **Label balance:** the "flipping" trick ("f ? False" → "Not f ? True") keeps true and false labels balanced. Without it, a small model can learn "negated question → false" as a shortcut.
- **Proof format:** the Polish-notation proof strings (#, %, &, sent7@int1) would use many vocabulary slots on identifiers. For a 100-token vocabulary, a ProntoQA-style natural-language chain (see section 3) is cheaper.

### Gaps
- No primary-source licence statement was found for RuleTaker/ProofWriter. The dataset README contains no licence text. The landing page redirects straight to the zip. A secondary source (the ALERT paper's appendix) lists ProofWriter as "CC BY" — [ALERT, Yu et al. 2022](https://arxiv.org/pdf/2212.08286). This is unconfirmed by AllenAI.

---

## 3. ProntoQA (Saparov and He, 2022/2023): ontology-based generation, "every X is a Y", and a chain-of-thought example

### Takeaway
ProntoQA generates a linear "is-a" ontology and walks up it with modus ponens. It renders each edge as "Every X is a Y." / "Each X is a Y." / "Xs are Ys.", and writes the chain of thought as alternating rule-restatements and conclusions. It was designed so that every sentence "can be easily and uniquely parsed" back to logic. That makes it the best template for a corpus with verifiable chain-of-thought. A 1-hop item fits in 32 tokens; a 3-hop item does not.

### Cited Findings
- **Verbatim example with chain of thought (Figure 1):** "Q: Each cat is a carnivore. Every carnivore is not herbivorous. Carnivores are mammals. All mammals are warm-blooded. Mammals are vertebrates. Every vertebrate is an animal. Animals are multicellular. Fae is a cat. True or false: Fae is not herbivorous. A: Fae is a cat. Cats are carnivores. Fae is a carnivore. Every carnivore is not herbivorous. Fae is not herbivorous. True". The paper labels the parts context / query / chain-of-thought / label. — [Saparov & He 2023 Fig. 1](https://arxiv.org/abs/2210.01240)
- **Only modus ponens is used:** "we only consider questions that are answerable using repeated applications of the modus ponens deduction rule": from ∀x(f(x) → g(x)) and f(a), conclude g(a). — [Saparov & He 2023 §3](https://arxiv.org/abs/2210.01240)
- **Pipeline:** "(1) first generate an ontology from a set of concepts, (2) generate a proof by traversing the ontology, (3) translate the ontology into the natural language context, and (4) translate the proof into the query, CoT, and label".
  - Ontologies are "linear (i.e., in the tree, every node has exactly 0 or 1 child nodes)" and have 3 to 10 concepts.
  - Proofs start from a random node with an axiom such as cat(fae), then "walk up the tree".
  — [Saparov & He 2023 §3](https://arxiv.org/abs/2210.01240)
- **Grammar:**
  - "Every edge in the ontology is converted into sentences such as 'All cats are carnivores' or 'Every cat is a carnivore.' Properties of nodes are also converted into sentences of the form 'All mammals are not cold-blooded'".
  - With probability 0.5 the query asks whether the conclusion is true or whether its negation is false.
  - The CoT is made "by translating the conclusion of each proof step into a CoT sentence".
  — [Saparov & He 2023 §3](https://arxiv.org/abs/2210.01240)
- **Built to be parsed back:** "Each example is translated from a proof and ontology such that the inverse process is simple: the sentences in an example can be easily and uniquely parsed into symbolic logical forms". The authors parse predicted CoT "via recursive-descent" parsing to grade each proof step. — [Saparov & He 2023 §3-4](https://arxiv.org/abs/2210.01240)
- **Fictional ontology, verbatim (Appendix A.3, 5 hops):** "Q: Every vumpus is a numpus. Each vumpus is dull. Dumpuses are vumpuses. Every dumpus is not hot. Every impus is a dumpus. Impuses are brown. Wumpuses are impuses. Wumpuses are opaque. Tumpuses are wumpuses. Tumpuses are small. Every yumpus is hot. Zumpuses are tumpuses. Zumpuses are feisty. Rompuses are zumpuses. Every rompus is not kind. Each jompus is a rompus. Jompuses are sour. Alex is a zumpus. True or false: Alex is hot." Expected answer: "Alex is a zumpus. Zumpuses are tumpuses. Alex is a tumpus. Tumpuses are wumpuses. Alex is a wumpus. Wumpuses are impuses. Alex is an impus. Every impus is a dumpus. Alex is a dumpus. Every dumpus is not hot. Alex is not hot. False" — [Saparov & He 2023 App. A.3](https://arxiv.org/abs/2210.01240)
- **Ontology types:** "fictional" uses made-up names ("wumpus" instead of "cat"); "true" uses real concept names consistent with the world; "false" uses real names with a randomly generated, non-factual tree. Hops tested were 1, 3 and 5. Sentence ordering is top-down (preorder) or bottom-up (postorder). — [Saparov & He 2023 §5.1](https://arxiv.org/abs/2210.01240); repo flags `--ontology [fictional|true|false]`, `--min-hops`, `--max-hops`, `--ordering [postorder|preorder|random]` — [asaparov/prontoqa](https://github.com/asaparov/prontoqa)
- **Distractors are needed:** without them "InstructGPT is able to predict the 'true'/'false' label almost perfectly", because the queried property appears exactly once in the context. The fix adds "a novel concept that is disconnected from the ontology tree" carrying the negated queried property, e.g. "Every insect is not a vertebrate." — [Saparov & He 2023 App. A.2](https://arxiv.org/abs/2210.01240)
- **Licence:** the repository is Apache-2.0. — [asaparov/prontoqa](https://github.com/asaparov/prontoqa)

### Inferences
- **Fit to the target scale (my counts):**
  - The Fae example (context + query + CoT + label) is about 75 tokens with 26 distinct types, more than twice the 32-token context.
  - A 1-hop item fits: "Every cat is a mammal. Tom is a cat. True or false: Tom is a mammal. Tom is a cat. Every cat is a mammal. Tom is a mammal. True" is about 30 tokens.
  - So for this model, ProntoQA's design should be used at 1 hop per window (2 hops with a shorter CoT).
- **Fictional names:** made-up names ("wumpus") exist to stop a pretrained LLM from using world knowledge. A from-scratch model has no prior knowledge, so real words such as cat, dog and bird work equally well and cost no extra vocabulary. Each fictional word is one more vocabulary slot.
- **Chain-of-thought pattern:** "X is a A. Every A is a B. X is a B." repeats the rule before stating the conclusion. That makes each step locally checkable: a verifier needs only the previous 2 sentences. This suits a short context.
- **Shortcuts:** the distractor lesson applies directly. If the queried property appears only in the relevant rule, a tiny model will learn string matching instead of the chain. Add one disconnected distractor rule that mentions the same property with the opposite polarity.
- **Negation:** "Every X is not Y" gives a negative property without changing the grammar. A verifier can parse it as `(X is Y -)` in ProofWriter's notation.

### Gaps
- The 2023 follow-up (Saparov et al., "Testing the General Deductive Reasoning Capacity of LLMs Using OOD Examples", PrOntoQA-OOD, with and-introduction, or-elimination, proof by contradiction and so on) was not fetched in this session. Its templates for contradiction and case-analysis steps are not covered here.
- No Hugging Face card with sample rows or a separate data licence was checked. Apache-2.0 applies to the generator code.

---

## 4. CLUTRR, LogicNLI, FOLIO, EntailmentBank: format, and whether each is too complex for a tiny model

### Takeaway
- **CLUTRR** (kinship, crowd-paraphrased) and **FOLIO** (expert-written, real-world first-order logic) are too lexically rich for about 100 tokens.
- **LogicNLI** has a useful four-way label scheme (entailment / contradiction / neutral / paradox), but its instances average roughly 180+ length units, with 15 facts+rules.
- **EntailmentBank** is grade-school science with a large vocabulary. Its "sent2 & sent5 -> int1: ...; sent4 & int1 -> hypot" tree notation is worth imitating.
- None should be copied directly. CLUTRR's noise taxonomy and LogicNLI's "paradox" label are the most useful ideas to borrow.

### Cited Findings
- **CLUTRR (Sinha et al. 2019):**
  - **Idea:** "given the facts that 'Alice is Bob's mother' and 'Jim is Alice's father', one can infer with reasonable certainty that 'Jim is Bob's grandfather.'" — [Sinha et al. 2019](https://arxiv.org/abs/1908.06177)
  - **Generation:** stories are generated from kinship rules and then "paraphras[ed] using Amazon Mechanical Turk" for k = 1, 2, 3 supporting facts. Longer stories are composed from these templates. The query is a pair of entities, not a natural-language question. — [Sinha et al. 2019 §3](https://arxiv.org/abs/1908.06177); [facebookresearch/clutrr](https://github.com/facebookresearch/clutrr)
  - **Noise types:** "Irrelevant facts" (a path sharing exactly one endpoint), "Supporting facts" (alternative longer paths between the targets) and "Disconnected facts" ("entities and relations that are completely unrelated to the target query"). — [Sinha et al. 2019 §3](https://arxiv.org/abs/1908.06177)
  - **Sample row (HF):** story "[Amy] has a son named [Dennis]. [Dennis] and his sister [Jennifer] went to the park."; query "('Amy', 'Jennifer')"; target_text "daughter"; proof_state "[{('Amy', 'daughter', 'Jennifer'): [('Amy', 'son', 'Dennis'), ('Dennis', 'sister', 'Jennifer')]}]"; f_comb "son-sister". — [HF CLUTRR/v1](https://huggingface.co/datasets/CLUTRR/v1)
  - **Licence:** "CLUTRR is CC-BY-NC 4.0 (Attr Non-Commercial Inter.) licensed" according to the GitHub repo. The HF card says "License: unknown". — [facebookresearch/clutrr](https://github.com/facebookresearch/clutrr); [HF CLUTRR/v1](https://huggingface.co/datasets/CLUTRR/v1)
- **LogicNLI (Tian et al. 2021):**
  - **Verbatim instance (Figure 2):**
    - "Facts: (F1) Harold is distinct. (F2) Daisy is not distinct. (F3) Alan is not distinct."
    - "Rules: (R1) If someone is alive, then he is neither grieving nor worrisome. (R2) If there is at least one people who is distinct, then Alan is grieving. (R3) Harold being alive is equivalent to Alan being grieving. (R4) Someone being both worrisome and drab is equivalent to being colorful and distinct."
    - "Statement: (S) Harold is grieving. Proofs: (P1) Alan is grieving. (P2) Harold is alive. Path: F1 + R2 → P1 + R3 → P2 + R1 → ¬S Label: Contradiction"
    — [Tian et al. 2021 Fig. 2](https://aclanthology.org/2021.emnlp-main.303/)
  - **Labels:** "Entailment", "Contradiction", "Neutral" and "Paradox". Paradox applies when both the statement and its negation follow. Reasoning is under an open-world assumption. The dataset covers seven first-order logic forms, including equivalence, existential and disjunction. It has "more than 30K instances", with hops ≤5. — [Tian et al. 2021](https://aclanthology.org/2021.emnlp-main.303/)
  - **Size per instance:** the statistics table I extracted shows "Avg. Length 184", "Max. Length 215" and "#(Facts+Rules) 15" for a 12,000-instance split. The column alignment in my PDF extraction was garbled, so treat these as approximate. — [Tian et al. 2021](https://aclanthology.org/2021.emnlp-main.303/)
  - **Licence:** no licence is visible on [omnilabNLP/LogicNLI](https://github.com/omnilabNLP/LogicNLI).
- **FOLIO (Han et al. 2022):**
  - **Size:** "1,430 examples (unique conclusions), each paired with one of 487 sets of premises". It is "expert-written", and annotators create stories "from scratch without using templates based on real-world knowledge" with parallel first-order logic for every sentence. Labels are True / False / Unknown. — [Han et al. 2022](https://arxiv.org/abs/2209.00840)
  - **Verbatim example (Table 2, Wild Turkey):**
    - Premises: "1. There are six types of wild turkeys: Eastern wild turkey, Osceola wild turkey, Gould's wild turkey, Merriam's wild turkey, Rio Grande wild turkey, and the Ocellated wild turkey. 2. Tom is not an Eastern wild turkey. 3. Tom is not an Osceola wild turkey. 4. Tom is also not a Gould's wild turkey. 5. Tom is neither a Merriam's wild turkey, nor a Rio Grande wild turkey. 6. Tom is a wild turkey."
    - Conclusions: "A. Tom is an Ocellated wild turkey. -> True B. Tom is an Eastern wild turkey. -> False C. Joey is a wild turkey. -> Unknown"
    - FOL: "¬EasternWildTurkey(tom) ... WildTurkey(tom)".
    — [Han et al. 2022 Table 2](https://arxiv.org/abs/2209.00840)
  - **Licence:** CC-BY-SA-4.0. — [Yale-LILY/FOLIO](https://github.com/Yale-LILY/FOLIO)
- **EntailmentBank (Dalvi et al. 2021):**
  - **Size:** "1,840 multistep entailment trees" for science QA pairs. Each tree has "an average of 6.6 nodes and 2.7 entailment steps". The facts are drawn from the WorldTree V2 corpus. — [Dalvi et al. 2021](https://arxiv.org/abs/2104.08661)
  - **Encoding:** "the input sentences S are labeled with identifiers (sent1, sent2, ...), and the hypothesis H is labeled with the special identifier 'hypot'"; "&" means and; "->" means entails. Example: "sent2 & sent5 -> int1: Eruptions block sunlight ; sent4 & int1 -> hypot". — [Dalvi et al. 2021 §5.1](https://arxiv.org/abs/2104.08661)
  - **Tasks:** Task 1 is gold leaves only. Task 2 adds distractors (up to 30 sentences). Task 3 is the full corpus. — [Dalvi et al. 2021](https://arxiv.org/abs/2104.08661)
  - **Repo example:** "$proof$ = sent2 & sent3 -> int1: the northern hemisphere is a kind of place; int1 & sent1 -> hypothesis;". The repo is Apache-2.0. No dataset licence is stated on the repo page. — [allenai/entailment_bank](https://github.com/allenai/entailment_bank)

### Inferences
- **CLUTRR:** too complex as text, because the crowd paraphrases bring an open vocabulary. Its *symbolic* layer is ideal for the target, though. The proof_state is already a list of triples ("Amy son Dennis", "Dennis sister Jennifer" → "Amy daughter Jennifer"). A templated kinship mini-domain ("A is the mother of B. B is the father of C. So A is the grandmother of C.") needs only about 10 kin words plus names. Composing relations is a different skill from is-a chains, so it adds variety.
- **LogicNLI:** too complex (15 facts+rules, equivalences, existentials). The **paradox** label (both S and not-S derivable) is a cheap way to teach "the premises are inconsistent". It could be imitated at 2-3 sentences: "Bob is big. Bob is not big. Is Bob big? paradox".
- **FOLIO:** far too complex. It has an open vocabulary, long multi-clause premises and Wikipedia topics. Its one transferable idea is the **Unknown** conclusion about an entity not mentioned in the premises ("Joey is a wild turkey -> Unknown").
- **EntailmentBank:** too complex lexically (science facts). The "A & B -> C" linear tree notation is a compact, parseable way to write a proof line if the corpus wants explicit proof steps. It costs only 2 symbol tokens ("&" and "->").

### Gaps
- No licence was found for LogicNLI or for the EntailmentBank data (as opposed to its code).
- The CLUTRR paper's Figure 1 example story is an image and could not be extracted. The HF sample row was used instead.

---

## 5. Default reasoning with exceptions ("birds fly, penguins don't"): which datasets cover it, with example text

### Takeaway
Two kinds of resource cover exceptions:
- RuleTaker's hand-built **Birds** rulebase (Sergot's formulation of McCarthy's abnormality puzzle). It encodes "birds fly unless abnormal" with negation as failure in fully templated, parseable English.
- **δ-NLI** ("Thinking Like a Skeptic", Rudinger et al. 2020). It adds human-written "strengtheners" and "weakeners" to premise/hypothesis pairs, but the language is open-vocabulary.

For a tiny corpus, the Birds pattern ("If someone is a bird and not abnormal then they can fly") is the one to imitate.

### Cited Findings
- **RuleTaker Birds rulebase:** "The 'birds' rulebase is a well-known logic problem illustrating the use of 'abnormality' predicates [McCarthy, 1984]. We entered Sergot's formulation of it verbatim (bar syntax)". Birds1 uses "is/is not flying" and Birds2 uses "can/cannot fly". These are test-only (zero-shot) sets. — [Clark et al. 2020 §4.3](https://arxiv.org/abs/2002.05867)
- **Verbatim Birds2 (Figure 5):** "If someone is a bird and not abnormal then they can fly. If someone is an ostrich then they are a bird. If someone is an ostrich then they are abnormal. If someone is an ostrich then they cannot fly. If someone is a bird and wounded then they are abnormal. If someone is wounded then they cannot fly. Arthur is a bird. Arthur is not wounded. Bill is an ostrich. Colin is a bird. Colin is wounded. Dave is not an ostrich. Dave is wounded. Q1.Arthur can fly. True/false? [T] Q2.Bill can fly. True/false? [F] Q3.Colin can fly. True/false? [F] Q4.Dave can fly. True/false? [F]" — [Clark et al. 2020 Fig. 5](https://arxiv.org/abs/2002.05867)
- **Electricity rulebase (also default-style):** "If a circuit has a switch and the switch is on then the circuit is complete. If a circuit does not have a switch then the circuit is complete. If a circuit is complete then a current runs through the circuit. ..." Q1 "The circuit is not complete. True/false? [F]". — [Clark et al. 2020 Fig. 6](https://arxiv.org/abs/2002.05867)
- **Both are in the dataset release:** the ProofWriter release keeps a `birds-electricity` directory in both CWA and OWA versions. — [ProofWriter README](https://aristo-data-public.s3.amazonaws.com/proofwriter/proofwriter-dataset-V2020.12.3.zip)
- **NAF is what makes exceptions work:** under the CWA, "not abnormal" holds for Arthur because abnormality cannot be proven. Under the OWA, negative conditions become "hard negation", so "not abnormal" would have to be stated explicitly. — [Tafjord et al. 2021 §3.2](https://arxiv.org/abs/2012.13048); [ProofWriter README](https://aristo-data-public.s3.amazonaws.com/proofwriter/proofwriter-dataset-V2020.12.3.zip)
- **δ-NLI definition:** "Defeasible inference is a mode of reasoning in which an inference (X is a bird, therefore X flies) may be weakened or overturned in light of new evidence (X is a penguin)." The related-work section states the classic case: "'Tweety is a bird' entails that 'Tweety flies', because birds usually fly. Such a conclusion [can be overturned] by new information such as 'Tweety is a penguin'". — [Rudinger et al. 2020](https://aclanthology.org/2020.findings-emnlp.418/)
- **δ-NLI format:** each line has a Premise, a Hypothesis, an Update and an UpdateType ("strengthener" or "weakener"). There are three portions: δ-SNLI, δ-ATOMIC and δ-SOCIAL (Social-Chemistry-101; this portion has hypothesis and update only). — [rudinger/defeasible-nli](https://github.com/rudinger/defeasible-nli)
- **δ-NLI verbatim examples:**
  - **Figure 1 (δ-SNLI):** Premise "Two men and a dog are standing among rolling green hills." Hypothesis "The men are farmers." Weakeners include "They are wearing backpacks." / "One man is using his binoculars." / "The men are studying a tour map." Strengtheners include "The men are facing their granary." / "The men are holding pitchforks." / "The dog is a sheep dog."
  - **Table 1:** premise "Old man crafting something in his workshop." with hypothesis "An old man is working": strengthener "The man is serious and is surrounded by workers.", weakener "The man is wearing pajamas and is chuckling."
  - **δ-SOCIAL:** "You should help your family with funeral expenses." strengthener "They have asked you to chip in", weakener "You are not financially stable to help out".
  — [Rudinger et al. 2020 Fig. 1, Table 1](https://aclanthology.org/2020.findings-emnlp.418/)
- **δ-NLI licence:** MIT. — [rudinger/defeasible-nli](https://github.com/rudinger/defeasible-nli)

### Inferences
- **Fit to the target scale (my counts):**
  - The full Birds2 theory is about 99 tokens, but uses only 22 distinct word types. The vocabulary is ideal and the length is three times the context.
  - It splits naturally into 32-token micro-items, for example "Birds can fly unless abnormal. Penguins are birds. Penguins are abnormal. Tweety is a penguin. Can Tweety fly? no" (about 22 tokens).
- **Make the exception explicit in the text.** The abnormality predicate turns "birds fly, penguins don't" into ordinary rules a symbolic verifier can check: `(bird ∧ ¬abnormal → fly)`, `(penguin → abnormal)`. Writing "Birds usually fly" as a bare generic leaves nothing for the verifier to parse.
- **CWA vs OWA matters here.** Default reasoning *requires* negation as failure. If the rest of the corpus is OWA with "unknown", the exception items must state "X is not abnormal" explicitly, or else mark "unless" as a special NAF keyword the verifier treats differently.
- **δ-NLI's idea is useful, its text is not.** The strengthener/weakener idea maps to a cheap template: "Tweety is a bird. So Tweety can fly. But Tweety is a penguin. So Tweety cannot fly." This teaches belief revision in about 20 tokens. The δ-NLI text itself (SNLI image captions, ATOMIC events, social norms) is far too open-vocabulary to copy.

### Gaps
- I found no small templated dataset other than RuleTaker Birds/Electricity that is built specifically around default rules with exceptions.
- I did not fetch dataset statistics for δ-NLI (number of tuples per portion).

---

## 6. Contradiction and claim-checking formats (FEVER-style claim → evidence → verdict)

### Takeaway
FEVER phrases each item as a short declarative claim, Wikipedia sentences as evidence, and one of three verdicts (SUPPORTS/Supported, REFUTES/Refuted, NOT ENOUGH INFO). Claims were made deliberately harder through "mutations": paraphrase, negation, substitution, and generalisation or specialisation. LogicNLI (section 4) adds a "Paradox" verdict for inconsistent premises. Adapted to tiny templated facts, the claim → evidence → verdict shape is an excellent critical-thinking template.

### Cited Findings
- **Size and source:** FEVER "consists of 185,445 claims manually verified against the introductory sections of Wikipedia pages". — [Thorne et al. 2018](https://arxiv.org/abs/1803.05355)
- **Verbatim example (Figure 1):** "Claim: The Rodney King riots took place in the most populous county in the USA. [wiki/Los Angeles Riots] The 1992 Los Angeles riots, also known as the Rodney King riots were a series of riots, lootings, arsons, and civil disturbances that occurred in Los Angeles County, California in April and May 1992. [wiki/Los Angeles County] Los Angeles County, officially the County of Los Angeles, is the most populous county in the USA. Verdict: Supported". This is a 2-hop claim with evidence from two pages. — [Thorne et al. 2018 Fig. 1](https://arxiv.org/abs/1803.05355)
- **Mutations:** "we specified six types of mutation: paraphrasing, negation, substitution of an entity/relation with a similar/dissimilar one, and making the claim more general/specific". Annotators "had difficulty generating non-trivial negation mutations (e.g. mutations beyond adding 'not' to the original)". — [Thorne et al. 2018 §3](https://arxiv.org/abs/1803.05355)
- **NOT ENOUGH INFO:** "The label NOT ENOUGH INFO was used if the claim could not be supported or refuted by any amount of information in Wikipedia (either because it is too general, or too specific)." Annotators were told to ask: "If I was given only the selected sentences, do I have strong reason to believe the claim is true (supported) or false (refuted)." — [Thorne et al. 2018 §3](https://arxiv.org/abs/1803.05355)
- **JSONL fields:** `id`, `label`, `claim`, `evidence`. Excerpt: `"id": 78526, "label": "REFUTES", "claim": "Lorelai Gilmore's father is named Robert."` — [fever.ai dataset page](https://fever.ai/dataset/fever.html)
- **Licence:** annotations "are made available under the license terms described on the applicable Wikipedia article pages", or otherwise "under the Creative Commons Attribution-ShareAlike License (version 3.0)". — [FEVER licence page](https://fever.ai/download/fever/license.html)
- **Other contradiction formats already covered:**
  - ProofWriter OWA: a False answer means the negation is provable; Unknown means neither can be proven. — [Tafjord et al. 2021](https://arxiv.org/abs/2012.13048)
  - LogicNLI: four-way Entailment / Contradiction / Neutral / Paradox, with a proof path such as "F1 + R2 → P1 + R3 → P2 + R1 → ¬S". — [Tian et al. 2021](https://aclanthology.org/2021.emnlp-main.303/)
  - bAbI task 9: "Fred is no longer in the office. Is Fred in the office? A:no". — [Weston et al. 2015](https://arxiv.org/abs/1502.05698)

### Inferences
- **FEVER's text is unusable at this scale.** It has Wikipedia vocabulary, long evidence sentences, and CC BY-SA share-alike obligations.
- **Its structure is directly reusable** with in-corpus facts: "Claim: Tom can fly. Evidence: Tom is a penguin. Penguins cannot fly. Verdict: refuted." (about 18 tokens). The three verdicts map onto ProofWriter's True / False / Unknown. Adding LogicNLI's Paradox gives four.
- **The FEVER mutation operators double as a recipe for counterfeit claims** to train on. Each can be generated from a true triple:
  - negation ("Tom is not a bird")
  - substitution of a similar/dissimilar entity ("Tom is a fish")
  - generalisation/specialisation ("Tom is an animal" — supported via is-a; "Tom is a robin" — not enough info)
- **Lesson from FEVER's annotation difficulty:** if every refuted claim is just "add not", the model learns the surface cue "not" means refuted. Mix substitution-based refutations with negation-based ones, and include negated claims that are *supported*.

### Gaps
- No small, templated claim-verification dataset was found in this session. FEVER-style synthetic logic sets may exist but were not searched.
- FEVER's own licence page addresses only the Wikipedia-derived material. I found no separate statement covering the claim text.

---

## 7. Licences, and whether raw text could legally be copied or should only be imitated

### Takeaway
Most of these licences would allow copying with attribution. In practice, though, nearly all of the raw text is too long or too lexically varied for a 100-token, 32-context model. Imitating the *templates* (which carry no expressive authorship) is both the legally cleanest and the technically better path. Only bAbI (CC BY 3.0) and possibly ProofWriter (CC BY per a secondary source) contain short templated items that could be lifted directly.

### Cited Findings

| Dataset | Licence found | Source |
|---|---|---|
| bAbI | Data: CC BY 3.0 (HF card); generator code: BSD | [HF babi_qa](https://huggingface.co/datasets/facebook/babi_qa); [bAbI-tasks](https://github.com/facebookarchive/bAbI-tasks) |
| RuleTaker / ProofWriter | Not stated in the dataset README; listed as "CC BY" by a secondary source (ALERT appendix) | [ProofWriter README](https://aristo-data-public.s3.amazonaws.com/proofwriter/proofwriter-dataset-V2020.12.3.zip); [ALERT](https://arxiv.org/pdf/2212.08286) |
| ProntoQA | Apache-2.0 (generator repo) | [asaparov/prontoqa](https://github.com/asaparov/prontoqa) |
| CLUTRR | CC-BY-NC 4.0 (GitHub); "unknown" on the HF card | [facebookresearch/clutrr](https://github.com/facebookresearch/clutrr); [HF CLUTRR/v1](https://huggingface.co/datasets/CLUTRR/v1) |
| LogicNLI | No licence visible | [omnilabNLP/LogicNLI](https://github.com/omnilabNLP/LogicNLI) |
| FOLIO | CC BY-SA 4.0 | [Yale-LILY/FOLIO](https://github.com/Yale-LILY/FOLIO) |
| EntailmentBank | Code Apache-2.0; data licence not stated on the repo | [allenai/entailment_bank](https://github.com/allenai/entailment_bank) |
| δ-NLI | MIT | [rudinger/defeasible-nli](https://github.com/rudinger/defeasible-nli) |
| FEVER | Wikipedia terms / CC BY-SA 3.0 | [FEVER licence](https://fever.ai/download/fever/license.html) |

### Inferences

**Legal reading (not legal advice):**
- **Copy with attribution:** bAbI (CC BY 3.0), ProofWriter (if CC BY is confirmed), δ-NLI (MIT, keep the notice) and ProntoQA (Apache-2.0 generator; its generated output is your own if you run the generator).
- **Copying obliges share-alike:** FOLIO and FEVER (CC BY-SA). The derived corpus would have to be released under the same terms.
- **Copying is restricted to non-commercial use:** CLUTRR (CC BY-NC).
- **Unknown licence, so imitate only:** LogicNLI, and EntailmentBank data.
- Sentences like "Bob is big." or "Mary went to the office." are generic and template-generated. Writing your own sentences from the same templates is imitation of a method, not copying of text. Citing the papers as design inspiration is still good practice.

**Technical reading (my counts):**
- bAbI task items: 23-30 tokens, 14 word types.
- RuleTaker theory: about 80 tokens, 24 types.
- Birds: about 99 tokens, 22 types.
- ProntoQA 3-hop: about 75 tokens, 26 types.
- CLUTRR sample: 25 tokens, 17 types, but the full vocabulary is open.
- With a 4-5k-token budget (about 150 windows of 32 tokens), the corpus can hold perhaps 150-250 micro-items. Hand-written or generated items cut down to 1-2 hop depth are the only practical option, whatever the licence.

**Design lessons for a corpus a symbolic verifier can parse back into triples (synthesised from all of the above):**
1. **One fact per sentence, one surface form per predicate.** Follow ProofWriter's "(arg1 rel arg2 polarity)" with rel="is" for attributes. Avoid bAbI-style verb synonyms, pronouns and coreference, and ParaRules-style paraphrase, which maps several triples to one sentence.
2. **Negation as a single token "not"** in a fixed position ("X is not A", "X does not R Y", "Every A is not B"), so that polarity becomes a +/- flag.
3. **A closed set of rule templates with one variable:** "If something is A then it is B." / "All A things are B." / "Every A is a B." (RuleTaker §3.4, ProntoQA §3).
4. **Declare the world assumption and keep it fixed.** OWA with true / false / unknown teaches "absence of evidence ≠ falsehood". CWA is needed for default-with-exception items, so mark it with a keyword such as "unless" or an explicit "abnormal" predicate (the Birds pattern).
5. **Balance the labels.** Use RuleTaker's flipping ("f? False" ↔ "not f? True") and FEVER-style mixed mutations, so neither "not" nor "unknown" becomes a surface cue.
6. **Add distractors.** Use ProntoQA's disconnected concept carrying the opposite polarity of the queried property, and CLUTRR's irrelevant / supporting / disconnected noise. Without them, even large models answer by string matching.
7. **Restate each step in the chain of thought.** "X is A. Every A is B. X is B." (ProntoQA). Each step can then be checked from the two sentences before it, which suits a 32-token window better than ProofWriter's identifier-based Polish notation.
8. **Control and record depth.** Keep depth at 0-2 for this context size. Depth-0 items are lookups and teach no inference (RuleTaker Mod0 failed the Birds set), so keep most items at depth 1-2.
9. **Use real, short words rather than fictional ones.** ProntoQA's "wumpus" vocabulary exists to block a pretrained model's prior knowledge, which a from-scratch model does not have.

### Gaps
- I could not confirm a primary-source licence for ProofWriter/RuleTaker data, LogicNLI, or EntailmentBank data.
- Whether very short templated sentences are copyrightable at all is a legal question this research cannot settle. The "imitate, don't copy" recommendation avoids depending on the answer.
