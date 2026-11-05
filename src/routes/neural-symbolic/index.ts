/**
 * Neural-symbolic routes.
 *
 * POST /train-neural-symbolic streams training (CE + semantic loss), like /train-transformer.
 * POST /neural-symbolic/compare runs a baseline and a neural-symbolic model on the same prompt and
 * seed, with the mask off and on. It never trains anything: a missing file is reported instead.
 */
import type { StepTrace } from "./constraints.js";
import type { NeuralSymbolicDone, NeuralSymbolicInit } from "./train.js";
import { join } from "node:path";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import NeuralSymbolicRequest from "../../schemas/neural-symbolic-request.js";
import TrainNeuralSymbolicRequest from "../../schemas/train-neural-symbolic-request.js";
import { createEmitter } from "../../server/lib/sse.js";
import { resetRand } from "../train-transformer/matrix.js";
import { forward, generateText } from "../train-transformer/transformer.js";
import { makeProcessor } from "./constraints.js";
import { loadModel, readRunMeta } from "./model.js";
import { buildTokenIndex, FRAMES, KnowledgeBase, RULES, TRIPLES } from "./symbolic.js";
import { trainNeuralSymbolic } from "./train.js";
import { verify } from "./verify.js";

type Model = NonNullable<Awaited<ReturnType<typeof loadModel>>>;

function isDone(value: object): value is NeuralSymbolicDone {
  return "architecture" in value;
}

function isInit(value: object): value is NeuralSymbolicInit {
  return "vocabSize" in value;
}

/** Every role word in every definition frame, read with the mask off. */
function frameContexts(kb: KnowledgeBase): string[] {
  const roles = [...kb.facts.values()].filter(({ t }) => t.rel === "defined_by").map(({ t }) => t.a);
  return roles.flatMap((role) => FRAMES.map((frame) => `the ${frame.map((p) => (p === "?x" ? role : p)).join(" ")}`));
}

/** Probability the model puts on banned tokens at a context, before anything edits it. */
function bannedMass(model: Model, kb: KnowledgeBase, context: string, windowSize: number): number | null {
  const ids = model.encode(context).slice(-windowSize);
  const V = model.config.vocabSize;
  const { logits } = forward(ids, model.weights, model.config);
  const last = logits.slice((ids.length - 1) * V, ids.length * V);
  const trace = makeProcessor(kb, buildTokenIndex(model.vocab), { mode: "mask", lambda: 0 })({
    ids,
    step: 0,
    logits: last,
    idxToToken: model.vocab,
  });
  return trace.maskedTokens.length > 0 ? trace.massBefore : null;
}

export default new Hono()
  .post("/train-neural-symbolic", zValidator("json", TrainNeuralSymbolicRequest), (c) => {
    const body = c.req.valid("json");

    return streamSSE(c, async (stream) => {
      const { emit, emitError } = createEmitter(stream);
      // Training holds most of the CPU for hours, so it stops when nobody is listening.
      const disconnect = new AbortController();
      stream.onAbort(() => disconnect.abort());
      try {
        for await (const result of trainNeuralSymbolic({ ...body, signal: disconnect.signal })) {
          if (isDone(result)) await emit(result, "done");
          else if (isInit(result)) await emit(result, "init");
          // Every epoch reports here, so a cached run replays quickly instead of taking 40 seconds.
          else await emit(result, "epoch", 5);
        }
      } catch (err) {
        await emitError(err);
      }
    });
  })
  .post("/neural-symbolic/compare", zValidator("json", NeuralSymbolicRequest), async (c) => {
    const body = c.req.valid("json");
    const dataDir = join(process.cwd(), ".data");
    const baselinePath = join(dataDir, body.baselineFile);
    const neuralSymbolicPath = join(dataDir, body.neuralSymbolicFile);

    const baseline = await loadModel(baselinePath);
    if (!baseline) {
      return c.json({ error: "baseline not trained for these settings", missing: body.baselineFile }, 404);
    }
    const neuralSymbolic = await loadModel(neuralSymbolicPath);
    if (!neuralSymbolic) {
      return c.json({ error: "neural-symbolic model not trained for these settings", missing: body.neuralSymbolicFile }, 404);
    }
    if (JSON.stringify(baseline.vocab) !== JSON.stringify(neuralSymbolic.vocab)) {
      return c.json({ error: "these models use different vocabularies, so token ids cannot be compared" }, 409);
    }

    const kb = new KnowledgeBase(TRIPLES, RULES);
    const meta = await readRunMeta(neuralSymbolicPath);

    const evaluate = (model: Model) => {
      const windowSize = Math.min(model.config.contextLen, 16);
      const seedIds = model.encode(body.prompt);
      const sample = (traces?: StepTrace[]) => {
        resetRand(body.seed);
        const hooks = traces && {
          processor: makeProcessor(kb, buildTokenIndex(model.vocab), { mode: "mask", lambda: 0 }),
          traces,
        };
        return generateText(
          model.weights,
          model.config,
          seedIds,
          body.maxTokens,
          model.vocab,
          body.temperature,
          body.topP,
          windowSize,
          hooks,
        );
      };

      const traces: StepTrace[] = [];
      const unmasked = sample();
      const masked = sample(traces);
      return {
        config: model.config,
        epochs: model.history.at(-1)?.epoch ?? null,
        unmasked: { text: unmasked, verify: verify(kb, unmasked) },
        masked: { text: masked, verify: verify(kb, masked), traces: traces.filter((t) => t.rulesFired.length > 0) },
      };
    };

    const probes = frameContexts(kb).flatMap((context) => {
      const b = bannedMass(baseline, kb, context, Math.min(baseline.config.contextLen, 16));
      const n = bannedMass(neuralSymbolic, kb, context, Math.min(neuralSymbolic.config.contextLen, 16));
      return b === null || n === null ? [] : [{ context, baseline: b, neuralSymbolic: n }];
    });
    const mean = (values: number[]) => (values.length ? values.reduce((a, v) => a + v, 0) / values.length : null);

    const baselineResult = { file: body.baselineFile, seed: 42, ...evaluate(baseline) };
    const neuralSymbolicResult = { file: body.neuralSymbolicFile, meta, ...evaluate(neuralSymbolic) };

    // A difference in settings must not pass as an effect of the loss.
    const warnings: string[] = [];
    if (baselineResult.epochs !== neuralSymbolicResult.epochs) warnings.push(`Epochs differ: ${baselineResult.epochs} vs ${neuralSymbolicResult.epochs}.`);
    if (JSON.stringify(baseline.config) !== JSON.stringify(neuralSymbolic.config)) warnings.push("Architectures differ.");
    if (meta && meta.seed !== 42) warnings.push(`Training seeds differ: the baseline always uses 42, this model used ${meta.seed}.`);
    if (meta && meta.lambdaS === 0) warnings.push("λ = 0: this is the CE-only control, not a semantic-loss model.");

    return c.json({
      prompt: body.prompt,
      seed: body.seed,
      dropped: baseline.dropped(body.prompt),
      warnings,
      baseline: baselineResult,
      neuralSymbolic: neuralSymbolicResult,
      probes,
      meanBannedMass: {
        baseline: mean(probes.map((p) => p.baseline)),
        neuralSymbolic: mean(probes.map((p) => p.neuralSymbolic)),
      },
    });
  });
