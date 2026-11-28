import "server-only";

import type { z } from "zod";
import type { CaseQuestion } from "@/features/course/schemas";
import { judgeWrite } from "./judge";
import { runSandbox } from "./sandbox";
import type { answerInput } from "./schemas";

export type Verdict = { correct: boolean; message: string };
export type Answer = z.infer<typeof answerInput>;

// Penilaian ulang di server (D-07). Query pengguna hanya berjalan di worker thread dengan batas 3 detik.
export async function gradeAnswer(
  question: CaseQuestion,
  seed: string,
  answer: Answer,
): Promise<Verdict> {
  if (question.type === "write" && answer.type === "write") {
    return judgeWrite(question, seed, answer.query, runSandbox);
  }
  if (question.type === "pilih" && answer.type === "pilih") {
    return answer.choice === question.answerIndex
      ? { correct: true, message: "Benar. Buktinya cocok." }
      : {
          correct: false,
          message: "Pilihanmu belum benar. Baca soalnya sekali lagi.",
        };
  }
  if (question.type === "susun" && answer.type === "susun") {
    const same =
      answer.order.length === question.answer.length &&
      answer.order.every((piece, index) => piece === question.answer[index]);
    return same
      ? { correct: true, message: "Benar. Buktinya cocok." }
      : { correct: false, message: "Urutannya belum benar." };
  }
  return { correct: false, message: "Jenis jawaban tidak sesuai soal." };
}
