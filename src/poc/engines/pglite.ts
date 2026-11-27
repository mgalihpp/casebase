/* Mesin PostgreSQL: PGlite (Postgres WASM). Dimuat hanya saat dipakai. */
import { terjemahPostgres } from "../galat";
import { kataPerintah, pecahPerintah } from "../sqlutil";
import { galat, potong, type HasilQuery, type Nilai, type QueryEngine, type Seed } from "../types";

type Hasil = { rows: unknown[][]; fields: { name: string }[] };
export type Pg = {
  exec(sql: string, opsi?: { rowMode?: "array" }): Promise<Hasil[]>;
  close(): Promise<void>;
};
export type MuatPglite = () => Promise<{ create(): Promise<Pg> }>;

const ubah = (v: unknown): Nilai => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  if (typeof v === "bigint") return Number(v);
  if (v instanceof Date) return v.toISOString().replace("T", " ").replace(/\.000Z$/, "");
  return JSON.stringify(v);
};

const SP = "casebase_pengguna";

/**
 * Transaksi pengguna dijalankan di dalam transaksi bungkus milik sandbox:
 *   BEGIN -> SAVEPOINT, COMMIT -> RELEASE SAVEPOINT, ROLLBACK -> ROLLBACK TO SAVEPOINT.
 * BEGIN kedua atau COMMIT tanpa BEGIN dibuang, sama seperti PostgreSQL asli yang hanya memberi WARNING.
 * Perintah dijalankan satu per satu dan berhenti di galat pertama, jadi perilaku "transaksi batal setelah galat"
 * tidak perlu ditiru.
 */
export function tulisUlangTransaksi(perintah: string[]): string[] {
  let terbuka = false;
  const out: string[] = [];
  for (const s of perintah) {
    const k = kataPerintah(s);
    const keSavepoint = /^\s*rollback\s+(work\s+|transaction\s+)?to\b/i.test(s);
    if (k === "BEGIN") {
      if (!terbuka) out.push(`SAVEPOINT ${SP}`);
      terbuka = true;
    } else if (k === "COMMIT") {
      if (terbuka) out.push(`RELEASE SAVEPOINT ${SP}`);
      terbuka = false;
    } else if (k === "ROLLBACK" && !keSavepoint) {
      if (terbuka) out.push(`ROLLBACK TO SAVEPOINT ${SP}`, `RELEASE SAVEPOINT ${SP}`);
      terbuka = false;
    } else out.push(s);
  }
  return out;
}

async function jalankan(db: Pg, sql: string): Promise<HasilQuery> {
  const p = pecahPerintah(sql);
  if ("galat" in p) return galat(p.galat);
  if (p.perintah.some((s) => /^\s*(prepare\s+transaction|(commit|rollback)\s+prepared)\b/i.test(s)))
    return galat("Transaksi dua fase (PREPARE TRANSACTION) tidak dipakai di latihan ini.");
  let akhir: HasilQuery = { kolom: [], baris: [], galat: null, terpotong: false };
  try {
    for (const s of tulisUlangTransaksi(p.perintah)) {
      const [h] = await db.exec(s, { rowMode: "array" });
      if (h?.fields.length) akhir = potong(h.fields.map((f) => f.name), h.rows.map((r) => r.map(ubah)));
    }
    return akhir;
  } catch (e) {
    return galat(terjemahPostgres(e as { message?: string; code?: string }));
  }
}

/**
 * Membuat database PostgreSQL baru itu mahal (initdb, 1,5 sampai 3 detik di server). Jadi satu database "templat"
 * diisi seed sekali, lalu tiap Jalankan/Cek dibungkus BEGIN ... ROLLBACK di templat itu.
 * Hasilnya setara dengan "database baru dari seed" (SDD 3.8) tanpa biaya membuat database.
 */
export function buatPgliteEngine(muat: MuatPglite): QueryEngine & { siapkan(seed: Seed): Promise<void> } {
  const templat = new Map<string, Promise<Pg>>();
  let antre: Promise<unknown> = Promise.resolve();

  const ambilTemplat = (seed: Seed) => {
    if (seed.jenis !== "sql") throw new Error("Seed PGlite harus berjenis sql");
    let p = templat.get(seed.skrip);
    if (!p) {
      p = (async () => {
        const PG = await muat();
        const db = await PG.create();
        await db.exec(seed.skrip);
        return db;
      })();
      p.catch(() => templat.delete(seed.skrip));
      templat.set(seed.skrip, p);
    }
    return p;
  };

  /** Templat dipakai bergantian, satu pekerjaan dalam satu waktu. */
  const serial = <T>(f: () => Promise<T>): Promise<T> => {
    const r = antre.then(f, f);
    antre = r.catch(() => undefined);
    return r;
  };

  const dibungkus = (seed: Seed, kerja: (db: Pg) => Promise<HasilQuery>) =>
    serial(async () => {
      const db = await ambilTemplat(seed);
      await db.exec("BEGIN");
      try {
        return await kerja(db);
      } finally {
        await db.exec("ROLLBACK");
      }
    });

  return {
    jenis: "pglite",
    async siapkan(seed) {
      await ambilTemplat(seed);
    },
    run(seed, query) {
      return dibungkus(seed, (db) => jalankan(db, query));
    },
    runThenCheck(seed, query, pemeriksa) {
      return dibungkus(seed, async (db) => {
        const r = await jalankan(db, query);
        return r.galat ? r : jalankan(db, pemeriksa);
      });
    },
  };
}
