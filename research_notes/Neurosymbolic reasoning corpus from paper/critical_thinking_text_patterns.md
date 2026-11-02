# Critical-thinking text patterns for a tiny explainable neurosymbolic corpus

Scope: this extends the three earlier notes in `research_notes/Reasoning corpus for neurosymbolic transformer/` (templated_reasoning_datasets.md, tiny_model_corpus_learnability.md, federated_pipeline_text_formats.md) and avoids repeating them. Those notes already give verbatim examples, proof formats and licences for bAbI, RuleTaker/ProofWriter (including the Birds rulebase and abduction format), ProntoQA, CLUTRR, LogicNLI, FOLIO, EntailmentBank, delta-NLI and FEVER. They also cover the ProntoQA distractor lesson, RuleTaker label flipping, SCAN/COGS, the Wang et al. inferred/atomic ratio, Physics-of-LMs augmentation, and the `question :` / `fact :` / `claim :` / `so the claim is …` tag grammar.

This note adds:
- reasoning types the earlier notes miss: causal, counterfactual, abductive, conflict resolution by preference, proof by contradiction, proof by cases, contrapositive, conjunction/disjunction contrast;
- new datasets: CLadder, BoardgameQA, PrOntoQA-OOD, alpha-NLI/ART, ATOMIC, COPA/Balanced COPA, TimeTravel, SimpleLogic, RobustLR, counterfactually-augmented data;
- concrete simple-vocabulary templates, aligned with the project's existing rule ids (R-TRANS, R-INHERIT, R-EXCEPT, R-CHECK, R-ADD in `src/routes/train-transformer/reasoning-corpus.ts`).

Token counts marked "my count" split on whitespace, with `. , ? :` as separate tokens. They are my estimates, not figures from the sources. No local project file was sent to any external service. The project file was read locally only, to match its template style.

---

## Q1. For each dataset family (including causal, abductive, defeasible and commonsense sets the earlier notes miss), what does a raw example look like, what proof/explanation comes with it, and what is its licence?

### Takeaway
Three newer families add the critical-thinking types the earlier notes lack:
- **BoardgameQA:** conflicting rules settled by explicit preferences, labelled proved / disproved / unknown.
- **CLadder:** yes/no causal questions on all three rungs of Pearl's ladder, with a six-step symbolic explanation.
- **PrOntoQA-OOD:** natural-language templates for proof by contradiction ("Suppose … This contradicts with …") and proof by cases.

Abductive (alpha-NLI), causal-commonsense (COPA, ATOMIC) and counterfactual (TimeTravel) sets supply useful shapes, but their open-vocabulary crowd text cannot be copied at this scale. Licences differ, and several dataset licences are unconfirmed. Imitating the templates remains the safe route.

### Cited Findings

**Recap: covered in the earlier notes, not repeated here.** bAbI (CC BY 3.0), RuleTaker/ProofWriter (licence unconfirmed; "CC BY" per a secondary source), ProntoQA (Apache-2.0 code), CLUTRR (CC BY-NC 4.0), LogicNLI (none visible), FOLIO (CC BY-SA 4.0), EntailmentBank (code Apache-2.0), delta-NLI (MIT), FEVER (CC BY-SA 3.0). See templated_reasoning_datasets.md sections 1-7.

**CLadder (Jin et al. 2023), causal reasoning across Pearl's three rungs**
- **Query types by rung:**
  - Rung 1, "seeing" (associational): marginal and conditional probabilities, and "explaining away" (conditioning on a collider).
  - Rung 2, "doing" (interventional): average treatment effect (ATE), adjustment-set questions, and collider bias.
  - Rung 3, "imagining" (counterfactual): counterfactual probability, ATT, NDE and NIE.

  — [Jin et al., CLadder (arXiv HTML v3)](https://arxiv.org/html/2312.04350v3)
- **Causal graphs:** IV, Arrowhead, Confounding, Mediation, DiamondCut, Frontdoor, Diamond, Chain, Collision and Immorality. Each query type is restricted to the graphs where it is well defined; for example, explaining away and collider bias use only Collision. — [CLadder HTML](https://arxiv.org/html/2312.04350v3)
- **Generation:**
  - A causal inference engine computes the answers over binary variables with Bernoulli mechanisms, so every query is identifiable by construction.
  - Stories are verbalised with templates. Example probability templates: "The overall probability of recovery is 60%." and "For patients who have small kidney stones, the probability of recovery is 70%."
  - Every question can be answered yes or no.

  — [CLadder HTML](https://arxiv.org/html/2312.04350v3)
- **Three name variants:** each graph has 2-5 commonsensical stories. "Anti-commonsensical" variants swap in an unusual effect variable (e.g. "ear shape") or add an irrelevant treatment (e.g. "playing card games"). "Nonsensical" variants use invented names (e.g. "zory", "qixy"). — [CLadder HTML](https://arxiv.org/html/2312.04350v3)
- **Size and balance:** v1.5 has 10,112 questions: 3,160 at Rung 1, 3,160 at Rung 2 and 3,792 at Rung 3. 50% are positive. — [CLadder HTML](https://arxiv.org/html/2312.04350v3)
- **Explanation structure:** each explanation breaks into six subskills: graph extraction, query-type interpretation, symbolic formalisation, data parsing, estimand derivation and arithmetic. — [CLadder HTML](https://arxiv.org/html/2312.04350v3)
- **Example from the repo README (question 16825, ATE, instrumental-variable graph; quoted in segments):**
  - Prompt opens with: "Imagine a self-contained, hypothetical world with only the following conditions, and without any unmentioned factors …"
  - Question: "Will college degree or higher decrease the chance of high salary?" Answer: `no`.
  - Reasoning, step by step:
    - Step 0: "Let V2 = proximity to a college; V1 = unobserved confounders; X = education level; Y = salary."
    - Step 1: edges V1→X, V2→X, V1→Y, X→Y.
    - Step 2: target E[Y | do(X = 1)] − E[Y | do(X = 0)].
    - Step 3: the IV ratio [P(Y=1|V2=1) − P(Y=1|V2=0)] / [P(X=1|V2=1) − P(X=1|V2=0)].
    - Step 4: plug-in values 0.35, 0.53, 0.40, 0.73.
    - Step 5: (0.53 − 0.35) / (0.73 − 0.40) = 0.55 > 0.

  The tool returning the page paraphrased parts of this, so treat the step wording as close but not guaranteed verbatim. — [causalNLP/cladder README](https://github.com/causalNLP/cladder)
- **Hugging Face rows:**
  - Fields: id, prompt, label, reasoning, rung, query_type, graph_id, story_id, question_property, formal_form.
  - Row with `reasoning` = "Let X = husband; V2 = wife; Y = alarm clock. X->V2,X->Y,V2->Y": rung 3, query_type `nde`, graph `mediation`, label `yes`, question_property "E[Y_{X=1, V2=0} - Y_{X=0, V2=0}]".
  - ATE row with reasoning "P(Y=1 | X=0) = 0.26 P(Y=1 | X=1) = 0.76 0.76 - 0.26 = 0.50 0.50 > 0": label `no`.
  - The viewer showed a DatasetGenerationCastError, and the card README is empty.

  — [HF causalNLP/cladder](https://huggingface.co/datasets/causalNLP/cladder)
- **Repo data files:** `cladder-v1-balanced.json`, with fields question_id, desc_id, given_info, question, answer, reasoning and meta. meta holds query_type, rung, story_id, graph_id, model_id and groundtruth. — [causalNLP/cladder](https://github.com/causalNLP/cladder)
- **Licence:**
  - Repo: MIT. — [causalNLP/cladder](https://github.com/causalNLP/cladder)
  - arXiv paper: CC BY 4.0. — [arXiv 2312.04350](https://arxiv.org/abs/2312.04350)
  - HF card: no licence stated. — [HF causalNLP/cladder](https://huggingface.co/datasets/causalNLP/cladder)

**BoardgameQA (Kazemi et al. 2023), defeasible reasoning with conflicting rules and preferences**
- **Framing:** the task is defeasible reasoning: one can "impose preferences over information sources (e.g., based on source credibility or information recency) and adopt the source with higher preference". — [arXiv 2306.07934](https://arxiv.org/abs/2306.07934)
- **The paper's illustrative theory (Example 3.1, not a dataset row):** Tweety is a penguin; penguins are birds; birds fly; penguins do not fly. "Penguins do not fly" is preferred over "Birds fly", so Tweety does not fly. — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **Labels:** proved, disproved, unknown. Disproved examples come from negating the question. Unknown examples come from perturbing the theory until the question can no longer be derived. — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **Two kinds of conflict:** Type1 needs the higher-priority rule's body to be provable. Type2 needs a proof that one element of the conflicting rule's body cannot be proved. — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **Generation trace (Fig. 22 caption, paraphrased):**
  - The question is whether the dog attacks the cat.
  - The generator adds "the dog unites with a lion" and the rule "anything uniting with a lion attacks the cat".
  - It then adds the conflicting rule "if the dog respects the cat it does not attack the cat".
  - Type2 is chosen, so the preference favours the first rule, and the sub-question for the conflicting rule's body is removed.

  — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **Depth and distractors:** depth is 1-3 hops. Distractors are facts and rules outside the proof that do not change the label, at 0, 1 or 2 per step. — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **Withheld knowledge:** some needed knowledge is held back and must come from world knowledge, arithmetic or orthography. The test split uses different entities, predicates and templates. — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **Licence:** the arXiv paper is CC BY 4.0. The dataset licence was not verified. — [arXiv 2306.07934](https://arxiv.org/abs/2306.07934)

**PrOntoQA-OOD (Saparov et al. 2023), natural-language templates for each deduction rule (Table 2 / §3)**
- **Rule templates:**
  - Implication elimination: "Alex is a cat. All cats are carnivores. Alex is a carnivore."
  - Conjunction introduction: "Alex is a cat. Alex is orange. Alex is a cat and orange."
  - Conjunction elimination: "Alex is a cat and orange. Alex is orange."
  - Disjunction introduction: "Alex is a cat. Alex is a cat or orange."
  - Disjunction elimination (proof by cases): "Alex is a cat or a dog. Suppose Alex is a cat … then Alex is warm-blooded." The dog case follows, ending "Alex is warm-blooded."
  - Proof by contradiction: "Suppose Alex is a mammal. Alex is not cold-blooded. This contradicts with Alex is cold-blooded." It ends "Alex is not a mammal."

  — [Saparov et al. 2023 (arXiv HTML)](https://arxiv.org/html/2305.15269)
- **Connectives:** hypothetical subproofs use "Suppose …" (or "Assume …" in expected CoT), contradictions use "This contradicts with …", and conclusions may start "Therefore, …". — [Saparov et al. 2023](https://arxiv.org/html/2305.15269)
- **Licence:** the paper is CC BY-SA 4.0. The code is described as "permissive open-source" (the repo is Apache-2.0 per the earlier note). — [Saparov et al. 2023](https://arxiv.org/html/2305.15269)

**alpha-NLI / ART (Bhagavatula et al. 2020), abductive "best explanation"**
- **Definition:** "Abductive reasoning is inference to the most plausible explanation for incomplete observations." — [Bhagavatula et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/1908.05739)
- **Verbatim example (§3.1):**
  - O1: "Carl went to the store desperately searching for flour tortillas for a recipe."
  - O2: "Carl left the store very frustrated."
  - h+: "The store had corn tortillas, but not flour ones."
  - h−: "The cashier was rude"

  — [ar5iv 1908.05739](https://ar5iv.labs.arxiv.org/html/1908.05739)
- **Construction:**
  - Observations are the first and last sentences of ROCStories.
  - Crowdworkers wrote plausible middle sentences, and other workers minimally edited them into implausible ones.
  - BERT-based adversarial filtering kept hard pairs.
  - Size: about 20k contexts and over 200k hypotheses.

  — [ar5iv 1908.05739](https://ar5iv.labs.arxiv.org/html/1908.05739)
- **Licence:** not stated on the arXiv page.

**ATOMIC (Sap et al. 2019), if-then causal commonsense triples**
- **Verbatim inferences:**
  - Event "PersonX pays PersonY a compliment": xIntent "PersonX wanted to be nice"; xReact "PersonX will feel good"; oReact "PersonY will feel flattered".
  - Event "PersonX calls the police": xNeed "PersonX needs to dial 911"; xEffect "PersonX starts to panic"; oWant "Others want to dispatch some officers"; xAttr "PersonX is responsible".

  — [Sap et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/1811.00146)
- **Nine relations:**
  - Mental-state: xIntent, xReact, oReact.
  - Event: xNeed, xWant, oWant, xEffect, oEffect.
  - Persona: xAttr.
  - By causal role, xNeed and xIntent are causes, effects include xWant, oEffect and xReact, and xAttr is stative.

  — [ar5iv 1811.00146](https://ar5iv.labs.arxiv.org/html/1811.00146)
- **Size:** 877,108 triples, 309,515 nodes and 24,313 base events. — [ar5iv 1811.00146](https://ar5iv.labs.arxiv.org/html/1811.00146)
- **Licence:** not stated in the paper text.

**COPA / Balanced COPA, cause-or-effect choice**
- **Verbatim rows:**
  - Premise "My body cast a shadow over the grass." / question cause / choice1 "The grass was cut." / choice2 "The sun was rising." / label 1.
  - Its mirrored twin: premise "The garden looked well-groomed." with the same two choices and label 0.
  - Effect example: "The elderly woman suffered a stroke." → "The woman's daughter moved in to take care of her." (correct) vs "… came over to clean her house."

  — [HF pkavumba/balanced-copa](https://huggingface.co/datasets/pkavumba/balanced-copa)
- **Why Balanced COPA exists:** original COPA has an "unbalanced token distribution between the correct and the incorrect answer choices". The mirrored instances reuse identical choices with flipped labels. Size: 1,000 validation and 500 test rows. Licence: CC BY 4.0. — [HF balanced-copa](https://huggingface.co/datasets/pkavumba/balanced-copa)
- **Original COPA:** size and licence not verified (the original USC page returned 404).

**TimeTravel (Qin et al. 2019), counterfactual story rewriting**
- **Verbatim example (Table 1):**
  - Premise "Ana had just had a baby girl."
  - Initial "She wanted her girl to have pierced ears."
  - Original ending: "She took her baby to the studio and had her ears pierced." … "Ana loved the earrings."
  - Counterfactual: "She didn't like the idea of having her ears pierced."
  - Edited ending: "She decided not to take her baby to the studio to get her ears pierced." … "Ana loved the fake earrings."

  — [Qin et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/1909.04076)
- **Size and principle:** 29,849 rewritten endings (16,752 / 5,613 / 7,484), plus 80,115 unpaired counterfactual contexts. The rule is to make minimal edits that are consistent with the counterfactual. No licence is stated in the paper. — [ar5iv 1909.04076](https://ar5iv.labs.arxiv.org/html/1909.04076)

**SimpleLogic (Zhang et al. 2022)**
- **Verbatim example (App. D):** "Facts: Alice frail. Query: Alice is disgusted ? Label: False Proof Depth: 3 From: LP". There are 5-30 predicates, depth 0-6, and 80k examples per depth. — [Zhang et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/2205.11502)

**RobustLR (Sanyal et al. 2022), symbolic contrast and equivalence sets**
- **Contrast sets (minimal edits that should change the label):**
  - Base: p ⟹ q with facts {p} → True.
  - Conjunction: p ∧ t ⟹ q with {p} → Unknown; with {p, t} → True.
  - Disjunction: p ∨ t ⟹ q with {¬p, ¬t} → Unknown.
  - Negation: p ⟹ ¬q with {p} → False.
- **Equivalence sets (rewrites that should keep the label):**
  - Contrapositive: p ⟹ q ≡ ¬q ⟹ ¬p.
  - Distributive: (p ⟹ q) ∧ (p ⟹ r) ≡ p ⟹ (q ∧ r), and (p ⟹ q) ∧ (r ⟹ q) ≡ (p ∨ r) ⟹ q.

  — [Sanyal et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/2205.12598)

**Counterfactually-augmented data, CAD (Kaushik et al. 2020)**
- **Verbatim NLI pair (shared premise "An older man with glasses raises his eyebrows in surprise."):** "The man has no glasses." (Contradiction) → "The man wears glasses." (Entailment).
- **Annotator instruction:** "Do not change any portions of the passage unnecessarily."

  — [Kaushik et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/1909.12434)

### Inferences
- **The new families map onto distinct symbolic operations a verifier can display:**

  | Source | Operation | Gloss |
  |---|---|---|
  | BoardgameQA | `prefer(rule_a, rule_b)` | conflict resolution |
  | PrOntoQA-OOD | `suppose … contradicts … therefore not …` | reductio |
  | PrOntoQA-OOD | `case a … case b … both …` | proof by cases |
  | RobustLR | contrast pairs | conjunction / disjunction / negation edits |
  | CLadder | `do(x)` vs `see(x)` | intervention vs observation |
  | CLadder | collider | explaining away |
  | COPA / ATOMIC | `cause(e1, e2)` | cause or effect direction |
  | TimeTravel | minimal-edit counterfactual pair | counterfactual |
  | alpha-NLI | choose the hypothesis that makes O1 → h → O2 coherent | abduction |

- **CLadder's yes/no depends on the question's wording ("increase" vs "decrease").** The repo example computes 0.55 > 0 and labels "will … decrease …?" as `no`. This likely explains the HF ATE row that computes 0.50 > 0 yet carries label `no`; I could not see that row's question text, so this is unconfirmed. Wording the question in both directions is a cheap way to stop the label leaking from the sign of the effect.
- **BoardgameQA's Example 3.1 is exactly the project's R-EXCEPT case ("birds fly, penguins do not").** It adds one thing R-EXCEPT lacks: an explicit preference statement the verifier can cite.

### Gaps
- No verbatim BoardgameQA dataset row was obtainable. Figure 2 is an image, and the dataset licence was not checked on its repo or HF card.
- No full verbatim CLadder prompt with its probability sentences was retrieved, only segments. The CLadder data licence apart from the MIT code licence is unconfirmed.
- Not found: licences for ART/alpha-NLI, ATOMIC, TimeTravel, SimpleLogic and RobustLR data, and the original COPA. (My recollection is that ATOMIC is CC BY 4.0 via AllenAI and COPA is BSD-2, but neither was verified.)
- The bAbI on-disk line format (flagged as a gap in the earlier note) is still unverified: the HF datasets-server request returned 404.

---

## Q2. Which formats stay short enough for a 32-token window and a few-hundred-word vocabulary, and what do simple-vocabulary templates for each critical-thinking type look like?

### Takeaway
None of the new datasets fits as raw text:
- **CLadder** is too long: probabilities plus a variable glossary.
- **BoardgameQA** is too deep: multi-rule theories.
- **alpha-NLI, TimeTravel, COPA and ATOMIC** have an open vocabulary.

Their *shapes* compress well, though. Every reasoning type below fits in 20-31 tokens (my count) with about 130 distinct words over the whole template set. The trick is to drop numbers (use qualitative causal rules), to state one rule per sentence, and to put the gold explanation in a short `because …` tail that restates a premise.

### Cited Findings
- **CLadder needs heavy machinery in every item:** a variable glossary ("Let V2 = proximity to a college; …"), an edge list and up to four probabilities. — [causalNLP/cladder](https://github.com/causalNLP/cladder)
- **BoardgameQA needs facts, rules, preferences and 1-3 hop depth, plus distractors (0-2 per step).** — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **PrOntoQA-OOD's single-rule demonstrations are 2-4 short sentences each,** e.g. "Alex is a cat. Alex is orange. Alex is a cat and orange." — [Saparov et al. 2023](https://arxiv.org/html/2305.15269)
- **SimpleLogic shows that a full item can be one line of facts, a query, a label and a depth.** — [Zhang et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/2205.11502)
- **COPA and alpha-NLI items are one premise or two observations plus two candidates.** — [HF balanced-copa](https://huggingface.co/datasets/pkavumba/balanced-copa); [ar5iv 1908.05739](https://ar5iv.labs.arxiv.org/html/1908.05739)

### Inferences

**Raw-format fit (my counts):**

| Item | Tokens | Fits 32? | Vocabulary |
|---|---|---|---|
| COPA "shadow" item, premise + "cause ?" + 2 choices | about 22 | yes | open |
| alpha-NLI Carl item, O1 + O2 + h+ + h− | about 40 | no | open |
| TimeTravel Ana item | about 65 | no | open |
| ATOMIC triple ("PersonX calls the police xNeed PersonX needs to dial 911") | about 11 | yes | open |
| CLadder repo example | well over 100 | no | numbers, variable letters |
| PrOntoQA-OOD single-rule step | 8-20 | yes | — |
| SimpleLogic line | about 13 | yes | — |

**Simple-vocabulary templates.** These are lowercase and mirror the house style of the existing R-* templates ("the x is a y . a y can z . so the x can z ."). Token counts are my whitespace counts. Each line is one corpus unit. The tail after `,` / `because` is the gold explanation that the symbolic layer lifts and displays. Proposed new rule ids are in brackets; they are suggestions, not existing code.

1. **Negation as a stated fact** [R-NEG] (RuleTaker/ProofWriter `-` polarity; RobustLR N-CS)
   - `the penguin is a bird . a penguin cannot fly . can the penguin fly ? no , a penguin cannot fly .` (23)
2. **Open-world unknown** [R-UNKNOWN] (ProofWriter OWA; FOLIO "Unknown"; BoardgameQA unknown)
   - `the cat is an animal . can the cat swim ? unknown , because no fact says the cat can swim .` (22)
3. **Conjunction / disjunction contrast pairs** [R-AND, R-OR] (RobustLR C-CS / D-CS). These pairs differ in a single word, `and` vs `or`, which is what makes them contrastive:
   - `if the king is old and ill he rests . the king is old . does the king rest ? unknown , ill is not known .` (27)
   - `if the king is old or ill he rests . the king is ill . does the king rest ? yes , the king is ill .` (27)
4. **Minimal contrast triple on one rule** (RobustLR base / negation). The three lines share almost every token, so only reasoning separates them:
   - `if the king is old he rests . the king is old . does the king rest ? yes .` (20)
   - `if the king is old he rests . the king is young . does the king rest ? unknown .` (20)
   - `if the king is old he does not rest . the king is old . does the king rest ? no .` (22)
5. **Default with exception, as belief revision** [R-EXCEPT variant] (delta-NLI weakener; Birds)
   - `tweety is a bird . so tweety can fly . then we learn tweety is a penguin . so tweety cannot fly .` (23)
6. **Explicit preference between conflicting rules** [R-PREFER] (BoardgameQA Example 3.1)
   - `a bird can fly . a penguin cannot fly . the penguin rule wins . pingu is a penguin and a bird . can pingu fly ? no .` (29)
7. **Contradiction / inconsistency detection** [R-CONTRA] (LogicNLI paradox; PrOntoQA-OOD reductio)
   - `the dog is a cat . no dog is a cat . is this consistent ? no , the two facts clash .` (23)
   - `rex is a dog . rex is not a dog . is rex a dog ? paradox , because both are stated .` (23)
8. **Contrapositive / modus tollens** [R-TOLLENS] (RobustLR C-ES, the weakest equivalence for models)
   - `rain wets the grass . the grass is not wet . did it rain ? no , rain would wet the grass .` (23)
9. **Proof by cases** [R-CASES] (PrOntoQA-OOD disjunction elimination)
   - `tom is a cat or a dog . a cat is an animal . a dog is an animal . is tom an animal ? yes , both ways .` (30)
10. **Two-hop deduction with a compressed proof** [R-TRANS + R-INHERIT] (ProntoQA). The `cat to mammal to animal` tail is a path the verifier can walk edge by edge:
    - `tom is a cat . a cat is a mammal . a mammal is an animal . is tom an animal ? yes , cat to mammal to animal .` (30)
11. **Causal forward (effect) and backward (cause)** [R-CAUSE] (COPA; ATOMIC xEffect)
    - `rain makes the river rise . it rained . what happened next ? the river rose , because rain makes the river rise .` (24)
    - `the grass is wet . cause ? a : it rained . b : the sun shone . a , because rain wets the grass .` (26)
12. **Counterfactual with and without an alternative cause** [R-CFACT] (CLadder rung 3, made qualitative; TimeTravel minimal edit). The two lines are a minimal pair: adding a second cause flips the answer.
    - `rain wets the grass . it rained . nothing else wets the grass . had it not rained , would the grass be wet ? no .` (27)
    - `rain or the sprinkler wets the grass . it rained . the sprinkler was on . had it not rained , is the grass wet ? yes .` (about 28)
13. **Explaining away, deterministic version** [R-COLLIDER] (CLadder collider / explaining-away). With two possible causes and the effect observed, the first cause becomes undetermined. That is "unknown" in a deterministic world; CLadder's probabilistic version would say "less likely".
    - `rain wets the grass . the sprinkler wets the grass . the grass is wet . the sprinkler was on . did it rain ? unknown .` (29)
14. **Abduction, best explanation** [R-ABDUCT] (alpha-NLI; ProofWriter abduction). Use `maybe` or `likely` rather than `yes`, because abduction is not deductively valid.
    - `work at night makes the doctor tired . the doctor is tired . why ? maybe the doctor works at night .` (22)
    - alpha-NLI shape: `first : the dog was hungry . last : the dog was happy . a : the dog ate . b : the dog ran . best : a .` (about 30)
15. **Kinship composition** [R-KIN] (CLUTRR proof_state; uses king/queen)
    - `the king is the father of the prince . the prince is the father of tom . so the king is the grandfather of tom .` (26)

- **Vocabulary check:** the union of all draft templates above came to 126 distinct whitespace tokens (my count, including punctuation). That is inside a few-hundred-word budget, and new entities (queen, doctor, river) slot in without new function words.
- **New function words beyond the current corpus:** `unknown`, `paradox`, `consistent`, `clash`, `suppose`, `cause`, `makes` / `wets`, `had`, `would`, `maybe`, `best`, `wins`, `or`, `and`, `if`, `because`. That is about 15 tokens. Each should stay a single BPE token.
- **The tightest items are the counterfactual pair, alpha-NLI and proof-by-cases (28-30 tokens).** Each leaves at most 2-4 tokens for an episode separator, so they cannot carry a distractor. Put distractors in the shorter types instead.

### Gaps
- No source tests whether qualitative (number-free) causal questions keep CLadder's rung distinctions learnable. Making them qualitative is my adaptation.
- I did not verify that these words stay single tokens under the project's trained BPE vocabulary.

---

## Q3. What design tips from the literature help small models generalise rather than memorise (proof depth, closed vs open world, distractors, held-out combinations, balanced labels, counterfactual pairs)?

### Takeaway
The strongest new evidence is negative: models reach about 99% in-distribution and still fail when the generating distribution shifts. This happens because label-correlated statistics leak, for example the number of rules (SimpleLogic), lexical cues in answer choices (COPA), or the presence of an Unknown option (RobustLR).

The remedies with evidence behind them are:
- generate from two different samplers and test across them;
- use mirrored or minimally edited counterfactual pairs whose surface stays the same while the label flips (Balanced COPA, CAD, RobustLR contrast sets);
- vary entity names between commonsense, anti-commonsense and nonsense (CLadder);
- hold out entities, predicates and templates at test time (BoardgameQA);
- report proof correctness separately from label accuracy.

### Cited Findings
- **Statistical features leak labels (SimpleLogic).**
  - Under Rule-Priority sampling, at #rule = 80, 92.7% of 2,322 examples are positive, against 49.9% at #rule = 38.
  - BERT trained on RP scores 99.8% (depth 0) but only 57.3% at depth 6 on Label-Priority test data. Training on RP+LP still gives 55.2% at depth 6 on a slightly altered LP* set.

  — [Zhang et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/2205.11502)
- **Balancing one feature helps partly, but full balancing is very expensive.**
  - Balancing #rule raised LP depth-6 accuracy from 57.3% to 68.1%, while accuracy on the balanced set itself fell to 88.3%, which shows reliance on #rule.
  - Jointly removing #fact, branching_factor and #rule raised the required oversampling factor from 5.5 to 55.6.
  - The authors conclude that removing all such features is computationally infeasible, and that high in-distribution accuracy does not show reasoning, so evaluation should use multiple data distributions.

  — [Zhang et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/2205.11502)
- **Perturbed logic sets expose weak spots (RobustLR).**
  - RoBERTa-Large scores 1.00 in-domain but averages 0.47 weighted-F1 on logical contrast sets: conjunction 0.44, disjunction 0.61, negation 0.37.
  - Contrapositive falls to about 0.79, against 0.93-0.94 for the distributive sets.
  - "Negations are hardest to learn across all settings". Adding negation to disjunction drops 0.81 to 0.50.
  - Humans score 0.88 (contrast) and 0.91 (equivalence).

  — [Sanyal et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/2205.12598)
- **RobustLR's Unknown-label finding and its training lessons.**
  - Removing the Unknown label raises the contrast average from 0.47 to 0.83.
  - Training on the operator mix under test (OR+NOT for disjunction contrasts, AND+NOT for conjunction+negation) gave the best scores.
  - A RoBERTa-Large trained from scratch performs far worse than a pretrained one.

  The tool returning the page summarised this, so the exact framing of the Unknown result should be rechecked in the paper. — [Sanyal et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/2205.12598)
- **BoardgameQA findings.**
  - Accuracy falls at depth 2-3 and as the number of conflicts grows. Type1 conflicts are slightly easier than Type2.
  - Correct labels often come with wrong proofs. Rule selection is better than conflict resolution.
  - Distractors hurt few-shot models, and tuned models degrade with many distractors.
  - Failure modes include hallucinating conflicts or facts, misreading preferences, and changing rules to force a proof.

  — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **BoardgameQA holds out surface material:** test uses different entities, predicates and templates, and some knowledge categories appear only in training. — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **CLadder's name variants:** commonsensical, anti-commonsensical (e.g. "ear shape") and nonsensical ("zory", "qixy") versions of the same graphs. Labels are 50% yes. — [CLadder HTML](https://arxiv.org/html/2312.04350v3)
- **Balanced COPA's mirrored instances:** identical answer choices with flipped labels, to cancel the "unbalanced token distribution between the correct and the incorrect answer choices". — [HF balanced-copa](https://huggingface.co/datasets/pkavumba/balanced-copa)
- **Counterfactually augmented data (CAD) breaks spurious features.**
  - Bi-LSTM sentiment trained on original data scores 79.3% on original and 55.7% on revised text. Trained on combined data it scores 81.7% and 92.0%.
  - Out of domain, combined data beats original-only data, e.g. Bi-LSTM on SemEval-2017 Twitter 68.7% vs 55.3%.
  - BERT trained on 1.67k original NLI pairs scores 72.2% on SNLI but 39.7% on revised-premise data.

  — [Kaushik et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/1909.12434)
- **Counterfactual rewriting (TimeTravel).** Supervised models stay close to the original plot but respect the counterfactual poorly, plausibly by copying the original ending. More paired data did not fix this. BLEU and ROUGE correlate negatively with human-judged counterfactual adherence. — [Qin et al. (ar5iv)](https://ar5iv.labs.arxiv.org/html/1909.04076)
- **PrOntoQA-OOD.** The gap between in-demonstration and out-of-demonstration (compositional) accuracy was near zero in all but three experiments. Removing distractors from in-context demonstrations "largely" did not change performance. GPT-3.5 and PaLM struggled when four rule types were combined. — [Saparov et al. 2023](https://arxiv.org/html/2305.15269)

### Inferences
These are recommendations for the 32-token / about 50k-parameter target, extrapolated from much larger models.
1. **Use two generators and cross-test.** Build the corpus with a rule-first sampler (pick rules, derive the label) and a label-first sampler (pick the label, build premises to fit). Train on one and test on the other, following SimpleLogic. At this scale the most likely leaks are:
   - the number of sentences;
   - whether `not` appears;
   - whether the query's attribute word appears in the premises;
   - the position of the answer word.

   Check each leak with a trivial baseline classifier before training.
2. **Make every critical-thinking type a minimal pair or triple.** Examples: the RobustLR-style contrast triple (Q2 template 4); the and/or pair (template 3); the counterfactual pair with and without an alternative cause (template 12); and Balanced-COPA-style mirrored items where the same two choices appear with flipped labels. Kaushik et al. and Balanced COPA show that this specifically removes the surface cues tiny models grab.
3. **Over-weight negation and the contrapositive.** Both are the weakest operators even for large pretrained models (RobustLR N-CS 0.37, C-ES 0.79). A from-scratch model has no pretraining to lean on, which RobustLR shows hurts further. Give R-NEG and R-TOLLENS more corpus share than R-TRANS.
4. **Balance three-way labels per template, not just overall.** RobustLR shows the Unknown option is itself a shortcut source. Within each rule id, aim for roughly equal yes / no / unknown, and avoid templates where `unknown` co-occurs only with one structural cue (e.g. only when a premise is missing). Unknown items should sometimes have *more* premises than yes items, not always fewer.
5. **Use three name tiers for held-out testing (from CLadder).**
   - Commonsense: `rain wets the grass`.
   - Anti-commonsense: `rain wets the king`.
   - Nonsense: a held-out single-token name used only at test.

   A model that reasons from in-context premises should get all three right. One that memorised world-like co-occurrences fails tier 2.
6. **Hold out surface material, as BoardgameQA does.** Keep entities, and at least one template paraphrase per rule id, out of training. This complements the earlier note's OOD-entity split.
7. **Cap depth at 2 and put distractors only where there is room.** BoardgameQA accuracy degrades at depth 2-3 even for fine-tuned large models, and the 32-token window already forces depth ≤ 2. Use 0-1 distractor sentences, only in the short templates (≤ 24 tokens).
8. **Fix the world assumption per rule id and say so in the unit.** The earlier note covered CWA vs OWA. The new point is that exception, collider and counterfactual items need closure statements to be well-defined:
   - "nothing else wets the grass" (the counterfactual pair);
   - "the penguin rule wins" (the preference).

   Without them the gold answer depends on an unstated assumption the verifier cannot check.
9. **Score the proof separately from the label.** BoardgameQA found correct labels with wrong proofs, and TimeTravel found n-gram metrics rewarding copying. Have the symbolic layer grade the `because …` tail independently. Report label accuracy, proof validity, and the rate of "right label, wrong reason".

### Gaps
- None of these studies used models under about 100M parameters, or a corpus of only a few thousand tokens. The size of each effect at the target scale is unknown.
- I found no source that measures how many contrast pairs are needed per rule type for a small model, analogous to SCAN's 8/16/32 dose-response in the earlier note.

---

## Q4. How should a corpus mix "fact", "rule", and "question → answer because …" lines so that a symbolic layer can trace the explanation?

### Takeaway
Treat each unit as a tiny theory followed by a query, a verdict and a restating justification:

`<facts> . <rules> . [<closure or preference>] . <question> ? <verdict> , because <one restated premise or path> .`

Three choices keep it traceable:
- the justification restates the premise sentence verbatim, as ProntoQA does, rather than citing ids;
- conflict and closure assumptions are written as their own sentences, as BoardgameQA does with preferences;
- the verdict comes from a closed set (yes / no / unknown / paradox / maybe), so the verifier can recompute it from the parsed premises.

### Cited Findings
- **CLadder** splits an explanation into six checkable subskills: graph extraction, query-type interpretation, formalisation, data parsing, estimand derivation and arithmetic. Its data stores `reasoning` separately from `answer`, along with meta fields `query_type`, `rung` and `graph_id`. — [CLadder HTML](https://arxiv.org/html/2312.04350v3); [causalNLP/cladder](https://github.com/causalNLP/cladder)
- **BoardgameQA** represents conflict resolution as an explicit preference between rules, plus a requirement to prove (Type1) or fail to prove (Type2) a rule body. It reports wrong proofs behind correct labels. — [BoardgameQA HTML](https://arxiv.org/html/2306.07934v1)
- **PrOntoQA-OOD** marks the boundaries of subproofs with fixed words ("Suppose", "This contradicts with", "Therefore"). — [Saparov et al. 2023](https://arxiv.org/html/2305.15269)
- **ATOMIC** names the causal or mental link of every if-then edge with one of nine relation labels (xIntent, xEffect, …). — [ar5iv 1811.00146](https://ar5iv.labs.arxiv.org/html/1811.00146)
- **SimpleLogic** stores label, proof depth and generator origin ("From: LP") with every item. — [ar5iv 2205.11502](https://ar5iv.labs.arxiv.org/html/2205.11502)
- **The current project corpus already follows this layout.** It uses five fixed templates with rule ids R-TRANS, R-INHERIT, R-EXCEPT, R-CHECK and R-ADD, each with its own regex parser that the verifier "reuses … to lift text back into triples". R-EXCEPT uses `but the x cannot a . so the x cannot a .` (local file `src/routes/train-transformer/reasoning-corpus.ts`, read locally only).

### Inferences
- **Line roles and the parse each one needs:**

  | Role | Surface form | Lifts to |
  |---|---|---|
  | fact | `the x is a c .` / `the x is not a c .` / `it rained .` | `(x is c ±)` / `(rain happened +)` |
  | rule | `a c can a .` / `if p and q then r .` / `rain wets the grass .` | `c → a`, `p ∧ q → r`, `cause(rain, grass wet)` |
  | closure | `nothing else wets the grass .` | the cause set is closed |
  | preference | `the penguin rule wins .` | `prefer(r2, r1)` |
  | question | `can the x a ?` / `did it rain ?` / `had it not rained , …?` / `why ?` / `is this consistent ?` | query plus mode: see / do / imagine / explain / check |
  | verdict | `yes` / `no` / `unknown` / `paradox` / `maybe` | recomputed by the solver |
  | because | `because <premise restated>` or `<c1> to <c2> to <c3>` | must string-match a premise in the same window, or be a valid path |

- **The verifier's check is three steps.**
  1. Parse every premise.
  2. Recompute the verdict with the solver for that rule id.
  3. Confirm that the `because` tail is a premise that actually appears in the window and lies on the solver's proof.

  A model that outputs the right verdict with an irrelevant `because` gets flagged as "right label, wrong reason", the BoardgameQA failure mode. Restating the premise in the tail (ProntoQA style) makes step 3 a string match, with no ids to learn.
- **Keep a mixed corpus share, so standalone facts and rules are not only ever seen inside question frames.** A suggested split by tokens:
  - About 20% bare fact and rule lines. These give the Physics-of-LMs surface variety the earlier note recommended, e.g. `a penguin cannot fly .` on its own.
  - About 60% full units across the 15 types.
  - About 20% minimal-pair partners of those units: contrast, mirrored and counterfactual twins placed in adjacent windows.

  These proportions are my suggestion, not from a source. Weight negation, contrapositive and unknown above deduction (see Q3).
- **Mode words make the query type explicit, which is the CLadder rung lesson in miniature.** `did it rain ?` (see), `had it not rained , …?` (imagine) and `why ? maybe …` (explain/abduce) let the symbolic layer pick a solver, and let an evaluation report accuracy per rung or type. Do not reuse `if` for both rule bodies and counterfactual questions; use `had … not` for counterfactuals so the parser can tell them apart.
- **Record metadata outside the training text, as CLadder's meta and SimpleLogic's "From:" do.** Keep rule id, depth, generator (rule-first / label-first), name tier (commonsense / anti / nonsense) and pair id in a side table, not in the 32-token window. This mirrors the project's existing `Unit = { rule, text }` shape.
- **Never leave a false or unsupported statement standing alone.** The earlier note made this point. It applies doubly to the new types. In `tweety is a bird . so tweety can fly . then we learn tweety is a penguin . so tweety cannot fly .`, the retracted conclusion must always be followed by its revision in the same window. Otherwise next-token training learns "tweety can fly" as a fact.

### Gaps
- No published work evaluates a `because <restated premise>` tail against id-based proofs for tiny models. The recommendation rests on ProntoQA's parseability argument and the cost of identifier tokens.
- The suggested 20/60/20 share is untested. No source gives an optimal ratio of bare facts to reasoning units at this scale.
