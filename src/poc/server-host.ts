/* Server: satu worker thread hangat per instance fungsi. Query lebih dari 3 detik -> worker dimatikan dan dibuat ulang. */
import path from "node:path";
import { Worker } from "node:worker_threads";
import { SEEDS, SOAL } from "./kasus01";
import type { Balasan, Pesan, PesanBaru } from "./runner";
import { BATAS_WAKTU_MS, type JenisMesin, type Seed } from "./types";

type Tugas = { pesan: Pesan; selesai: (b: Balasan & { mulaiDingin: boolean }) => void; dipanaskan?: boolean };

function mesinUntuk(p: Pesan): { mesin: JenisMesin; seed: Seed; kunci: string } | null {
  if (p.op === "check") {
    const s = SOAL.find((x) => x.id === p.soalId);
    return s ? { mesin: s.mesin, seed: SEEDS[s.seed], kunci: `${s.mesin}:${s.seed}` } : null;
  }
  if (p.op === "run" && p.mesin === "pglite" && p.seed.jenis === "sql") return { mesin: p.mesin, seed: p.seed, kunci: `pglite:${p.seed.skrip}` };
  return null;
}

const BERKAS = path.join(process.cwd(), "poc-server", "worker.mjs");
let worker: Worker | null = null;
let siap: Promise<string | null> | null = null;
const BATAS_PANAS_MS = 30000;
let antre: Tugas[] = [];
let sibuk = false;
let nomor = 0;
let dinginBerikut = false;
/** Mesin dan seed yang sudah dimuat di worker yang sedang hidup. */
let hangat = new Set<string>();

function nyalakan() {
  const w = new Worker(BERKAS);
  worker = w;
  hangat = new Set(["sqljs"]);
  // Worker memanaskan sql.js dan PGlite (initdb + seed) lalu mengirim { siap: true }.
  // Pemanasan tidak dihitung ke batas 3 detik query.
  siap = new Promise((ok) => {
    const t = setTimeout(() => ok("Mesin penilai tidak siap dalam 30 detik."), BATAS_PANAS_MS);
    const dengar = (m: { siap?: boolean; galat?: string }) => {
      if (!m.siap) return;
      clearTimeout(t);
      w.off("message", dengar);
      ok(m.galat ? `Mesin penilai gagal dimuat: ${m.galat}` : null);
    };
    w.on("message", dengar);
    w.on("error", (e: Error) => (clearTimeout(t), ok(`Worker penilai galat: ${e.message}`)));
  });
  w.on("error", () => matikan());
}

function matikan() {
  worker?.terminate();
  worker = null;
  siap = null;
}

async function jalankanBerikut() {
  if (sibuk || !antre.length) return;
  sibuk = true;
  const tugas = antre.shift()!;
  const dingin = !worker || dinginBerikut;
  dinginBerikut = false;
  if (!worker) nyalakan();
  const galatPanas = await siap;
  if (galatPanas) {
    matikan();
    tugas.selesai({ id: 0, ok: false, ms: 0, galat: galatPanas, mulaiDingin: dingin });
    sibuk = false;
    jalankanBerikut();
    return;
  }
  const w = worker!;

  // Memuat mesin (misalnya initdb PGlite) tidak dihitung ke batas 3 detik query.
  const perlu = mesinUntuk(tugas.pesan);
  if (perlu && !hangat.has(perlu.kunci)) {
    const idSiap = ++nomor;
    await new Promise<void>((ok) => {
      const d = (b: Balasan) => b.id === idSiap && (w.off("message", d), ok());
      w.on("message", d);
      w.postMessage({ id: idSiap, op: "siapkan", mesin: perlu.mesin, seed: perlu.seed } satisfies Pesan);
    });
    hangat.add(perlu.kunci);
    tugas.dipanaskan = true;
  }

  const id = ++nomor;
  const t0 = performance.now();
  const akhiri = (b: Balasan) => {
    clearTimeout(batas);
    w.off("message", dengar);
    tugas.selesai({ ...b, mulaiDingin: dingin || !!tugas.dipanaskan });
    sibuk = false;
    jalankanBerikut();
  };
  const dengar = (b: Balasan) => b.id === id && akhiri(b);
  const batas = setTimeout(() => {
    matikan();
    nyalakan(); // panaskan pengganti segera, jangan tunggu permintaan berikutnya
    dinginBerikut = true;
    akhiri({
      id,
      ok: false,
      ms: performance.now() - t0,
      galat: `Query berjalan lebih dari ${BATAS_WAKTU_MS / 1000} detik dan dihentikan. Mungkin ada perulangan tanpa akhir.`,
    });
  }, BATAS_WAKTU_MS);
  w.on("message", dengar);
  w.postMessage({ ...tugas.pesan, id });
}

export function kirimKeServer(pesan: PesanBaru): Promise<Balasan & { mulaiDingin: boolean }> {
  return new Promise((selesai) => {
    antre.push({ pesan: { ...pesan, id: 0 } as Pesan, selesai });
    jalankanBerikut();
  });
}

/** Untuk uji: matikan worker supaya proses Node bisa selesai. */
export function tutupServerHost() {
  antre = [];
  matikan();
}
