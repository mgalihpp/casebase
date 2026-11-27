/* Pemuat mesin di browser: dipakai Web Worker (worker-browser.ts) dan pengukuran di utas utama (ukur-utama.ts). */
import initSqlJs from "sql.js";
import type { SqlJs } from "./engines/sqljs";
import { buatPelari } from "./runner";

export type Lapor = (mesin: string, ms: number, byte: number) => void;

/** Unduh berkas .gz lalu buka di browser. Mengembalikan isi asli dan ukuran yang benar-benar diunduh. */
async function ambil(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  if (!r.ok || !r.body) throw new Error(`Gagal mengunduh ${url}`);
  diunduh += Number(r.headers.get("content-length") ?? 0);
  return new Response(r.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
}
let diunduh = 0;
/** Total byte terkompresi yang diunduh pemuat ini (dari Content-Length). */
export const totalDiunduh = () => diunduh;

export function buatPelariBrowser(lapor: Lapor) {
  let sqlP: Promise<SqlJs> | null = null;
  let pgP: ReturnType<typeof muatPglite> | null = null;

  async function muatPglite() {
    const t = performance.now();
    const sebelum = diunduh;
    // Modul JS PGlite ada di chunk terpisah: tidak diunduh sampai baris ini dijalankan.
    const [{ PGlite }, pg, initdb, data] = await Promise.all([
      import("@electric-sql/pglite"),
      ambil("/pglite/pglite.wasm.gz"),
      ambil("/pglite/initdb.wasm.gz"),
      ambil("/pglite/pglite.data.gz"),
    ]);
    const tUnduh = performance.now() - t;
    const t1 = performance.now();
    const [pgliteWasmModule, initdbWasmModule] = await Promise.all([WebAssembly.compile(pg), WebAssembly.compile(initdb)]);
    const tersimpan = diunduh;
    lapor("pglite-unduh", tUnduh, tersimpan - sebelum);
    lapor("pglite-kompilasi", performance.now() - t1, 0);
    const fsBundle = new Blob([data]);
    return {
      create: async () => {
        const t2 = performance.now();
        const db = await PGlite.create({ pgliteWasmModule, initdbWasmModule, fsBundle });
        lapor("pglite-initdb", performance.now() - t2, 0);
        return db as never;
      },
    };
  }

  return buatPelari({
    sqljs: () =>
      (sqlP ??= (async () => {
        const t = performance.now();
        const sebelum = diunduh;
        const wasm = await ambil("/pglite/sql-wasm.wasm.gz");
        const SQL = (await initSqlJs({ wasmBinary: wasm })) as SqlJs;
        lapor("sqljs", performance.now() - t, diunduh - sebelum);
        return SQL;
      })()),
    pglite: () => (pgP ??= muatPglite()),
  });
}
