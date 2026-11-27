/* Isi worker yang sama untuk browser (Web Worker) dan server (worker_threads Node). */
import { buatMingoEngine } from "./engines/mingo";
import { buatPgliteEngine, type MuatPglite } from "./engines/pglite";
import { buatRedisEngine } from "./engines/redis";
import { buatSqlJsEngine, type SqlJs } from "./engines/sqljs";
import type { HasilQuery, JenisMesin, QueryEngine, Seed } from "./types";

export type Pesan =
  | { id: number; op: "run"; mesin: JenisMesin; seed: Seed; query: string }
  | { id: number; op: "siapkan"; mesin: JenisMesin; seed: Seed }
  | { id: number; op: "check"; soalId: string; query: string };

/** Pesan sebelum diberi nomor. Omit dibagi per anggota union supaya field tiap jenis pesan tetap dikenal. */
export type PesanBaru = Pesan extends infer P ? (P extends unknown ? Omit<P, "id"> : never) : never;

export type Balasan =
  | { id: number; ok: true; ms: number; hasil?: HasilQuery; putusan?: unknown }
  | { id: number; ok: false; ms: number; galat: string };

export function buatPelari(muat: { sqljs: () => Promise<SqlJs>; pglite: MuatPglite }) {
  const sqljs = buatSqlJsEngine(muat.sqljs);
  const pglite = buatPgliteEngine(muat.pglite);
  const mesin: Record<JenisMesin, QueryEngine> = { sqljs, pglite, mingo: buatMingoEngine(), redis: buatRedisEngine() };

  return {
    mesin,
    async tangani(p: Pesan, nilai?: (p: Extract<Pesan, { op: "check" }>) => Promise<unknown>): Promise<Balasan> {
      const t0 = performance.now();
      try {
        if (p.op === "siapkan") {
          if (p.mesin === "pglite") await pglite.siapkan(p.seed);
          else await mesin[p.mesin].run(p.seed, p.mesin === "mingo" ? "db.x.find()" : p.mesin === "redis" ? "GET x" : "SELECT 1");
          return { id: p.id, ok: true, ms: performance.now() - t0 };
        }
        if (p.op === "run") {
          const hasil = await mesin[p.mesin].run(p.seed, p.query);
          return { id: p.id, ok: true, ms: performance.now() - t0, hasil };
        }
        if (!nilai) throw new Error("Penilaian hanya di server");
        const putusan = await nilai(p);
        return { id: p.id, ok: true, ms: performance.now() - t0, putusan };
      } catch (e) {
        return { id: p.id, ok: false, ms: performance.now() - t0, galat: String((e as Error)?.message ?? e) };
      }
    },
  };
}
