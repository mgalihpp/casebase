import { z } from "zod";

export const startInput = z.object({
  courseId: z.string().min(1).max(32),
  nodeKey: z.string().min(1).max(32),
});

export const checkInput = startInput.extend({
  questionIndex: z.number().int().min(0),
  query: z.string().max(4000),
});
