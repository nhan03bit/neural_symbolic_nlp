# Neural-Symbolic NLP: rebuilding a small transformer, and what it cannot reason about

A from-scratch TypeScript pipeline (Bun, Hono, Vite; no ML libraries) that rebuilds the road to a GPT-style model: ELIZA → BPE → XOR network → Word2Vec → decoder-only transformer. The point of the exercise is a gap it exposes.

**The gap.** A transformer is trained from random weights to minimise next-token loss. Nothing in that objective represents *why* an output is right, so the model fits plausible text and cannot account for it. The author's study note says it directly: the model guesses "the best weight to achieve 'Target Error' But lack[s] the Critical Reasoning to its own". The report asks what a *feasible* neuro-symbolic extension of this small model looks like, using the taxonomy of Sheth, Roy and Gaur (2023).

## Status

| Stage | State |
|---|---|
| 0 ELIZA, 1 BPE | Works |
| 2 XOR network | Works, seeded; 4 seeds reach the same function through unrelated weights |
| 3 Word2Vec | **Repaired** (all cosines were 1.0). Now king/queen 0.90, king−man+woman→queen |
| 4 Transformer | **In progress**, hand-written; does not type-check yet |
| Symbolic layer | **Designed, not implemented** |
| Experiments E1–E3 | **Not run**; no results are claimed |

Only stages 2 and 3 have measured results in the report.

## The report

Read it in [`docs/progress/`](docs/progress/README.md):

1. [Background: stages 0–3, with measurements and the Word2Vec failure](docs/progress/01-background.md)
2. [The transformer and self-attention](docs/progress/02-transformer-self-attention.md)
3. [The reasoning gap](docs/progress/03-reasoning-gap.md)
4. [A neuro-symbolic design for this model](docs/progress/04-neurosymbolic-design.md)
5. [Implementation and evaluation](docs/progress/05-implementation-and-evaluation.md)
6. [Conclusion and future work](docs/progress/06-conclusion-and-future-work.md)
7. [References](docs/progress/references.md)

The source papers and the study note are in [`docs/paper/`](docs/paper/).

## Running

```bash
bun install
bun run dev                          # http://localhost:5173
bun test tests/train-embed.test.ts   # Word2Vec sanity tests
bun tests/probe-xor.ts               # XOR across seeds
bun tests/probe-embed.ts 300         # Skip-gram, about 6 s
bunx tsc -b --noEmit                 # type-check
```

Watch raw SSE from a route:

```bash
curl -N -X POST localhost:5173/bpe-tokenize -H 'content-type: application/json' -d '{"message":"low lower lowest"}'
```

## Credit

Architecture follows [w3cj/how-llms-work](https://github.com/w3cj/how-llms-work). That repository has no licence file, so no code was copied and it is used only as a design cross-check. It has no symbolic component; the neuro-symbolic layer here is original.
