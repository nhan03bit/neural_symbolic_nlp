/**
 * The neural-symbolic trainer must stay independent of the baseline, and differ from it only by
 * the semantic loss. Real short trainings run in a throwaway directory, so .data is never touched.
 * Source is copied in, not linked, because both trainers write a worker bundle beside it.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { StepTrace } from "../src/routes/neural-symbolic/constraints.js";
import type { NeuralSymbolicEpoch, NeuralSymbolicInit, NeuralSymbolicOpts } from "../src/routes/neural-symbolic/train.js";
import TrainNeuralSymbolicRequest from "../src/schemas/train-neural-symbolic-request.js";
import { makeProcessor } from "../src/routes/neural-symbolic/constraints.js";
import routes from "../src/routes/neural-symbolic/index.js";
import { classifyCandidate, makeLifter } from "../src/routes/neural-symbolic/lift.js";
import { addSemanticGrad, semanticLoss } from "../src/routes/neural-symbolic/semantic-loss.js";
import { buildTokenIndex, KnowledgeBase, RULES, TRIPLES } from "../src/routes/neural-symbolic/symbolic.js";
import {
  buildSemMasks,
  findControlFile,
  findViolations,
  neuralSymbolicConfig,
  neuralSymbolicWeightsFilename,
  trainNeuralSymbolic,
} from "../src/routes/neural-symbolic/train.js";
import { verify } from "../src/routes/neural-symbolic/verify.js";
import { resetRand } from "../src/routes/train-transformer/matrix.js";
import {
  baselineWeightsFilename,
  buildVocabulary,
  TRAIN_TEXTS,
  trainTransformer,
} from "../src/routes/train-transformer/train.js";
import {
  backward,
  forward,
  generateText,
  initWeights,
  zeroGrads,
} from "../src/routes/train-transformer/transformer.js";

const EPOCHS = 3;
const LAYERS = 1;
const SETTINGS = { epochs: EPOCHS, temperature: 0.8, topP: 0.9, numLayers: LAYERS, maxTokens: 5 };
const TIMEOUT = 240_000;

const originalCwd = process.cwd();
let sandbox: string;
const vocab = buildVocabulary();
const cfg = neuralSymbolicConfig(vocab.indexToWord.length, LAYERS);
const kb = new KnowledgeBase(TRIPLES, RULES);

const read = (file: string) => JSON.parse(readFileSync(join(sandbox, ".data", file), "utf-8"));

async function runNeuralSymbolic(lambdaS: number, seed = 42, epochs = EPOCHS) {
  const opts: NeuralSymbolicOpts = { ...SETTINGS, epochs, lambdaS, seed };
  let init: NeuralSymbolicInit | undefined;
  const events: object[] = [];
  for await (const event of trainNeuralSymbolic(opts)) {
    if ("vocabSize" in event) init = event;
    events.push(event);
  }
  return { init: init!, events, file: neuralSymbolicWeightsFilename(epochs, cfg, lambdaS, seed) };
}

function softmax(z: number[]) {
  const max = Math.max(...z);
  const e = z.map((v) => Math.exp(v - max));
  const sum = e.reduce((a, b) => a + b, 0);
  return Float32Array.from(e.map((v) => v / sum));
}

beforeAll(() => {
  sandbox = mkdtempSync(join(tmpdir(), "neural-symbolic-"));
  mkdirSync(join(sandbox, ".data"));
  cpSync(join(originalCwd, "src"), join(sandbox, "src"), { recursive: true });
  process.chdir(sandbox);
});

afterAll(() => {
  process.chdir(originalCwd);
  rmSync(sandbox, { recursive: true, force: true });
});

describe("semantic loss, hand-checked values", () => {
  test.each([
    [[0, 0, 0], [2], 0.4055, [-0.1667, -0.1667, 0.3333]],
    [[2, 0, 0], [0], 1.546, [0.787, -0.3935, -0.3935]],
  ] as [number[], number[], number, number[]][])("z=%p banned=%p", (z, banned, loss, grad) => {
    const p = softmax(z);
    expect(semanticLoss(p, [banned], 1, 3)).toBeCloseTo(loss, 3);
    const d = new Float32Array(3);
    addSemanticGrad(d, p, [banned], 1, 3, 1);
    d.forEach((v, j) => expect(v).toBeCloseTo(grad[j], 3));
  });

  test("it averages over the sequence length, not the vocabulary", () => {
    const row = softmax([0, 0, 0]);
    const probs = new Float32Array([...row, ...row]);
    expect(semanticLoss(probs, [[2], null], 2, 3)).toBeCloseTo(0.4055 / 2, 3);
  });
});

describe("masks on the real corpus", () => {
  const ids = TRAIN_TEXTS.flatMap((s) => vocab.tokenize(s).flatMap((t) => vocab.wordToIndex.get(t) ?? []));
  const sequences = ids.slice(0, -16).map((_, i) => ({ input: ids.slice(i, i + 16), target: ids.slice(i + 1, i + 17) }));
  const masks = buildSemMasks(sequences, vocab.indexToWord);

  test("the KB fires, on few positions, with no corpus conflicts", () => {
    expect(masks.constrainedPositions).toBeGreaterThan(0);
    expect(masks.constrainedPositions / masks.totalPositions).toBeLessThan(0.01);
    expect(masks.corpusConflicts).toEqual([]);
  });
});

describe("independence from the baseline", () => {
  test("backward with no seam, and with a seam that does nothing, give the same gradient", () => {
    resetRand(42);
    const w = initWeights(cfg);
    const input = [0, 1, 2, 3];
    const target = [1, 2, 3, 4];
    const plain = zeroGrads(cfg);
    const seamed = zeroGrads(cfg);
    backward(forward(input, w, cfg), target, w, cfg, plain);
    backward(forward(input, w, cfg), target, w, cfg, seamed, () => {});
    expect(Array.from(seamed.headW)).toEqual(Array.from(plain.headW));
    expect(Array.from(seamed.tokEmb)).toEqual(Array.from(plain.tokEmb));
  });

  test("at λ = 0 and seed 42 it produces the baseline's weights and loss", async () => {
    await Array.fromAsync(trainTransformer(SETTINGS));
    const { file } = await runNeuralSymbolic(0);

    const baseline = read(baselineWeightsFilename(EPOCHS, cfg));
    const control = read(file);
    expect(control.weights).toEqual(baseline.weights);
    // The new trainer reports every epoch and the baseline a subset, so compare where both report.
    type Entry = { epoch: number; loss: number; sample?: string };
    const reported = control.history.filter((h: Entry) =>
      baseline.history.some((b: Entry) => b.epoch === h.epoch),
    );
    expect(reported.map((h: Entry) => h.loss)).toEqual(baseline.history.map((h: Entry) => h.loss));
    // Lifting runs between training steps, so equal samples show it used no random numbers.
    expect(reported.map((h: Entry) => h.sample)).toEqual(baseline.history.map((h: Entry) => h.sample));
    expect(baseline.neuralSymbolic).toBeUndefined();
  }, TIMEOUT);

  test("at λ = 2 the weights change, the baseline's file does not, and the run records its settings", async () => {
    const baselinePath = join(sandbox, ".data", baselineWeightsFilename(EPOCHS, cfg));
    const before = readFileSync(baselinePath, "utf-8");
    const { file, init } = await runNeuralSymbolic(2);

    expect(readFileSync(baselinePath, "utf-8")).toBe(before);
    const run = read(file);
    expect(run.weights).not.toEqual(JSON.parse(before).weights);
    expect(run.neuralSymbolic).toMatchObject({ lambdaS: 2, seed: 42, constrainedPositions: init.constrainedPositions });
    expect(run.history.at(-1).semLoss).toBeGreaterThan(0);
  }, TIMEOUT);

  test("a repeated run loads from its own file instead of training again", async () => {
    const { events } = await runNeuralSymbolic(2);
    expect((events.at(-1) as { architecture: string }).architecture).toContain("cached");
  }, TIMEOUT);

  test("λ, seed and KB settings each give a different file", () => {
    const names = [
      neuralSymbolicWeightsFilename(3, cfg, 2, 42),
      neuralSymbolicWeightsFilename(3, cfg, 0, 42),
      neuralSymbolicWeightsFilename(3, cfg, 2, 1),
      baselineWeightsFilename(3, cfg),
    ];
    expect(new Set(names).size).toBe(4);
    expect(names[3]).toStartWith("transformer-weights-");
  });
});

describe("per-epoch report", () => {
  test("every epoch reports its rules, losses and lifted patterns, and the losses add up", async () => {
    const { events, init } = await runNeuralSymbolic(1);
    const epochs = events.filter((e) => "epoch" in e) as NeuralSymbolicEpoch[];
    expect(epochs.map((e) => e.epoch)).toEqual([0, 1, 2, 3]);
    expect(init.triggers.length).toBeGreaterThan(0);
    expect(init.triggers.reduce((sum, t) => sum + t.positions, 0)).toBe(init.constrainedPositions);
    expect(init.triggers.flatMap((t) => t.rules.filter((r) => r.mode === "ban")).length).toBeGreaterThan(0);

    for (const epoch of epochs) {
      expect(epoch.triggerStats).toHaveLength(init.triggers.length);
      const total = epoch.triggerStats.reduce((sum, t) => sum + t.semLoss, 0);
      expect(total).toBeCloseTo(epoch.semLoss, 8);
      expect(epoch.semLoss).toBeGreaterThan(0);
      expect(Array.isArray(epoch.lifted)).toBe(true);

      // Every position counts once in the epoch's banned mass, however many a pattern has.
      const weighted = epoch.triggerStats.reduce((sum, t, g) => sum + t.bannedMass * init.triggers[g].positions, 0);
      expect(epoch.bannedMass).toBeCloseTo(weighted / init.constrainedPositions, 8);
      expect(epoch.bannedMass).toBeGreaterThan(0);
      expect(Array.isArray(epoch.violated)).toBe(true);
    }
  }, TIMEOUT);

  test("a run reads its control from the saved λ = 0 run, if there is one", async () => {
    const control = await runNeuralSymbolic(0);
    expect(control.init.control).toBeNull();

    const { init } = await runNeuralSymbolic(1);
    const saved = read(control.file).history as NeuralSymbolicEpoch[];
    expect(init.control?.semLoss).toEqual(saved.map((e) => e.semLoss));
    expect(init.control?.semLoss).toHaveLength(EPOCHS + 1);

    const noControl = await runNeuralSymbolic(1, 7);
    expect(noControl.init.control).toBeNull();
  }, TIMEOUT);

  test("a run of another length still gets the saved λ = 0 run as its control", async () => {
    const control = await runNeuralSymbolic(0);
    const saved = read(control.file).history as NeuralSymbolicEpoch[];

    const { init } = await runNeuralSymbolic(1, 42, EPOCHS + 1);
    expect(init.control?.semLoss).toEqual(saved.map((e) => e.semLoss));
    expect(init.control?.semLoss).toHaveLength(EPOCHS + 1);
  }, TIMEOUT);

  test("the control is the matching λ = 0 file covering the most epochs", () => {
    const name = (epochs: number, lambdaS = 0, seed = 42) => neuralSymbolicWeightsFilename(epochs, cfg, lambdaS, seed);
    const at = (file: string, epoch: number) => file.replace(/\.json$/, `-at${epoch}.json`);

    expect(findControlFile([name(300), name(100)], cfg, 42)).toBe(name(300));
    expect(findControlFile([at(name(2000), 100), name(300)], cfg, 42)).toBe(name(300));
    expect(findControlFile([at(name(2000), 500), name(300)], cfg, 42)).toBe(at(name(2000), 500));
    expect(findControlFile([name(300, 2), name(300, 0, 7), "notes.json"], cfg, 42)).toBeNull();
  });

  test("λ can go up to 50, the strongest setting tested", () => {
    const body = { epochs: 50, temperature: 0.8, topP: 0.9, numLayers: 2, maxTokens: 20 };
    expect(TrainNeuralSymbolicRequest.safeParse({ ...body, lambdaS: 50 }).success).toBe(true);
    expect(TrainNeuralSymbolicRequest.safeParse({ ...body, lambdaS: 51 }).success).toBe(false);
  });

  test("a rule is violated from a mean p of exactly 0.02, not below it", () => {
    const rule = (word: string, r: string) => ({ rule: r, fact: `not_defined_by(claimant, ${word})`, word, mode: "ban" as const });
    const trigger = {
      pattern: "claimant is the person who",
      template: "?x is the person who",
      role: "claimant",
      positions: 2,
      rules: [
        rule("answers", "R-COUNTER"),
        { rule: "kb", fact: "defined_by(claimant, brings)", word: "brings", mode: "support" as const },
        rule("owns", "R-OTHER-DOMAIN"),
        rule("sells", "R-OTHER-DOMAIN"),
      ],
      heldBack: [],
    };
    // Totals over 2 positions, one per ban rule; the support rule has no slot.
    expect(findViolations([trigger], [[0.05, 0.04, 0.0399]])).toEqual([
      { pattern: trigger.pattern, role: "claimant", rule: "R-COUNTER", word: "answers", p: 0.025 },
      { pattern: trigger.pattern, role: "claimant", rule: "R-OTHER-DOMAIN", word: "owns", p: 0.02 },
    ]);
  });

  test("the unreviewed fact can never be reported as violated", async () => {
    const { events } = await runNeuralSymbolic(1);
    for (const epoch of events.filter((e) => "epoch" in e) as NeuralSymbolicEpoch[]) {
      expect(epoch.violated.filter((v) => v.role === "landlord" && v.word === "rents")).toEqual([]);
    }
    const { init } = await runNeuralSymbolic(1);
    const landlord = init.triggers.find((t) => t.role === "landlord")!;
    expect(findViolations([landlord], [landlord.rules.filter((r) => r.mode === "ban").map(() => 2 * landlord.positions)])
      .map((v) => v.word)).not.toContain("rents");
  }, TIMEOUT);

  test("each ban rule's tokens are the tokens the mask bans", () => {
    const seqs = [];
    const ids = TRAIN_TEXTS.flatMap((text) => vocab.tokenize(text).flatMap((t) => vocab.wordToIndex.get(t) ?? []));
    for (let i = 0; i <= ids.length - 17; i++) seqs.push({ input: ids.slice(i, i + 16), target: ids.slice(i + 1, i + 17) });
    const { semMasks, semGroups, ruleTokens } = buildSemMasks(seqs, vocab.indexToWord);
    semMasks.forEach((mask, k) => mask.forEach((banned, t) => {
      if (!banned) return;
      expect(ruleTokens[semGroups[k][t]!].flat().sort()).toEqual([...banned].sort());
    }));
  });

  test("the unreviewed fact stays out of the trained rules but is still shown", async () => {
    const { init } = await runNeuralSymbolic(1);
    const landlord = init.triggers.find((t) => t.role === "landlord")!;
    expect(landlord.rules.map((r) => r.word)).not.toContain("rents");
    expect(landlord.heldBack).toContain("not_defined_by:landlord:rents");
  }, TIMEOUT);
});

describe("lift status", () => {
  const always = () => true;
  const classify = (role: string, word: string, p = 0.5) =>
    classifyCandidate(kb, role, word, p, `${role} is the person who`, always);

  test("the three statuses", () => {
    expect(classify("claimant", "brings").status).toBe("confirmed");
    expect(classify("claimant", "owns").status).toBe("conflict");
    expect(classify("claimant", "pays").status).toBe("novel");
  });
  test("is_owed is reached through its surface word", () => {
    expect(classify("creditor", "owed")).toMatchObject({ status: "confirmed", triple: { b: "is_owed" } });
    expect(classify("debtor", "owed").status).toBe("conflict");
  });
  test("a conflict carries its proof, and an unreviewed fact says so", () => {
    expect(classify("claimant", "owns")).toMatchObject({ proofKey: "not_defined_by:claimant:owns" });
    expect(classify("claimant", "owns").heldBack).toBeUndefined();
    expect(classify("landlord", "rents")).toMatchObject({ status: "conflict", heldBack: true });
  });
  test("a novel word must clear τ and stay consistent", () => {
    expect(classify("claimant", "pays", 0.5).passesGate).toBe(true);
    expect(classify("claimant", "pays", 0.1).passesGate).toBe(false);
    const never = classifyCandidate(kb, "claimant", "pays", 0.5, "p", () => false);
    expect(never.passesGate).toBe(false);
  });
  test("lifting reads the network and leaves the KB alone", () => {
    resetRand(42);
    const w = initWeights(cfg);
    const before = kb.facts.size;
    const encode = (text: string) => vocab.tokenize(text).flatMap((t) => vocab.wordToIndex.get(t) ?? []);
    const candidates = makeLifter(kb, cfg, vocab.indexToWord, encode, 16)(w);
    expect(kb.facts.size).toBe(before);
    for (const c of candidates) expect(c.triple.rel).toBe("defined_by");
  });
});

describe("mask at generation", () => {
  const prompt = vocab.tokenize("the claimant is the person who").map((t) => vocab.wordToIndex.get(t)!);

  test("with no processor, output matches the same seed exactly", () => {
    resetRand(42);
    const w = initWeights(cfg);
    resetRand(7);
    const a = generateText(w, cfg, prompt, 5, vocab.indexToWord);
    resetRand(7);
    const b = generateText(w, cfg, prompt, 5, vocab.indexToWord);
    expect(a).toBe(b);
  });

  test("with the mask on, a banned token is never chosen", () => {
    resetRand(42);
    const w = initWeights(cfg);
    const tokenIndex = buildTokenIndex(vocab.indexToWord);
    for (let seed = 0; seed < 200; seed++) {
      resetRand(seed);
      const traces: StepTrace[] = [];
      generateText(w, cfg, prompt, 1, vocab.indexToWord, 1, 1, 16, {
        processor: makeProcessor(kb, tokenIndex, { mode: "mask", lambda: 0 }),
        traces,
      });
      expect(traces[0].maskedTokens.length).toBeGreaterThan(0);
      expect(traces[0].maskedTokens).not.toContain(traces[0].chosen);
    }
  });
});

describe("verifier", () => {
  test("it reads definition claims and counts them", () => {
    const report = verify(kb, "the claimant is the person who owns the home. the tenant is the person who rents it.");
    expect(report).toMatchObject({ parsed: 2, supported: 1, contradicted: 1, unknown: 0 });
    expect(report.claims[0].proof[0]).toContain("R-OTHER-DOMAIN");
  });
  test("a bare sentence is no claim, because a creditor can bring a claim", () => {
    expect(verify(kb, "the creditor brings a claim.").parsed).toBe(0);
  });
  test("two-word is_owed, a text ending mid-claim, and an unreviewed fact", () => {
    expect(verify(kb, "the creditor is the person who is owed money.").supported).toBe(1);
    expect(verify(kb, "the creditor is the person who is").parsed).toBe(0);
    expect(verify(kb, "the landlord is the person who rents.")).toMatchObject({ contradicted: 0, unknown: 1 });
  });
});

describe("compare route", () => {
  const post = (body: object) =>
    routes.request("/neural-symbolic/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const missing = { baselineFile: "transformer-weights-none.json", neuralSymbolicFile: "neural-symbolic-weights-none.json" };

  test("a path outside .data is rejected", async () => {
    const response = await post({ ...missing, baselineFile: "../../etc/transformer-weights-x.json" });
    expect(response.status).toBe(400);
  });
  test("a missing baseline gives 404 and names the file", async () => {
    const response = await post(missing);
    expect(response.status).toBe(404);
    expect((await response.json()).missing).toBe(missing.baselineFile);
  });

  test("two real runs compare on one prompt, and a vocabulary mismatch gives 409", async () => {
    const baselineFile = baselineWeightsFilename(EPOCHS, cfg);
    const neuralSymbolicFile = neuralSymbolicWeightsFilename(EPOCHS, cfg, 2, 42);
    const response = await post({ baselineFile, neuralSymbolicFile, maxTokens: 3 });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.warnings).toEqual([]);
    expect(json.dropped).toEqual([]);
    expect(json.probes.length).toBeGreaterThan(0);
    expect(json.baseline.masked.traces[0].maskedTokens.length).toBeGreaterThan(0);

    const other = read(baselineFile);
    other.vocab = [...other.vocab].reverse();
    await Bun.write(join(sandbox, ".data", "transformer-weights-other.json"), JSON.stringify(other));
    const mismatch = await post({ baselineFile: "transformer-weights-other.json", neuralSymbolicFile });
    expect(mismatch.status).toBe(409);
  }, TIMEOUT);
});
