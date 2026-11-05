/** Request schema for comparing a baseline model with a neural-symbolic model on one prompt. */
import { z } from "zod";

export default z.object({
  // No "/" is allowed in either name, so a request cannot leave .data.
  baselineFile: z.string().regex(/^transformer-weights-[\w.-]+\.json$/),
  neuralSymbolicFile: z.string().regex(/^neural-symbolic-weights-[\w.-]+\.json$/),
  prompt: z.string().min(1).max(200).default("the claimant is the person who"),
  maxTokens: z.number().int().min(1).max(100).default(20),
  temperature: z.number().min(0.1).max(2).default(0.8),
  topP: z.number().min(0.1).max(1).default(0.9),
  seed: z.number().int().default(42),
});
