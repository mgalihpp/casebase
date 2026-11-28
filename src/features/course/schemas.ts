import { z } from "zod";

// Bentuk dokumen kasus di case_content.body (lihat ARCHITECTURE.md dan SDD 3.6).
export const caseNodeSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["mission", "chest", "boss"]),
  title: z.string().optional(),
  topic: z.string().optional(),
  coins: z.number().int().optional(),
});

const writeQuestionSchema = z.object({
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

const choiceQuestionSchema = z
  .object({
    node: z.string().min(1),
    type: z.literal("pilih"),
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    answerIndex: z.number().int().min(0),
    hints: z.array(z.string()),
    explanation: z.string(),
  })
  .superRefine((question, ctx) => {
    if (question.answerIndex >= question.options.length) {
      ctx.addIssue({
        code: "custom",
        path: ["answerIndex"],
        message: "answerIndex melebihi jumlah pilihan.",
      });
    }
  });

const arrangeQuestionSchema = z
  .object({
    node: z.string().min(1),
    type: z.literal("susun"),
    prompt: z.string().min(1),
    pieces: z.array(z.string().min(1)).min(2),
    answer: z.array(z.string().min(1)).min(2),
    hints: z.array(z.string()),
    explanation: z.string(),
  })
  .superRefine((question, ctx) => {
    const sortedPieces = [...question.pieces].sort();
    const sortedAnswer = [...question.answer].sort();
    const isPermutation =
      sortedPieces.length === sortedAnswer.length &&
      sortedPieces.every((piece, index) => piece === sortedAnswer[index]);
    if (!isPermutation) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message: "answer harus berisi potongan yang sama dengan pieces.",
      });
    }
  });

const guessQuestionSchema = z
  .object({
    node: z.string().min(1),
    type: z.literal("tebak"),
    prompt: z.string().min(1),
    columns: z.array(z.string().min(1)).min(1),
    rows: z.array(z.array(z.union([z.string(), z.number()]))).min(2),
    answer: z.array(z.number().int().min(0)),
    hints: z.array(z.string()),
    explanation: z.string(),
  })
  .superRefine((question, ctx) => {
    if (question.answer.some((row) => row >= question.rows.length)) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message: "answer menunjuk baris yang tidak ada.",
      });
    }
  });

const mistakeQuestionSchema = z
  .object({
    node: z.string().min(1),
    type: z.literal("salah"),
    prompt: z.string().min(1),
    tokens: z.array(z.string().min(1)).min(2),
    wrongIndex: z.number().int().min(0),
    options: z.array(z.string().min(1)).min(2),
    fixIndex: z.number().int().min(0),
    hints: z.array(z.string()),
    explanation: z.string(),
  })
  .superRefine((question, ctx) => {
    if (question.wrongIndex >= question.tokens.length) {
      ctx.addIssue({
        code: "custom",
        path: ["wrongIndex"],
        message: "wrongIndex melebihi jumlah token.",
      });
    }
    if (question.fixIndex >= question.options.length) {
      ctx.addIssue({
        code: "custom",
        path: ["fixIndex"],
        message: "fixIndex melebihi jumlah pilihan.",
      });
    }
  });

const pairQuestionSchema = z
  .object({
    node: z.string().min(1),
    type: z.literal("pasang"),
    prompt: z.string().min(1),
    kiri: z.array(z.string().min(1)).min(2),
    kanan: z.array(z.string().min(1)).min(2),
    answer: z.array(z.number().int().min(0)),
    hints: z.array(z.string()),
    explanation: z.string(),
  })
  .superRefine((question, ctx) => {
    const valid =
      question.answer.length === question.kiri.length &&
      question.kanan.length === question.kiri.length &&
      new Set(question.answer).size === question.answer.length &&
      question.answer.every((index) => index < question.kanan.length);
    if (!valid) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message:
          "answer harus memasangkan tiap sisi kiri dengan satu sisi kanan.",
      });
    }
  });

export const caseQuestionSchema = z.discriminatedUnion("type", [
  writeQuestionSchema,
  choiceQuestionSchema,
  arrangeQuestionSchema,
  guessQuestionSchema,
  mistakeQuestionSchema,
  pairQuestionSchema,
]);

export const caseBodySchema = z.object({
  course: z.string().min(1),
  number: z.string().min(1),
  title: z.string().min(1),
  story: z.string(),
  bukti: z.array(z.string()).default([]),
  tersangka: z.array(z.string()).default([]),
  seed: z.string().min(1),
  nodes: z.array(caseNodeSchema).min(1),
  questions: z.array(caseQuestionSchema),
});

export type CaseNode = z.infer<typeof caseNodeSchema>;
export type CaseQuestion = z.infer<typeof caseQuestionSchema>;
export type CaseWriteQuestion = z.infer<typeof writeQuestionSchema>;
export type CaseBody = z.infer<typeof caseBodySchema>;
