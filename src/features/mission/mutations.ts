import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { loadCaseBundle, statusOf } from "@/features/course/queries";
import { db } from "@/server/db";
import { gradeAnswer } from "./grader";
import {
  applyWrongAnswer,
  completeAttempt,
  openAttempt,
  readHearts,
} from "./progression";
import { HINT_MAX } from "./rewards";
import { missionAttempt, nodeFailure } from "./schema";
import type { checkInput, hintInput, startInput } from "./schemas";

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

  const now = new Date();
  if ((await readHearts(userId, now)) === 0) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Nyawamu habis.",
    });
  }

  const verdict = await gradeAnswer(question, bundle.body.seed, answer);

  const isLastQuestion = questionIndex === questions.length - 1;
  const nodeDone = verdict.correct && isLastQuestion;
  const caseId = bundle.caseRow.id;

  const outcome = await db.transaction(async (tx) => {
    const attempt = await openAttempt(tx, userId, caseId, nodeKey);
    await tx
      .update(missionAttempt)
      .set({
        answered: attempt.answered + 1,
        correct: attempt.correct + (verdict.correct ? 1 : 0),
      })
      .where(eq(missionAttempt.id, attempt.id));

    const hearts = verdict.correct
      ? await readHearts(userId, now)
      : await applyWrongAnswer(tx, userId, now);

    if (!nodeDone) return { hearts, reward: null };

    await tx
      .delete(nodeFailure)
      .where(
        and(
          eq(nodeFailure.userId, userId),
          eq(nodeFailure.caseId, caseId),
          eq(nodeFailure.nodeKey, nodeKey),
        ),
      );
    const reward = await completeAttempt(
      tx,
      userId,
      attempt.id,
      caseId,
      nodeKey,
      now,
    );
    return { hearts, reward };
  });

  return {
    correct: verdict.correct,
    message: verdict.message,
    explanation: verdict.correct ? question.explanation : null,
    nodeDone,
    hearts: outcome.hearts,
    reward: outcome.reward,
  };
}

// Mencatat petunjuk yang dibuka. Skor mengurangi 10 per petunjuk, maksimal 3 per percobaan.
export async function takeHint(
  userId: string,
  { courseId, nodeKey, questionIndex, hintIndex }: z.infer<typeof hintInput>,
) {
  const bundle = await loadCaseBundle(userId, courseId);
  if (!bundle?.body || !bundle.caseRow || !bundle.statuses) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Kasus tidak ditemukan.",
    });
  }
  const question = bundle.body.questions.filter(
    (item) => item.node === nodeKey,
  )[questionIndex];
  if (!question) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Soal tidak ditemukan.",
    });
  }
  const text = question.hints[hintIndex];
  if (text === undefined) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Petunjuk tidak ditemukan.",
    });
  }

  await db.transaction(async (tx) => {
    const attempt = await openAttempt(tx, userId, bundle.caseRow.id, nodeKey);
    const hints = Math.min(HINT_MAX, Math.max(attempt.hints, hintIndex + 1));
    await tx
      .update(missionAttempt)
      .set({ hints })
      .where(eq(missionAttempt.id, attempt.id));
  });

  return { text, total: question.hints.length };
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

  const caseId = bundle.caseRow.id;
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(missionAttempt)
      .set({ status: "quit", finishedAt: now })
      .where(
        and(
          eq(missionAttempt.userId, userId),
          eq(missionAttempt.caseId, caseId),
          eq(missionAttempt.nodeKey, nodeKey),
          eq(missionAttempt.status, "active"),
        ),
      );
    await tx
      .insert(nodeFailure)
      .values({ userId, caseId, nodeKey })
      .onConflictDoUpdate({
        target: [nodeFailure.userId, nodeFailure.caseId, nodeFailure.nodeKey],
        set: { failedAt: now },
      });
  });

  return { status: "retry" as const };
}
