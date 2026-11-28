import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import { loadCaseBundle, statusOf } from "@/features/course/queries";
import type { startInput } from "./schemas";

// Mengirim soal tanpa kunci jawaban, pembahasan, dan petunjuk (SDD 3.6).
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
    .map((question) => ({
      prompt: question.prompt,
      boleh: question.boleh,
      wajib: question.wajib,
    }));

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
