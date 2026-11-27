/* Pengukuran di utas utama halaman, KHUSUS untuk emulasi CPU HP lewat DevTools/CDP:
   Chrome hanya bisa melambatkan CPU utas halaman, tidak bisa melambatkan Web Worker.
   Kode mesinnya sama persis dengan yang dipakai worker. Produk tetap menjalankan query di Web Worker. */
import { buatPelariBrowser } from "./muat-browser";
import { SEEDS } from "./kasus01";

export async function ukur() {
  const tahap: Record<string, number> = {};
  const p = buatPelariBrowser((mesin, ms) => (tahap[mesin] = Math.round(ms)));
  const q = "SELECT * FROM transaksi ORDER BY jumlah DESC LIMIT 3";
  let t = performance.now();
  await p.tangani({ id: 1, op: "siapkan", mesin: "sqljs", seed: SEEDS.sqlite });
  const sqljsMuat = Math.round(performance.now() - t);
  const sx: number[] = [];
  for (let i = 0; i < 20; i++) sx.push((await p.tangani({ id: 2, op: "run", mesin: "sqljs", seed: SEEDS.sqlite, query: q })).ms);
  t = performance.now();
  await p.tangani({ id: 3, op: "siapkan", mesin: "pglite", seed: SEEDS.postgres });
  const pgMuat = Math.round(performance.now() - t);
  const px: number[] = [];
  for (let i = 0; i < 20; i++) px.push((await p.tangani({ id: 4, op: "run", mesin: "pglite", seed: SEEDS.postgres, query: q })).ms);
  const p95 = (xs: number[]) => +[...xs].sort((a, b) => a - b)[Math.ceil(0.95 * xs.length) - 1].toFixed(1);
  return { sqljs_muat_ms: sqljsMuat, sqljs_jalankan_p95: p95(sx), pglite_muat_ms: pgMuat, pglite_tahap: tahap, pglite_jalankan_p95: p95(px) };
}
