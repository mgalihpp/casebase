/* Web Worker untuk Jalankan di browser. Dibundel esbuild ke public/poc-worker/ (lihat scripts/build-poc.mjs). */
import { buatPelariBrowser } from "./muat-browser";
import type { Pesan } from "./runner";

declare const self: { postMessage(m: unknown): void; onmessage: ((e: { data: Pesan }) => void) | null };

/** Laporan pemuatan mesin, untuk tabel ukur POC. */
const pelari = buatPelariBrowser((mesin, ms, byte) => self.postMessage({ muat: { mesin, ms, byte } }));

self.onmessage = async (e) => {
  self.postMessage(await pelari.tangani(e.data));
};
