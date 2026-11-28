import { z } from "zod";

// Bentuk dokumen kasus di case_content.body (lihat ARCHITECTURE.md dan SDD 3.6).
export const caseNodeSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["mission", "chest", "boss"]),
  title: z.string().optional(),
  topic: z.string().optional(),
  coins: z.number().int().optional(),
});

export const caseQuestionSchema = z.object({
  node: z.string().min(1),
  type: z.literal("write"),
  prompt: z.string().min(1),
  boleh: z.array(z.string()),
  wajib: z.array(z.string()),
  aturanKolom: z.enum(["tepat", "minimal"]),
  answer: z.string().min(1),
  pemeriksa: z.string().nullable(),
  hints: z.array(z.string()),
  explanation: z.string(),
});

export const caseBodySchema = z.object({
  course: z.string().min(1),
  number: z.string().min(1),
  title: z.string().min(1),
  story: z.string(),
  seed: z.string().min(1),
  nodes: z.array(caseNodeSchema).min(1),
  questions: z.array(caseQuestionSchema),
});

export type CaseNode = z.infer<typeof caseNodeSchema>;
export type CaseQuestion = z.infer<typeof caseQuestionSchema>;
export type CaseBody = z.infer<typeof caseBodySchema>;
