/* POC langkah 2: antarmuka bersama semua mesin query (SDD 3.8). */

export type Nilai = string | number | boolean | null;

/** Hasil QueryEngine.run. Selalu salah satu: kolom+baris, atau galat. */
export type HasilQuery = {
  kolom: string[];
  baris: Nilai[][];
  galat: string | null;
  /** true jika hasil dipotong di BATAS_BARIS. */
  terpotong: boolean;
  /** Khusus MongoDB: dokumen asli, dipakai penilai (bandingkan tanpa _id). */
  dokumen?: Record<string, unknown>[];
};

export type JenisMesin = "sqljs" | "pglite" | "mingo" | "redis";

/** Data contoh. SQL: skrip CREATE + INSERT. MongoDB: koleksi JSON. Redis: daftar perintah awal. */
export type Seed =
  | { jenis: "sql"; skrip: string }
  | { jenis: "mongo"; koleksi: Record<string, Record<string, unknown>[]> }
  | { jenis: "redis"; perintah: string };

export interface QueryEngine {
  readonly jenis: JenisMesin;
  /** Membuat database baru dari seed, menjalankan query, lalu membuang database itu. */
  run(seed: Seed, query: string): Promise<HasilQuery>;
  /**
   * Untuk soal yang mengubah data: jalankan query lalu query pemeriksa di database yang sama.
   * Mengembalikan hasil pemeriksa (atau galat dari query utama).
   */
  runThenCheck(seed: Seed, query: string, pemeriksa: string): Promise<HasilQuery>;
}

export const BATAS_BARIS = 200;
export const BATAS_WAKTU_MS = 3000;

export const galat = (pesan: string): HasilQuery => ({ kolom: [], baris: [], galat: pesan, terpotong: false });

export function potong(kolom: string[], baris: Nilai[][]): HasilQuery {
  return { kolom, baris: baris.slice(0, BATAS_BARIS), galat: null, terpotong: baris.length > BATAS_BARIS };
}
