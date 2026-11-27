/* Worker thread Node untuk Cek jawaban. Dibundel esbuild ke poc-server/worker.mjs (sql.js dan PGlite eksternal). */
import { PGlite } from "@electric-sql/pglite";
import initSqlJs from "sql.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parentPort } from "node:worker_threads";
import type { SqlJs } from "./engines/sqljs";
import { KUNCI } from "./kasus01-kunci";
import { SEEDS, SOAL } from "./kasus01";
import { nilaiJawaban } from "./nilai";
import { buatPelari, type Pesan } from "./runner";

/* Berkas WASM dibaca dari node_modules lewat process.cwd(), bukan lewat resolusi paket:
   Next.js (Turbopack) membundel worker ini, dan di dalam bundel sql.js tidak bisa menemukan berkasnya sendiri. */
const dariModul = (...p: string[]) => readFile(path.join(process.cwd(), "node_modules", ...p));

let sqlP: Promise<SqlJs> | null = null;
let pgP: Promise<{ create(): Promise<never> }> | null = null;
const pelari = buatPelari({
  sqljs: () => (sqlP ??= dariModul("sql.js", "dist", "sql-wasm.wasm").then((b) => initSqlJs({ wasmBinary: b }) as Promise<SqlJs>)),
  pglite: () =>
    (pgP ??= (async () => {
      const [pg, initdb, data, snapshot] = await Promise.all([
        dariModul("@electric-sql", "pglite", "dist", "pglite.wasm"),
        dariModul("@electric-sql", "pglite", "dist", "initdb.wasm"),
        dariModul("@electric-sql", "pglite", "dist", "pglite.data"),
        readFile(path.join(process.cwd(), "poc-server", "pg-dasar.tar.gz")).catch(() => null),
      ]);
      const [pgliteWasmModule, initdbWasmModule] = await Promise.all([WebAssembly.compile(pg), WebAssembly.compile(initdb)]);
      const fsBundle = new Blob([data]);
      // Snapshot klaster kosong (dibuat scripts/build-poc.mjs) melewati initdb. Tanpa snapshot, initdb biasa.
      const loadDataDir = snapshot ? new Blob([snapshot]) : undefined;
      return { create: () => PGlite.create({ pgliteWasmModule, initdbWasmModule, fsBundle, loadDataDir }) as never };
    })()),
});

parentPort!.on("message", async (p: Pesan) => {
  const balas = await pelari.tangani(p, async (c) => {
    const soal = SOAL.find((s) => s.id === c.soalId);
    const kunci = KUNCI[c.soalId];
    if (!soal || !kunci) throw new Error("Soal tidak ditemukan");
    return nilaiJawaban(pelari.mesin[soal.mesin], soal, SEEDS[soal.seed], kunci, c.query);
  });
  parentPort!.postMessage(balas);
});

/* Panaskan sql.js sejak worker dibuat (murah). PGlite dipanaskan host saat soal PostgreSQL pertama datang. */
Promise.all([pelari.tangani({ id: -2, op: "siapkan", mesin: "sqljs", seed: SEEDS.sqlite })]).then((b) => {
  const gagal = b.find((x) => !x.ok);
  parentPort!.postMessage({ siap: true, galat: gagal && !gagal.ok ? gagal.galat : undefined });
});
