import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import type { z } from "zod";
import { loadCaseBundle, statusOf } from "@/features/course/queries";
import { profile } from "@/features/profile/schema";
import { db } from "@/server/db";
import { gradeAnswer } from "./grader";
import {
  applyWrongAnswer,
  completeAttempt,
  consumeCheck,
  openAttempt,
  openHint,
  readHearts,
  recordAnswer,
} from "./progression";
import { chestOpen, missionAttempt, nodeFailure, nodeProgress } from "./schema";
import type { checkInput, hintInput, startInput } from "./schemas";

function notFound(message: string) {
  return new TRPCError({ code: "NOT_FOUND", message });
}

// Menilai ulang jawaban di server. Node selesai ketika soal terakhirnya benar.
export async function checkAnswer(
  userId: string,
  { courseId, nodeKey, questionIndex, answer }: z.infer<typeof checkInput>,
) {
  const bundle = await loadCaseBundle(userId, courseId);
  if (!bundle?.body || !bundle.caseRow || !bundle.statuses) {
    throw notFound("Kasus tidak ditemukan.");
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
  if (!question) throw notFound("Soal tidak ditemukan.");
  if (question.type !== answer.type) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Jenis jawaban tidak cocok dengan soal.",
    });
  }

  const now = new Date();
  const withinLimit = await consumeCheck(db, userId, now);
  if (!withinLimit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Terlalu sering mengecek. Tunggu sebentar lalu coba lagi.",
    });
  }
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
    const attempt = await openAttempt(tx, userId, caseId, nodeKey, now);
    await recordAnswer(tx, attempt.id, verdict.correct, now);

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

// Membuka satu petunjuk. Petunjuk dibuka berurutan per soal dan memotong koin saat ada saldo.
export async function takeHint(
  userId: string,
  { courseId, nodeKey, questionIndex, hintIndex }: z.infer<typeof hintInput>,
) {
  const bundle = await loadCaseBundle(userId, courseId);
  if (!bundle?.body || !bundle.caseRow || !bundle.statuses) {
    throw notFound("Kasus tidak ditemukan.");
  }
  const questions = bundle.body.questions.filter(
    (item) => item.node === nodeKey,
  );
  const question = questions[questionIndex];
  if (!question) throw notFound("Soal tidak ditemukan.");
  const text = question.hints[hintIndex];
  if (text === undefined) throw notFound("Petunjuk tidak ditemukan.");

  const now = new Date();
  const caseId = bundle.caseRow.id;
  const result = await db.transaction(async (tx) => {
    const attempt = await openAttempt(tx, userId, caseId, nodeKey, now);
    return openHint(
      tx,
      userId,
      attempt.id,
      `${nodeKey}:${questionIndex}`,
      hintIndex,
    );
  });

  if (result.status === "urutan") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Buka petunjuk sebelumnya dulu.",
    });
  }

  return {
    text,
    total: question.hints.length,
    coins: result.coins,
    spent: result.status === "baru",
  };
}

// Membuka kotak bukti. Koinnya hanya diberikan sekali per kotak.
export async function openChest(
  userId: string,
  { courseId, nodeKey }: z.infer<typeof startInput>,
) {
  const bundle = await loadCaseBundle(userId, courseId);
  if (!bundle?.body || !bundle.caseRow || !bundle.statuses) {
    throw notFound("Kasus tidak ditemukan.");
  }
  const node = bundle.body.nodes.find((item) => item.key === nodeKey);
  if (!node || node.type !== "chest") throw notFound("Kotak tidak ditemukan.");

  const status = statusOf(bundle.statuses, nodeKey);
  if (status === "locked") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Kotak bukti terbuka setelah misi sebelumnya selesai.",
    });
  }

  const caseId = bundle.caseRow.id;
  const gained = await db.transaction(async (tx) => {
    const [opened] = await tx
      .insert(chestOpen)
      .values({ userId, caseId, nodeKey })
      .onConflictDoNothing()
      .returning({ nodeKey: chestOpen.nodeKey });
    if (!opened) return 0;

    await tx
      .insert(nodeProgress)
      .values({ userId, caseId, nodeKey })
      .onConflictDoNothing();
    const coins = node.coins ?? 0;
    await tx
      .update(profile)
      .set({ coins: sql`${profile.coins} + ${coins}` })
      .where(eq(profile.userId, userId));
    return coins;
  });

  return { gained };
}

// Menandai misi yang sedang aktif sebagai gagal, sehingga statusnya menjadi "retry".
export async function failMission(
  userId: string,
  { courseId, nodeKey }: z.infer<typeof startInput>,
) {
  const bundle = await loadCaseBundle(userId, courseId);
  if (!bundle?.body || !bundle.caseRow || !bundle.statuses) {
    throw notFound("Kasus tidak ditemukan.");
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
