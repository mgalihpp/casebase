export type Table = { name: string; columns: { name: string; type: string }[] };

const CONSTRAINTS = ["PRIMARY", "FOREIGN", "UNIQUE", "CHECK", "CONSTRAINT"];

export function parseTables(seed: string): Table[] {
  return [...seed.matchAll(/CREATE TABLE\s+(\w+)\s*\(([^)]*)\)/gi)].map(
    ([, name, body]) => ({
      name,
      columns: body
        .split(",")
        .map((part) => part.trim().split(/\s+/))
        .filter(
          ([first]) => first && !CONSTRAINTS.includes(first.toUpperCase()),
        )
        .map(([column, type]) => ({ name: column, type: type ?? "" })),
    }),
  );
}

// Urutan di sini adalah urutan tombol, bukan urutan di kunci jawaban.
const KOSAKATA = [
  "WITH",
  "SELECT",
  "DISTINCT",
  "*",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "UPPER",
  "LENGTH",
  "strftime",
  "ROW_NUMBER",
  "RANK",
  "LAG",
  "(",
  ")",
  "OVER",
  "PARTITION BY",
  "AS",
  "FROM",
  "JOIN",
  "LEFT JOIN",
  "ON",
  "WHERE",
  "IN",
  "NOT IN",
  "LIKE",
  "IS NULL",
  "IS NOT NULL",
  "AND",
  "OR",
  "GROUP BY",
  "HAVING",
  "ORDER BY",
  "ASC",
  "DESC",
  "LIMIT",
  "INSERT INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE FROM",
  "CREATE TABLE",
  "CREATE VIEW",
  "ALTER TABLE",
  "ADD COLUMN",
  "PRIMARY KEY",
  "NOT NULL",
  "FOREIGN KEY",
  "REFERENCES",
  "INTEGER",
  "TEXT",
  "=",
  ">",
  "<",
  ">=",
  "<=",
  "-",
  ";",
];

function patternFor(word: string) {
  const escaped = word
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/ /g, "\\s+");
  return /\w/.test(word)
    ? new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "gi")
    : new RegExp(escaped, "g");
}

/**
 * Kata kunci yang dipakai kunci jawaban, tanpa nilai teks atau angka dan tanpa urutannya.
 * Dijalankan di server; yang dikirim ke klien hanya daftar ini.
 */
export function answerKeywords(answer: string) {
  let rest = answer.replace(/'[^']*'/g, " ");
  const found = new Set<string>();
  for (const word of [...KOSAKATA].sort((a, b) => b.length - a.length)) {
    const pattern = patternFor(word);
    if (pattern.test(rest)) {
      found.add(word);
      rest = rest.replace(patternFor(word), " ");
    }
  }
  return KOSAKATA.filter((word) => found.has(word));
}

/** Tombol kata kunci di editor: kata kunci soal, lalu nama tabel dan kolom kasus. */
export function keywordChips(keywords: string[], tables: Table[]) {
  const names = tables.flatMap((table) => [
    table.name,
    ...table.columns.map((column) => column.name),
  ]);
  return [...new Set([...keywords, ...names, ","])];
}
