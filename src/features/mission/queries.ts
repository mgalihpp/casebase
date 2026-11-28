import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import { loadCaseBundle, statusOf } from "@/features/course/queries";
import type { CaseQuestion } from "@/features/course/schemas";
import type { hintInput, startInput } from "./schemas";

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
      message: "Selesaikan misi sebelumnya untuk membuka misi ini.",
    });
  }

  const questions = bundle.body.questions
    .filter((question) => question.node === nodeKey)
    .map(toPublicQuestion);

  return {
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

// Petunjuk satu per satu; biaya petunjuk dihitung di klien, server hanya mengembalikan teksnya.
export async function getHint(
  userId: string,
  { courseId, nodeKey, questionIndex, hintIndex }: z.infer<typeof hintInput>,
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
      message: "Selesaikan misi sebelumnya untuk membuka misi ini.",
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

  return { text, total: question.hints.length };
}
