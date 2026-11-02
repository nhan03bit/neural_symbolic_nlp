# Semantic loss (Xu et al., 2018): the original paper, and whether the project's M5 matches it

Local copies, both checked with `pdfinfo` on 2026-10-31:
- `docs/paper/xu-2018-semantic-loss.pdf`: arXiv 1711.11157v2. Title "A Semantic Loss Function for Deep Learning with Symbolic Knowledge"; authors Jingyi Xu, Zilu Zhang, Tal Friedman, Yitao Liang, Guy Van den Broeck; 14 pages; 504,132 bytes; PDF 1.5. The stamp reads "arXiv:1711.11157v2 [cs.AI] 8 Jun 2018". This is a real PDF.
- `docs/paper/ahmed-2023-pseudo-semantic-loss.pdf`: arXiv 2312.03905v2. 16 pages; 690,226 bytes. The PDF metadata title is empty, but the first page reads "A Pseudo-Semantic Loss for Autoregressive Models with Logical Constraints" (Ahmed, Chang, Van den Broeck), stamped "arXiv:2312.03905v2 [cs.LG] 27 Jan 2024" and "37th Conference on Neural Information Processing Systems (NeurIPS 2023)".

Unless a source says otherwise, every quote below comes from the text of these PDFs, extracted with `pdftotext`.

## Q1. Bibliographic details, licence, and redistribution

### Takeaway
The paper is Xu, Zhang, Friedman, Liang & Van den Broeck, *Proceedings of the 35th ICML*, PMLR vol. 80, pp. 5502–5511, 2018. It is also arXiv:1711.11157, whose current version v2 is the ICML version. Both arXiv papers are under arXiv's default "non-exclusive licence to distribute". That licence lets arXiv distribute the paper and gives third parties no right to redistribute it. A private local copy is fine. **However, the project's GitHub repo is public and `docs/paper/` is tracked in git, so committing these PDFs would be public redistribution.** Keep them out of commits, for example with `.gitignore`, and cite or link them instead.

### Cited Findings
- PMLR BibTeX, quoted exactly: `@InProceedings{pmlr-v80-xu18h, title = {A Semantic Loss Function for Deep Learning with Symbolic Knowledge}, author = {Xu, Jingyi and Zhang, Zilu and Friedman, Tal and Liang, Yitao and Van den Broeck, Guy}, booktitle = {Proceedings of the 35th International Conference on Machine Learning}, pages = {5502--5511}, year = {2018}, editor = {Dy, Jennifer and Krause, Andreas}, volume = {80}, series = {Proceedings of Machine Learning Research}, month = {10--15 Jul}, publisher = {PMLR}, url = {https://proceedings.mlr.press/v80/xu18h.html}}`. The PMLR meta tags give publication date 2018/07/03 and ISSN 2640-3498. PMLR hosts a separate supplementary PDF, `xu18h-supp.pdf`. — [PMLR v80 xu18h](https://proceedings.mlr.press/v80/xu18h.html)
- arXiv history: v1, 29 Nov 2017 (878 KB); v2, 8 Jun 2018 (159 KB). The comment on v2 reads: "This version appears in the Proceedings of the 35th International Conference on Machine Learning (ICML 2018)". Subjects: cs.AI (primary), cs.LG, cs.LO, stat.ML. DOI: https://doi.org/10.48550/arXiv.1711.11157 (an arXiv DOI issued through DataCite; PMLR issues no publisher DOI). — [arXiv abs 1711.11157](https://arxiv.org/abs/1711.11157)
- The arXiv v2 PDF includes the appendices. The ICML main text says "Appendices are included in the supplementary material". In the arXiv PDF the appendices (A–E) come after the references. — [arXiv PDF](https://arxiv.org/pdf/1711.11157)
- Both 1711.11157 and 2312.03905 link to `http://arxiv.org/licenses/nonexclusive-distrib/1.0/` as their licence. — [arXiv abs 1711.11157](https://arxiv.org/abs/1711.11157), [arXiv abs 2312.03905](https://arxiv.org/abs/2312.03905)
- arXiv's description of that licence: "This license gives limited rights to arXiv to distribute the article", and it "limits re-use of any type from other entities or individuals". On copyright in general: "the original copyright holder retains ownership after posting on arXiv". — [arXiv licence help](https://info.arxiv.org/help/license/index.html)
- The original code is at https://github.com/UCLA-StarAI/Semantic-Loss/ (paper footnote 2). The GitHub API reported no licence file for the repo. — [paper PDF](https://arxiv.org/pdf/1711.11157), [GitHub repo](https://github.com/UCLA-StarAI/Semantic-Loss)
- The project's `origin` remote resolves to `nhan03bit/neural_symbolic_nlp`, and the GitHub API reports `"private": false, "visibility": "public"`. `git ls-files docs/paper` shows that the older PDFs in that folder are tracked. The two new PDFs are not ignored. — local `git remote -v`, `git check-ignore`, and [GitHub API](https://api.github.com/repos/nhan03bit/neural_symbolic_nlp)

### Inferences
- A copy kept for personal study on the user's own machine is ordinary reader use. Pushing it to a public GitHub repo is redistribution, which the arXiv licence does not grant to third parties. The safe practice is to add `docs/paper/*.pdf`, or at least these two files, to `.gitignore` and cite the arXiv or PMLR URL in the docs. This is a reading of the licence text, not legal advice.
- Suggested citation: Xu, J., Zhang, Z., Friedman, T., Liang, Y., & Van den Broeck, G. (2018). A Semantic Loss Function for Deep Learning with Symbolic Knowledge. In *Proc. 35th ICML*, PMLR 80:5502–5511. arXiv:1711.11157.

### Gaps
- I did not find a PMLR statement giving the copyright holder for v80 papers; the page footer shows only "Copyright ©". I did not check the PMLR PDF against arXiv v2 page by page. I compared only the metadata and the abstract, which are identical.

## Q2. The exact definition (Definition 1)

### Takeaway
The paper gives **no equation numbers anywhere**. The definition sits inside "Definition 1 (Semantic Loss)" in §3.1, and should be cited as "Definition 1 of Xu et al. (2018)", not as an equation number. The p_i are the probabilities of n Boolean variables, which are sampled *independently*.

### Cited Findings
- Setup, §3.1: "The semantic loss L^s(α, p) is a function of a sentence α in propositional logic, defined over variables X = {X_1, …, X_n}, and a vector of probabilities p for the same variables X. Element p_i denotes the predicted probability of variable X_i, and corresponds to a single output of the neural net." — [paper §3.1](https://arxiv.org/pdf/1711.11157)
- **Definition 1 (Semantic Loss).** "Let p be a vector of probabilities, one for each variable in X, and let α be a sentence over X. The semantic loss between α and p is
  L^s(α, p) ∝ − log Σ_{x ⊨ α} Π_{i: x ⊨ X_i} p_i Π_{i: x ⊨ ¬X_i} (1 − p_i)."
  The formula in the brief is correct. — [paper §3.1](https://arxiv.org/pdf/1711.11157)
- Interpretation: "Intuitively, the semantic loss is proportional to a negative logarithm of the probability of generating a state that satisfies the constraint, when sampling values according to p. Hence, it is the self-information (or "surprise") of obtaining an assignment that satisfies the constraint (Jones, 1979)." — [paper §3.1](https://arxiv.org/pdf/1711.11157)
- The independence assumption is explicit in §3.2: "it corresponds to the probability of obtaining state x after independently sampling each X_i with probability p_i." — [paper §3.2](https://arxiv.org/pdf/1711.11157)
- Output units, §2: "Each value in p represents the probability of an output and falls in [0, 1]. We use both softmax and sigmoid units for our output activation functions." — [paper §2](https://arxiv.org/pdf/1711.11157)
- Use in training, §4.1: "existing loss + w · semantic loss". Appendix C: "we perform a grid search over {0.001, 0.005, 0.01, 0.05, 0.1} … Empirically, 0.005 always gives the best or nearly the best results". The weight was 0.5 for grids and 0.25 for preference learning. — [paper §4.1, App. C](https://arxiv.org/pdf/1711.11157)

### Inferences
- The "∝" in the definition is fixed by Lemma 9 / Theorem 11 to a single positive constant K. In practice, take K = 1 and put the scale into the weight w (λ_s in the project).

### Gaps
- None for the definition. The brief's request to number the equation "as the paper does" cannot be met, because the paper does not number it.

## Q3. Axioms, uniqueness, and computation with circuits (WMC / SDD)

### Takeaway
The main text states four axioms and Appendix A states twelve, partly restating the main-text ones. Together they fix the loss uniquely up to a multiplicative constant (Theorem 1 = Theorem 11). For a general α, the sum in Definition 1 is a weighted model count (WMC). The paper compiles α into a deterministic, decomposable Boolean circuit, citing Darwiche 2011, the SDD paper. It then turns AND into × and OR into +, and evaluates the loss and its gradient in time linear in the size of the circuit.

### Cited Findings
- Main-text axioms, §3.2:
  - **Axiom 1 (Monotonicity)**: "If α ⊨ β, then the semantic loss L^s(α, p) ≥ L^s(β, p) for any vector p."
  - **Axiom 2 (Identity)**: "∀x, L^s(x, x) = 0."
  - **Axiom 3 (Label-Literal Correspondence)**: "L^s(X, p) ∝ − log(p) and L^s(¬X, p) ∝ − log(1 − p)."
  - **Axiom 4 (Differentiability)**: "For any fixed α, the semantic loss L^s(α, p) is monotone in each probability in p, continuous and differentiable."
  - Propositions: **Prop. 2 (Semantic Equivalence)**, "If α ≡ β, then … L^s(α, p) = L^s(β, p)"; **Prop. 3 (Satisfaction)**, "If x ⊨ α, then the semantic loss L^s(α, x) = 0."
  - **Lemma 4**: "L^s(x, p) ∝ − Σ_{i: x⊨X_i} log p_i − Σ_{i: x⊨¬X_i} log(1 − p_i)."
  - **Theorem 1 (Uniqueness)**: "The semantic loss function in Definition 1 satisfies all axioms in Appendix A and is the only function that does so, up to a multiplicative constant." — [paper §3.2](https://arxiv.org/pdf/1711.11157)
- Appendix A, full list: Axiom 5 (Truth), "∀p, L^s(true, p) = 0"; **Axiom 6 (Additive Independence)**, "L^s(α ∧ β, [p q]) = L^s(α, p) + L^s(β, q)" for disjoint variable sets; Prop. 5 (Locality); Axiom 7 (Monotonicity); Prop. 6 (equivalence); Prop. 7 (Non-Negativity); Axiom 8 (Identity); Prop. 8 (Satisfaction, with proof); Axiom 9 (Label-Literal); Axiom 10 (Value Symmetry), "L^s(α, p) = L^s(ᾱ, 1 − p)"; Axiom 11 (Variable Symmetry); Lemma 9 (a single constant K); Lemma 10 (state loss); **Axiom 12 (Exponential Additivity)**, "Let α and β be mutually exclusive sentences … let f^s(K, α, p) = K^{−L^s(α,p)}. Then, there exists a positive constant K such that f^s(K, α ∨ β, p) = f^s(K, α, p) + f^s(K, β, p)"; Theorem 11 (Uniqueness). The proof shows that f^s(K, ·, p) satisfies Kolmogorov's three axioms and is therefore "a probability distribution". — [paper App. A](https://arxiv.org/pdf/1711.11157)
- Tractability, §5.1: "the right-hand side is a well-known automated reasoning task called weighted model counting (WMC) (Chavira & Darwiche, 2008; Sang et al., 2005)". "We use the circuit compilation techniques in Darwiche (2011) to build a Boolean circuit representing semantic loss … we can use it to compute both the values and the gradients of semantic loss in time linear in the size of the circuit (Darwiche & Marquis, 2002)." The reference list entry for Darwiche (2011) is "SDD: A new canonical representation of propositional knowledge bases. In IJCAI, 2011." — [paper §5.1, refs](https://arxiv.org/pdf/1711.11157)
- The circuit-to-arithmetic step: "we can convert it to an arithmetic circuit, by simply changing AND gates into ∗, and OR gates into +, as shown in Figure 4. Now, by pushing the probabilities up through the arithmetic circuit, evaluating the root gives the probability of the logical formula described by the Boolean circuit – this is precisely the exponentiated semantic loss." This works because of "two key properties called determinism and decomposability". A second "pass down on the circuit" computes the partial derivatives. — [paper §5.1](https://arxiv.org/pdf/1711.11157)
- Cost: "for bounded-treewidth constraints it can be done efficiently, and for some constraints exact compilation is theoretically hard". — [paper §5.1](https://arxiv.org/pdf/1711.11157)
- Grid paths are compiled with "the method of Nishino et al. (2017)", a paper titled "Compiling graph substructures into sentential decision diagrams". The code repo ships SDD and vtree files, `complex_constraints/4-grid-all-pairs-sd.sdd` and `permutation-4.sdd`, plus a `pypsdd` submodule. — [paper §5.2](https://arxiv.org/pdf/1711.11157), [GitHub tree](https://github.com/UCLA-StarAI/Semantic-Loss)

### Inferences
- In the paper's own text, "SDD" appears only through the Darwiche (2011) and Nishino et al. (2017) citations and in the code's `.sdd` files. A fair wording is "compiled to an SDD (Darwiche, 2011) and evaluated as an arithmetic circuit".
- For the project, Axiom 6 (additive independence) is what justifies summing per-position losses, but only if positions are treated as independent. See Q6.

### Gaps
- None material.

## Q4. The exactly-one constraint and its closed form

### Takeaway
Under independent Bernoulli outputs, the exactly-one semantic loss is −log Σ_i p_i Π_{j≠i}(1−p_j). The paper says explicitly that a softmax layer already enforces mutual exclusion, so on a categorical output exactly-one holds with probability 1 and its semantic loss is zero. This is why the original code applies the loss to **sigmoid** outputs.

### Cited Findings
- Encoding, §2: "conjoining sentences of the form ¬X_1 ∨ ¬X_2 for all pairs of variables (at most one variable is true), and a single sentence X_1 ∨ · · · ∨ X_n (at least one variable is true)." — [paper §2](https://arxiv.org/pdf/1711.11157)
- Closed form, §4.1 (unnumbered): "for the exactly-one constraint used in n-class classification, semantic loss reduces to
  L^s(exactly-one, p) ∝ − log Σ_{i=1}^{n} p_i Π_{j=1, j≠i}^{n} (1 − p_j),
  where values p_i denote the probability of class i as predicted by the neural net." Using a circuit, the cost drops "from O(n²) (as shown above), to O(n)". — [paper §4.1](https://arxiv.org/pdf/1711.11157)
- The paper on softmax, §4.2: "A classical softmax layer interprets its output as representing a categorical distribution. Hence, by normalizing its outputs, softmax enforces the same mutual exclusion constraint enforced in our semantic loss function. However, there does not exist a natural way to extend softmax loss to unlabeled samples." — [paper §4.2](https://arxiv.org/pdf/1711.11157)
- The original code, `semi_supervised/semantic.py`: `cross_entropy = tf.reduce_sum(tf.nn.sigmoid_cross_entropy_with_logits(labels=y_, logits=y_mlp), axis=1)` (the softmax cross-entropy line is commented out), then `normalized_logits = tf.nn.sigmoid(y_mlp)`, then `wmc_tmp += tf.reduce_prod(one_situation - normalized_logits, axis=1)` for i in range(10), `tf.abs`, and `log_wmc = tf.log(wmc_tmp)`. This is the closed form above with p = sigmoid(z): each term is (−p_i)Π(1−p_j), and the abs removes the sign. The coefficient in this file is `-0.0005`, while App. C reports 0.005. — [GitHub semantic.py](https://raw.githubusercontent.com/UCLA-StarAI/Semantic-Loss/master/semi_supervised/semantic.py)
- Typo in §5.1: the standard encoding is printed as "(x1 ∨ x2 ∨ x3) ∧ (¬x1 ∨ ¬x2) ∧ (¬x1 ∧ ¬x3) ∧ (¬x2 ∧ ¬x3)", with ∧ where ∨ belongs in the last two clauses. Appendix E prints it correctly: "(x1 ∨ x2 ∨ x3) ∧ (¬x1 ∨ ¬x2) ∧ (¬x1 ∨ ¬x3) ∧ (¬x2 ∨ ¬x3)". — [paper §5.1, App. E](https://arxiv.org/pdf/1711.11157)

### Inferences
- The project's comment in 07 says "Xu et al., 2018, in the 'exactly one of A' form". That is **inaccurate**. Xu's exactly-one constraint is a constraint *among Bernoulli outputs*, and under a softmax it is vacuous: the loss is 0. The project's constraint is "at least one of A", i.e. ∨_{i∈A} X_i, evaluated under a categorical distribution. See Q6.
- The 0.0005 vs 0.005 mismatch between the code and App. C may just be one script's setting. Treat App. C as the reported value.

### Gaps
- I did not check whether other scripts in the repo, e.g. the CIFAR code (a submodule), use different coefficients.

## Q5. Experiments and key numbers

### Takeaway
Semantic loss helps most when labels are scarce: MNIST with 100 labels goes from 78.46% to 98.38%. It also raises "coherent" accuracy on structured outputs: grid paths go from 5.62% to 28.51%, and sushi rankings from 1.01% to 13.59%.

### Cited Findings
- Setup: MNIST MLP "784-1000-500-250-250-250-10"; CIFAR-10 uses a 10-layer CNN; Adam with lr 0.002; Gaussian pixel noise σ = 0.3; 10 seeds on MNIST and FASHION; a single trial on CIFAR. — [paper §4.2](https://arxiv.org/pdf/1711.11157)
- **Table 1, MNIST** (test accuracy % with 100 / 1000 / ALL labels; from a layout-preserving extraction of p. 5): MLP with Gaussian noise baseline 78.46 (±1.94) / 94.26 (±0.31) / 99.34 (±0.08); self-training 72.55 (±4.21) / 87.43 (±3.07) / –; MLP with entropy regularizer 96.27 (±0.64) / 98.32 (±0.34) / 99.37 (±0.12); **MLP with semantic loss 98.38 (±0.51) / 98.78 (±0.17) / 99.36 (±0.02)**; Ladder Net 98.94 (±0.37) / 99.16 (±0.08) / 99.43 (±0.02); Virtual Adversarial 97.67 / 98.64 / 99.36; AtlasRBF 91.9 (±0.95) / 96.32 (±0.12) / 98.69; Deep Generative 96.67 (±0.14) / 97.60 (±0.02) / 99.04. — [paper Table 1](https://arxiv.org/pdf/1711.11157)
- **Table 2, FASHION** (100 / 500 / 1000 / ALL): Ladder Net 81.46 (±0.64) / 85.18 (±0.27) / 86.48 (±0.15) / 90.46; MLP baseline 69.45 (±2.03) / 78.12 (±1.41) / 80.94 (±0.84) / 89.87; **MLP with semantic loss 86.74 (±0.71) / 89.49 (±0.24) / 89.67 (±0.09) / 89.81**. — [paper Table 2](https://arxiv.org/pdf/1711.11157)
- **Table 3, CIFAR-10** (4000 / ALL): CNN baseline in Ladder Net 76.67 (±0.61) / 90.73; Ladder Net 79.60 (±0.47) / –; our baseline (CNN, whitening, cropping) 77.13 / 90.96; **CNN with semantic loss 81.79 / 90.92**. Text: "our method scores a gain of 4.66% whereas ladder nets gain 2.93%." — [paper Table 3](https://arxiv.org/pdf/1711.11157)
- **Table 4, grid shortest path**: a 4×4 grid, 1600 examples, 60/20/20 split. Coherent / Incoherent / Constraint: 5-layer MLP 5.62 / 85.91 / 6.99; **+ semantic loss 28.51 / 83.14 / 69.89**. — [paper Table 4](https://arxiv.org/pdf/1711.11157)
- **Table 5, preference ranking**: sushi data from PrefLib, 5000 users, predicting the order of 4 items from 6. 3-layer MLP 1.01 / 75.78 / 2.72; **+ semantic loss 13.59 / 72.43 / 55.28**. — [paper Table 5](https://arxiv.org/pdf/1711.11157)
- With full supervision the loss has little effect: "Because the MLP has enough capacity to almost perfectly fit the training data, where the constraint is always satisfied, semantic loss is almost always zero. This is a direct consequence of Proposition 3." — [paper §4.2](https://arxiv.org/pdf/1711.11157)

### Inferences
- The "simple paths" in the brief refers to the grid experiment, whose constraint is "a valid simple path between the desired source and destination". The paper has no separate simple-path dataset.

### Gaps
- None. Table 1 was checked with `pdftotext -layout`, which resolved where each cell belongs.

## Q6. KEY CHECK: is the project's M5 loss Xu et al.'s semantic loss?

### Takeaway
**No, not literally.** The project computes L_sem = −(λ_s/S) Σ_t log Σ_{i∈A_t} p_{t,i} over one softmax per position. This is the *negative log-probability that the constraint "y_t ∈ A_t" holds under a categorical distribution*. It uses the same principle as semantic loss (−log of the probability of satisfying the constraint, i.e. a WMC), but Definition 1 assumes independent Bernoulli outputs, and the project's output is categorical. The precise relation, verified numerically below, is that M5 equals the *difference* of two Xu semantic losses on sigmoid outputs:
  −log Σ_{i∈A} softmax(z)_i = L^s(ExactlyOne ∧ ∨_{i∈A} X_i, σ(z)) − L^s(ExactlyOne, σ(z)).
In words, M5 is Xu's semantic loss of the disjunction *conditioned on* exactly-one. It is also exactly the form that later work from the same lab (Ahmed et al. 2023, Eq. 3) uses for categorical / autoregressive outputs. The 07 code comment ("in the 'exactly one of A' form") should be reworded.

### Cited Findings
- Xu's p_i are per-variable Bernoulli probabilities, sampled "independently" (§3.2), and the exactly-one code uses `tf.nn.sigmoid`. — [paper §3.2](https://arxiv.org/pdf/1711.11157), [GitHub semantic.py](https://raw.githubusercontent.com/UCLA-StarAI/Semantic-Loss/master/semi_supervised/semantic.py)
- The paper notes that softmax "enforces the same mutual exclusion constraint", so under a categorical distribution exactly-one is always satisfied. — [paper §4.2](https://arxiv.org/pdf/1711.11157)
- Ahmed, Chang & Van den Broeck (NeurIPS 2023) restate the neuro-symbolic objective for *categorical* outputs. Variables are Y_{ij} for step i and class j, and "the neural network will ensure that, for each time step i, there is exactly one class being predicted in each possible state". The fully-factorized case is "p(y | z) = Π_{i=1}^n p(y_i | z) (2)", where "p(y_i | z) is computed as σ(w_i^⊤ z) … and σ(x) is the softmax function". The objective is "argmax_θ p_θ(α) = argmax_θ E_{y∼p_θ}[1{y ⊨ α}] = argmax_θ Σ_{y⊨α} p_θ(y), (3)", and "The negative logarithm of this expectation yields a loss function called semantic loss [46]", where [46] is Xu et al. — [Ahmed et al. 2023, §2.2–2.3](https://arxiv.org/abs/2312.03905)
- The same paper's **Definition 3.1 (Pseudo-Semantic Loss)**: "L^SL_pseudo(α, p_θ) := − log E_{y∼p} p̃_y(α) = − log E_{y∼p} Σ_{ỹ⊨α} p̃_y(ỹ). (8)", where "p̃_y(ỹ) := Π_i p(ỹ_i | y_{−i}) (7)". This is a pseudolikelihood centred on a *model sample* y, because "Under such distributions, computing the likelihood of even simple constraints is #P-hard" (abstract). — [Ahmed et al. 2023, §3](https://arxiv.org/abs/2312.03905)
- Its LLM experiment uses the constraint closest to M5. The paper says it minimises "the probability that any of a list of profanity, slurs, and swear words appear as part of the model generations", on GPT-2 (124M) with RealToxicityPrompts. Table 3, Expected Max Toxicity (Full): GPT-2 0.44, SGEAT 0.32, PseudoSL 0.29. Toxicity probability (Full): 34.11%, 14.05%, 9.80%. PPL: 25.85, 28.72, 28.14. — [Ahmed et al. 2023, §5, Table 3](https://arxiv.org/abs/2312.03905)
- Its other results: Warcraft shortest path, ResNet-18 + SL 59.40 exact / 61.20 consistent vs CNN-LSTM + PseudoSL 66.00 / 79.00 (Table 2); Sudoku, ConvNet + SL 22.10 vs RNN + PseudoSL 28.20 exact (Table 1). — [Ahmed et al. 2023, Tables 1–2](https://arxiv.org/abs/2312.03905)
- Semantic Probabilistic Layers: Ahmed, Teso, Chang, Van den Broeck & Vergari, "Semantic probabilistic layers for neuro-symbolic learning", NeurIPS 2022, arXiv:2206.00426. This is a *predictive layer*, not a loss: it "guarantee[s] its predictions are consistent with a set of predefined symbolic constraints … restricting their support to solutions of the constraint", and is trained "via maximum likelihood". — [arXiv 2206.00426](https://arxiv.org/abs/2206.00426); the venue is from ref [2] of [Ahmed et al. 2023](https://arxiv.org/abs/2312.03905)
- Related same-lab work listed in the 2023 paper's references, not read here: [3] Ahmed, Wang, Chang & Van den Broeck, "Neuro-symbolic entropy regularization"; [4] Ahmed, Chang & Van den Broeck, "Semantic strengthening of neuro-symbolic learning", AISTATS (26th). — [Ahmed et al. 2023, refs](https://arxiv.org/abs/2312.03905)
- 07, §3, states M5 as "L_sem = −(λ_s/S) Σ_t log P_A(t), with P_A(t) = Σ_{i∈A_t} p_{t,i}", with the gradient c·p_j(1 − 1/P_A) for j ∈ A_t and c·p_j for j ∈ B_t. The code comment reads "Semantic loss (Xu et al., 2018, in the "exactly one of A" form)". — local `docs/progress/07-neurosymbolic-code-2b.md`, lines 336–352

### Derivation and numerical verification (local, `scratchpad/check.py`)
- Gradient. With p = softmax(z) and P_A = Σ_{i∈A} p_i, we have ∂P_A/∂z_j = p_j 1[j∈A] − p_j P_A. So ∂(−log P_A)/∂z_j = p_j − p_j 1[j∈A]/P_A. This gives p_j(1 − 1/P_A) for j ∈ A and p_j for j ∉ A, multiplied by c = λ_s/S. **The 07 gradient is correct**, and each row sums to 0.
- Identity. Let q = σ(z). Then Pr(x = e_i | ExactlyOne) = q_i Π_{j≠i}(1−q_j) / Σ_k q_k Π_{j≠k}(1−q_j) = e^{z_i}/Σ_k e^{z_k}, because the odds q_i/(1−q_i) = e^{z_i}. Hence −log Σ_{A} softmax(z) = L^s(EO ∧ ∨A, σ(z)) − L^s(EO, σ(z)). Checking by brute-force enumeration (K = 5, random z, A = {0,2,3}) gives matches to 6 decimals: 0.302226 = 0.302226; 0.631109 = 0.631109; 0.655007 = 0.655007. By contrast, Xu's L^s(∨A, σ(z)) on its own gives 0.0797, 0.0799 and 0.3987, which are different numbers. So M5 is **not** Definition 1 applied to the disjunction with sigmoid outputs.
- Sum over positions t. Under teacher forcing, each p_t is conditioned on the *gold* prefix. Summing −log P_A(t) therefore equals Xu's additive-independence form (Axiom 6) for the conjunction ∧_t (y_t ∈ A_t), *as if the positions were independent*. That is the fully-factorized assumption of Ahmed et al. Eq. (2). It is not the exact probability of the conjunction under the autoregressive model, which Ahmed et al. call #P-hard in general. It is also not their pseudo-semantic loss, which centres the approximation on a model sample and conditions on y_{−i}.

### Unit tests in 07 (§9, table and `test.each`)
The brief's "logits [0,0,0], A={2}" misreads the test. In `[[0, 0, 0], [2], 0.4055, …]` the `[2]` is the **banned** set B, so A = {0,1}. The 07 table and prose already say "A={0,1} (B={2})".

| Case | Formula as written in 07 | Computed (float32, Python) | 07 value | Verdict |
|---|---|---|---|---|
| z=[0,0,0], B={2}, A={0,1} | L = −ln(2/3) = ln 1.5 | 0.405465 | 0.4055 | correct (diff 3.5e-5) |
| same, gradient | [⅓(1−3/2), ⅓(1−3/2), ⅓] | [−0.166667, −0.166667, 0.333333] | [−0.1667, −0.1667, 0.3333] | correct; row sum 0 |
| (if A were {2}) | −ln(1/3) | 1.098612; grad [0.3333, 0.3333, −0.6667] | — | not what the test encodes |
| z=[2,0,0], B={0}, A={1,2} | p = [0.786986, 0.106507, 0.106507]; L = −ln 0.213014 | 1.546398 | 1.546 | correct, but **only just passes** `toBeCloseTo(…, 3)` (|Δ| = 3.98e-4 < 5e-4). Use 1.5464 for margin. |
| same, gradient | [p_0, p_1 − ½, p_2 − ½] | [0.786986, −0.393493, −0.393493] | [0.787, −0.3935, −0.3935] | correct (max diff 1.4e-5) |
| finite-difference test, z=[0.3,−1.2,0.8,0.1], B={2,3}, h=1e-3 | central difference vs analytic | max diff 5.9e-5 | tolerance 5e-4 | passes |
| B = ∅ | code skips the position | 0, [0,0,0] | 0 | correct |

Note that for j ∈ A the gradient simplifies to p_j − p_j/P_A. In case 2 this is p_j − ½, because p_j/P_A = ½ for two equal allowed tokens.

### Inferences: recommended citation wording
- Replace "Semantic loss (Xu et al., 2018, in the 'exactly one of A' form)" with something like:
  > "M5 is the semantic loss of Xu et al. (2018) adapted to a categorical (softmax) output: the negative log-probability that the next token lies in the KB-allowed set A_t, −log Σ_{i∈A_t} p_{t,i}. Xu et al.'s Definition 1 assumes independent Bernoulli outputs. Under a softmax, exactly-one holds by construction (Xu et al., §4.2), and the constraint reduces to the disjunction ∨_{i∈A_t} X_i, whose probability is Σ_{i∈A_t} p_i. This is the categorical form of the objective in Ahmed et al. (2023, Eq. 3), applied per position under teacher forcing, i.e. treating positions as independent (their Eq. 2)."
- Shorter acceptable phrasings: "follows the semantic-loss principle of Xu et al. (2018)", or "the semantic loss of the constraint y_t ∈ A_t under a categorical output distribution (cf. Ahmed et al., 2023)". **Avoid** "exactly-one form" and "Definition 1 of Xu et al." as a description of the formula. The strictly correct special-case statement is "equal to L^s(EO ∧ ∨A_t, σ(z)) − L^s(EO, σ(z))".
- The closest published LLM analogue is the word-banning constraint of the pseudo-semantic loss paper (GPT-2 detoxification). M5's "banned set B_t" is a per-position, teacher-forced version of that idea, and it avoids the sampling and pseudolikelihood that PseudoSL needs for sequence-level constraints.
- On the claim in 07 that "the model therefore has no reason to prefer one allowed token over another": the gradient target is p renormalised over A_t, so M5 leaves the *relative* probabilities within A_t unchanged. This is consistent with Xu's design, which is "regardless of which output is correct" (§3.1).

### Gaps
- I did not read the full SPL paper or the entropy-regularization and semantic-strengthening papers. Their mentions here come only from abstracts and reference lists.
- I did not search for other work applying semantic loss to LLMs beyond the Ahmed et al. line, so other categorical or LLM adaptations may exist.
- I did not run the project's TypeScript tests. The checks were re-implemented in Python with float32 arrays. The TS `allowedMass` accumulates in float64, which differs only negligibly.
