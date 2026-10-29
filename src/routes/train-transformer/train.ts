/**
 * Training orchestrator for a tiny GPT — tokenizes a corpus, trains with data parallelism, streams results.
 *
 * Radford et al. (2018) showed that a decoder-only transformer pre-trained on raw text
 * learns surprisingly general language representations. This file trains the same
 * architecture from scratch on a small story corpus, demonstrating every step:
 * BPE tokenization, sequence construction, multi-worker gradient accumulation, and
 * autoregressive text generation.
 *
 * @see https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf — Radford et al. (2018) "Improving Language Understanding by Generative Pre-Training" (GPT-1)
 * @see https://arxiv.org/abs/1508.07909 — Sennrich, Haddow & Birch (2016) "Neural Machine Translation of Rare Words with Subword Units" (BPE)
 *
 * Training uses data parallelism via SharedArrayBuffer: each worker thread runs
 * forward+backward on its slice of sequences and accumulates gradients into shared
 * memory. The main thread sums worker gradients and runs one Adam step per epoch.
 *
 * Yields InitResult, then EpochResults during training, then a final TransformerTrainResult.
 */