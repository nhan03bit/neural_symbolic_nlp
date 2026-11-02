/**
 * The five verification gates for the transformer (docs/progress/05, section 3).
 *
 * No transformer experiment is trusted until all of these pass. Gates 1, 3 and 4 fail while
 * defects D1-D3 are present in transformer.ts: gate 4 because D1 and D2 leave early positions
 * with all-zero logits, so editing a token there changes nothing.
 */
import { describe, expect, test } from "bun:test";
import { buildSync } from "esbuild";
import type {
  TransformerConfig,
  TransformerGrads,
  TransformerWeights,
} from "../src/routes/train-transformer/transformer.js";
import { resetRand } from "../src/routes/train-transformer/matrix.js";
import {
  adamUpdate,
  backward,
  BLOCK_KEYS,
  crossEntropyLoss,
  forward,
  initAdam,
  initWeights,
  zeroGrads,
} from "../src/routes/train-transformer/transformer.js";

const SMALL: TransformerConfig = {
  vocabSize: 12,
  contextLen: 6,
  embDim: 4,
  numHeads: 2,
  ffDim: 8,
  numLayers: 2,
};
const INPUT = [1, 5, 9, 2, 7, 3];
const TARGET = [5, 9, 2, 7, 3, 11];

function lossOf(
  w: TransformerWeights,
  cfg: TransformerConfig,
  input: number[],
  target: number[],
): number {
  const { probs } = forward(input, w, cfg);
  return crossEntropyLoss(probs, target, input.length, cfg.vocabSize);
}

/** Every trainable parameter array, paired with its gradient and a readable name. */
function parameterGroups(w: TransformerWeights, g: TransformerGrads) {
  const groups: { name: string; param: Float32Array; grad: Float32Array }[] = [
    { name: "tokEmb", param: w.tokEmb, grad: g.tokEmb },
    { name: "posEmb", param: w.posEmb, grad: g.posEmb },
    { name: "lnFGamma", param: w.lnFGamma, grad: g.lnFGamma },
    { name: "lnFBeta", param: w.lnFBeta, grad: g.lnFBeta },
    { name: "headW", param: w.headW, grad: g.headW },
    { name: "headB", param: w.headB, grad: g.headB },
  ];
  w.blocks.forEach((block, i) => {
    for (const key of BLOCK_KEYS) {
      groups.push({
        name: `block${i}.${key}`,
        param: block[key],
        grad: g.blocks[i][key],
      });
    }
  });
  return groups;
}

/**
 * Compile the real transformer source with every Float32Array swapped for Float64Array.
 *
 * Finite differences cannot reach the gate's threshold in Float32: a step small enough to
 * avoid crossing a ReLU kink is lost to rounding, and a larger one crosses kinks. Measuring in
 * Float64 checks the same code without loosening the threshold.
 */
function loadFloat64Model() {
  const { outputFiles } = buildSync({
    stdin: {
      contents: `
        export * from "./src/routes/train-transformer/transformer.ts";
        export { resetRand } from "./src/routes/train-transformer/matrix.ts";
      `,
      resolveDir: process.cwd(),
      loader: "ts",
    },
    bundle: true,
    format: "cjs",
    platform: "node",
    write: false,
  });
  const source = outputFiles[0].text.replaceAll("Float32Array", "Float64Array");
  const module = { exports: {} };
  new Function("module", "exports", source)(module, module.exports);
  return module.exports as typeof import("../src/routes/train-transformer/transformer.js") & {
    resetRand: typeof resetRand;
  };
}

describe("transformer verification gates", () => {
  test("gate 1: analytic gradients match finite differences in every parameter group", () => {
    const model = loadFloat64Model();

    for (const seed of [7, 42, 1]) {
      model.resetRand(seed);
      const w = model.initWeights(SMALL);
      const g = model.zeroGrads(SMALL);
      model.backward(model.forward(INPUT, w, SMALL), TARGET, w, SMALL, g);

      const loss = () =>
        model.crossEntropyLoss(
          model.forward(INPUT, w, SMALL).probs,
          TARGET,
          INPUT.length,
          SMALL.vocabSize,
        );
      const h = 1e-6;
      const failures: string[] = [];

      for (const { name, param, grad } of parameterGroups(w, g)) {
        let diff = 0;
        let analyticNorm = 0;
        let numericNorm = 0;
        for (let i = 0; i < param.length; i++) {
          const original = param[i];
          param[i] = original + h;
          const plus = loss();
          param[i] = original - h;
          const minus = loss();
          param[i] = original;
          const numeric = (plus - minus) / (2 * h);
          diff += (numeric - grad[i]) ** 2;
          analyticNorm += grad[i] ** 2;
          numericNorm += numeric ** 2;
        }
        const scale = Math.max(Math.sqrt(analyticNorm), Math.sqrt(numericNorm));
        if (scale < 1e-9) {
          // Only bK may vanish: it shifts a row's scores equally, and softmax ignores that.
          if (!name.endsWith(".bK")) failures.push(`${name}: zero gradient`);
          continue;
        }
        const relativeError = Math.sqrt(diff) / scale;
        if (relativeError >= 1e-3) {
          failures.push(`${name}: ${relativeError.toExponential(2)}`);
        }
      }

      expect({ seed, failures }).toEqual({ seed, failures: [] });
    }
  });

  test("gate 2: initial loss is close to ln V", () => {
    resetRand(42);
    const cfg: TransformerConfig = {
      vocabSize: 807,
      contextLen: 16,
      embDim: 32,
      numHeads: 2,
      ffDim: 128,
      numLayers: 2,
    };
    const w = initWeights(cfg);
    const input = Array.from({ length: 16 }, (_, i) => (i * 37) % 807);
    const target = Array.from({ length: 16 }, (_, i) => ((i + 1) * 37) % 807);

    const loss = lossOf(w, cfg, input, target);
    expect(Math.abs(loss - Math.log(807))).toBeLessThan(0.5);
  });

  test("gate 3: one repeated sequence overfits to near-zero loss", () => {
    resetRand(42);
    const w = initWeights(SMALL);
    const buf = initAdam(w);

    for (let step = 1; step <= 500; step++) {
      const g = zeroGrads(SMALL);
      backward(forward(INPUT, w, SMALL), TARGET, w, SMALL, g);
      adamUpdate(w, g, buf, 0.01, step);
    }

    expect(lossOf(w, SMALL, INPUT, TARGET)).toBeLessThan(0.05);
  });

  test("gate 4: changing a future token leaves earlier logits unchanged", () => {
    resetRand(42);
    const w = initWeights(SMALL);
    const V = SMALL.vocabSize;
    const before = forward(INPUT, w, SMALL).logits;

    for (let changed = 1; changed < INPUT.length; changed++) {
      const edited = [...INPUT];
      edited[changed] = (edited[changed] + 1) % V;
      const after = forward(edited, w, SMALL).logits;

      expect(Array.from(after.subarray(0, changed * V))).toEqual(
        Array.from(before.subarray(0, changed * V)),
      );
      // The edited position itself must react, or the comparison above proves nothing.
      expect(
        Array.from(after.subarray(changed * V, (changed + 1) * V)),
      ).not.toEqual(
        Array.from(before.subarray(changed * V, (changed + 1) * V)),
      );
    }
  });

  test("gate 5: the same seed gives the same weights", () => {
    function train(seed: number) {
      resetRand(seed);
      const w = initWeights(SMALL);
      const buf = initAdam(w);
      for (let step = 1; step <= 5; step++) {
        const g = zeroGrads(SMALL);
        backward(forward(INPUT, w, SMALL), TARGET, w, SMALL, g);
        adamUpdate(w, g, buf, 0.001, step);
      }
      return parameterGroups(w, zeroGrads(SMALL)).flatMap((group) =>
        Array.from(group.param),
      );
    }

    const first = train(42);
    expect(train(42)).toEqual(first);
    expect(train(1)).not.toEqual(first);
  });
});
