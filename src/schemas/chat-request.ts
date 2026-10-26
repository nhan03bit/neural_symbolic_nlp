import { z } from "zod";

export default z.object({
  message: z.string().min(1, "Message must not be empty"),
});
