# References

PDFs of the first group are in `docs/paper/`. Page numbers for the Sheth et al. paper are the printed pages (printed page = PDF page + 55).

## Primary sources for this report

1. **Author's study note.** *NLP Transformer Note* (5 pages, annotated screenshots of an animated transformer visual). `docs/paper/NLP Transformer Note.pdf`. Contains no equations; the English is non-native and is quoted with `[sic]`. Used for the thesis (p3, p5) and the order of chapter 02.
2. **Sheth, A., Roy, K., & Gaur, M.** (2023). "Neurosymbolic Artificial Intelligence (Why, What, and How)." *IEEE Intelligent Systems* 38(3), 56–62. DOI 10.1109/MIS.2023.3268724. `docs/paper/Neurosymbolic_Artificial_Intelligence_Why_What_and_How.pdf`. Definition p56–57; taxonomy Fig. 1 p58 (Category 1 lowering: 1a, 1b; Category 2 lifting: 2a, 2b); Fig. 2 p59 (inductive bias and self-attention); Fig. 4 p61 (PK-iL mental-health case, 47% expert agreement for LLMs against 70% for PK-iL). The PDF footer carries an IEEE Xplore licensed-use stamp, so check the licence before redistributing the file.
3. **w3cj/how-llms-work.** https://github.com/w3cj/how-llms-work. Reference design for the five-stage pipeline and a decoder-only pre-LN transformer. **No licence file** (GitHub reports none), so no code was copied; used only as an architecture cross-check. Contains no symbolic component.

## Papers behind each stage

| Stage | Reference | Link |
|---|---|---|
| 0 | Weizenbaum, J. (1966). ELIZA. *Communications of the ACM* 9(1). | https://dl.acm.org/doi/10.1145/365153.365168 |
| 1 | Sennrich, R., Haddow, B., & Birch, A. (2016). Neural Machine Translation of Rare Words with Subword Units. *ACL*. | https://arxiv.org/abs/1508.07909 |
| 2 | Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). Learning representations by back-propagating errors. *Nature* 323. | https://www.nature.com/articles/323533a0 |
| 2, 4 | Glorot, X., & Bengio, Y. (2010). Understanding the difficulty of training deep feedforward neural networks. *AISTATS*. | https://proceedings.mlr.press/v9/glorot10a.html |
| 3 | Mikolov, T., Chen, K., Corrado, G., & Dean, J. (2013). Efficient Estimation of Word Representations in Vector Space. | https://arxiv.org/abs/1301.3781 |
| 3 | Mikolov, T., Sutskever, I., Chen, K., Corrado, G., & Dean, J. (2013). Distributed Representations of Words and Phrases and their Compositionality. *NeurIPS*. | https://arxiv.org/abs/1310.4546 |
| 4 | Vaswani, A., et al. (2017). Attention Is All You Need. *NeurIPS*. | https://arxiv.org/abs/1706.03762 |
| 4 | Ba, J. L., Kiros, J. R., & Hinton, G. E. (2016). Layer Normalization. | https://arxiv.org/abs/1607.06450 |
| 4 | Kingma, D. P., & Ba, J. (2014). Adam: A Method for Stochastic Optimization. *ICLR 2015*. | https://arxiv.org/abs/1412.6980 |
| 4 | Radford, A., Narasimhan, K., Salimans, T., & Sutskever, I. (2018). Improving Language Understanding by Generative Pre-Training. OpenAI. | https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf |
| 4 | Holtzman, A., Buys, J., Du, L., Forbes, M., & Choi, Y. (2019). The Curious Case of Neural Text Degeneration. *ICLR 2020*. | https://arxiv.org/abs/1904.09751 |

Stage-to-paper map: 0 → Weizenbaum; 1 → Sennrich; 2 → Rumelhart, Glorot; 3 → Mikolov (a, b), Sennrich; 4 → Glorot, Kingma, Sennrich, Ba, Vaswani, Radford, Holtzman.

Five of these are saved in `docs/paper/`: Weizenbaum (1966), Sennrich (2016), Rumelhart (1986) and both Mikolov (2013) papers.

## Further reading and cited secondary sources

- Minsky, M., & Papert, S. (1969). *Perceptrons*. The XOR critique that stage 2 answers.
- Xiong, R., et al. (2020). On Layer Normalization in the Transformer Architecture. https://arxiv.org/abs/2002.04745 (why pre-LN trains more stably).
- Radford, A., et al. (2019). Language Models are Unsupervised Multitask Learners (GPT-2): byte-level BPE regex and pre-LN.
- Xu, J., Zhang, Z., Friedman, T., Liang, Y., & Van den Broeck, G. (2018). A Semantic Loss Function for Deep Learning with Symbolic Knowledge. *ICML*. **Cited from memory in chapter 04 §7; confirm the reference before final use.**
- Kahneman, D. *Thinking, Fast and Slow*, as used by Sheth et al. for the System 1 / System 2 grounding (p56).

## Figure provenance (`docs/images/`)

Cut from the PDFs in `docs/paper/` (cropped with `pdftoppm`). The study note's screenshots are not reused: chapter 02 uses original diagrams instead. Each cut figure is credited in its caption and is used here as a study illustration, not as our result. Check the publisher's terms before reusing any of them outside this repository.

| File | Source |
|---|---|
| `sheth2023-fig1-taxonomy.png` | Sheth, Roy and Gaur (2023), Fig. 1, p. 58 |
| `sheth2023-fig2-kg-compression.png` | Sheth, Roy and Gaur (2023), Fig. 2, p. 59 |
| `mikolov2013a-fig1-cbow-skipgram.png` | Mikolov et al. (2013a), Fig. 1, p. 5 |
| `mikolov2013b-fig1-skipgram.png` | Mikolov et al. (2013b), Fig. 1, p. 2 (not embedded; same model as Fig. 1 of 2013a) |
| `mikolov2013b-fig2-country-capital-pca.png` | Mikolov et al. (2013b), Fig. 2, p. 4 |
| `sennrich2016-fig1-bpe.png` | Sennrich et al. (2016), Algorithm 1 and Fig. 1, p. 4 |
| `fig-*.png` | Drawn by `docs/images/make_figures.py` (matplotlib), all in one visual style, from `docs/progress/ieee/data/`. `fig-taxonomy-mapping.png` redraws Sheth et al. Fig. 1 with this work's mapping added; `fig-attn-*.png` and `fig-layers.png` are original explainers after the study note; `fig-attn-causal.png` is computed from seeded random weights |

To rebuild the drawn figures: `bun tests/ieee-data.ts && python3 docs/images/make_figures.py` (needs `matplotlib` and `numpy`).

## What this report does not cite

The Sheth et al. paper does not use Kautz's six types or the phrases "learning for reasoning" and "reasoning for learning", so the report does not attribute them to it.
