import type { CaseWriteQuestion } from "@/features/course/schemas";

// Hapus komentar dan isi string, lalu ubah ke huruf besar supaya aturan kata kunci
// tidak terkecoh oleh teks di dalam tanda kutip.
export function normalizeSql(query: string): string {
  return query
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Mengembalikan pesan galat dalam Bahasa Indonesia, atau null jika aturan terpenuhi.
export function checkRules(
  question: Pick<CaseWriteQuestion, "boleh" | "wajib">,
  query: string,
): string | null {
  const normalized = normalizeSql(query);
  if (!normalized) return "Editor masih kosong. Mulai dengan SELECT.";

  const statements = normalized
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  if (statements.length > 1) return "Satu query saja ya.";

  const command = statements[0]?.split(" ")[0] ?? "";
  if (question.boleh.length > 0 && !question.boleh.includes(command)) {
    return `Di misi ini kamu hanya boleh memakai ${question.boleh.join(", ")}.`;
  }

  for (const keyword of question.wajib) {
    const pattern = keyword
      .toUpperCase()
      .split(" ")
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+");
    if (!new RegExp(`\\b${pattern}\\b`).test(normalized)) {
      return `Query belum memakai ${keyword}.`;
    }
  }

  return null;
}
