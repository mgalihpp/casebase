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
  if (question.type === "tebak" && answer.type === "tebak") {
    const got = [...new Set(answer.rows)].sort((a, b) => a - b);
    const want = [...question.answer].sort((a, b) => a - b);
    const same =
      got.length === want.length && got.every((row, i) => row === want[i]);
    return same
      ? { correct: true, message: "Benar. Buktinya cocok." }
      : {
          correct: false,
          message:
            "Baris yang kamu pilih belum tepat. Cek ada yang terlewat atau kelebihan.",
        };
  }
  if (question.type === "salah" && answer.type === "salah") {
    if (answer.token !== question.wrongIndex) {
      return {
        correct: false,
        message: "Bagian itu belum jadi sumber kesalahan. Cari lagi.",
      };
    }
    return answer.fix === question.fixIndex
      ? { correct: true, message: "Benar. Buktinya cocok." }
      : { correct: false, message: "Perbaikan itu belum tepat." };
  }
  if (question.type === "pasang" && answer.type === "pasang") {
    const same =
      answer.pairs.length === question.answer.length &&
      answer.pairs.every((right, left) => right === question.answer[left]);
    return same
      ? { correct: true, message: "Benar. Buktinya cocok." }
      : { correct: false, message: "Ada pasangan yang belum cocok." };
  }
  return { correct: false, message: "Jenis jawaban tidak sesuai soal." };
}
