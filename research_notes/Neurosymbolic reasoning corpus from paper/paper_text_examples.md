# Simple raw-text reasoning examples in Sheth, Roy and Gaur (2023), "Neurosymbolic AI: Why, What, and How"

Source: local PDF `docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf` (IEEE Intelligent Systems 38(3), May/June 2023, doi 10.1109/MIS.2023.3268724). It has **7 PDF pages, which are journal pages 56–62**. Citations below give both, e.g. "PDF p4 / p59". The link `[PDF pN]` points to `../../docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf#page=N`.

Method notes:
- The body text was extracted with `pdftotext`. The PDF's text layer drops the "f" glyph (for example "Artiicial", "unctions"), so quotes below have the "f" restored. Nothing else was changed.
- **Figures 1–4 are raster images with no text layer.** Their text was transcribed by rendering pages 3–6 at 300 dpi and reading the crops. Treat figure quotes as careful transcriptions, not copy-paste.
- "[PARAPHRASE]" marks wording that is mine. "[AUTHORED]" marks rules or sentences I wrote that the paper implies but does not state.
- Nothing was uploaded. The only web query was one public-concept check (C-SSRS, Fig. 4).

[PDF p1]: ../../docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf#page=1
[PDF p2]: ../../docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf#page=2
[PDF p3]: ../../docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf#page=3
[PDF p4]: ../../docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf#page=4
[PDF p5]: ../../docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf#page=5
[PDF p6]: ../../docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf#page=6
[PDF p7]: ../../docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf#page=7

## What concrete text examples, sentences, triples or scenarios appear in the paper (page by page)?

### Takeaway
This is a short position paper. It has only **three concrete worked examples, and all three are in figures**: Fig. 2, a fruit knowledge graph (Apple / Grape / Watermelon, `has` antioxidants, `is_a` Fruit) with a 3×3 attention mask; Fig. 3, the NYC→LA driving-time query solved as 41 + 1 = 42 by search plus Wolfram Alpha; and Fig. 4, a mental-health post mapped through a clinical decision tree to a constrained response. Everything else is a one-line illustration in prose: words/digits/colors, next word and digits, health care/criminal justice/autonomous driving, and the three logic families. **The most likely "Image #14" is the Fig. 2 path list**: `1. Antioxidants has⁻¹ Apple is_a Fruit / 2. Antioxidants has⁻¹ Grape is_a Fruit / 3. Watermelon is_a Fruit`. It is the only short, simple, raw-text example in the paper. The runner-up is the Fig. 3 sub-question `What is 1 + the number of hours it takes to go from NYC,USA to LA, USA?` → `1 + 41 = 42`.

### Cited Findings

**E1. Abstract: perception vs cognition, safety constraints (PDF p1 / p56)**
- Exact: "Humans interact with the environment using a combination of perception—transforming sensory inputs from their environment into symbols, and cognition—mapping symbols to knowledge about the environment or supporting abstraction, reasoning by analogy, and long-term planning." — [PDF p1]
- Exact: "machine perception … refers to large-scale pattern recognition from raw data using neural networks trained using self-supervised learning objectives such as next-word prediction or object recognition." — [PDF p1]
- Exact: "For example, humans can follow and explain the guidelines and safety constraints driving their decision making in safety-critical applications such as health care, criminal justice, and autonomous driving." — [PDF p1]
- Reasoning type: safety-constraint checking plus explanation. No concrete rule is given; the domains are named only.
- Symbolic explanation: the answer is allowed or blocked because guideline G applies, and the guideline is cited as the reason. [PARAPHRASE of the paper's claim]

**E2. System 1 / System 2 (Kahneman) (PDF p1 / p56)**
- Exact: "System 1 is crucial for enabling individuals to make sense of the vast numbers of raw data they encounter in their environment and convert them into meaningful symbols (e.g., words, digits, and colors) that can be used for further cognitive processing. System 2 performs more conscious and deliberative higher-level functions (e.g., reasoning and planning). It uses background knowledge to position the perception module's output accurately, enabling complex tasks such as analogy, reasoning, and long-term planning." — [PDF p1]
- Exact: "Together, these systems enable people to see, comprehend, and act, following their knowledge of the environment." — [PDF p1]
- Reasoning type: perception→symbol→knowledge lookup. The symbol types are concrete ("words, digits, and colors"), but no worked sentence is given.

**E3. Neural perception tasks and successes (PDF p1–p2 / p56–57)**
- Exact: "high performance on self-supervision tasks such as predicting the next word and recognizing digits." — [PDF p1]
- Exact: "impressive solutions to challenging problems, including protein folding, efficient matrix multiplication, and solving complex puzzles." — [PDF p2]
- Reasoning type: none (perception only). This is useful as the contrast class: the next-word prediction a tiny transformer does.

**E4. Analogy via knowledge structures (PDF p2 / p57)**
- Exact: "knowledge enables humans to engage in cognitive processes beyond what is explicitly stated in available data. For example, humans make analogical connections between concepts in similar abstract contexts through mappings to knowledge structures that spell out such mappings." (cites Gentner 1983, structure-mapping) — [PDF p2]
- Exact: "The hypothesis is that next-word prediction from many texts on the Internet can lead to an emergent "cognitive model" of the world that the neural network can use to support cognition." — [PDF p2]
- **No concrete analogy pair is given.** It is a claim with an "e.g." but no instance.

**E5. Why-box and the definition of the two categories (PDF p2 / p57)**
- Exact (sidebar "Why Neurosymbolic Artificial Intelligence?"): "Embodying intelligent behavior in an artificial intelligence system must involve both perception, processing raw data and cognition, using background knowledge to support abstraction, analogy, reasoning, and planning. Symbolic structures represent this background knowledge explicitly." — [PDF p2]
- Exact: "To ensure rigorous safety standards, it is necessary to incorporate appropriate background knowledge to set guardrails during training rather than as a posthoc measure. Symbolic knowledge structures can provide an effective mechanism for imposing domain constraints for safety, and explicit reasoning traces for explainability." — [PDF p2]
- Exact categories: "1) methods that compress structured symbolic knowledge to integrate with neural patterns and reason using the integrated neural patterns, and 2) methods that extract information from neural patterns to allow for mapping to structured symbolic knowledge (lifting) and perform symbolic reasoning." — [PDF p2]

**E6. Formal-logic families named (PDF p3 / p58)**
- Exact: "Category 1) b) methods use matrix and higher-order tensor-factorization methods to obtain compressed representations of objects and formal logic statements that describe the relationships between them (such as propositional logic, first-order logic, and second-order situation calculus)." — [PDF p3]
- **No example statements are given.** Any propositional, FOL or situation-calculus sentence would be [AUTHORED].

**E7. Figure 1, the taxonomy (PDF p3 / p58).** This is a classification figure with no example sentences. The exact method labels are:
- 1a "Compressed Knowledge Graph Representation Based Methods": "1. Knowledge Graph Embedding Based Methods (e.g., K-Adapter) 2. Knowledge Graph Mask Based Methods (e.g., TDLR)"
- 1b "Compressed Logic Representation Based Methods": "1. Propositional Logic (e.g., KB-ANN) 2. First-Order Logic (e.g., Logical Neural Networks)"
- 2a "Decoupled Integration between Neural and Symbolic Components": "1. Federated Pipeline Methods (e.g., Langchain Pipelines) 2. Serialized Pipeline Methods (e.g., Wolfram + ChatGPT)"
- 2b "Intertwined Integration between Neural and Symbolic Components": "1. Program Abstraction Induction Methods (e.g., Prob. Programs) 2. End-to-End Differentiable Methods (e.g., PK-iL)" — [PDF p3]
- Caption, exact: "The two primary types of neurosymbolic techniques, lowering and lifting, can be further divided into four subcategories." — [PDF p3]

**E8. Figure 2, the fruit knowledge graph (PDF p4 / p59). Most likely "Image #14".**
- Graph panel labelled "Background Knowledge". The node labels, transcribed: "Apple", "Grape", "Watermelon", "has", "Antioxidants", "is_a", "Fruit". — [PDF p4]
- Path list under the graph (exact transcription; the superscript is "−1"):
  ```
  1. Antioxidants has⁻¹ Apple is_a Fruit
  2. Antioxidants has⁻¹ Grape is_a Fruit
  3. Watermelon is_a Fruit
  ```
  — [PDF p4]
- Panel "Inductive Bias-level Structured Knowledge Compression": a 3×3 mask over (Apple, Grape, Watermelon), added ("+") to an attention-like matrix:
  ```
              Apple  Grape  Watermelon
  Apple         1      1       0
  Grape         1      1       0
  Watermelon    0      0       1
  ```
  — [PDF p4]
- Panel "Representation-level Structured Knowledge Compression": Apple, Grape and Watermelon vectors are summed ("+ … =") into one vector. — [PDF p4]
- Caption, exact: "Two methods for compressing knowledge graphs that integrate them with neural processing pipelines. One approach involves embedding knowledge graph paths into vector spaces, enabling integration with the neural network's hidden representations. The other method involves encoding knowledge graphs as masks to modify the neural network's inductive biases. An example of an inductive bias is the correlation information stored in the self-attention matrices of a transformer neural network." — [PDF p4]
- Related prose: "Knowledge graph-compression methods can still be utilized to apply domain constraints, such as specifying modifications to pattern correlations in the neural network, as depicted in Figure 2." — [PDF p4]
- Reasoning type: KG lookup, 2-hop path (attribute + taxonomy), and shared-attribute similarity, which becomes the mask.

**E9. Figure 3, the federated pipeline (NYC→LA) (PDF p5 / p60)**
- User query box, exact: "Assuming it takes an hour to prepare for the drive, how much time should be allotted for the total journey by car from NYC, USA to LA, USA?" — [PDF p5]
- Node: "LLM-API with Chain-of-Thought Reasoning". — [PDF p5]
- Decomposed sub-queries, exact (the double space after "hours" is in the original):
  - "What is 1 + the number of hours it takes to go from NYC,USA to LA, USA?" → "Wolfram Alpha-API" → "1 + 41 = 42"
  - "How many hours  does it take to drive from NYC, USA to LA, USA?" → "Google Serp-API" → "41 hours" — [PDF p5]
- Final answer, exact: "The driving time from New York City to Los Angeles is approximately 41 hours. If you add the one hour for preparation time, then you should allot around 42 hours for the total journey by car from NYC to LA." — [PDF p5]
- Code panel, exact: `tools = load_tools(["serpapi","llm-math"],llm=llm)`, `agent="zero-shot-react-description"`, `federated_agent.run(query)`. The API key is shown as "REDACTED API KEY". — [PDF p5]
- Caption, exact: "The method employs a language model trained on chain-of-thought reasoning to segment the input query into tasks. The language model then utilizes task-specific symbolic solvers to derive solutions. Specifically, the language model recognizes that search and scientific computing (mathematics) symbolic solvers are necessary for the given query. The resulting solutions are subsequently combined and transformed into natural language for presentation to the user." — [PDF p5]
- Reasoning type: task decomposition, fact lookup, arithmetic, then composition. The project already implements this as `R-ADD` in `src/routes/train-transformer/reasoning-corpus.ts`, whose header cites Fig. 3.

**E10. Figure 4, PK-iL mental-health pipeline (PDF p6 / p61). Sensitive content.**
- Header: "Map_Function(X = query, Z = concept, Θ1)". — [PDF p6]
- Concept callouts, exact: "Snomed Concept: Health Related Behavior Finding"; "Snomed Concept: Intrusive Thoughts"; "DSM-5 Definition: Obsessive-compulsive disorder is a disorder in which people have obsessive, intrusive thoughts, ideas or sensations that make them feel driven to do something repetitively"; "Suicidality Concept: Non-specific active suicidal thoughts". — [PDF p6]
- Post text, partly hidden by the callouts in the figure itself: "Really struggling w[…] […] obsessive, intrusive thoughts, and need to get out of my head. I have been there and got nothing same as my life. I have a gun. I'm not on a ledge or something but i have a gun on my lap." — [PDF p6]
- Decision tree, exact node labels:
  - "Wish to be Dead": True → "Non-Specific Active Suicidal Thoughts"; False → "Suicidal Indication (Y)"
  - "Non-Specific Active Suicidal Thoughts": True → "Active Suicidal Ideation with Any Methods"; False → "Suicidal Ideation (Y)"
  - "Active Suicidal Ideation with Any Methods": True → "Suicidal Behavior or Attempt (Y)"; False → "Suicidal Ideation (Y)" (the leaf highlighted green)
  - Footer: "Y = Expert_Defined_Domain_Model(X = query, Z = concept)" — [PDF p6]
- Constraint box, exact: "Response Constraints. If (Y in {Suicidality: [Ideation, Behavior, Attempt]}), Output: "Please reach out to a mental health professional, such as a therapist or counselor, who can provide you with the tools and resources to cope with your thoughts and emotions healthily. If you are in immediate danger of harming yourself, please call your local emergency services or the nearest emergency room for immediate help. You can also contact a suicide prevention hotline, such as the National Suicide Prevention Lifeline, at 1-800-273-8255 for support and guidance."" — [PDF p6]
- Generator: "Constrained_Response_Generation_Model = Π(Y, Θ2)", fed by "Continual Process Knowledge-infused Learning (PKiL)". — [PDF p6]
- Bar chart: "Recorded Expert Agreement using Generated Responses", "LLMs" 47%, "PkiL" 70%. Side text: "User-explainability i.e., Clinicians and Patients + Domain Constraints Verify adherence to the clinical guideline on diagnosis which a clinician understands." — [PDF p6]
- Caption, exact (excerpt): "The map functions link fragments of raw data to decision variables in the diagnosis model, which are then used to apply constraints to the patient's response generated by the text generation model. The results from an existing implementation demonstrate that expert satisfaction levels reached 70% using such a pipeline, compared to 47% with LLMs in federated pipelines, such as OpenAI's text-Davinci-003." — [PDF p6]
- The PK-iL source paper (ref. 10) labels Reddit posts with the Columbia Suicide Severity Rating Scale (C-SSRS): ideation, behavior, attempt. — [arXiv 2204.12560](https://arxiv.org/pdf/2204.12560)

**E11. Conclusion: KGs are easy to update; guardrails as KGs (PDF p6–p7 / p61–62)**
- Exact: "Knowledge graphs are suitable for symbolic structures that bridge the cognition and perception aspects because they support real-world dynamism. Unlike static and brittle symbolic logics, such as first-order logic, they are easy to update." — [PDF p6]
- Exact: "future knowledge graphs have the potential to model heterogeneous types of application- and domain-level knowledge beyond schemas. This includes workflows, constraint specifications, and process structures" — [PDF p6]
- Exact: "We believe that guidelines, policy, and regulations can be encoded via extended forms of knowledge graphs such as those shown in Figure 4 (and hence, symbolic means), which in turn can provide explainability accountability, rigorous auditing capabilities, and safety." — [PDF p7]

### Inferences
- **Image #14 is most likely the Fig. 2 path list** (E8). The task asks for "a short, simple text example". Fig. 2's three lines are the only short, self-contained raw-text data in the paper; Fig. 3 is longer and Fig. 4 is long and clinical. The project's `reasoning-corpus.ts` already cites Fig. 3 (R-ADD), so a new screenshot is more likely to point at something not yet used. If it is not Fig. 2, the next candidates are the Fig. 3 sub-question/`1 + 41 = 42` box, then the Fig. 3 final-answer paragraph.
- Ranked by usefulness as raw training text for a tiny model: E8 (triples) > E9 (decomposed arithmetic) > E10 tree, as an abstract structure only > E1/E2/E4/E6, which are concept claims and need authored instances.
- How a symbolic layer explains each answer [AUTHORED]:
  - E8: "apple is like grape because both have antioxidants (path 1, path 2); watermelon shares no attribute in this graph, so its mask entry is 0."
  - E9: "fact: NYC→LA = 41 h (search); math: 1 + 41 = 42 (calculator); answer: 42 h."
  - E10: "branch taken: Wish to be Dead = True → Non-Specific Active Suicidal Thoughts = … → leaf Y = Suicidal Ideation; Y ∈ {Ideation, Behavior, Attempt}, so the response constraint fired."

### Gaps
- The Fig. 4 post is partly hidden by overlaid callouts in the published figure, so the full sentence cannot be recovered from this PDF.
- The hotline number in Fig. 4 (1-800-273-8255) reflects 2023 publication. Whether it is current was not checked; verify before reusing it anywhere.
- The paper gives no concrete analogy pair (E4), no logic statements (E6), and no criminal-justice or driving rule (E1). All instances for those are [AUTHORED].
- I cannot see the user's "Image #14", so the identification is an inference.

## Which paper categories (e.g. lowering/lifting, federated pipelines, fully integrated, knowledge-guided) does each example illustrate?

### Takeaway
The paper ties each figure to one category: Fig. 2 → **1a lowering** (KG embedding and KG mask), Fig. 3 → **2a decoupled/federated lifting**, Fig. 4 → **2b intertwined, end-to-end differentiable (PK-iL)**. **No figure illustrates 1b** (compressed logic). The prose examples (E1, E2, E4, E5, E11) motivate all categories and are not tied to one.

### Cited Findings
- 1a, KG compression, Fig. 2: "One approach is to use knowledge graph-embedding methods … The other approach is to use knowledge graph-masking methods, which encode the knowledge graphs in a way suitable for integration with the inductive biases of the neural network. Figure 2 illustrates the two approaches." Ratings: perception H; abstraction/analogy/planning M "due to lossy compression of the full semantics in the knowledge graph (e.g., relationships are not modeled effectively in compressed representations)". — [PDF p3]
- 1a application level: explainability L, constraints M, scalability and continual H. — [PDF p4]
- 1b, compressed logic: "computationally inefficient and do not facilitate large-scale perception [(L) …]"; application level all L because "End users must familiarize themselves with the rigor and details of formal logic semantics". — [PDF p3], [PDF p4]
- 2a, federated, Fig. 3: "These methods utilize neural networks to identify symbolic functions based on task descriptions … Once the symbolic function is identified, the method transfers the task to the appropriate symbolic reasoner, such as a math- or fact-based search tool. Figure 3 illustrates a federated pipeline method". Cognition M, "restricted by the language model's comprehension of the input query". — [PDF p4], [PDF p5]
- 2a application level: "tracing their chain of thought during processing immensely enhances the application-level aspects of user explainability" (M); constraints "in natural language using prompt templates" (M); scalability H; continual L. — [PDF p5]
- 2b, intertwined, Fig. 4: "possess the added ability to fully govern the learning of all pipeline components through end-to-end differential compositions of functions … Figure 4 shows an example of this method for mental health diagnostic assistance." All H. — [PDF p5], [PDF p6]

Summary table (categories from the paper; example mapping from the paper for Figs. 2–4, [AUTHORED] for the prose examples):

| Example | Category | Basis |
|---|---|---|
| E8 Fig. 2 fruit KG, triples + mask | 1a (embedding and mask) | paper, p59 |
| E9 Fig. 3 NYC→LA, 41 + 1 | 2a federated pipeline | paper, p59–60 |
| E10 Fig. 4 decision tree + response constraint | 2b end-to-end differentiable (PK-iL) | paper, p60–61 |
| E6 logic families | 1b (named, no example) | paper, p58 |
| E1 safety guidelines; E11 guardrails as KGs | constraint / "knowledge-guided"; the paper points to Fig. 4 (2b) | paper, p62 |
| E2 System 1/2 | motivates the split: neural = System 1, symbolic = System 2 | paper, p56–57 |
| E4 analogy | cognition target; rated M (1a, 1b, 2a) vs H (2b) | [AUTHORED] mapping |

### Inferences
- In the project's terms (`docs/progress/04-neurosymbolic-design.md`), Fig. 2's mask panel is the closest analogue to the planned M1 logit mask. That doc already says so ("1a-style by analogy"). Fig. 3 maps to the existing R-ADD template and to M4, a post-hoc verifier (2a). Fig. 4's "Response Constraints" box is the paper's clearest instance of a rule gating generated output, i.e. M1/M3 behaviour.
- The paper never uses the words "lowering" in the body; only the Fig. 1 caption says "lowering and lifting". Category 1 is called "compress…"; "lifting" appears in the definition of category 2.

### Gaps
- The paper does not say which subtype the prose examples (E1, E2, E4) belong to. My mapping is interpretive.
- No 1b worked example exists, so a "compressed logic" training item cannot be quoted.

## What rules, facts or constraints does each example imply, written out as raw natural-language sentences?

### Takeaway
Fig. 2 yields 6 facts and 2 derivable similarity rules. Fig. 3 yields 2 facts and 1 arithmetic rule. Fig. 4 yields a 3-question decision procedure and 1 output constraint. The prose examples yield only [AUTHORED] rules. All sentences below are **[AUTHORED] restatements** of the quoted material in E1–E11, except where marked "stated".

### Cited Findings
Source material for each block: E8 [PDF p4], E9 [PDF p5], E10 [PDF p6], E1 [PDF p1], E11 [PDF p6]–[PDF p7].

**From E8 (Fig. 2).** Facts, read off the triples ("has⁻¹" read as the inverse of "has"):
- "an apple is a fruit." / "a grape is a fruit." / "a watermelon is a fruit." (stated as `is_a`)
- "an apple has antioxidants." / "a grape has antioxidants." (stated as `Antioxidants has⁻¹ Apple`, `… Grape`)
- Rules [AUTHORED]:
  - "if x is an apple then x is a fruit." (taxonomy)
  - "if x and y both have antioxidants then x is like y." This is the rule that generates mask entries 1 for apple–grape.
  - "if x is a fruit then x is food." (needed to link to the corpus's "fruit and vegetables are healthy food")
- Constraint (mask), read off the matrix: "apple may attend to grape." / "grape may attend to apple." / "watermelon may attend only to watermelon."
- **Caution:** the 0 for watermelon reflects only this toy graph (closed-world). Do not author "a watermelon has no antioxidants" or "a watermelon cannot have antioxidants" as world facts.

**From E9 (Fig. 3).**
- Facts: "the drive from nyc to la takes forty one hours." (search result, stated as 41 hours) / "getting ready takes one hour." (stated premise)
- Rule: "if a trip has parts then the total time is the sum of the parts." [AUTHORED; the paper states "1 + 41 = 42"]
- Conclusion (stated): "you should allot around 42 hours for the total journey."

**From E10 (Fig. 4)**, abstracted, keeping the paper's node labels:
- "if wish to be dead is false then the label is suicidal indication."
- "if wish to be dead is true and non-specific active suicidal thoughts is false then the label is suicidal ideation."
- "if non-specific active suicidal thoughts is true and active suicidal ideation with any methods is false then the label is suicidal ideation."
- "if active suicidal ideation with any methods is true then the label is suicidal behavior or attempt."
- Output constraint (stated as code-like text): "if the label is ideation, behavior or attempt then the reply must point to a mental health professional and emergency help."
- Definitional fact (stated DSM-5 text): "obsessive-compulsive disorder is a disorder in which people have obsessive, intrusive thoughts …"
- Concept mapping (stated): "intrusive thoughts" in the post maps to the Snomed concept "Intrusive Thoughts".

**From E1 / E5 / E11** (no concrete rules in the paper; all [AUTHORED] templates):
- "the system must follow the guideline." / "if a rule forbids an answer then the system cannot give that answer." / "every answer must name the rule it follows." These mirror "explicit reasoning traces for explainability" and "imposing domain constraints for safety".
- Updatability (E11): "a fact in the graph can be changed. after the change the old answer is wrong."

**From E2 / E3 / E4 / E6** ([AUTHORED]):
- System 1: "the eye sees a red shape. the shape is an apple." System 2: "an apple is a fruit, so the apple is food."
- Analogy (structure mapping): "a is to b as c is to d if a relates to b the same way c relates to d."
- Propositional: "if it rains then the ground is wet." FOL: "every fish can swim." Situation calculus: "after the king gives the crown to the prince, the prince has the crown."

### Inferences
- Fig. 2 supports three relation types that fit the planned `symbolic.ts` relation set (`is_a`, `has`, and a derived `like`/`similar_to`). Fig. 4 adds a new relation kind, the ordered **decision procedure** (if/else chain). It does not reduce to a single Horn rule without the negated conditions, which the doc 04 Horn-rule interface (`if: Triple[]`) does not express.
- Fig. 3's rule is exactly the existing `R-ADD`. Fig. 2's taxonomy is the same shape as the existing `R-TRANS`/`R-INHERIT`, just over fruit instead of animals.

### Gaps
- The paper does not explain how the 3×3 mask is computed from the graph. "Shared `has` attribute → 1, plus the diagonal" is my reading of the figure, not a stated algorithm.
- The Fig. 4 tree's True/False semantics follow the arrows as drawn. Which leaf the example post reaches is shown only by the green highlight on "Suicidal Ideation (Y)"; the path is not stated.

## Which examples could be rewritten into the simple lowercase, short-sentence style of corpus.ts? (2–3 sample rewrites per example)

### Takeaway
Fig. 2 and Fig. 3 rewrite cleanly. Fig. 2 can be rewritten either with its own words (adding apple, grape, watermelon, antioxidants) or by swapping the structure onto existing corpus vocabulary (cat/dog/fish, which already share "pet"). Fig. 4 should **only** be rewritten as a neutral structural analogue (doctor / sick / hospital), not verbatim. Its crisis content is unsuitable for a toy generative corpus. The prose examples need authored instances, but those fit the corpus easily.

### Cited Findings
- Corpus style reference: `src/routes/train-embed/corpus.ts` uses lowercase, no punctuation beyond periods in stories, sentences like "the cat sat on the mat", "a dog is a loyal pet", "fruit and vegetables are healthy food", "the doctor works at the hospital", "the nurse helps the doctor". "apple", "grape", "watermelon", "antioxidants", "hour" and "city" do **not** occur in `corpus.ts`. "fruit", "food", "doctor", "hospital" and "sick" do. (local file, read directly)
- `reasoning-corpus.ts` already defines R-TRANS, R-INHERIT, R-EXCEPT, R-CHECK and R-ADD, with the template `question : … fact : … math : … answer : …` for R-ADD. (local file)
- doc 04 lists candidate relations `is_a`, `lives_in`, `can`, `cannot`, `opposite_of`, `agrees_with`. (`docs/progress/04-neurosymbolic-design.md`)

Sample rewrites (all [AUTHORED]):

| Ex. | Rewrites in corpus style | Symbolic explanation the layer would give |
|---|---|---|
| E8 Fig. 2, own words | "an apple is a fruit" · "a grape is a fruit and a grape has antioxidants" · "the apple and the grape both have antioxidants so the apple is like the grape" | `is_a(apple,fruit)`; `has(apple,antioxidants)`, `has(grape,antioxidants)` → `like(apple,grape)` |
| E8, in existing vocab | "a cat is a pet . a dog is a pet . the cat is like the dog" · "a fish is an animal . a fish is not a pet" [authored fact] · "the cat and the dog are pets so they are alike" | mask analogue: cat↔dog = 1, fish↔cat = 0, because of a shared `is_a(·,pet)` |
| E8, chain | "a watermelon is a fruit . fruit is healthy food . so a watermelon is healthy food" | `R-TRANS`: is_a(watermelon,fruit) ∧ is_a(fruit,food) |
| E9 Fig. 3 | "the boy needs one hour to get ready . the walk from the village to the sea is six hours . so the trip is seven hours" · existing R-ADD form: "question : ready in one hour , then village to sea . how long ? fact : village to sea is six hours . math : one plus six is seven . answer : seven hours ." · "the king needs two hours to dress . the castle to the river is three hours . the king needs five hours" | fact (lookup) + math (add) → answer; trace names `R-ADD` |
| E10 Fig. 4, neutral analogue only | "the boy is sick . a sick boy must see the doctor" · "is the boy sick ? yes . is the boy very sick ? no . so the boy sees the doctor at home" · "if the boy is very sick then the nurse must call the doctor and take him to the hospital" | decision chain: sick? → very sick? → leaf; output constraint "must see the doctor" fired by the label |
| E1 safety | "the car must stop at the red light" · "if the light is red then the car cannot go" · "the doctor must follow the rules of the hospital" | constraint rule blocks the forbidden token ("go") after "red light"; this is the M1 mask |
| E2 System 1/2 | "the girl sees a red fruit . the red fruit is an apple" (perception→symbol) · "an apple is a fruit so the girl can eat it" (symbol→knowledge) · "the boy sees the number two" | step 1 = neural label; step 2 = KB lookup `is_a(apple,fruit)` |
| E3 next word | "the cat sat on the mat" (already in corpus) · "the dog sat on the rug" | none; pure perception baseline |
| E4 analogy | "the king is to the queen as the prince is to the princess" · "the cat is to the kitten as the dog is to the puppy" · "a man is to a boy as a woman is to a girl" | shared relation: `opposite_of(king,queen)` ↔ `opposite_of(prince,princess)`; `baby_of(kitten,cat)` ↔ `baby_of(puppy,dog)` |
| E6 logic | propositional: "if rain falls then the river is full" · FOL: "every fish can swim . a salmon is a fish . so a salmon can swim" · situation: "the king gives the crown to the prince . now the prince has the crown" | modus ponens / `R-INHERIT` / state update |
| E11 update | "a penguin is a bird . a bird can fly . but a penguin cannot fly" · "update : the bear now lives in the zoo . the bear does not live in the forest" | exception overrides default (`R-EXCEPT`); KG edit invalidates the old fact |

### Inferences
- **Best new material from the paper for this project: E8 (Fig. 2).** It adds a second taxonomy domain (food/fruit) and an attribute relation (`has`), and its mask panel shows the paper's own picture of what M1 does. Using the in-vocab cat/dog/pet version avoids adding rare tokens to the tiny BPE vocabulary. Using the apple/grape version keeps fidelity to the figure. A mix is possible.
- E9 is already covered by R-ADD. More E9 items mostly add data, not a new reasoning type.
- E10 contributes a **reasoning shape** (ordered yes/no questions → label → constrained reply) that the current rule set lacks. Reuse that shape with neutral vocabulary. Verbatim Fig. 4 text would teach a tiny generative model fragments of crisis language and a possibly outdated hotline number with no benefit.
- E4's analogy rewrites line up with the Skip-gram analogy probes the corpus was built for (king − man + woman ≈ queen), so they double as an embedding test set.

### Gaps
- Whether adding apple/grape/watermelon/antioxidants hurts the tiny model (BPE fragmentation, sparse counts) was not measured; it is a hypothesis for the implementation chapter.
- No paper text supports "fish is not a pet" or the traffic-light rules; they are purely authored. Tag them as such in the corpus if they are added.
