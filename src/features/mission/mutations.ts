import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import { loadCaseBundle, statusOf } from "@/features/course/queries";
import { db } from "@/server/db";
import { gradeQuery } from "./grader";
import { nodeProgress } from "./schema";
import type { checkInput } from "./schemas";

// Menilai ulang jawaban di server. Node selesai ketika soal terakhirnya benar.
export async function checkAnswer(
  userId: string,
  { courseId, nodeKey, questionIndex, query }: z.infer<typeof checkInput>,
) {
  const bundle = await loadCaseBundle(userId, courseId);
  if (!bundle?.body || !bundle.caseRow || !bundle.statuses) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Kasus tidak ditemukan.",
    });
  }

  const status = statusOf(bundle.statuses, nodeKey);
  if (status === "locked") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Selesaikan misi sebelumnya untuk membuka misi ini.",
    });
  }

  const questions = bundle.body.questions.filter(
    (question) => question.node === nodeKey,
  );
  const question = questions[questionIndex];
  if (!question) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Soal tidak ditemukan.",
    });
  }

  const verdict = await gradeQuery(question, bundle.body.seed, query);

  const isLastQuestion = questionIndex === questions.length - 1;
  if (verdict.correct && isLastQuestion) {
    await db
      .insert(nodeProgress)
      .values({ userId, caseId: bundle.caseRow.id, nodeKey })
      .onConflictDoNothing();
  }

  return {
    correct: verdict.correct,
    message: verdict.message,
    explanation: verdict.correct ? question.explanation : null,
    nodeDone: verdict.correct && isLastQuestion,
  };
}
