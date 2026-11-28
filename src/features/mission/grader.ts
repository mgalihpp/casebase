import initSqlJs, { type SqlJsStatic } from "sql.js";
import type { z } from "zod";
import type {
  CaseQuestion,
  CaseWriteQuestion,
} from "@/features/course/schemas";
import { executeQuery, type QueryResult } from "./engine/execute";
import { explainSqlError } from "./engine/sql-messages";
import { checkRules } from "./rules";
import type { answerInput } from "./schemas";

export type Verdict = { correct: boolean; message: string };
export type Answer = z.infer<typeof answerInput>;

// Penilai ini hanya jalan di server (D-07). Sprint 2 memakai thread utama,
// worker thread menyusul di Sprint 3 bersama batas waktu.
let sqlPromise: Promise<SqlJsStatic> | undefined;
function getSql() {
  sqlPromise ??= initSqlJs();
  return sqlPromise;
}

function sameColumns(a: string[], b: string[]) {
  return (
    a.length === b.length &&
    a.every((name, index) => name.toLowerCase() === b[index]?.toLowerCase())
  );
}

function rowKeys(result: QueryResult) {
  return result.rows.map((row) => JSON.stringify(row));
}

function sameRows(user: QueryResult, expected: QueryResult, ordered: boolean) {
  const left = rowKeys(user);
  const right = rowKeys(expected);
  if (left.length !== right.length) return false;
  if (ordered) return left.every((key, index) => key === right[index]);
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((key, index) => key === sortedRight[index]);
}

// Jenis jawaban yang tidak cocok dengan soal ditolak di checkAnswer; cabang ini hanya penjaga tipe.
export async function gradeAnswer(
  question: CaseQuestion,
  seed: string,
  answer: Answer,
): Promise<Verdict> {
  if (question.type === "write" && answer.type === "write") {
    return gradeQuery(question, seed, answer.query);
  }
  if (question.type === "pilih" && answer.type === "pilih") {
    return answer.choice === question.answerIndex
      ? { correct: true, message: "Tepat sekali!" }
      : {
          correct: false,
          message: "Pilihanmu belum tepat. Coba baca soalnya lagi.",
        };
  }
  if (question.type === "susun" && answer.type === "susun") {
    const same =
      answer.order.length === question.answer.length &&
      answer.order.every((piece, index) => piece === question.answer[index]);
    return same
      ? { correct: true, message: "Tepat sekali!" }
      : { correct: false, message: "Urutannya belum tepat." };
  }
  return { correct: false, message: "Jenis jawaban tidak cocok dengan soal." };
}

export async function gradeQuery(
  question: CaseWriteQuestion,
  seed: string,
  query: string,
): Promise<Verdict> {
  const ruleError = checkRules(question, query);
  if (ruleError) return { correct: false, message: ruleError };

  const SQL = await getSql();

  let user: QueryResult;
  try {
    user = executeQuery(SQL, seed, query);
  } catch (error) {
    return { correct: false, message: explainSqlError(error) };
  }

  const expected = executeQuery(SQL, seed, question.answer);

  if (
    question.aturanKolom === "tepat" &&
    !sameColumns(user.columns, expected.columns)
  ) {
    return {
      correct: false,
      message: "Kolom hasilnya belum sesuai dengan yang diminta.",
    };
  }

  const ordered = /\bORDER\s+BY\b/i.test(question.answer);
  if (!sameRows(user, expected, ordered)) {
    return {
      correct: false,
      message: "Hasilnya belum tepat. Cek lagi baris yang kamu tampilkan.",
    };
  }

  return { correct: true, message: "Tepat sekali!" };
}
