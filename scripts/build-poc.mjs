/* Bangun worker POC mesin query.
   - public/poc-worker/: Web Worker (ESM, PGlite di chunk terpisah supaya dimuat hanya saat dipakai)
   - public/pglite/:     berkas WASM sql.js dan PGlite (gzip), diunduh worker saat mesinnya dipakai
   - poc-server/:        worker thread Node untuk /api/poc/check, plus snapshot klaster PostgreSQL kosong */
import { build } from "esbuild";
import { PGlite } from "@electric-sql/pglite";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { builtinModules } from "node:module";
import { join } from "node:path";

/* Berkas mesin disimpan sudah di-gzip dan dibuka worker dengan DecompressionStream.
   Dengan begitu ukuran unduhan tidak bergantung pada apakah hosting mengompres application/wasm
   atau application/octet-stream (next start tidak mengompres pglite.data). */
const pg = join("node_modules", "@electric-sql", "pglite", "dist");
rmSync("public/pglite", { recursive: true, force: true });
mkdirSync("public/pglite", { recursive: true });
const sumber = {
  "pglite.wasm.gz": join(pg, "pglite.wasm"),
  "initdb.wasm.gz": join(pg, "initdb.wasm"),
  "pglite.data.gz": join(pg, "pglite.data"),
  "sql-wasm.wasm.gz": join("node_modules", "sql.js", "dist", "sql-wasm.wasm"),
};
for (const [nama, asal] of Object.entries(sumber)) writeFileSync(join("public/pglite", nama), gzipSync(readFileSync(asal), { level: 9 }));

rmSync("public/poc-worker", { recursive: true, force: true });
const nodeBuiltins = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

await build({
  entryPoints: { worker: "src/poc/worker-browser.ts", "ukur-utama": "src/poc/ukur-utama.ts" },
  bundle: true,
  format: "esm",
  splitting: true,
  platform: "browser",
  target: "es2020",
  outdir: "public/poc-worker",
  external: nodeBuiltins,
  minify: true,
  logLevel: "warning",
});

await build({
  entryPoints: ["src/poc/worker-server.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outfile: "poc-server/worker.mjs",
  external: ["sql.js", "@electric-sql/pglite"],
  logLevel: "warning",
});

/* Snapshot klaster PostgreSQL kosong setelah initdb. Di server, membuka snapshot ~0,5 detik,
   sedangkan initdb ~2,2 detik. Seed kasus tetap dijalankan saat runtime, jadi konten bisa berubah tanpa build ulang. */
const snap = "poc-server/pg-dasar.tar.gz";
if (!existsSync(snap)) {
  const db = await PGlite.create();
  const b = await db.dumpDataDir("gzip");
  writeFileSync(snap, Buffer.from(await b.arrayBuffer()));
  await db.close();
}

console.log("worker POC dibangun: public/poc-worker, public/pglite, poc-server");
