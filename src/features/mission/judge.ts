import type { CaseWriteQuestion } from "@/features/course/schemas";

export type RunOutcome =
  | { ok: true; columns: string[]; rows: unknown[][] }
  | { ok: false; message: string };

// Satu eksekusi: seed, lalu prelude (query pengguna) bila ada, lalu query yang dinilai.
export type Job = { seed: string; prelude: string | null; query: string };
export type Runner = (jobs: Job[]) => Promise<RunOutcome[]>;

export type Verdict = { correct: boolean; message: string };

const KNOWN_COMMANDS = [
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "DROP",
  "ALTER",
  "PRAGMA",
];

/** Memisah statement pada `;` di luar kutip dan tanda kurung. */
export function splitStatements(query: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < query.length; i++) {
    const ch = query[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === ";" && depth === 0) {
      out.push(query.slice(start, i));
      start = i + 1;
    }
  }
  out.push(query.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

/**
 * Perintah yang menentukan isi statement. Untuk `WITH ... SELECT` ini adalah
 * SELECT, INSERT, UPDATE, atau DELETE pertama di luar tanda kurung CTE.
 */
export function mainCommand(statement: string): string | null {
  const first = statement.match(/^\s*([A-Za-z]+)/)?.[1]?.toUpperCase() ?? null;
  if (first !== "WITH") return first;
  let depth = 0;
  let quote: string | null = null;
  let word = "";
  const flush = () => {
    const upper = word.toUpperCase();
    word = "";
    return depth === 0 &&
      ["SELECT", "INSERT", "UPDATE", "DELETE"].includes(upper)
      ? upper
      : null;
  };
  for (const ch of statement.slice(4)) {
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (/[A-Za-z_]/.test(ch)) {
      word += ch;
      continue;
    }
    const found = flush();
    if (found) return found;
  }
  return flush();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Mencocokkan kata kunci wajib seperti `ORDER BY` dengan spasi bebas di antara kata. */
export function containsKeyword(query: string, keyword: string) {
  const pattern = keyword.trim().split(/\s+/).map(escapeRegExp).join("\\s+");
  return new RegExp(`\\b${pattern}\\b`, "i").test(query);
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

type Table = { columns: string[]; rows: unknown[][] };

/**
 * Membandingkan tabel pengguna dengan tabel kunci. Kolom dicocokkan dengan
 * nama, tanpa peduli huruf dan urutan. Baris dicocokkan sebagai himpunan,
 * kecuali kunci memakai ORDER BY, lalu urutannya harus sama.
 */
export function compareTables(
  user: Table,
  expected: Table,
  columnRule: CaseWriteQuestion["aturanKolom"],
  ordered: boolean,
): boolean {
  const userCols = user.columns.map((c) => c.toLowerCase());
  const expCols = expected.columns.map((c) => c.toLowerCase());

  if (columnRule === "tepat") {
    if (userCols.length !== expCols.length) return false;
    if (new Set(userCols).size !== userCols.length) return false;
  }
  const idx = expCols.map((c) => userCols.indexOf(c));
  if (idx.some((i) => i === -1)) return false;

  // Baris pengguna dipetakan ke urutan kolom kunci. Baris kunci sudah dalam urutan itu.
  const keyOrder = expCols.map((_, i) => i);
  const project = (rows: unknown[][], columns: number[]) =>
    rows.map((row) => columns.map((i) => normalizeCell(row[i])).join("\u0001"));

  const got = project(user.rows, idx);
  const want = project(expected.rows, keyOrder);
  if (got.length !== want.length) return false;
  if (ordered) return got.every((row, i) => row === want[i]);
  const sortedGot = [...got].sort();
  const sortedWant = [...want].sort();
  return sortedGot.every((row, i) => row === sortedWant[i]);
}

const CORRECT = "Tepat sekali!";

/**
 * Menilai soal tulis query (SDD 3.7.1). Urutan pemeriksaan: perintah yang
 * diizinkan, kata wajib, galat sintaks, lalu hasil.
 */
export async function judgeWrite(
  question: CaseWriteQuestion,
  seed: string,
  userQuery: string,
  run: Runner,
): Promise<Verdict> {
  const query = userQuery.trim();
  if (!query) return { correct: false, message: "Tulis query dulu." };

  const allowed = question.boleh.map((b) => b.toUpperCase());
  for (const statement of splitStatements(query)) {
    const command = mainCommand(statement);
    if (
      !command ||
      !KNOWN_COMMANDS.includes(command) ||
      !allowed.includes(command)
    ) {
      return {
        correct: false,
        message:
          command && KNOWN_COMMANDS.includes(command)
            ? `Perintah ${command} belum dipakai di misi ini.`
            : "Perintah pertama belum dikenali. Periksa penulisannya.",
      };
    }
  }

  for (const required of question.wajib) {
    if (!containsKeyword(query, required)) {
      return { correct: false, message: `Query belum memakai ${required}.` };
    }
  }

  const ordered = containsKeyword(question.answer, "ORDER BY");
  const [user, expected] = await run(
    question.pemeriksa
      ? [
          { seed, prelude: query, query: question.pemeriksa },
          { seed, prelude: question.answer, query: question.pemeriksa },
        ]
      : [
          { seed, prelude: null, query },
          { seed, prelude: null, query: question.answer },
        ],
  );
  if (!user.ok) return { correct: false, message: user.message };
  if (!expected.ok) return { correct: false, message: expected.message };

  const same = compareTables(
    { columns: user.columns, rows: user.rows },
    { columns: expected.columns, rows: expected.rows },
    question.aturanKolom,
    ordered,
  );
  return same
    ? { correct: true, message: CORRECT }
    : {
        correct: false,
        message: question.pemeriksa
          ? "Data setelah perintahmu belum sama dengan yang dicari."
          : "Hasilnya belum sama dengan bukti yang dicari.",
      };
}
