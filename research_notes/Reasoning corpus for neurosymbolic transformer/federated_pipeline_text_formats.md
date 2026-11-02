# Federated neuro-symbolic pipelines and plain-text reasoning-trace formats (from Sheth, Roy and Gaur 2023, Fig. 3)

Method note: the local PDF was processed only on this machine, with `pdftotext -layout` for the body text and `pdftoppm` for the Figure 3 image, which pdftotext cannot read. Nothing from it was sent to any external service. The arXiv papers below were downloaded as public PDFs into a scratch directory and grepped locally, so every format example below is copied verbatim from the primary source. Citation for the local paper: A. Sheth, K. Roy, M. Gaur, "Neurosymbolic Artificial Intelligence (Why, What, and How)", IEEE Intelligent Systems 38(3):56–62, May/June 2023, [doi:10.1109/MIS.2023.3268724](https://doi.org/10.1109/MIS.2023.3268724). Page numbers are the journal's printed page numbers. Figure 3 is on p. 60.

## Q1. What does the paper say about category 2a (federated pipelines) and its explainability? What exactly does Figure 3 show?

### Takeaway
Sheth et al. define category 2a ("federated pipelines") as an LLM that sees which symbolic function a task needs and hands that sub-task to a separate symbolic solver, such as a math tool or a fact-based search tool. Their Figure 3 builds one with a LangChain `zero-shot-react-description` agent using `serpapi` and `llm-math`. For explainability, the paper rates 2a "(M)", medium. Tracing the chain of thought "immensely enhances" user explainability, but the LM's own parse of the query limits that benefit. The paper says nothing about the text format of the trace.

### Cited Findings
- **Taxonomy (p. 57):** category 2 is "methods that extract information from neural patterns to allow for mapping to structured symbolic knowledge (lifting) and perform symbolic reasoning". Category 2 splits into "a) decoupled integration between the neural and symbolic components and b) intertwined integration between the neural and symbolic components" (p. 58). [Sheth et al. 2023](https://doi.org/10.1109/MIS.2023.3268724)
- **Algorithm-level paragraph on 2a (pp. 59–60), verbatim:** "For category 2) a), the proliferation of large language models and their corresponding plug-ins has spurred the development of federated pipeline methods. These methods utilize neural networks to identify symbolic functions based on task descriptions that are specified using appropriate modalities such as natural language and images. Once the symbolic function is identified, the method transfers the task to the appropriate symbolic reasoner, such as a math- or fact-based search tool. Figure 3 illustrates a federated pipeline method that utilizes the Langchain library. These methods are proficient in supporting large-scale perception through the large language model [(H) in Figure 1]. However, their ability to facilitate algorithm-level functions related to cognition, such as abstraction, analogy, reasoning, and planning, is restricted by the language model's comprehension of the input query [(M) in Figure 1]." [Sheth et al. 2023](https://doi.org/10.1109/MIS.2023.3268724)
- **Figure 3 caption (p. 60), verbatim:** "FIGURE 3. Federated pipeline method using the Langchain library. The method employs a language model trained on chain-of-thought reasoning to segment the input query into tasks. The language model then utilizes task-specific symbolic solvers to derive solutions. Specifically, the language model recognizes that search and scientific computing (mathematics) symbolic solvers are necessary for the given query. The resulting solutions are subsequently combined and transformed into natural language for presentation to the user. LLM-API: large language model-application program interface." [Sheth et al. 2023](https://doi.org/10.1109/MIS.2023.3268724)
- **Application-level paragraph on 2a (p. 60), verbatim:** "For the systems belonging to category 2) a), tracing their chain of thought during processing immensely enhances the application-level aspects of user explainability. However, the language model's ability to parse the input query and relate it to domain-model concepts during response generation limits this ability [(M) in Figure 1]. Furthermore, the specification of domain constraints in natural language using prompt templates also limits the constraint-modeling capability, which depends on the language model's ability to comprehend application- or domain-specific concepts [(M) in Figure 1]. Federated pipelines excel in scalability because language models and application plug-ins that facilitate their use for domain-specific use cases are becoming more widely available and accessible [(H) in Figure 1]. Unfortunately, language models require an enormous amount of time and number of space resources to train, and hence, continual domain adaptation using federated pipelines remains challenging [(L) in Figure 1]." [Sheth et al. 2023](https://doi.org/10.1109/MIS.2023.3268724)
- **Contrast with 2b (p. 60):** 2b methods "use pipelines similar to those in category 2) a) federated pipelines, however, they possess the added ability to fully govern the learning of all pipeline components through end-to-end differential compositions of functions". The Figure 4 caption reports "expert satisfaction levels reached 70% using such a pipeline, compared to 47% with LLMs in federated pipelines, such as OpenAI's text-Davinci-003." [Sheth et al. 2023](https://doi.org/10.1109/MIS.2023.3268724)
- **Why symbolic structures help explainability (p. 57):** "Symbolic knowledge structures can provide an effective mechanism for imposing domain constraints for safety, and explicit reasoning traces for explainability." [Sheth et al. 2023](https://doi.org/10.1109/MIS.2023.3268724)
- **Figure 3 contents, transcribed from the rendered image (the boxes contain no extractable text):**
  - Code box (the API key is shown redacted in the figure):
    ```
    os.environ["SERPAPI_API_KEY"] = [REDACTED API KEY]
    tools = load_tools(["serpapi","llm-math"],llm=llm)
    #see list of agent types such as "zero-shot-react-description" in the langchain documentation
    federated_agent = initialize_agent(tools,
                                       llm,
                                       agent="zero-shot-react-description")
    #enter a query
    query = """Assuming it takes an hour to prepare for the drive,
            how much time should be allotted for the total journey by car from NYC, USA to LA, USA?"""
    #run the federated agent
    federated_agent.run(query)
    ```
  - Query box: "Assuming it takes an hour to prepare for the drive, how much time should be allotted for the total journey by car from NYC, USA to LA, USA?" The query goes to the box "LLM-API with Chain-of-Thought Reasoning".
  - Math sub-question: "What is 1 + the number of hours it takes to go from NYC,USA to LA, USA?" goes to "Wolfram Alpha-API" and returns "1 + 41 = 42". In the figure, "41" is boxed and "the number of hours it takes to go from NYC,USA to LA, USA" is outlined with a dashed box.
  - Search sub-question: a dashed arrow leads from that outlined span to "How many hours does it take to drive from NYC, USA to LA, USA?", which goes to "Google Serp-API" and returns "41 hours". The boxed 41 flows back up into the math expression.
  - Recombined LLM output: "The driving time from New York City to Los Angeles is approximately 41 hours. If you add the one hour for preparation time, then you should allot around 42 hours for the total journey by car from NYC to LA."
  - Right-hand header box: "Federated Pipeline Methods".
  - [Sheth et al. 2023, Fig. 3](https://doi.org/10.1109/MIS.2023.3268724)

### Inferences
- The figure's decomposition is nested, not sequential. The math sub-question contains the search sub-question as a placeholder ("1 + *the number of hours…*"), and the search result (41) is substituted into it. In a flat text trace this becomes: search step first, then a math step whose operand is copied from the search step's result. A verifier can check that copy explicitly, by testing that the math operand equals the fact's object.
- The code uses LangChain's `llm-math` tool, but the diagram labels that solver "Wolfram Alpha-API". The figure is therefore a schematic of the idea, not a literal log of the run. The paper never shows the agent's actual Thought/Action/Observation text.
- The paper rates explainability (M) because the trace is free natural language produced by the same LM that misparses queries. That supports a project design in which every step is fixed-template text a rule-based parser can check, rather than free CoT.

### Gaps
- The paper gives no textual trace format, no tool-call syntax and no evaluation of trace faithfulness. The real LangChain log for this query is not reproduced.
- "41 hours" is the search engine's figure as shown in the paper. I did not check it independently, and it does not matter for the format question.

## Q2. How do CoT, scratchpads, Self-Ask, ReAct, Toolformer, PAL and the LangChain zero-shot-react agent write intermediate steps in text? (verbatim examples)

### Takeaway
The formats range from no structure at all (CoT: free prose) to fully machine-executable (PAL: Python). In between are line-prefix tags (Self-Ask, ReAct, LangChain) and inline bracketed calls with the result spliced in (Toolformer). Only Toolformer, ReAct/LangChain and Self-Ask mark which "solver" produced a span, and they do it with fixed prefix tokens.

### Cited Findings
- **Chain-of-Thought (Wei et al., 2022).** Definition: "A chain of thought is a series of intermediate natural language reasoning steps that lead to the final output." Prompts are triples ⟨input, chain of thought, output⟩. Verbatim exemplar: `Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?` / `A: Roger started with 5 balls. 2 cans of 3 tennis balls each is 6 tennis balls. 5 + 6 = 11. The answer is 11.` The only fixed markers are `Q:`, `A:` and `The answer is`. The paper also notes that a "generated chain of thought is not always factual". — [Wei et al. 2022, arXiv:2201.11903](https://arxiv.org/abs/2201.11903)
- **Scratchpads (Nye et al., 2021).** Intermediate steps are written as text between `<scratch>` and `</scratch>` tags, and the final answer follows the closing tag. Verbatim long-addition target (Fig. 2):
  ```
  Input:
  2 9 + 5 7
  Target:
  <scratch>
  2 9 + 5 7 , C: 0
  2 + 5 , 6 C: 1 # added 9 + 7 = 6 carry 1
  , 8 6 C: 0 # added 2 + 5 + 1 = 8 carry 0
  0 8 6
  </scratch>
  8 6
  ```
  "The carry is recorded in the digit following 'C:'. Comments (marked by #) are added for clarity and are not part of the target." Digits are separated by spaces, one token per digit. The program-trace variant uses `line:` / `state:` pairs, for example `line: output = remove_Occ("PHP","P")`. The paper says "we encode the intermediate steps of the algorithm as text and use standard supervised training", and that scratchpads helped decoder-only Transformers "in the fine-tuning regime" with better out-of-distribution length generalisation. — [Nye et al. 2021, arXiv:2112.00114](https://arxiv.org/abs/2112.00114)
- **Self-Ask (Press et al., 2022).** Verbatim (Fig. 1):
  ```
  Question: Who was president of the U.S. when superconductivity was discovered?
  Are follow up questions needed here: Yes.
  Follow up: When was superconductivity discovered?
  Intermediate answer: Superconductivity was discovered in 1911.
  Follow up: Who was president of the U.S. in 1911?
  Intermediate answer: William Howard Taft.
  So the final answer is: William Howard Taft.
  ```
  With a search engine plugged in, the follow-up becomes `Query: What is the current tallest wooden lattice tower?`, the engine returns `Response: Radio Tower Gliwice`, and that response is written back as `Intermediate answer: Radio Tower Gliwice.` Footnote: "In smaller models, ending the prompt with the additional 'Are follow up questions needed here: Yes. Follow up:' improves performance". The abstract says "the model explicitly asks itself (and answers) follow-up questions before answering the initial question". — [Press et al. 2022, arXiv:2210.03350](https://arxiv.org/abs/2210.03350)
- **ReAct (Yao et al., 2022/ICLR 2023).** The action space is "(1) search[entity] … (2) lookup[string] … (3) finish[answer]". Verbatim FEVER trace (appendix), which includes a refutation:
  ```
  Claim:          Bermuda Triangle is a loosely-defined region in the Pacific Ocean.
  Thought 1:      I need to search Bermuda Triangle and find if it is in the Pacific Ocean.
  Action 1:       Search[Bermuda Triangle]
  Observation 1:  Reportedly haunted locations...
  Thought 2:      The observation says that it is in the western part of the North Atlantic
                  Ocean, so it is not in the Pacific Ocean.
  Action 2:       Finish[REFUTES]
  Observation 2:  Episode finished
  ```
  A not-enough-info case ends with `Thought 3: It does not mention Soyuz, so I am not sure if this claim is true or not.` / `Action 3: Finish[NOT ENOUGH INFO]`. The paper motivates ReAct by "issues of hallucination and error propagation in chain-of-thought reasoning". — [Yao et al. 2022, arXiv:2210.03629](https://arxiv.org/abs/2210.03629)
- **LangChain zero-shot-react-description (MRKL prompt, the agent used in Fig. 3).** Verbatim format instructions from `langchain/agents/mrkl/prompt.py` (v0.0.150, around the paper's date):
  ```
  Question: the input question you must answer
  Thought: you should always think about what to do
  Action: the action to take, should be one of [{tool_names}]
  Action Input: the input to the action
  Observation: the result of the action
  ... (this Thought/Action/Action Input/Observation can repeat N times)
  Thought: I now know the final answer
  Final Answer: the final answer to the original input question
  ```
  The prefix is "Answer the following questions as best you can. You have access to the following tools:" and the suffix is "Begin!\n\nQuestion: {input}\nThought:{agent_scratchpad}". — [LangChain v0.0.150 mrkl/prompt.py](https://raw.githubusercontent.com/langchain-ai/langchain/v0.0.150/langchain/agents/mrkl/prompt.py)
- **Toolformer (Schick et al., 2023).** API calls are linearised inline as `<API> a_c(i_c) → r </API>`. "In practice, we use the token sequences ' [', ']' and '->' to represent '<API>', '</API>' and '→'", so that no new vocabulary is needed. Verbatim examples (Fig. 1): `Out of 1400 participants, 400 (or [Calculator(400 / 1400) → 0.29] 29%) passed the test.` · `The New England Journal of Medicine is a registered trademark of [QA("Who is the publisher of The New England Journal of Medicine?") → Massachusetts Medical Society] the MMS.` · `The name derives from "la tortuga", the Spanish word for [MT("tortuga") → turtle] turtle.` At inference the model decodes "until M produces the '→' token". The API then runs and its result is inserted. API calls are kept in training data only if they reduce the LM loss on the following tokens. The tools are a calculator, a Q&A system, two search engines, a translation system and a calendar. — [Schick et al. 2023, arXiv:2302.04761](https://arxiv.org/abs/2302.04761)
- **PAL, Program-aided LMs (Gao et al., 2022).** PAL "offloads the solution step to a runtime such as a Python interpreter". The Figure 2 close-up interleaves NL and code: `A: Roger started with 5 tennis balls.` / `tennis_balls = 5` / `2 cans of 3 tennis balls each is` / `bought_balls = 2 * 3` / `tennis balls. The answer is` / `answer = tennis_balls + bought_balls`. The appendix shows the full function form `def solution(): """Shawn has five toys. ...""" toys_initial = 5 / mom_toys = 2 / dad_toys = 2 / total_received = mom_toys + dad_toys / total_toys = toys_initial + total_received / result = total_toys / return result`. — [Gao et al. 2022, arXiv:2211.10435](https://arxiv.org/abs/2211.10435). Program of Thoughts uses the same idea ("PoT relegates some computation to an external process (a Python interpreter)"). — [Chen et al. 2022, arXiv:2211.12588](https://arxiv.org/abs/2211.12588)
- **ProofWriter (Tafjord et al., 2021)**, the closest published match to a triple-liftable trace. The context lists facts and rules with ids (`triple1: Anne is white. … rule1: If someone is rough and young then they are blue.`). The proof output cites them by id: `$answer$ = True ; $proof$ = # sent7@int1 & sent16 # sent8@int2 … ; with int1: The lion is not nice. ; int2: The tiger is not red. …` — [Tafjord et al. 2021, arXiv:2012.13048](https://arxiv.org/abs/2012.13048)

### Inferences
- An illustrative LangChain trace for the Fig. 3 query would look like this, in the MRKL format above: `Thought: I need to find the driving time … Action: Search / Action Input: driving time NYC to LA / Observation: 41 hours / Thought: I need to add 1 hour … Action: Calculator / Action Input: 1 + 41 / Observation: Answer: 42 / Thought: I now know the final answer / Final Answer: …`. **This is my reconstruction, not a quoted log.** The tool display names "Search" and "Calculator" for `serpapi`/`llm-math` come from memory of LangChain's `load_tools` and were not checked against source.
- Three ways of attributing a span to a solver recur across these papers:
  - Line-prefix tags: Self-Ask `Follow up:`/`Intermediate answer:`; ReAct/LangChain `Action:`/`Observation:`.
  - Inline call-and-result brackets: Toolformer `[Tool(args) → result]`.
  - Executable code: PAL/PoT.
  All three put the solver identity in a fixed position, so a parser can dispatch on it without understanding the surrounding prose.

### Gaps
- I did not fetch the current LangChain docs. LangChain has since deprecated `initialize_agent` in favour of LangGraph-based agents, but I did not check the current API, and the v0.0.150 prompt is the one relevant to a 2023 figure.
- None of these papers studies tiny from-scratch models (d=32, 32-token context). Every result is for large pretrained LMs, or for fine-tuned models in the case of scratchpads.

## Q3. Which formats are easiest for a rule-based parser to lift into (relation, subject, object) triples or arithmetic checks? Should the corpus use tags like `question :`, `fact :`, `math :`, `answer :`, `claim :`?

### Takeaway
From easiest to hardest for a regex parser to lift: (1) fixed-template steps with a one-word solver tag, as in ProofWriter and Toolformer's call → result; (2) Self-Ask pairs; (3) ReAct/LangChain Action lines, whose Thought lines are free text; (4) PAL, which is checkable by execution but not liftable to triples; (5) free CoT. **Recommendation:** use one-word lowercase tags followed by a separate ` : ` token. Use one tag per solver, and write one closed sentence per step in a fixed template. Do not use brackets, step numbers, multi-word tags or code.

### Cited Findings
- Toolformer separates the call from its result with dedicated markers (`[`, `]`, `->`) and stops decoding at `→` so the tool supplies `r`. The tool's output span is therefore always identifiable, and checking it is trivial. — [Schick et al. 2023](https://arxiv.org/abs/2302.04761)
- Self-Ask's follow-up / intermediate-answer pairing exists so that "our structure allows us to easily plug in a search engine to answer the follow-up questions". Each `Follow up:` is a sub-query and each `Intermediate answer:` is its result. — [Press et al. 2022](https://arxiv.org/abs/2210.03350)
- In ReAct, only Actions are structured (`search[entity]`, `lookup[string]`, `finish[answer]`). Thoughts are free text. The paper's own error analysis lists "Hallucinated reasoning trace or facts" as a failure category. — [Yao et al. 2022](https://arxiv.org/abs/2210.03629)
- Scratchpad traces are deterministic algorithm states: one line per step, digits space-separated, carry after a fixed `C:` marker. Each line can be recomputed and compared. — [Nye et al. 2021](https://arxiv.org/abs/2112.00114)
- PAL/PoT make arithmetic fully checkable by running it ("offloads the solution step to a runtime such as a Python interpreter"). The cost is variable names, `=`, `*`, `def` and docstrings. — [Gao et al. 2022](https://arxiv.org/abs/2211.10435); [Chen et al. 2022](https://arxiv.org/abs/2211.12588)
- ProofWriter writes facts and rules as short templated English sentences with ids, and proofs as id chains. Every intermediate (`int1: The lion is not nice.`) is a single templated sentence. — [Tafjord et al. 2021](https://arxiv.org/abs/2012.13048)
- Self-Ask reports that small models need the prompt to end with the literal tag prefix ("Are follow up questions needed here: Yes. Follow up:"). That suggests weaker models depend on explicit tags to enter the decomposition format. — [Press et al. 2022](https://arxiv.org/abs/2210.03350)

### Inferences

**Recommended step grammar** (lowercase, every punctuation mark its own token, numbers as single number-words):

| tag | solver it marks (Fig. 3 analogue) | template | lifts to |
|---|---|---|---|
| `question :` | user input | `question : <np> … ?` | nothing; context only |
| `fact :` | search / KB lookup (Google Serp-API) | `fact : <s> to <o> is <n> hours .` / `fact : the <x> is a <y> .` | `(drive_hours, s→o, n)` / `(is_a, x, y)` |
| `math :` | calculator (Wolfram Alpha / llm-math) | `math : <a> plus <b> is <c> .` | check `a + b == c`, and check `b == fact.object` |
| `answer :` | recombination (LLM output) | `answer : <c> hours .` | check `c == math.result` |
| `claim :` | proposition to verify | `claim : the <x> <verb-s> .` | `(can, x, ability)` |
| `so` (verdict) | symbolic verdict | `so the claim is true .` / `… false .` | compare with KB |

- **Arguments for tags.** (a) The parser dispatches on the first two tokens of each step, so it never has to segment free text. This is the same role `Follow up:`/`Action:`/`[Calculator(` play in the papers above. (b) Each tag is one vocabulary item, which matters in a 100–400-token vocabulary. Every tag word must be a whole token: `question`, `fact`, `math`, `answer`, `claim`, `:`. (c) The verifier's job is the same whether the step came from a real tool or from the model's weights. The tag records which solver *should* have produced the step, so the verifier can call that solver (KB lookup or `a+b`) and compare. (d) Tags let the training loss and the evaluation be broken down per step type.
- **Arguments against, or costs.** (a) Each tag costs 2 of the 32 context tokens. (b) A tiny model may learn tag-then-template co-occurrence without learning the content. Tags make the format easy to fit and make content errors easy to *detect*, but they do not make the content right. (c) Unlike Toolformer, nothing at training time separates text the tool would produce from text the model produces. If the corpus is used only for next-token prediction, the model learns to hallucinate `fact :` content too. Two mitigations follow from Toolformer's design: at inference, stop at `fact : <s> to <o> is` and let the KB fill in the object; or, at minimum, have the verifier overwrite or flag it.
- **Avoid:**
  - Brackets and parentheses (Toolformer/ReAct). Each costs extra punctuation tokens, and nesting is hard for a 2–6-layer model.
  - Step numbers (`Thought 1:`). These add numeric tokens and give no information to the verifier.
  - Multi-word tags (`intermediate answer :` is 3 tokens; `are follow up questions needed here : yes .` is 8).
  - Python (PAL). It needs identifiers, `=`, `*`, `def`, quotes and newlines, which blow the vocabulary and the 32-token window.
  - Free CoT prose. It cannot be lifted reliably.
- **Token budget check against the project's current templates** in `src/routes/train-transformer/reasoning-corpus.ts`, counting whitespace-separated tokens and assuming one word = one BPE token, which needs to be confirmed for the trained vocabulary:
  - `claim : the emu flies . the emu is a bird . but the emu cannot fly . so the claim is false .` = 24 tokens. Fits.
  - Pets R-ADD (`question : the <o> has two cats and three dogs . how many pets ? math : two plus three is five . answer : five pets .`) = 28 tokens. Fits.
  - Route R-ADD (`question : ready in one hour , then <a> to <b> . how long ? fact : <a> to <b> is five hours . math : one plus five is six . answer : six hours .`) ≈ 37 tokens. **The whole unit exceeds the 32-token context.** Each step fits on its own (15 / 9 / 8 / 5 tokens). By the time the model emits `answer`, though, the start of the `question` has scrolled out of the window. That is acceptable only because `answer` needs nothing beyond the preceding `math` step. Options: shorten the question (e.g. `question : one hour to get ready , then <a> to <b> . how long ?`), or accept it and document that `answer :` depends only on `math :`.
- **Make the Fig. 3 substitution explicit.** In Fig. 3 the search result 41 is copied into the math expression. Keep the operand order `math : <prep> plus <fact-object> is <sum> .` so the verifier can check two things: an arithmetic identity, and a copy identity with the `fact :` object. The copy check is how a verifier catches a correct sum computed from a wrong fact.

### Gaps
- I found no published work evaluating tag-based reasoning formats on tiny from-scratch transformers of this size. The recommendations about cost per token and learnability are inferences, not findings.
- I did not verify whether the project's word-level BPE keeps `question`, `answer` or `cannot` as single tokens at vocabulary sizes of 100–400.

## Q4. How should a verifiable trace show a wrong or rejected step ("but", "so the claim is false", corrections)? What does the literature on self-verification and claim/evidence/verdict formats say?

### Takeaway
The established pattern is claim → evidence → verdict, with a three-way verdict (FEVER: SUPPORTED / REFUTED / NOT ENOUGH INFO; ReAct writes it as `Finish[SUPPORTS|REFUTES|NOT ENOUGH INFO]`). Self-correction work (Chain-of-Verification, Self-Verification, Self-Refine) adds a draft → check → revise loop. For this corpus: keep `claim : … . <evidence> . so the claim is true|false .` and add `unknown` for claims not in the KB. Show rejected steps only inside a frame that ends in an explicit verdict or correction, never as a bare false statement.

### Cited Findings
- **FEVER (Thorne et al., 2018):** "The claims are classified as SUPPORTED, REFUTED or NOTENOUGHINFO … For the first two classes, the annotators also recorded the sentence(s) forming the necessary evidence for their judgment." The example layout is claim, then evidence sentences each tagged with their source page (`[wiki/Los Angeles County] …`), then `Verdict: Supported`. Example refutation: the claim "Fiji's largest island is Kauai." "can be refuted by retrieving 'Kauai is the oldest Hawaiian Island.' as evidence." — [Thorne et al. 2018, arXiv:1803.05355](https://arxiv.org/abs/1803.05355)
- **ReAct on FEVER** writes the rejection in the Thought, with a contrastive connective, before the verdict action: "The observation says that it is in the western part of the North Atlantic Ocean, so it is not in the Pacific Ocean." → `Finish[REFUTES]`. For missing evidence: "so I am not sure if this claim is true or not." → `Finish[NOT ENOUGH INFO]`. — [Yao et al. 2022](https://arxiv.org/abs/2210.03629)
- **Chain-of-Verification (Dhuliawala et al., 2023)**, four steps verbatim: "1. Generate Baseline Response … 2. Plan Verifications: Given both query and baseline response, generate a list of verification questions … 3. Execute Verifications: Answer each verification question in turn, and hence check the answer against the original response to check for inconsistencies or mistakes. 4. Generate Final Verified Response: Given the discovered inconsistencies (if any), generate a revised response incorporating the verification results." Worked example: the baseline lists Hillary Clinton as born in NY. The verification question "Where was Hillary Clinton born?" is answered "Chicago, Illinois", and she is dropped from the final response. — [Dhuliawala et al. 2023, arXiv:2309.11495](https://arxiv.org/abs/2309.11495)
- **Self-Verification (Weng et al., 2022/2023):** CoT "is highly sensitive to individual mistakes and vulnerable to error accumulation". The method takes "the conclusion obtained by CoT as one of the conditions for solving the original problem" and performs "a backward verification", which yields "interpretable answer validation scores". — [Weng et al. 2022, arXiv:2212.09561](https://arxiv.org/abs/2212.09561)
- **Self-Refine (Madaan et al., 2023)** loops generate → `Feedback:` → refine with the same model. — [Madaan et al. 2023, arXiv:2303.17651](https://arxiv.org/abs/2303.17651)
- **ProofWriter** distinguishes closed-world (CWA) from open-world (OWA) answering. Under OWA a statement can be True, False or Unknown. — [Tafjord et al. 2021](https://arxiv.org/abs/2012.13048)

### Inferences
- **Recommended frames.** Each fits in 32 tokens; the token counts are whitespace counts.
  - Supported: `claim : the eagle flies . the eagle is a bird . a bird can fly . so the claim is true .` (22)
  - Refuted by an exception, with `but` overriding the inherited default: `claim : the emu flies . the emu is a bird . but the emu cannot fly . so the claim is false .` (24). `but` plays the role of ReAct's "so it is not in the Pacific Ocean" Thought. It marks the step at which the default inference is rejected.
  - Not in the KB (FEVER NEI / OWA Unknown): `claim : the kiwi swims . no fact about the kiwi . so the claim is unknown .` This adds the tokens `no`, `about` and `unknown`. Use it only if the symbolic layer can return "unknown". Otherwise the model learns a verdict the verifier never produces.
  - Corrected math step (CoVe-style draft → check → revise): `math : one plus five is seven . check : one plus five is six . so the step is false .` (~20). A `fix :` step is also possible, but it costs a second line and is optional.
- **Rule for negative examples:** never let a false statement appear in the corpus without its refutation inside the same 32-token window. A next-token-prediction model trained on bare wrong steps will learn them as facts. ReAct, FEVER and CoVe all pair the wrong claim with the evidence and the verdict, which is what makes the negative example teach rather than mislead. This is an inference from those formats; no source tests it.
- Keep the verdict word in a fixed slot (`so the claim is <v> .`). The verifier then compares one token to the KB, and the evaluation can report verdict accuracy apart from evidence accuracy, mirroring FEVER's split between label accuracy and evidence recall.
- The literature's verification methods (CoVe, Self-Verification, Self-Refine) rely on a large LM checking itself. For this project the *symbolic layer* is the checker. The corpus only needs to teach the model the trace shape, so the verifier can parse it and label each step `ok` or `rejected`. That is closer to FEVER/ReAct verdict formats than to LLM self-critique.

### Gaps
- I found no study of how training on refuted examples affects tiny LMs, for example whether including `… is seven . … so the step is false .` raises or lowers the rate of wrong sums. This would need an ablation in this project.
- I did not verify the exact Self-Verification prompt template (its masked-condition re-prediction format) beyond the abstract-level description quoted above.
