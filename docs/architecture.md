# Software architecture: how the pipeline and the transformer are built in code

*An object-oriented UML view of the from-scratch implementation, stage by stage*

This chapter describes the **code** rather than the maths. For each stage of the pipeline it gives the UML structure (class diagrams), the runtime behaviour (sequence and activity diagrams), and the files that implement it. The maths is in [chapter 02](progress/02-transformer-self-attention.md) and the symbolic design is in [chapter 04](progress/04-neurosymbolic-design.md).

**Snapshot.** The diagrams describe the working tree on 2026-10-29, which is newer than chapters 02 and 05. `transformer.ts`, `train.ts`, `weigth-layout.ts`, the worker and the SSE route now exist and type-check (`bunx tsc -b --noEmit` is clean), and checkpoints up to 2000 epochs for a 6-layer model sit in `.data/`. Section 9 lists three defects in the forward and backward passes found while drawing these diagrams. Until they are fixed and a gradient check passes, **those checkpoints are not evidence of anything**.

## 0. How to read the diagrams

The code is TypeScript written in a functional, data-oriented style. It has no `class` keyword: data lives in plain `type` records of `Float32Array`s, and behaviour lives in module-level functions. UML still fits once each language construct is mapped to a UML element:

| TypeScript construct | UML element | Stereotype used |
|---|---|---|
| ES module with exported functions (`transformer.ts`, `matrix.ts`, `bpe.ts`) | Class with static operations. Exported = `+` public, unexported = `-` private | `«module»` |
| `type X = { ... }` holding only data | Class with attributes only | `«struct»` |
| Nested record (`TransformerWeights.blocks: BlockWeights[]`) | Composition `*--` with multiplicity | |
| Function that reads or creates a type | Dependency `..>` | |
| `async function*` trainer | Class that implements an iterator and yields a union of events | `«generator»` |
| `new Hono().post(...)` sub-app | Boundary class | `«route»` |
| `node:worker_threads` entry file | Active class with its own thread | `«worker»` |
| Discriminated union (`SavedNetwork = SingleLayer \| MultiLayer`) | Generalisation `<\|--` from an abstract parent | `«union»` |
| Designed but not written (chapter 04) | Class drawn for the target design | `«designed»` |

Static methods are marked with `$` (Mermaid renders them underlined). Matrix shapes are written in brackets, for example `[V×D]` means a flat, row-major `Float32Array` of length `V·D`.

## 1. System overview

### 1.1 Layered package diagram

```mermaid
flowchart TB
  subgraph Client["Client (browser) — src/client"]
    direction LR
    R["routes.tsx<br/>URL → page"] --> H["hooks/use-*-chat<br/>one per stage"]
    H --> U["useSSEChat&lt;TState,TEvent&gt;<br/>generic streaming hook"]
    U --> RS["lib/sse.ts readSSE()"]
    H --> C["components/*-result<br/>stage visualisers"]
  end

  subgraph Server["Server — src/index.tsx + src/routes"]
    direction LR
    APP["Hono app<br/>index.tsx"] --> RT["«route» per stage<br/>simple-chat, bpe-tokenize,<br/>neural-net, train-embed,<br/>train-transformer"]
    RT --> SC["src/schemas<br/>Zod request schemas"]
    RT --> TR["«generator» trainers<br/>train.ts per stage"]
  end

  subgraph Lib["Shared library — src/server/lib"]
    direction LR
    BPE["bpe.ts"]
    RNG["rng.ts mulberry32"]
    MATH["math.ts cosine"]
    SSE["sse.ts createEmitter"]
  end

  subgraph Store["Persistence — .data/"]
    W["*.json weights<br/>and checkpoints"]
  end

  RS -- "POST JSON → text/event-stream" --> APP
  RT --> SSE
  TR --> BPE
  TR --> RNG
  TR --> MATH
  TR --> W
```

Dependencies point one way: client → HTTP → routes → trainers → shared library → disk. No trainer imports Hono and no shared-library module imports a route, so each trainer can run outside the server. The probe scripts in `tests/` rely on this.

### 1.2 The pattern every stage repeats

Each stage of the pipeline is built from the same five parts. Once this pattern is clear, each later stage only adds a new trainer and a new result component.

```mermaid
classDiagram
  direction LR

  class HonoApp {
    <<route>>
    +route(path, subApp) HonoApp
  }
  class StageRoute {
    <<route>>
    +post(path, zValidator(schema), handler)
  }
  class RequestSchema {
    <<struct>>
    Zod object: validated body
  }
  class StageTrainer {
    <<generator>>
    +next() InitResult | EpochResult | FinalResult
  }
  class SSEEmitter {
    <<module>>
    +emit~T~(data: T, event: string, delay?) Promise
    +emitError(err) Promise
  }
  class SSEReader {
    <<module>>
    +readSSE~TEvent~(opts: SSEOptions) SSEResult$
  }
  class UseSSEChat~TState, TEvent~ {
    <<hook>>
    -messages: Message[]
    -loading: boolean
    +sendMessage() Promise
  }
  class UseSSEChatOptions~TState, TEvent~ {
    <<interface>>
    +endpoint: string
    +buildBody(input) unknown
    +initState() TState
    +onEvent(parsed: TEvent, state: TState) Child
  }
  class StageHook {
    <<hook>>
    useXxxChat() UseSSEChatReturn
  }
  class ResultComponent {
    <<component>>
    renders TState as JSX
  }

  HonoApp "1" o-- "5" StageRoute : composes
  StageRoute ..> RequestSchema : validates with
  StageRoute ..> StageTrainer : iterates
  StageRoute ..> SSEEmitter : writes events
  StageHook ..|> UseSSEChatOptions : supplies strategy
  StageHook ..> UseSSEChat : calls
  UseSSEChat ..> SSEReader : streams with
  UseSSEChat ..> UseSSEChatOptions : configured by
  StageHook ..> ResultComponent : onEvent returns
  SSEReader ..> StageRoute : HTTP POST
```

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Hook as StageHook / useSSEChat
  participant Reader as readSSE
  participant Route as «route» Hono handler
  participant Gen as «generator» trainer
  participant Emit as createEmitter

  User->>Hook: type input, press send
  Hook->>Hook: buildBody(input), initState()
  Hook->>Reader: readSSE({endpoint, body, onEvent})
  Reader->>Route: POST /stage (JSON)
  Route->>Route: zValidator(schema)
  Route->>Gen: trainer = trainX(body)
  loop for await (result of trainer)
    Gen-->>Route: yield Init / Epoch / Final
    Route->>Route: type guard (isInitResult, isTrainResult)
    Route->>Emit: emit(result, "init" | "epoch" | "done")
    Emit-->>Reader: event: … / data: {json}
    Reader->>Hook: onEvent(parsed)
    Hook->>Hook: onEvent(parsed, state) → JSX
    Hook-->>User: re-render the assistant message
  end
```

Design choices this pattern encodes:

- **Trainer as an async generator (Iterator).** The trainer does not know about HTTP. It only `yield`s plain objects. The route turns them into SSE events, and a test can consume the same generator with `for await`. `await tick()` after each yield returns control to the event loop so events are flushed during long loops.
- **Polymorphism through discriminated unions.** Each generator yields `InitResult | EpochResult | FinalResult`. The route tells them apart with type guards that test for a field (`"architecture" in value`). This replaces a class hierarchy with `instanceof`.
- **Strategy plus Template Method on the client.** `useSSEChat` fixes the lifecycle (append the user message, open the stream, update the assistant message, handle errors). Each stage supplies only `buildBody`, `initState` and `onEvent`.

## 2. Stage 0 — ELIZA pattern matching

*Progress: [ch. 01 §1](progress/01-background.md). File: `src/routes/simple-chat.ts`.*

```mermaid
classDiagram
  class SimpleChatRoute {
    <<route>>
    +POST /simple-chat
  }
  class ChatRequest {
    <<struct>>
    +message: string
  }
  class ElizaModule {
    <<module>>
    -greetings: string[]
    -getSimpleChatResponse(message: string) string
    -getRandomContinuation() string
  }
  SimpleChatRoute ..> ChatRequest
  SimpleChatRoute ..> ElizaModule : response text
  SimpleChatRoute ..> SSEEmitter : start, word × N, done
  class SSEEmitter { <<module>> }
```

All of the "intelligence" is an ordered chain of rules inside `getSimpleChatResponse`: greeting → "i feel X" → "my X" → "worried" → a random fallback. Nothing is learned and nothing is stored. The stage sets up the streaming skeleton (route, schema, emitter, hook) that later stages reuse unchanged.

## 3. Stage 1 — BPE tokenizer

*Progress: [ch. 01 §2](progress/01-background.md). Files: `src/server/lib/bpe.ts` (shared library), `src/routes/bpe-tokenize.ts` (demo route).*

```mermaid
classDiagram
  direction LR
  class BpeModule {
    <<module>>
    +PRE_TOKEN_RE: RegExp$
    +countWords(text, regex) Map[string→number]$
    +mergeTokens(tokens, pair, merged) string[]$
    +trainBpe(wordFreqs, maxMerges) TrainedBpe$
    +applyMerges(text, merges, regex) string[]$
    +trainBpeOnText(text, maxMerges?, regex?) TrainedBpe$
  }
  class Merge {
    <<struct>>
    +pair: [string, string]
    +merged: string
    +frequency: number
  }
  class TrainedBpe {
    <<struct>>
    +merges: Merge[]
    +wordSplits: Map[string→string[]]
  }
  class BpeTokenizeRoute {
    <<route>>
    +POST /bpe-tokenize
  }
  class Corpus {
    <<module>>
    +CORPUS: string[]$
    +STORIES: string[]$
    +BPE_MERGES: Merge[]$
    +tokenize(text) string[]$
    +buildVocab(corpus) Vocab$
  }

  TrainedBpe "1" *-- "0..1000" Merge
  BpeModule ..> TrainedBpe : creates
  BpeTokenizeRoute ..> BpeModule : trainBpe, applyMerges
  Corpus ..> BpeModule : trains once at import
```

How it is built in code:

1. **Pre-tokenise** with a regex so merges never cross a word boundary. The transformer passes its own regex `/\s\w+|[^\w\s]/g`, so that a leading space belongs to the token (`" cat"`), and joining tokens restores the text.
2. **Count word types, not tokens** (`countWords`). Pair frequencies are weighted by word frequency, so `"the"` is split only once however often it appears.
3. **Merge greedily** (`trainBpe`): count all adjacent pairs, merge the most frequent, repeat up to `maxMerges`.
4. **Encode** (`applyMerges`) by replaying the merges in the order they were learned.

`bpe.ts` is the first **shared** module. The Skip-gram corpus (`Corpus.BPE_MERGES`) and the transformer (`trainBpeOnText(…, 1000, …)` in `train.ts`) both depend on it. The vocabulary of every later model is therefore defined by this stage.

## 4. Stage 2 — XOR network and backpropagation

*Progress: [ch. 01 §3](progress/01-background.md#3-stage-2-learning-by-backpropagation). Files: `src/routes/neural-net/{index,train,serialize}.ts`, `src/server/lib/rng.ts`.*

```mermaid
classDiagram
  direction LR
  class NeuralNetRoute {
    <<route>>
    +POST /neural-net
  }
  class NeuralNetRequest {
    <<struct>>
    +mode: "single-layer" | "multi-layer"
    +epochs: int = 5000
  }
  class XorTrainer {
    <<module>>
    -XOR_INPUTS: number[][]
    -XOR_TARGETS: number[]
    -sigmoid(x) number
    -sigmoidDeriv(s) number
    -makeRandWeight(seed) fn
    +trainSingleLayer(epochs, seed=42) AsyncGenerator$
    +trainMultiLayer(epochs, seed=42) AsyncGenerator$
  }
  class EpochResult {
    <<struct>>
    +epoch: number
    +loss: number
  }
  class TrainResult {
    <<struct>>
    +architecture: string
    +predictions: Prediction[]
    +verdict: string
    +weights: SavedNetwork
  }
  class Prediction {
    <<struct>>
    +input: number[]
    +expected: number
    +actual: number
  }
  class SavedNetwork {
    <<union>>
    +type: string
  }
  class SingleLayerWeights {
    <<struct>>
    +type = "single-layer"
    +w1: number
    +w2: number
    +bias: number
  }
  class MultiLayerWeights {
    <<struct>>
    +type = "multi-layer"
    +w1: number[2][4]
    +b1: number[4]
    +w2: number[4]
    +b2: number
  }
  class Serializer {
    <<module>>
    +saveNetwork(network, path) Promise$
  }
  class Rng {
    <<module>>
    +mulberry32(seed) () => number$
  }

  SavedNetwork <|-- SingleLayerWeights
  SavedNetwork <|-- MultiLayerWeights
  TrainResult *-- "4" Prediction
  TrainResult *-- SavedNetwork
  XorTrainer ..> EpochResult : yields
  XorTrainer ..> TrainResult : yields last
  XorTrainer ..> Rng : seeded init
  NeuralNetRoute ..> XorTrainer : selects by mode (Strategy)
  NeuralNetRoute ..> Serializer : .data/{mode}-weights.json
  NeuralNetRoute ..> NeuralNetRequest
```

This stage adds three things that the transformer reuses:

- **A training loop as a generator**: forward → loss → backward → update, yielding about 50 `EpochResult`s.
- **A seeded RNG** (`mulberry32`). Every later stage takes its randomness from it, which is what made the four-seed comparison in chapter 01 possible.
- **Persisting weights to `.data/`** as JSON, with a `type` tag so the format can be told apart when it is read back.

The weights here are scalars and small nested arrays. The transformer replaces them with flat `Float32Array`s, because at 10⁴–10⁵ parameters nested JS arrays are slow and cannot be shared between threads.

## 5. Stage 3 — Skip-gram word embeddings

*Progress: [ch. 01 §4](progress/01-background.md#4-stage-3-word-embeddings-and-the-collapse-we-fixed). Files: `src/routes/train-embed/{index,train,corpus}.ts`, `src/server/lib/math.ts`.*

```mermaid
classDiagram
  direction LR
  class TrainEmbedRoute {
    <<route>>
    +POST /train-embed
  }
  class TrainEmbedRequest {
    <<struct>>
    +words: string[1..10]
    +epochs: int
    +dimensions: int = 32
    +windowSize: int = 2
    +negativeSamples: int = 5
  }
  class SkipGramTrainer {
    <<generator>>
    -wIn: Float64Array [V×dim]
    -wOut: Float64Array [V×dim]
    -pairs: [target, context][]
    -cumulative: Float64Array [V]
    -sampleNegative() number
    -shuffle(pairs)
    -getVector(idx) number[]
    +trainSkipGram(opts) AsyncGenerator$
  }
  class Corpus {
    <<module>>
    +CORPUS: string[]$
    +BPE_MERGES: Merge[]$
    +tokenize(text) string[]$
    +buildVocab(corpus) Vocab$
  }
  class Vocab {
    <<struct>>
    +wordToIndex: Map[string→number]
    +indexToWord: string[]
    +freq: Map[string→number]
  }
  class MathModule {
    <<module>>
    +cosineSimilarity(a, b) number$
  }
  class TrainEmbedResult {
    <<struct>>
    +embeddings: WordEmbedding[]
    +neighbors: Neighbor[]
    +similarities: SimilarityPair[]
    +analogies: Analogy[]
    +warnings: string[]
  }

  TrainEmbedRoute ..> TrainEmbedRequest
  TrainEmbedRoute ..> SkipGramTrainer
  SkipGramTrainer ..> Corpus : vocab + tokens
  Corpus ..> Vocab : creates
  SkipGramTrainer ..> MathModule : neighbours, analogies
  SkipGramTrainer ..> TrainEmbedResult : yields last
  SkipGramTrainer ..> Rng : init, shuffle, negatives
  class Rng { <<module>> }
```

What this stage adds:

- **The weight matrix as a flat typed array** (`Float64Array`, row `i` starts at `i·dim`). The transformer uses the same layout.
- **Vocabulary from BPE** (`buildVocab`, sorted by frequency). The transformer builds its vocabulary the same way, but from `STORIES` and with its own merges.
- **An evaluation module** (`cosineSimilarity`, nearest neighbours, analogies) kept apart from training, so evaluation can change without touching the training loop.

The five bugs that caused the collapse (chapter 01 §4) were all inside `SkipGramTrainer`'s private operations (`cumulative`, the positive update, the negative row, the analogy sign) and in `Corpus`. Because the class boundary is narrow, the fix needed no change outside this module.

## 6. Stage 4 — the decoder-only transformer

*Progress: [ch. 02](progress/02-transformer-self-attention.md). Files: `src/routes/train-transformer/`*

| File | Responsibility |
|---|---|
| `matrix.ts` | Linear algebra on flat row-major `Float32Array`; seeded `rand` |
| `transformer.ts` | Model: types, init, forward, backward, loss, Adam, generation |
| `weigth-layout.ts` | Packs every parameter into one `SharedArrayBuffer`; zero-copy views |
| `train-worker.ts` | `«worker»`: forward + backward on a slice of sequences |
| `train.ts` | `«generator»` orchestrator: BPE, sequences, workers, Adam, checkpoints, samples |
| `index.ts` | `«route»` `POST /train-transformer` → SSE |
| `src/schemas/train-transformer-request.ts` | Zod: epochs, temperature, topP, numLayers, maxTokens |

### 6.1 Domain model (structure of the data)

```mermaid
classDiagram
  direction TB
  class TransformerConfig {
    <<struct>>
    +vocabSize: number  V
    +contextLen: number  C = 32
    +embDim: number  D = 32
    +numHeads: number  H = 2
    +ffDim: number  F = 128
    +numLayers: number  N
  }
  class TransformerWeights {
    <<struct>>
    +tokEmb: Float32Array [V×D]
    +posEmb: Float32Array [C×D]
    +blocks: BlockWeights[N]
    +lnFGamma: Float32Array [D]
    +lnFBeta: Float32Array [D]
    +headW: Float32Array [D×V]
    +headB: Float32Array [V]
  }
  class BlockWeights {
    <<struct>>
    +ln1Gamma, ln1Beta: [D]
    +wQ, wK, wV, wO: [D×D]
    +bQ, bK, bV, bO: [D]
    +ln2Gamma, ln2Beta: [D]
    +ff1W: [D×F]
    +ff1B: [F]
    +ff2W: [F×D]
    +ff2B: [D]
  }
  class TransformerGrads {
    <<struct>>
    same shape as TransformerWeights
  }
  class BlockGrads {
    <<struct>>
    K in keyof BlockWeights → Float32Array
  }
  class AdamBuf {
    <<struct>>
    one AdamMoments per parameter tensor
  }
  class BlockAdamBuf {
    <<struct>>
    K in keyof BlockWeights → AdamMoments
  }
  class AdamMoments {
    <<struct>>
    +m: Float32Array
    +v: Float32Array
  }
  class ForwardCache {
    <<struct>>
    +tokenIds: number[S]
    +x0: [S×D]
    +blockCaches: BlockCache[N]
    +lnFOut, lnFHat: [S×D]
    +lnFMean, lnFVar: [S]
    +logits, probs: [S×V]
  }
  class BlockCache {
    <<struct>>
    +input, ln1Out, ln1Hat: [S×D]
    +ln1Mean, ln1Var: [S]
    +Q, K, V: [S×D]
    +attnWeights: [H×S×S]
    +attnOut, x1: [S×D]
    +ln2Out, ln2Hat: [S×D]
    +ln2Mean, ln2Var: [S]
    +ff1Out, reluOut: [S×F]
    +ff2Out, output: [S×D]
  }

  TransformerWeights "1" *-- "N" BlockWeights : blocks
  TransformerGrads "1" *-- "N" BlockGrads : blocks
  AdamBuf "1" *-- "N" BlockAdamBuf : blocks
  AdamBuf "1" *-- "7" AdamMoments : embeddings + head
  BlockAdamBuf "1" *-- "16" AdamMoments
  ForwardCache "1" *-- "N" BlockCache : blockCaches
  BlockGrads ..> BlockWeights : mapped type over keys
  TransformerWeights ..> TransformerConfig : shapes from
```

**One list of keys drives everything.** `BLOCK_KEYS` lists the 16 parameter names of a block in a fixed order. `BlockGrads` and `BlockAdamBuf` are TypeScript *mapped types* over `keyof BlockWeights`, so the compiler rejects a gradient or optimiser buffer that is missing a key. The same list drives `initAdam`, `adamUpdate`, `countParams`, `serializeModel`, and the shared-memory layout (`computeLayout`). Adding a parameter means adding it in three places: the type, `BLOCK_KEYS`, and `weightSize`.

**Parameter count** (from `countParams`, same formula as chapter 02 §6). One block is `4(D²+D) + 4D + 2DF + F + D = 12,704`. The trained vocabulary is `V = 392` (783 merges). With N = 2 the model has 51,976 parameters; with N = 6 (the checkpoints in `.data/`) it has 102,792.

### 6.2 Behaviour (the modules that operate on the data)

```mermaid
classDiagram
  direction LR
  class MatrixModule {
    <<module>>
    +rand: () => number$
    +resetRand(seed=42)$
    +matmul(A, B, M, K, N) [M×N]$
    +matmulTransA(A, B, K, M, N) Aᵀ·B$
    +matmulTransB(A, B, M, K, N) A·Bᵀ$
    +addBias(out, bias, rows, cols)$
    +addInPlace(target, source)$
    +sumCols(mat, rows, cols) [cols]$
    +zeros(n)$
    +ones(n)$
    +xavierInit(n, fanIn, fanOut)$
  }
  class TransformerModule {
    <<module>>
    +BLOCK_KEYS: keyof BlockWeights[16]$
    +initWeights(cfg) TransformerWeights$
    +zeroGrads(cfg) TransformerGrads$
    +initAdam(w) AdamBuf$
    +countParams(w) number$
    +forward(ids, w, cfg) ForwardCache$
    +crossEntropyLoss(probs, targets, S, V) number$
    +backward(cache, targets, w, cfg, grads)$
    +adamUpdate(w, grads, buf, lr, t, β1, β2, ε)$
    +generateText(w, cfg, seedIds, maxLen, vocab, T, topP, seqLen) string$
    -initBlockWeights(D, F) BlockWeights
    -zeroBlockGrads(D, F) BlockGrads
    -layerNormForward(x, γ, β, S, D, mean, var, xHat) [S×D]
    -layerNormBackward(dOut, xHat, γ, var, S, D, dγ, dβ) [S×D]
    -softmaxRows(x, rows, cols) [rows×cols]
    -blockForward(input, bw, cfg) BlockCache
    -blockBackward(dOut, bc, bw, cfg, bg) [S×D]
    -adamUpdateParam(p, g, buf, lr, bc1, bc2, β1, β2, ε)
  }
  class Rng {
    <<module>>
    +mulberry32(seed)$
  }
  TransformerModule ..> MatrixModule : all linear algebra
  MatrixModule ..> Rng : seeded rand
  TransformerModule ..> TransformerWeights : reads / updates
  TransformerModule ..> ForwardCache : creates in forward, reads in backward
  TransformerModule ..> TransformerGrads : accumulates +=
  TransformerModule ..> AdamBuf : updates m, v
  class TransformerWeights { <<struct>> }
  class ForwardCache { <<struct>> }
  class TransformerGrads { <<struct>> }
  class AdamBuf { <<struct>> }
```

`transformer.ts` works as a **Facade**. It exports eight operations and keeps the layer internals (LayerNorm, softmax, block forward/backward) private. The orchestrator and the worker only call `forward`, `crossEntropyLoss`, `backward`, `adamUpdate` and `generateText`.

### 6.3 Logical layer view (the network as objects)

A framework such as PyTorch would make every layer an `nn.Module` object holding its weights and a `forward` method, with autograd producing `backward`. This code has neither objects nor autograd. Each layer is a **pair of hand-written functions** plus a **cache record** that carries activations from forward to backward. The diagram below is the *logical* object model. Each class is labelled with the code that actually implements it.

```mermaid
classDiagram
  direction TB
  class Layer {
    <<interface>>
    +forward(x) y, cache
    +backward(dy, cache) dx, accumulates dθ
  }
  class Embedding {
    tokEmb [V×D], posEmb [C×D]
    code: forward() lines for x0, backward() scatter-add
  }
  class LayerNorm {
    γ [D], β [D]
    code: layerNormForward / layerNormBackward
  }
  class MultiHeadCausalAttention {
    wQ wK wV wO [D×D], biases [D]
    H heads, headDim = D/H, scale = 1/√headDim
    code: blockForward / blockBackward (attention part)
  }
  class FeedForward {
    ff1W [D×F], ff1B [F], ff2W [F×D], ff2B [D]
    ReLU
    code: blockForward / blockBackward (FFN part)
  }
  class TransformerBlock {
    pre-LN, two residual connections
    x1 = x + MHA(LN1(x))
    y = x1 + FFN(LN2(x1))
    code: blockForward / blockBackward
  }
  class LMHead {
    lnF γ β, headW [D×V], headB [V]
    code: forward() tail, backward() head
  }
  class SoftmaxCrossEntropy {
    code: softmaxRows + crossEntropyLoss
    dLogits = (p − onehot) / S
  }
  class DecoderOnlyTransformer {
    code: forward / backward
  }

  Layer <|.. Embedding
  Layer <|.. LayerNorm
  Layer <|.. MultiHeadCausalAttention
  Layer <|.. FeedForward
  Layer <|.. TransformerBlock
  Layer <|.. LMHead
  TransformerBlock *-- "2" LayerNorm : ln1, ln2
  TransformerBlock *-- MultiHeadCausalAttention
  TransformerBlock *-- FeedForward
  DecoderOnlyTransformer *-- Embedding
  DecoderOnlyTransformer *-- "N" TransformerBlock
  DecoderOnlyTransformer *-- LMHead
  DecoderOnlyTransformer ..> SoftmaxCrossEntropy : loss
```

Writing the network as functions has a trade-off.

- **For:** every multiply is visible, the memory layout is explicit (needed for `SharedArrayBuffer`), and nothing is hidden by autograd. That fits the purpose of the project.
- **Against:** every forward operation needs a matching hand-derived backward. The compiler cannot check that the two agree, which is exactly how the defects in section 9 got in. The safeguard is a numerical one: the finite-difference gradient check in chapter 05.

### 6.4 Forward pass through one block

```mermaid
sequenceDiagram
  autonumber
  participant F as forward()
  participant B as blockForward()
  participant LN as layerNormForward
  participant M as matrix.ts
  participant SM as softmaxRows

  F->>F: x0[i] = tokEmb[id_i] + posEmb[i]
  loop for each block b in w.blocks
    F->>B: blockForward(x, bw, cfg)
    B->>LN: ln1Out = LN1(x) with γ1, β1, keep mean, var, xHat
    B->>M: Q = ln1Out·wQ + bQ, K = …·wK + bK, V = …·wV + bV
    loop for each head h
      B->>B: scores[i][j] = Q_h[i]·K_h[j] / √headDim, −∞ if j > i (causal)
      B->>SM: weights = softmax(scores) row-wise
      B->>B: attnVals_h[i] = Σ_j weights[i][j] · V_h[j]
    end
    B->>M: attnOut = attnVals·wO + bO
    B->>B: x1 = x + attnOut (residual 1)
    B->>LN: ln2Out = LN2(x1) with γ2, β2
    B->>M: ff1Out = ln2Out·ff1W + ff1B
    B->>B: reluOut = max(0, ff1Out)
    B->>M: ff2Out = reluOut·ff2W + ff2B
    B->>B: output = x1 + ff2Out (residual 2)
    B-->>F: BlockCache (all intermediates)
  end
  F->>LN: lnFOut = LNF(x) with γF, βF
  F->>M: logits = lnFOut·headW + headB
  F->>SM: probs = softmax(logits)
  F-->>F: return ForwardCache
```

Heads are not separate objects. Head `h` is the column slice `[h·headDim, (h+1)·headDim)` of the shared `Q`, `K` and `V` matrices, so no reshape or copy is needed. `attnWeights` stores all heads in one `[H×S×S]` array so that the backward pass can reuse them.

### 6.5 Backward pass

`ForwardCache` acts as a **Memento**. The forward pass records every intermediate, and the backward pass reads them back in reverse order:

```mermaid
flowchart RL
  L["loss<br/>crossEntropyLoss"] --> DL["dLogits = (probs − onehot)/S"]
  DL --> HD["head: dHeadW += lnFOutᵀ·dLogits<br/>dHeadB += Σrows<br/>dX = dLogits·headWᵀ"]
  HD --> LNF["layerNormBackward (final)"]
  LNF --> BN["blockBackward N … 1<br/>FFN → LN2 → residual<br/>→ wO → softmax → Q,K,V → LN1 → residual"]
  BN --> EMB["scatter-add<br/>dTokEmb[id_i] += dX[i]<br/>dPosEmb[i] += dX[i]"]
```

Gradients are **accumulated** (`+=`, through `addInPlace`) and never overwritten. Each worker can therefore run `backward` over many sequences into one buffer, and the main thread adds the buffers together. The `matmulTransA` and `matmulTransB` helpers compute `Aᵀ·B` and `A·Bᵀ` without building a transposed copy. These are the two shapes every linear-layer gradient needs: `dW = Xᵀ·dY` and `dX = dY·Wᵀ`.

### 6.6 Training orchestration: shared memory and worker threads

```mermaid
classDiagram
  direction LR
  class TrainTransformer {
    <<generator>>
    +trainTransformer(opts: TrainOpts) AsyncGenerator$
    -serializeModel(w, cfg, vocab, merges) JSON
    -tryLoadWeights(path) TransformerWeights | null
    -buildWorkerBundle() path
  }
  class TrainOpts {
    <<struct>>
    +epochs, temperature, topP
    +numLayers, maxTokens
  }
  class WeightLayoutModule {
    <<module>>
    -SHARED_KEYS = tokEmb, posEmb
    -HEAD_KEYS = lnFGamma, lnFBeta, headW, headB
    -weightSize(key, cfg) number
    +computeLayout(cfg) layout, totalFloats$
    +packWeightsToSab(w, layout, total) SharedArrayBuffer$
    +copyWeightsFromSab(sab, layout, w)$
    +createWeightViews(sab, layout, N) TransformerWeights$
    +createGradViews(sab, layout, N) TransformerGrads$
    +sumGradsFromWorkers(target, sabs, layout)$
  }
  class LayoutEntry {
    <<struct>>
    +key: string
    +blockIdx: number  (−1 = not in a block)
    +offset: number
    +length: number
  }
  class SharedArrayBuffer {
    <<platform>>
    weightSab: 1 shared by all
    gradSab: 1 per worker
  }
  class TrainWorker {
    <<worker>>
    -w: TransformerWeights (views on weightSab)
    -grads: TransformerGrads (views on gradSab)
    -sequences: input, target[]
    +on("compute") post("done", loss)
  }
  class Esbuild {
    <<platform>>
    buildSync → .train-worker.mjs
  }

  TrainTransformer ..> TrainOpts
  TrainTransformer ..> WeightLayoutModule
  WeightLayoutModule "1" *-- "many" LayoutEntry : WeightLayout
  WeightLayoutModule ..> SharedArrayBuffer : views into
  TrainTransformer "1" o-- "cpus − 2" TrainWorker : spawns
  TrainWorker ..> WeightLayoutModule : createWeightViews / createGradViews
  TrainWorker ..> TransformerModule : forward, loss, backward
  TrainTransformer ..> TransformerModule : adamUpdate, generateText
  TrainTransformer ..> Esbuild : bundles train-worker.ts
  TrainTransformer ..> BpeModule : trainBpeOnText(STORIES, 1000)
  class TransformerModule { <<module>> }
  class BpeModule { <<module>> }
```

The layout is `[tokEmb][posEmb][block 0: 16 keys]…[block N−1: 16 keys][lnFGamma][lnFBeta][headW][headB]`. `createWeightViews` returns a `TransformerWeights` whose fields are `Float32Array` *views* at given offsets into one buffer. Code that receives it (`forward`, `adamUpdate`) cannot tell it apart from a normally allocated model, so `transformer.ts` needs no change to support multiple threads. The main thread uses the same views (`wShared`), so when `adamUpdate` writes to the weights, every worker sees the new values without a copy.

One epoch, master–worker (data-parallel, synchronous):

```mermaid
sequenceDiagram
  autonumber
  participant Route as «route» /train-transformer
  participant T as trainTransformer
  participant L as weigth-layout
  participant W as «worker» × (cpus−2)
  participant D as .data/

  Route->>T: trainTransformer(opts)
  T->>T: resetRand(42), BPE on STORIES, vocab by frequency
  T->>T: sliding windows: input = ids[i..i+16), target = ids[i+1..i+17)
  T->>D: tryLoadWeights(e{epochs}-l{N}-…json)
  alt checkpoint exists (cache hit)
    D-->>T: weights
    T-->>Route: yield InitResult, then final result with "cached" label
  else train from scratch
    T->>T: initWeights(cfg), initAdam(w)
    T-->>Route: yield InitResult
    T->>L: computeLayout, packWeightsToSab
    T->>W: new Worker(bundle, {weightSab, gradSab_k, layout, slice_k})
    W-->>T: "ready"
    loop epoch = 0..epochs
      par every worker
        T->>W: "compute"
        W->>W: gradSab.fill(0)
        W->>W: for seq in slice: forward → loss → backward (+= grads)
        W-->>T: "done", loss_k
      end
      T->>L: sumGradsFromWorkers (reduce)
      T->>T: adamUpdate(wShared, grads, adamBuf, lr=1e-3, t=epoch+1)
      opt epoch % 10 == 0
        T->>T: copyWeightsFromSab, generateText(seed = first 3 tokens)
        T-->>Route: yield EpochResult {epoch, loss, sample}
      end
      opt epoch % 100 == 0
        T->>D: write checkpoint e{epoch}-l{N}-d32-h2-ff128-ctx32.json
      end
    end
    T->>W: terminate()
    T->>D: write final weights
    T-->>Route: yield TransformerTrainResult
  end
```

Training is **full-batch**: one Adam step per epoch on the summed gradient of every training window. Workers have no shared mutable state other than the weight buffer, and the main thread writes that buffer only after every worker has replied `"done"`. Because of this barrier the code needs no `Atomics`.

### 6.7 Persistence

| Artefact | Writer | Reader | Format |
|---|---|---|---|
| `.data/single-layer-weights.json`, `multi-layer-weights.json` | `saveNetwork` | — | `SavedNetwork` union |
| `.data/embedding-weights.json` | `trainSkipGram` (`save !== false`) | — | `{type:"word2vec-skipgram", vocab, merges, embeddings}` |
| `.data/transformer-weights-e{E}-l{N}-d{D}-h{H}-ff{F}-ctx{C}.json` | `serializeModel` (every 100 epochs and at the end) | `tryLoadWeights` | `{type:"decoder-transformer", config, vocab, merges, weights}`, values rounded to 6 d.p. |

The transformer filename encodes the configuration, so the file acts as a cache key: a request with the same `epochs` and `numLayers` loads the file and skips training. Two limits follow. The key does not include the seed or a hash of the code, so a checkpoint written before a bug fix is served again after it. After fixing the defects in section 9, delete the `transformer-weights-*` files.

### 6.8 Generation

```mermaid
flowchart LR
  A["ids = seedIds"] --> B["context = last seqLen ids"]
  B --> C["forward(context)"]
  C --> D["copy logits of last position<br/>into fresh Float32Array[V]"]
  D -. "seam for M1/M2<br/>LogitsProcessor (ch. 04)" .-> D2["«designed»<br/>mask / bias + trace"]
  D --> E["÷ temperature"]
  D2 -.-> E
  E --> F["stable softmax"]
  F --> G["sort desc, keep nucleus<br/>until Σp ≥ topP"]
  G --> H["sample with seeded rand()"]
  H --> I["ids.push(token)"]
  I -->|"step < maxLen"| B
  I --> J["join idxToToken → text"]
```

There is no KV cache: each step runs the full forward pass on the window again. The cost per token is O(S²·D·N), which is acceptable at S ≤ 16 and D = 32. Sampling draws from `matrix.rand`, so `resetRand(seed)` makes generation reproducible. Prediction P2 of chapter 04 depends on this.

## 7. Stage 5 — the symbolic layer («designed», not implemented)

*Progress: [ch. 04](progress/04-neurosymbolic-design.md). Planned files: `symbolic.ts`, `constraints.ts`, verifier.*

```mermaid
classDiagram
  direction LR
  class Triple {
    <<struct>>
    +rel: string
    +a: string
    +b: string
  }
  class Rule {
    <<struct>>
    +id: string
    +if: Triple[]
    +then: Triple
  }
  class KnowledgeBase {
    <<designed>>
    +triples: Triple[]
    +rules: Rule[]
    +entail(context) facts, fired
    +allowed(context, idToToken) banned, supported, fired
  }
  class ProcessorCtx {
    <<struct>>
    +ids: number[]
    +step: number
    +logits: Float32Array [V]
    +idxToToken: string[]
  }
  class LogitsProcessor {
    <<interface>>
    +process(ctx: ProcessorCtx) StepTrace
  }
  class HardMaskProcessor {
    <<designed>>
    M1: z_i = −∞ for i ∉ A_t
    fallback if all banned
  }
  class SoftBiasProcessor {
    <<designed>>
    M2: z_i += λ for i ∈ S_t
  }
  class StepTrace {
    <<struct>>
    +step: number
    +rulesFired: string[]
    +maskedTokens: string[]
    +massBefore: number
    +massAfter: number
    +chosen: string
    +fallback: boolean
  }
  class Verifier {
    <<designed>>
    M4
    +verify(text) violations
  }
  class Violation {
    <<struct>>
    +sentence: string
    +triple: Triple
    +rule: string
  }
  class GenerateText {
    <<module>>
    generateText(…, processor?)
  }

  KnowledgeBase "1" *-- "many" Triple
  KnowledgeBase "1" *-- "many" Rule
  Rule *-- Triple
  LogitsProcessor <|.. HardMaskProcessor
  LogitsProcessor <|.. SoftBiasProcessor
  HardMaskProcessor ..> KnowledgeBase : allowed()
  SoftBiasProcessor ..> KnowledgeBase : allowed()
  LogitsProcessor ..> ProcessorCtx
  LogitsProcessor ..> StepTrace : M3 trace
  GenerateText o-- "0..1" LogitsProcessor : optional Strategy
  Verifier ..> KnowledgeBase : entail()
  Verifier ..> Violation : returns
```

How this fits the code that exists:

- **One seam, optional dependency.** `generateText` gets an optional `LogitsProcessor` (Strategy), called right after the logits of the last position are copied and before `÷ temperature`. With no processor the code path is the current one, so the output is identical byte for byte at the same seed (P2). That is a unit test, not an experiment.
- **The weights are never touched.** The processor depends on `KnowledgeBase` and a `Float32Array`, never on `TransformerWeights`. This is what "decoupled" (2a) means in code terms.
- **The verifier is independent of generation.** It takes text, so it can check output produced with the processor on or off. That is how E2 compares the two.

## 8. Client architecture

```mermaid
classDiagram
  direction LR
  class Routes {
    <<module>>
    / → useSimpleChat
    /bpe-token → useBpeTokenizeChat
    /neural-net-xor → useNeuralNetChat
    /train-embed → useTrainEmbedChat
    /train-transformer → useTrainTransformerChat
  }
  class App {
    <<component>>
    +chat: ChatState
    +slots?: belowHeader, aboveChat
  }
  class ChatProvider {
    <<component>>
  }
  class ChatState {
    <<struct>>
    +input, loading, messages
    +sendMessage(), setInput()
    +title, tagline
  }
  class Header { <<component>> }
  class MessageList { <<component>> }
  class ChatInput { <<component>> }
  class ChatBubble { <<component>> }
  class Message {
    <<struct>>
    +id: string
    +role: user | assistant
    +content: Child
  }
  class UseTrainTransformerChat {
    <<hook>>
    buildBody: "300 0.8 0.9 2 40" → epochs, T, topP, layers, maxTokens
    onEvent: init | epoch | done
  }
  class TrainTransformerResult {
    <<component>>
    +init?: InitData
    +epochs: EpochData[]
    +samples: Sample[]
    +summary?: TransformerSummary
  }

  Routes ..> App : one per page
  App *-- ChatProvider
  ChatProvider ..> ChatState : provides context
  App *-- Header
  App *-- MessageList
  App *-- ChatInput
  MessageList *-- "many" ChatBubble
  ChatBubble ..> Message
  Header ..> ChatState : useChatContext
  ChatInput ..> ChatState : useChatContext
  MessageList ..> ChatState : useChatContext
  UseTrainTransformerChat ..> TrainTransformerResult : renders into Message.content
  Routes ..> UseTrainTransformerChat
```

The same `App` shell serves every stage. A page differs only in the hook passed as `chat`, and that hook's `onEvent` returns the stage's result component as the assistant message's `content`. Each new stage added one hook, one result component and one route line. `App`, `useSSEChat` and `readSSE` were not changed.

## 9. Defects found while drawing the diagrams

Following each forward step to its backward counterpart (§6.3–6.5) shows three places where they do not match. They are listed for the owner and **not changed** in this chapter. Each one would make a finite-difference gradient check fail.

| # | Location | Code now | Should be | Effect |
|---|---|---|---|---|
| D1 | `transformer.ts:494` (`blockForward`, residual 1) | `x1[i] = input[i] * attnOut[i]` | `input[i] + attnOut[i]` | The residual becomes a product. `blockBackward` assumes a sum (`dInput = dX1 + …`), so the forward and backward passes no longer describe the same function. |
| D2 | `transformer.ts:482` (`blockForward`, weighted sum of V) | `for (let j = 0; j < i; j++)` | `j <= i` | Each token cannot attend to itself, and position 0 gets an all-zero attention output. The backward pass (`j <= i`) rebuilds `attnVals` differently from the forward pass. |
| D3 | `transformer.ts:668` (`blockBackward`, dK) | `dScores[i][j] * bc.K[i…]` | `dScores[i][j] * bc.Q[i…]` | `∂(Qᵢ·Kⱼ)/∂Kⱼ = Qᵢ`. Every dK is wrong, so `wK` and `bK` are trained on the wrong gradient. |

Housekeeping, lower priority:

- `train-worker.mjs` is tracked by git, but `train.ts` writes and loads `.train-worker.mjs` (the esbuild output). The tracked file is a stale bundle. Consider deleting it and adding `.train-worker.mjs` to `.gitignore`.
- The checkpoint cache key (§6.7) does not include a code version. Delete `.data/transformer-weights-*.json` after fixing D1–D3, or old weights will be served as "cached".
- Chapters 02 §7 and 05 §1.2–1.3 still say the transformer does not compile and that `train.ts` is not written. Both are out of date relative to this chapter.

## 10. Design patterns used

| Pattern | Where | Why it is there |
|---|---|---|
| Iterator (async generator) | Every `train*` function | Separates computing from transport. The same trainer feeds SSE, tests and probe scripts. |
| Observer over SSE | `createEmitter` → `readSSE` → `onEvent` | Pushes progress (loss, samples) to the browser while training runs |
| Template Method + Strategy | `useSSEChat` with `buildBody` / `initState` / `onEvent` | The lifecycle is written once and each stage supplies only what differs |
| Facade | `transformer.ts` exports 8 operations and hides layer internals | Callers (worker, orchestrator) do not depend on block internals |
| Memento | `ForwardCache` / `BlockCache` | Backward pass needs the exact forward activations |
| Master–worker, shared memory | `train.ts` + `train-worker.ts` + `weigth-layout.ts` | Data-parallel gradients on all cores, with no copying of weights or gradients |
| Zero-copy views | `createWeightViews` / `createGradViews` | The model code runs unchanged on shared memory |
| Cache-aside | `tryLoadWeights` before training | Repeat requests return at once |
| Discriminated union + type guard | `SavedNetwork`, yielded event unions, `isTrainResult` | Polymorphism with no class hierarchy, checked by the compiler |
| Single source of truth | `BLOCK_KEYS` + mapped types | Weights, grads, Adam state, layout and serialisation all follow one list of keys |
| Seeded dependency | `mulberry32(seed)`, `resetRand` | Reproducibility; seed variation is an experimental variable (E1) |
| Strategy («designed») | `LogitsProcessor` in `generateText` | Symbolic constraints plug in without touching the network |

## 11. Traceability: progress chapter → code

| Stage | Progress chapter | Main files | Key UML elements | State |
|---|---|---|---|---|
| 0 ELIZA | [01 §1](progress/01-background.md) | `routes/simple-chat.ts` | `ElizaModule`, `SimpleChatRoute` | Works |
| 1 BPE | [01 §2](progress/01-background.md) | `server/lib/bpe.ts`, `routes/bpe-tokenize.ts` | `BpeModule`, `Merge` | Works |
| 2 XOR | [01 §3](progress/01-background.md#3-stage-2-learning-by-backpropagation) | `routes/neural-net/*`, `server/lib/rng.ts` | `XorTrainer`, `SavedNetwork` | Works, measured |
| 3 Skip-gram | [01 §4](progress/01-background.md#4-stage-3-word-embeddings-and-the-collapse-we-fixed) | `routes/train-embed/*`, `server/lib/math.ts` | `SkipGramTrainer`, `Corpus`, `Vocab` | Fixed, measured |
| 4 Transformer | [02](progress/02-transformer-self-attention.md) | `routes/train-transformer/*` | `TransformerModule`, `TransformerWeights`, `ForwardCache`, `WeightLayoutModule`, `TrainWorker` | Implemented, type-checks; D1–D3 open; gates of ch. 05 not passed |
| 5 Symbolic | [04](progress/04-neurosymbolic-design.md) | — | `KnowledgeBase`, `LogitsProcessor`, `Verifier`, `StepTrace` | Designed only |
| 6 E1–E3 | [05](progress/05-implementation-and-evaluation.md) | — | — | Not run |
