/* Browser: menjalankan query di Web Worker. Lebih dari 3 detik -> worker dimatikan, dibuat ulang saat dipakai lagi. */
import type { Balasan, Pesan, PesanBaru } from "./runner";
import { BATAS_WAKTU_MS, type JenisMesin, type Seed } from "./types";

export type LaporanMuat = { mesin: string; ms: number; byte: number };

let worker: Worker | null = null;
let nomor = 0;
const pendengarMuat = new Set<(l: LaporanMuat) => void>();

function ambilWorker(): Worker {
  if (worker) return worker;
  const w = new Worker("/poc-worker/worker.js", { type: "module" });
  w.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.muat) pendengarMuat.forEach((f) => f(e.data.muat));
  });
  worker = w;
  return w;
}

export function dengarMuat(f: (l: LaporanMuat) => void) {
  pendengarMuat.add(f);
  return () => pendengarMuat.delete(f);
}

/** Matikan worker (misalnya untuk mengukur muat pertama lagi). Mesin yang sudah dimuat ikut hilang. */
export function matikanWorker() {
  worker?.terminate();
  worker = null;
}

function kirim(pesan: PesanBaru, batasMs: number | null): Promise<Balasan> {
  const w = ambilWorker();
  const id = ++nomor;
  const t0 = performance.now();
  return new Promise((selesai) => {
    let batas: ReturnType<typeof setTimeout> | undefined;
    const dengar = (e: MessageEvent) => {
      if (e.data?.id !== id) return;
      clearTimeout(batas);
      w.removeEventListener("message", dengar);
      selesai(e.data as Balasan);
    };
    w.addEventListener("message", dengar);
    if (batasMs !== null)
      batas = setTimeout(() => {
        w.removeEventListener("message", dengar);
        matikanWorker();
        selesai({
          id,
          ok: false,
          ms: performance.now() - t0,
          galat: `Query berjalan lebih dari ${BATAS_WAKTU_MS / 1000} detik dan dihentikan. Mungkin ada perulangan tanpa akhir.`,
        });
      }, batasMs);
    w.postMessage({ ...pesan, id });
  });
}

/** Muat mesin dan seed tanpa batas waktu (unduhan PGlite bisa lama di 4G). */
export const siapkan = (mesin: JenisMesin, seed: Seed) => kirim({ op: "siapkan", mesin, seed }, null);

/** Jalankan query. Batas 3 detik dihitung sejak query dikirim; mesin sebaiknya sudah disiapkan. */
export const jalankan = (mesin: JenisMesin, seed: Seed, query: string) => kirim({ op: "run", mesin, seed, query }, BATAS_WAKTU_MS);
