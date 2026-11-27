/* Mesin SQL Dasar dan SQLite: sql.js (SQLite WASM). */
import { terjemahSqlite } from "../galat";
import { BATAS_BARIS, galat, potong, type HasilQuery, type Nilai, type QueryEngine, type Seed } from "../types";

type Stmt = {
  getColumnNames(): string[];
  step(): boolean;
  get(): unknown[];
  free(): void;
};
type Db = {
  exec(sql: string): unknown;
  iterateStatements(sql: string): Iterable<Stmt>;
  close(): void;
};
export type SqlJs = { Database: new () => Db };

const ubah = (v: unknown): Nilai =>
  v === null || typeof v === "number" || typeof v === "string" ? v : v instanceof Uint8Array ? `[blob ${v.length} byte]` : String(v);

/** Jalankan semua perintah. Hasil = perintah terakhir yang punya kolom. Baris dibaca paling banyak BATAS_BARIS+1. */
function jalankan(db: Db, sql: string): HasilQuery {
  let akhir: HasilQuery = { kolom: [], baris: [], galat: null, terpotong: false };
  try {
    for (const st of db.iterateStatements(sql)) {
      const kolom = st.getColumnNames();
      const baris: Nilai[][] = [];
      while (st.step()) {
        if (kolom.length) baris.push(st.get().map(ubah));
        if (baris.length > BATAS_BARIS) break;
      }
      st.free();
      if (kolom.length) akhir = potong(kolom, baris);
    }
    return akhir;
  } catch (e) {
    return galat(terjemahSqlite(String((e as Error)?.message ?? e)));
  }
}

export function buatSqlJsEngine(muat: () => Promise<SqlJs>): QueryEngine {
  const baru = async (seed: Seed) => {
    if (seed.jenis !== "sql") throw new Error("Seed sql.js harus berjenis sql");
    const SQL = await muat();
    const db = new SQL.Database();
    db.exec(seed.skrip);
    return db;
  };
  return {
    jenis: "sqljs",
    async run(seed, query) {
      const db = await baru(seed);
      try {
        return jalankan(db, query);
      } finally {
        db.close();
      }
    },
    async runThenCheck(seed, query, pemeriksa) {
      const db = await baru(seed);
      try {
        const r = jalankan(db, query);
        if (r.galat) return r;
        return jalankan(db, pemeriksa);
      } finally {
        db.close();
      }
    },
  };
}
