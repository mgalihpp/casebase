import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { loadCaseBundle, statusOf } from "@/features/course/queries";
import type { CaseQuestion } from "@/features/course/schemas";
import { profile } from "@/features/profile/schema";
import { db } from "@/server/db";
import { readHeartsDetail } from "./progression";
import { missionAttempt, missionHint } from "./schema";
import type { startInput } from "./schemas";

// Soal yang dikirim ke klien tanpa kunci jawaban, pilihan benar, pembahasan, dan petunjuk (SDD 3.6).
function toPublicQuestion(question: CaseQuestion) {
  switch (question.type) {
    case "write":
      return {
        type: question.type,
        prompt: question.prompt,
        boleh: question.boleh,
        wajib: question.wajib,
      };
    case "pilih":
      return {
        type: question.type,
        prompt: question.prompt,
        options: question.options,
      };
    case "susun":
      return {
        type: question.type,
        prompt: question.prompt,
        pieces: question.pieces,
      };
    case "tebak":
      return {
        type: question.type,
        prompt: question.prompt,
        columns: question.columns,
        rows: question.rows,
      };
    case "salah":
      return {
        type: question.type,
        prompt: question.prompt,
        tokens: question.tokens,
        options: question.options,
      };
    case "pasang":
      return {
        type: question.type,
        prompt: question.prompt,
        kiri: question.kiri,
        kanan: question.kanan,
      };
  }
}

export async function startMission(
  userId: string,
  { courseId, nodeKey }: z.infer<typeof startInput>,
) {
  const bundle = await loadCaseBundle(userId, courseId);
  if (!bundle?.body || !bundle.statuses) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Kasus untuk kursus ini belum tersedia.",
    });
  }

  const node = bundle.body.nodes.find((item) => item.key === nodeKey);
  if (!node) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Misi tidak ditemukan.",
    });
  }

  const status = statusOf(bundle.statuses, nodeKey);
  if (status === "locked") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tuntaskan misi sebelumnya untuk membuka misi ini.",
    });
  }

  const rawQuestions = bundle.body.questions.filter(
    (question) => question.node === nodeKey,
  );
  const questions = rawQuestions.map(toPublicQuestion);

  const [active] = await db
    .select({
      id: missionAttempt.id,
      questionIndex: missionAttempt.questionIndex,
    })
    .from(missionAttempt)
    .where(
      and(
        eq(missionAttempt.userId, userId),
        eq(missionAttempt.caseId, bundle.caseRow?.id ?? ""),
        eq(missionAttempt.nodeKey, nodeKey),
        eq(missionAttempt.status, "active"),
      ),
    )
    .limit(1);
  const opened = active
    ? await db
        .select({
          questionKey: missionHint.questionKey,
          hintIndex: missionHint.hintIndex,
        })
        .from(missionHint)
        .where(eq(missionHint.attemptId, active.id))
    : [];
  const hintsOpened = rawQuestions.map((_, index) =>
    opened
      .filter((row) => row.questionKey === `${nodeKey}:${index}`)
      .map((row) => row.hintIndex),
  );

  const [me] = await db
    .select({ coins: profile.coins })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  return {
    ...(await readHeartsDetail(userId, new Date())),
    coins: me?.coins ?? 0,
    hintsOpened,
    questionIndex: Math.min(
      active?.questionIndex ?? 0,
      Math.max(0, questions.length - 1),
    ),
    course: { id: bundle.course.id, name: bundle.course.name },
    case: {
      number: bundle.body.number,
      title: bundle.body.title,
      story: bundle.body.story,
      seed: bundle.body.seed,
    },
    node: {
      key: node.key,
      type: node.type,
      title: node.title ?? null,
      topic: node.topic ?? null,
    },
    status,
    questions,
  };
}
