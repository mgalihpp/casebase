/* Data contoh POC: tabel transaksi Kasus 01 (sama dengan src/game/content.ts) di empat mesin.
   Berkas ini aman dikirim ke browser: tidak berisi kunci jawaban. Kunci ada di kasus01-kunci.ts. */
import type { JenisMesin, Seed } from "./types";

const TRANSAKSI: [number, string, number, string, string][] = [
  [1, "KAS-GDG", 2500000, "2026-03-13 21:10", "Pembelian palet"],
  [2, "KAS-GDG", 18750000, "2026-03-14 23:41", "Transfer ke BYS-88"],
  [3, "KAS-07", 950000, "2026-03-14 08:15", "Uang makan"],
  [4, "KAS-GDG", 32000000, "2026-03-15 00:12", "Transfer ke BYS-88"],
  [5, "PRB-22", 4200000, "2026-03-15 09:30", "Servis forklift"],
  [6, "KAS-GDG", 27500000, "2026-03-15 00:37", "Transfer ke BYS-88"],
  [7, "KAS-07", 1100000, "2026-03-15 10:02", "Uang makan"],
  [8, "PRB-22", 12300000, "2026-03-15 13:45", "Pembelian ban"],
  [9, "KAS-GDG", 15000000, "2026-03-12 14:00", "Gaji lembur"],
];

const q = (v: string | number) => (typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);
const insert = TRANSAKSI.map((r) => `INSERT INTO transaksi VALUES (${r.map(q).join(", ")});`).join("\n");

export const SEEDS: Record<"sqlite" | "postgres" | "mongo" | "redis", Seed> = {
  sqlite: {
    jenis: "sql",
    skrip: `CREATE TABLE transaksi (id INTEGER PRIMARY KEY, rekening TEXT COLLATE NOCASE, jumlah INTEGER, waktu TEXT, keterangan TEXT COLLATE NOCASE);\n${insert}`,
  },
  postgres: {
    jenis: "sql",
    skrip: `CREATE TABLE transaksi (id integer PRIMARY KEY, rekening text NOT NULL, jumlah bigint NOT NULL, waktu timestamp NOT NULL, keterangan text);\n${insert}`,
  },
  mongo: {
    jenis: "mongo",
    koleksi: {
      transaksi: TRANSAKSI.map(([id, rekening, jumlah, waktu, keterangan]) => ({ _id: `trx${id}`, id, rekening, jumlah, waktu, keterangan })),
    },
  },
  redis: {
    jenis: "redis",
    perintah: ["SET transfer:BYS-88 3", "SET saldo:KAS-GDG 15000000", "SET sesi:dewi aktif EX 900"].join("\n"),
  },
};

export type Soal = {
  id: string;
  kursus: string;
  mesin: JenisMesin;
  seed: keyof typeof SEEDS;
  pertanyaan: string;
  jenis: "baca" | "ubah";
  /** tepat: nama dan jumlah kolom sama. minimal: kolom kunci harus ada, kolom lebih boleh. */
  aturanKolom: "tepat" | "minimal";
  boleh: string[];
  /** Perintah yang wajib muncul, misalnya BEGIN dan COMMIT. */
  wajib?: string[];
  contoh: string;
};

export const SOAL: Soal[] = [
  {
    id: "sql-top3",
    kursus: "SQL Dasar",
    mesin: "sqljs",
    seed: "sqlite",
    pertanyaan: "Tampilkan 3 transaksi dengan jumlah terbesar, dari yang paling besar.",
    jenis: "baca",
    aturanKolom: "tepat",
    boleh: ["SELECT"],
    contoh: "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3",
  },
  {
    id: "pg-top3",
    kursus: "PostgreSQL",
    mesin: "pglite",
    seed: "postgres",
    pertanyaan: "Tampilkan 3 transaksi dengan jumlah terbesar, dari yang paling besar.",
    jenis: "baca",
    aturanKolom: "tepat",
    boleh: ["SELECT"],
    contoh: "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3",
  },
  {
    id: "pg-bekukan",
    kursus: "PostgreSQL",
    mesin: "pglite",
    seed: "postgres",
    pertanyaan:
      "Dalam satu transaksi (BEGIN sampai COMMIT), ubah keterangan semua transfer ke BYS-88 menjadi 'Dibekukan' dan pindahkan rekeningnya ke 'BEKU-01'.",
    jenis: "ubah",
    aturanKolom: "tepat",
    boleh: ["BEGIN", "UPDATE", "COMMIT", "ROLLBACK", "SELECT"],
    wajib: ["BEGIN", "COMMIT"],
    contoh:
      "BEGIN;\nUPDATE transaksi SET keterangan = 'Dibekukan', rekening = 'BEKU-01'\nWHERE keterangan = 'Transfer ke BYS-88';\nCOMMIT;",
  },
  {
    id: "mongo-top3",
    kursus: "MongoDB",
    mesin: "mingo",
    seed: "mongo",
    pertanyaan: "Tampilkan 3 dokumen transaksi dengan jumlah terbesar, dari yang paling besar.",
    jenis: "baca",
    aturanKolom: "tepat",
    boleh: ["find", "sort", "limit", "skip", "aggregate"],
    contoh: "db.transaksi.find({}).sort({ jumlah: -1 }).limit(3)",
  },
  {
    id: "redis-hitung",
    kursus: "Redis",
    mesin: "redis",
    seed: "redis",
    pertanyaan:
      "BYS-88 menerima satu transfer lagi. Naikkan penghitung transfer:BYS-88, lalu buat kunci itu kedaluwarsa dalam 3600 detik.",
    jenis: "ubah",
    aturanKolom: "tepat",
    boleh: ["GET", "SET", "INCR", "INCRBY", "EXPIRE", "TTL", "EXISTS"],
    contoh: "INCR transfer:BYS-88\nEXPIRE transfer:BYS-88 3600",
  },
];

/** Query tak berujung per mesin, untuk menguji batas 3 detik. */
export const QUERY_TAK_BERUJUNG: Partial<Record<JenisMesin, string>> = {
  sqljs: "WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r) SELECT count(*) FROM r",
  pglite: "WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r) SELECT count(*) FROM r",
};
