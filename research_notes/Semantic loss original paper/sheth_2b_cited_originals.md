# Sheth, Roy & Gaur (2023), category 2(b) "intertwined" lifting: which originals they cite, and what those papers do

Primary source: Sheth, A., Roy, K., Gaur, M. (2023). "Neurosymbolic Artificial Intelligence (Why, What, and How)". *IEEE Intelligent Systems* 38(3), pp. 56–62, doi:10.1109/MIS.2023.3268724. The local copy is `docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf`. Its text was extracted with `pdftotext -layout`, and Fig. 1, which is an image, was rendered from page 58 with `pdftoppm`. Page numbers below are the journal page numbers.

Local source link used below: [Sheth2023-local](file:///Users/nedpham/Projects/neural_symbolic_nlp/docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf), DOI [10.1109/MIS.2023.3268724](https://doi.org/10.1109/MIS.2023.3268724).

---

## Q1. Which numbered references does Sheth et al. cite in the 2(b) paragraph and in Fig. 1?

### Takeaway
The 2(b) text paragraphs cite **no references at all**. Fig. 1's 2(b) box names two method families, each with one example, and uses no reference numbers. Only one of those examples, **PK-iL**, maps to a numbered reference: **ref. 10**, Roy et al. 2022, arXiv:2204.12560. Ref. 10 is cited from the caption of Fig. 4, which is the paper's worked example of a 2(b) pipeline. The other example, "Prob. Programs", has **no citation anywhere** in the paper. The paper has only 10 references in total.

### Cited Findings
**How category 2 and its 2(b) subcategory are defined (p. 57–58, verbatim):**
- "2) methods that extract information from neural patterns to allow for mapping to structured symbolic knowledge (lifting) and perform symbolic reasoning." — [Sheth2023-local, p. 57](https://doi.org/10.1109/MIS.2023.3268724)
- "We also spatiocategorize 2) into methods that employ a) decoupled integration between the neural and symbolic components and b) intertwined integration between the neural and symbolic components." — [Sheth2023-local, p. 58](https://doi.org/10.1109/MIS.2023.3268724)

**The 2(b) text, algorithm level (p. 60, verbatim; no reference numbers):**
- "Category 2) b) methods use pipelines similar to those in category 2) a) federated pipelines, however, they possess the added ability to fully govern the learning of all pipeline components through end-to-end differential compositions of functions that correspond to each component. This level of control enables us to attain the necessary levels of cognition on aspects of abstraction, analogy, and planning, which are appropriate for the given application [(H) in Figure 1] while still preserving large-scale perception capabilities. Figure 4 shows an example of this method for mental health diagnostic assistance." — [Sheth2023-local, p. 60](https://doi.org/10.1109/MIS.2023.3268724). The word "differential" (not "differentiable") is the paper's own.

**The 2(b) text, application level (p. 60–61, verbatim; no reference numbers):**
- "Category 2) b) methods show significant promise as they score highly regarding all application-level aspects, including user explainability, domain constraints, scalability across use cases, and support for continual adaptation to application-specific changes [(H) in Figure 1]. This is due to the high modeling flexibility and closely intertwined coupling of system components. Thus, a change in any particular component leads to positive changes in all components within the system's pipeline. Notably, in an implemented system for the mental health diagnostic assistance use case, shown in Figure 4, we see drastic improvements in expert satisfaction with the system's responses, further demonstrating the immense potential for 2) b) category methods." — [Sheth2023-local, p. 60–61](https://doi.org/10.1109/MIS.2023.3268724)

**Fig. 1, the 2(b) box (p. 58; transcribed from the rendered figure because it is not in the PDF text layer):**
- Left box: "Intertwined Integration between Neural and Symbolic Components".
- Right box: "1. Program Abstraction Induction Methods (e.g., Prob. Programs) 2. End-to-End Differentiable Methods (e.g., PK-iL) …"
- Scores. Algorithm level: "Large-scale Perception (H) 2. Abstraction (H) 3. Analogy (H) 4. Planning (H)". Application level: "User-Explainability (H) 2. Domain Constraints (H) 3. Scalability (H) 4. Continual (H)".
- Source: [Sheth2023-local, Fig. 1, p. 58](https://doi.org/10.1109/MIS.2023.3268724)
- The Fig. 1 caption expands the abbreviations only and cites nothing: "Prob. Programs: probabilistic programs; PK-iL: process knowledge infused learning." — [Sheth2023-local, p. 58](https://doi.org/10.1109/MIS.2023.3268724)

**Fig. 4, the only reference attached to the 2(b) example (p. 61, verbatim):**
- "FIGURE 4. Pipeline that is fully differentiable from end to end. It consists of a composition of functions corresponding to various pipeline components. … trainable map functions are applied to raw data, converting them to concepts in the domain model. The example given in the figure relates to mental health diagnosis and conversational assistance. The map functions link fragments of raw data to decision variables in the diagnosis model, which are then used to apply constraints to the patient's response generated by the text generation model. The results from an existing implementation demonstrate that expert satisfaction levels reached 70% using such a pipeline, compared to 47% with LLMs in federated pipelines, such as OpenAI's text-Davinci-003.10" — [Sheth2023-local, p. 61](https://doi.org/10.1109/MIS.2023.3268724)

**Reference entry 10 (verbatim):**
- "10. K. Roy et al., "Process knowledge-infused learning for suicidality assessment on social media," 2022, arXiv:2204.12560." — [Sheth2023-local, p. 62](https://doi.org/10.1109/MIS.2023.3268724)

**The other references, none of which is attached to 2(b):**
- Ref. 6, "A. Sheth et al., "Process knowledge-infused AI: Toward user-level explainability, interpretability, and safety," IEEE Internet Comput., vol. 26, no. 5, pp. 76–84, Sep./Oct. 2022, doi: 10.1109/MIC.2022.3182349." It is cited only in "Application-Level Considerations": "…especially in safety-critical applications.6" — [Sheth2023-local, p. 57, 62](https://doi.org/10.1109/MIS.2023.3268724)
- Refs. 8 (TDLR) and 9 (K-Adapter) belong to category 1(a), through the Fig. 2 caption. Ref. 7 (Garcez & Lamb) is a general definition. Refs. 1–5 are Kahneman, AlphaFold, AlphaTensor, Gentner and Bubeck "Sparks". — [Sheth2023-local, p. 62](https://doi.org/10.1109/MIS.2023.3268724)

### Inferences
- In this paper's own terms, the **only original paper attached to 2(b)** is ref. 10, PK-iL. It is linked by name in Fig. 1 ("e.g., PK-iL") and by number in the Fig. 4 caption. The link from the Fig. 1 label "PK-iL" to ref. 10 rests on matching names: the Fig. 1 caption expands PK-iL as "process knowledge infused learning", and the title of ref. 10 is "Process knowledge-infused learning…". Fig. 1 itself has no reference number.
- "Program Abstraction Induction Methods (e.g., Prob. Programs)" is an **uncited** example. Sheth et al. name no specific probabilistic-programming system for it, such as DeepProbLog, Scallop or NeurASP. Following the instruction not to infer category membership from other surveys, no paper was assigned to this slot.
- Ref. 6 is the conceptual parent of PK-iL, since it defines "process knowledge". Sheth et al. cite it, but not in the 2(b) discussion.

### Gaps
- **Where the 70% vs 47% figure comes from.** The Fig. 4 caption attributes "70% … compared to 47% with … text-Davinci-003" to ref. 10, but the arXiv text of ref. 10 contains neither result. The only version is v1, dated 26 Apr 2022. A full-text grep for "davinci" and "satisf" found no matches, and the paper reports classification accuracy/AUC and annotator agreement, not expert satisfaction with generated responses ([arXiv:2204.12560](https://arxiv.org/abs/2204.12560)). The closely related ProKnow paper (Roy et al., arXiv:2305.08010v2, 1 Jun 2023) does not mention text-davinci-003 either. The original source of the 70%/47% numbers could not be identified, and the citation may point to the wrong paper.

---

## Q2. Details of each cited 2(b) paper (and closely linked papers), plus download log

### Takeaway
The paper attached to 2(b) is PK-iL (Roy, Gaur, Zhang & Sheth 2022). It is an open-access arXiv preprint and has been downloaded. PK-iL is a supervised classifier. A fixed expert decision tree (the Columbia Suicide Severity Rating Scale, C-SSRS) is the symbolic structure, and its yes/no nodes are grounded by thresholded embedding similarity between text fragments and the tree's questions. Despite Sheth et al.'s label, the arXiv text does **not** show end-to-end gradient training through the neural encoder. Ref. 6 (Sheth et al. 2022) was also downloaded as the conceptual background.

### Cited Findings

#### (a) Ref. 10, PK-iL, the only 2(b)-attached citation
- **Citation:** Kaushik Roy, Manas Gaur, Qi Zhang, Amit Sheth. "Process Knowledge-infused Learning for Suicidality Assessment on Social Media." arXiv:2204.12560 [cs.AI], v1, 26 Apr 2022 (the only version). No DOI or venue is given on arXiv. — [arXiv abs](https://arxiv.org/abs/2204.12560)
- **Open access:** yes, through arXiv. Saved as `docs/paper/roy-2022-process-knowledge-infused-learning.pdf`. `pdfinfo` reports 7 pages and 1,179,780 bytes. The metadata Title field is empty, so the title was checked from the first-page text: "Process Knowledge-infused Learning for Suicidality Assessment on Social Media". — [arXiv PDF](https://arxiv.org/pdf/2204.12560)
- **Core mechanism (from the paper):**
  - "PK can be viewed as a decision tree". The probability of label y is "a polynomial of the form y = Σ_{l∈Leaves} p_l Π_{i=1}^{Nq} I_yes(q_i)(1 − I_no(q_i))". Here p_l is "the ratio of the number of annotators that chose that path … to the total number of annotators". — [arXiv:2204.12560 §3](https://arxiv.org/abs/2204.12560)
  - I_yes and I_no are grounded neurally. The text representation of a post fragment x_sub and of a question q_i come from an embedding model (word2vec, XLNet, RoBERTa, T5, ERNIE, Longformer). A kernel similarity K(x_sub/|x_sub|, q_i/|q_i|) ≥ ±θ_i decides the answer, with "θ_i … suitably chosen thresholds of accepted high similarity". The OR over fragments is defined as "∨ z_k = (Σ z_k ≥ 0.5)". — [arXiv:2204.12560 §3–4, Eqs. 2–3](https://arxiv.org/abs/2204.12560)
  - Training: "We can then optimize the Bernoulli Loss L for an input post … Since L({θ_i}) is strongly convex, we use Newton's optimization method to learn the parameters". Algorithm 1 updates only θ_i. The embedding model, fragment size and kernel are chosen "by hyperparameter tuning", and the language models are fine-tuned on a suicide-subreddit corpus. — [arXiv:2204.12560 §4–5](https://arxiv.org/abs/2204.12560)
  - Results: PK-iL with a Gaussian kernel beats each embedding baseline. For example, word2vec goes from 75%/69% to 84%/72% accuracy/AUC, and the authors say PK-iL "improves upon the accuracy of the baseline models by upto almost 15% points". The explanation is the tree path plus the matched fragment. — [arXiv:2204.12560 §5, Table 2](https://arxiv.org/abs/2204.12560)
- **Is it end-to-end differentiable?** Sheth et al.'s Fig. 1 files PK-iL under "End-to-End Differentiable Methods" ([Sheth2023-local, p. 58](https://doi.org/10.1109/MIS.2023.3268724)). The PK-iL paper itself never uses the words "differentiable" or "end-to-end": a full-text grep found zero matches ([arXiv:2204.12560](https://arxiv.org/abs/2204.12560)). See Inferences.
- **Relation to semantic loss (Xu et al. 2018):** PK-iL does not cite Xu et al. 2018. A grep for "semantic loss" and "Xu" matched only a reference to "Zhengyan Zhang, Xu Han…" (ERNIE). — [arXiv:2204.12560](https://arxiv.org/abs/2204.12560)

#### (b) Ref. 6, Process Knowledge-Infused AI, cited by Sheth et al. but not attached to 2(b)
- **Citation:** Amit Sheth, Manas Gaur, Kaushik Roy, Revathy Venkataraman, Vedant Khandelwal. "Process Knowledge-Infused AI: Toward User-Level Explainability, Interpretability, and Safety." *IEEE Internet Computing* 26(5):76–84, 2022, doi:10.1109/MIC.2022.3182349. Preprint arXiv:2206.13349, 9 Jun 2022. — [arXiv abs](https://arxiv.org/abs/2206.13349); [ebiquity record](https://ebiquity.umbc.edu/paper/html/id/1036/Process-Knowledge-Infused-AI-Toward-User-Level-Explainability-Interpretability-and-Safety)
- **Open access:** the IEEE version is paywalled. The arXiv preprint and the UMBC MDSOAR copy are open ([MDSOAR](https://mdsoar.org/handle/11603/29561)). The arXiv preprint was saved as `docs/paper/sheth-2022-process-knowledge-infused-ai.pdf`. `pdfinfo` reports 7 pages and 1,144,901 bytes, and the first-page text title is "Process Knowledge-Infused AI: Towards User-level Explainability, Interpretability, and Safety".
- **Core mechanism (position paper, no new algorithm):**
  - It defines process knowledge as the ordered, expert-defined procedures that guide decisions: clinical practice guidelines, PHQ-9, GAD-7, C-SSRS and DASH-diet guidance.
  - It contrasts process knowledge with other knowledge forms. A knowledge graph "is structured but not ordered", so it "can support context capture but cannot enforce conceptual flow". Semantic lexicons "add constraints but cannot enforce conceptual flow". Ontologies can enforce order.
  - It argues that infusing process knowledge "into statistical AI would yield a new class of neuro-symbolic algorithms" and points to PK-iL as the example. It states the guiding question: "What if we could use the annotator's labels and the process or guidelines used to label them and explicitly control the learning of a model to recover the guideline or process (instead of implicitly)."
  - Source: [arXiv:2206.13349](https://arxiv.org/abs/2206.13349)
- **End-to-end differentiable?** The paper does not address this. It is a conceptual and position paper ([arXiv:2206.13349](https://arxiv.org/abs/2206.13349)).
- **Relation to semantic loss:** none. It mentions "statistical loss functions that quantify uncertainty" only in passing and does not cite Xu et al. ([arXiv:2206.13349](https://arxiv.org/abs/2206.13349))

#### (c) Related but NOT cited by Sheth et al.: ProKnow (lead only, not downloaded to the repository)
- **Citation:** Kaushik Roy, Manas Gaur, Misagh Soltani, Vipula Rawte, Ashwin Kalyan, Amit Sheth. "ProKnow: Process Knowledge for Safety Constrained and Explainable Question Generation for Mental Health Diagnostic Assistance." arXiv:2305.08010 (v2, 1 Jun 2023). — [arXiv abs](https://arxiv.org/abs/2305.08010v2). A PMC record ([PMC9869802](https://pmc.ncbi.nlm.nih.gov/articles/PMC9869802)) came up in the same search, but I did not check whether it is ProKnow's journal version, so its venue is unconfirmed.
- **Why it matters:** Sheth et al.'s Fig. 4 describes a diagnosis model that constrains a text-generation model for mental health. That matches ProKnow more closely than it matches PK-iL, which only classifies.
- **Mechanism:** ProKnow uses "a search algorithm mounted over pre-trained LMs that explicitly compares the generated question against the ProKnow-data ground-truth questions, Safety Lexicon, and a knowledge base (KB). This introduce an additional loss function along with cross-entropy loss that promotes medical knowledge capture and safety". In Algorithm 1, each candidate next question's score adds four terms: LM probability, a Tag/Rank-order heuristic, KB-similarity concept capture, and a safety-lexicon penalty. "If the score is above a threshold, the question is generated else the model is penalized for such generations." — [arXiv:2305.08010v2 §3](https://arxiv.org/abs/2305.08010v2)
- **Not downloaded to `docs/paper/`**, because Sheth et al. do not cite it and the task restricts downloads to Sheth-cited 2(b) papers. A scratch copy was used only to check its text.

#### Download log
| File | Source | Status |
|---|---|---|
| `docs/paper/roy-2022-process-knowledge-infused-learning.pdf` | https://arxiv.org/pdf/2204.12560 | Valid PDF, 7 pp. This is the **2(b)-attached citation (ref. 10)**. |
| `docs/paper/sheth-2022-process-knowledge-infused-ai.pdf` | https://arxiv.org/pdf/2206.13349 | Valid PDF, 7 pp. This is ref. 6: Sheth-cited and the conceptual parent of PK-iL, but **not** attached to 2(b). |
| none | "Prob. Programs" | Not downloaded because Sheth et al. cite no paper for it. |
| none | Xu et al. 2018 | Not downloaded, as instructed. Not cited by Sheth et al. (see Q3). |
| none | ProKnow (arXiv:2305.08010) | Not placed in the repository because it is not cited by Sheth et al. Open access if wanted later. |

No paywalled 2(b) originals had to be skipped, because the one cited 2(b) original is on arXiv. Only the IEEE Internet Computing version of ref. 6 is paywalled, and its arXiv preprint was used instead.

### Inferences
- **PK-iL's "end-to-end differentiable" label is not supported by its own text.** As printed, the yes/no indicators are hard threshold comparisons (≥ ±θ_i), and the fragment OR is a hard step (Σ ≥ 0.5). Gradients with respect to θ_i through step functions are zero almost everywhere. The paper does not explain how it computes the gradient and Hessian with respect to θ_i used in its Newton step. The encoder is fine-tuned separately rather than through the tree loss. PK-iL is better described as a neural grounding of a fixed symbolic tree, with a few learned thresholds. Sheth et al.'s "end-to-end differentiable" description in Fig. 1 and Fig. 4 reads as an aspiration or architectural ideal, not as something the cited preprint demonstrates.
- **Structural kinship with semantic loss.** PK-iL's Eq. 1 sums, over the tree paths that satisfy a label, the product of per-node yes/no truth values. That is the same "sum over satisfying assignments of products of per-variable values" shape as the weighted model count that semantic loss takes the negative log of (Xu et al. 2018, [arXiv:1711.11157](https://arxiv.org/abs/1711.11157)). There are three differences:
  - PK-iL uses hard 0/1 indicators where semantic loss uses soft probabilities.
  - PK-iL weights paths by annotator agreement p_l.
  - PK-iL uses this quantity as the **predictor**, whereas semantic loss is a **regularizer** added to a task loss.
  
  If PK-iL's indicators were replaced with sigmoid probabilities, Eq. 1 would become a differentiable weighted model count over the tree's DNF. The model would then be both closer to semantic loss and genuinely end-to-end differentiable. This is my own observation and is not stated in either paper.
- **Mapping to the TypeScript transformer project (semantic-loss term + "lift" step):**
  - *PK-iL is a "lift" step.* It maps neural evidence (fragment embeddings) onto discrete symbols (yes/no answers at process-knowledge nodes), then reasons symbolically over a fixed structure (tree path to label). The project's lift is similar: high-probability next tokens become candidate triples, which are checked against a Horn-rule KB.
  - *Key difference:* in PK-iL the symbolic structure is fixed and never grows, and the check is "does a path through the tree exist", not "is this fact consistent with the rules". PK-iL has no counterpart to "add the triple to the KB if consistent".
  - *Semantic-loss analogue:* PK-iL does not regularize the encoder with the knowledge. The knowledge is used only at the output. The project's semantic-loss term, which pushes next-token probabilities toward KB-consistent outputs during training, has no counterpart in PK-iL.
  - *ProKnow* (uncited, see (c)) is the closer analogue. It scores candidate generations against a KB and a safety lexicon, penalizes violations through "an additional loss function along with cross-entropy", and gates generation on a threshold. That is roughly "semantic-loss-like penalty + consistency-checked lift". However, its KB check is lexical or embedding similarity, not Horn-rule entailment.
- Of the two families in Sheth et al.'s 2(b) box, "Program Abstraction Induction (e.g., Prob. Programs)" is conceptually closer to the project's Horn-rule KB, since probabilistic logic programs operate over rules. Sheth et al. give no example paper for it, so a reader of this survey alone has no 2(b) original in the logic-program style.

### Gaps
- PK-iL's training details are under-specified. The paper does not show how ∇θ and ∇²θ are computed through the threshold indicators. As printed, the "Bernoulli Loss" is written in terms of P(Y=y|X=x) alone, P log P + (1−P) log(1−P), with no explicit target-label term or minus sign. That may be a typo in the preprint and could not be resolved from the text.
- No peer-reviewed version of PK-iL (arXiv:2204.12560) was found during this research. Only one search was spent on venues, so a later published version cannot be ruled out.
- Which probabilistic-programming works Sheth et al. had in mind for "Prob. Programs" cannot be determined from the paper.

---

## Q3. Does Sheth et al. cite Xu et al. 2018 (semantic loss) anywhere?

### Takeaway
**No.** Sheth et al. (2023) never cite Xu et al. 2018, "A Semantic Loss Function for Deep Learning with Symbolic Knowledge" (ICML 2018), and never use the phrase "semantic loss". The reference list has exactly 10 entries, and none of them is Xu et al.

### Cited Findings
- The full reference list (refs 1–10) is: Kahneman 2011; Jumper et al. 2021 (AlphaFold); Fawzi et al. 2022; Gentner 1983; Bubeck et al. 2023; Sheth et al. 2022 (IEEE Internet Computing); Garcez & Lamb 2023; Roy et al. 2022 (TDLR); Wang et al. 2020 (K-Adapter); Roy et al. 2022 (PK-iL). — [Sheth2023-local, p. 62](https://doi.org/10.1109/MIS.2023.3268724)
- A case-insensitive grep of the extracted full text for "Xu", "semantic loss" and "loss" found no occurrence of "Xu" or "semantic loss". The only match for "loss" is "lossy compression" in the category 1(a) discussion. — [Sheth2023-local, p. 58](https://doi.org/10.1109/MIS.2023.3268724)
- The closest wording to a loss-based constraint is in the Fig. 4 caption, where map functions' outputs "are then used to apply constraints to the patient's response generated by the text generation model". It gives no loss formulation and no citation besides ref. 10. — [Sheth2023-local, p. 61](https://doi.org/10.1109/MIS.2023.3268724)
- Neither of the two downloaded Roy/Sheth papers cites Xu et al. 2018 either ([arXiv:2204.12560](https://arxiv.org/abs/2204.12560); [arXiv:2206.13349](https://arxiv.org/abs/2206.13349)).

### Inferences
- Any project write-up that places a semantic-loss term under Sheth et al.'s 2(b) category is an **interpretation by the project author**, not a classification Sheth et al. make. One defensible framing is that semantic loss provides the "end-to-end differential composition" that Sheth et al.'s 2(b) text calls for, which PK-iL does not deliver in its printed form. The project should cite Xu et al. 2018 directly and state that this mapping is its own.

### Gaps
- The text layer of Fig. 1 was not extractable, so the figure was read from a rendered image. No reference numbers are visible anywhere inside Fig. 1.
