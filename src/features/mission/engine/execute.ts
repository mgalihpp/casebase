import type { SqlJsStatic } from "sql.js";

export type QueryResult = {
  columns: string[];
  rows: unknown[][];
};

// Menjalankan seed lalu query di database sementara, supaya perubahan
// pengguna tidak terbawa ke percobaan berikutnya (SDD 3.8).
export function executeQuery(
  SQL: SqlJsStatic,
  seed: string,
  query: string,
): QueryResult {
  const db = new SQL.Database();
  try {
    db.exec(seed);
    const results = db.exec(query);
    const last = results.at(-1);
    return last
      ? { columns: last.columns, rows: last.values }
      : { columns: [], rows: [] };
  } finally {
    db.close();
  }
}
