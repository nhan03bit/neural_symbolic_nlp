/** Request schema for the neural-symbolic trainer: the baseline's fields plus λ and the seed. */
import { z } from "zod";
import TrainTransformerRequest from "./train-transformer-request.js";

export default TrainTransformerRequest.extend({
  // 0 trains on cross-entropy alone, which is the control arm for seeds other than 42.
  lambdaS: z.number().min(0).max(5).default(2),
  seed: z.number().int().default(42),
});
