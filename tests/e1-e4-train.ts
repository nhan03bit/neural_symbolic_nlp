/**
 * Trains the runs E1 and E4 need (docs/progress/05 §2), one after another, with the same
 * settings as the saved seed-42 runs: 2000 epochs, 2 layers, the civil-law corpus and KB.
 *
 *   E1: λ = 0 at seeds 1, 2, 3 (seed 42 is saved).
 *   E4: λ = 2 at seeds 42, 1, 2, 3, plus the λ = 0 runs above.
 *
 * A run whose final weights file exists is skipped, so the script can be restarted after a stop.
 * Training is full-batch and uses random numbers only to initialise the weights, so sampling
 * settings here change the logged samples, not the weights.
 *
 *   bun tests/e1-e4-train.ts
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildVocabulary } from "../src/routes/train-transformer/train.js";
import {
  neuralSymbolicConfig,
  neuralSymbolicWeightsFilename,
  trainNeuralSymbolic,
} from "../src/routes/neural-symbolic/train.js";

const EPOCHS = 2000;
const NUM_LAYERS = 2;
const RUNS: { lambdaS: number; seed: number }[] = [
  { lambdaS: 0, seed: 1 },
  { lambdaS: 0, seed: 2 },
  { lambdaS: 0, seed: 3 },
  { lambdaS: 2, seed: 42 },
  { lambdaS: 2, seed: 1 },
  { lambdaS: 2, seed: 2 },
  { lambdaS: 2, seed: 3 },
];

const cfg = neuralSymbolicConfig(
  buildVocabulary().indexToWord.length,
  NUM_LAYERS,
);
const stamp = () => new Date().toISOString().slice(0, 19);

for (const { lambdaS, seed } of RUNS) {
  const file = neuralSymbolicWeightsFilename(EPOCHS, cfg, lambdaS, seed);
  if (existsSync(join(process.cwd(), ".data", file))) {
    console.log(`${stamp()} skip λ=${lambdaS} seed ${seed}: ${file} exists`);
    continue;
  }
  console.log(`${stamp()} start λ=${lambdaS} seed ${seed}`);
  const started = Date.now();
  for await (const event of trainNeuralSymbolic({
    epochs: EPOCHS,
    temperature: 0.8,
    topP: 0.9,
    numLayers: NUM_LAYERS,
    maxTokens: 40,
    lambdaS,
    seed,
  })) {
    if ("epoch" in event && "loss" in event && event.epoch % 100 === 0) {
      console.log(
        `${stamp()}   λ=${lambdaS} seed ${seed} epoch ${event.epoch} CE ${event.loss} sem ${event.semLoss}`,
      );
    }
    if ("weightsFile" in event) {
      const minutes = ((Date.now() - started) / 60000).toFixed(1);
      console.log(
        `${stamp()} done λ=${lambdaS} seed ${seed} in ${minutes} min: CE ${event.finalLoss} sem ${event.finalSemLoss} -> ${event.weightsFile}`,
      );
    }
  }
}
console.log(`${stamp()} all runs finished`);
process.exit(0);
