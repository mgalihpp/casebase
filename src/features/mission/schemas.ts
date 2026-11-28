import { z } from "zod";

export const startInput = z.object({
  courseId: z.string().min(1).max(32),
  nodeKey: z.string().min(1).max(32),
});

export const hintInput = startInput.extend({
  questionIndex: z.number().int().min(0),
  hintIndex: z.number().int().min(0),
});

export const answerInput = z.discriminatedUnion("type", [
  z.object({ type: z.literal("write"), query: z.string().max(4000) }),
  z.object({ type: z.literal("pilih"), choice: z.number().int().min(0) }),
  z.object({ type: z.literal("susun"), order: z.array(z.string()) }),
]);

export const checkInput = startInput.extend({
  questionIndex: z.number().int().min(0),
  answer: answerInput,
});
