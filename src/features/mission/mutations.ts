import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { loadCaseBundle, statusOf } from "@/features/course/queries";
import { db } from "@/server/db";
import { gradeAnswer } from "./grader";
import { nodeFailure, nodeProgress } from "./schema";
import type { checkInput, startInput } from "./schemas";

// Menilai ulang jawaban di server. Node selesai ketika soal terakhirnya benar.
export async function checkAnswer(
  userId: string,
  { courseId, nodeKey, questionIndex, answer }: z.infer<typeof checkInput>,
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
  if (question.type !== answer.type) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Jenis jawaban tidak cocok dengan soal.",
    });
  }

  const verdict = await gradeAnswer(question, bundle.body.seed, answer);

  const isLastQuestion = questionIndex === questions.length - 1;
  const nodeDone = verdict.correct && isLastQuestion;
  if (nodeDone) {
    const caseId = bundle.caseRow.id;
    await db.transaction(async (tx) => {
      await tx
        .insert(nodeProgress)
        .values({ userId, caseId, nodeKey })
        .onConflictDoNothing();
      await tx
        .delete(nodeFailure)
        .where(
          and(
            eq(nodeFailure.userId, userId),
            eq(nodeFailure.caseId, caseId),
            eq(nodeFailure.nodeKey, nodeKey),
          ),
        );
    });
  }

  return {
    correct: verdict.correct,
    message: verdict.message,
    explanation: verdict.correct ? question.explanation : null,
    nodeDone,
  };
}

// Menandai misi yang sedang aktif sebagai gagal, sehingga statusnya menjadi "retry".
export async function failMission(
  userId: string,
  { courseId, nodeKey }: z.infer<typeof startInput>,
) {
  const bundle = await loadCaseBundle(userId, courseId);
  if (!bundle?.body || !bundle.caseRow || !bundle.statuses) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Kasus tidak ditemukan.",
    });
  }

  const status = statusOf(bundle.statuses, nodeKey);
  if (status === "locked" || status === "done") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Misi ini belum bisa gagal.",
    });
  }

  await db
    .insert(nodeFailure)
    .values({ userId, caseId: bundle.caseRow.id, nodeKey })
    .onConflictDoUpdate({
      target: [nodeFailure.userId, nodeFailure.caseId, nodeFailure.nodeKey],
      set: { failedAt: new Date() },
    });

  return { status: "retry" as const };
}
