/* Penilai jawaban soal tulis query, mengikuti SDD 3.7.1. Dijalankan di server (worker thread). */
import { uraiMongo } from "./engines/mingo";
import { pecahToken } from "./engines/redis";
import type { Soal } from "./kasus01";
import { cekPerintahBoleh, kataPerintah, pakaiOrderBy, pecahPerintah } from "./sqlutil";
import type { HasilQuery, Nilai, QueryEngine, Seed } from "./types";

export type Putusan = { benar: boolean; pesan: string; hasil?: HasilQuery };

/* ---------- 1. perintah boleh dan wajib (FR-EDT-04) ---------- */

function daftarPerintah(soal: Soal, query: string): string[] | { galat: string } {
  if (soal.mesin === "redis")
    return query.split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("#")).map((s) => pecahToken(s)[0].toUpperCase());
  if (soal.mesin === "mingo") {
    try {
      return uraiMongo(query).rantai.map((p) => p.metode);
    } catch {
      return []; // galat urai dilaporkan mesin dengan pesan yang lebih jelas
    }
  }
  const p = pecahPerintah(query);
  return "galat" in p ? p : p.perintah.map(kataPerintah);
}

function cekPerintah(soal: Soal, query: string): string | null {
  if (soal.mesin === "sqljs" || soal.mesin === "pglite") {
    const g = cekPerintahBoleh(query, soal.boleh);
    if (g) return g;
  }
  const d = daftarPerintah(soal, query);
  if ("galat" in d) return d.galat;
  const boleh = new Set(soal.boleh.map((b) => b.toUpperCase()));
  const asing = d.find((x) => !boleh.has(x.toUpperCase()));
  if (asing) return `Perintah ${asing} tidak dipakai di soal ini. Yang boleh: ${soal.boleh.join(", ")}.`;
  const kurang = (soal.wajib ?? []).filter((w) => !d.some((x) => x.toUpperCase() === w.toUpperCase()));
  if (kurang.length) return `Soal ini meminta ${kurang.join(" dan ")} ditulis.`;
  return null;
}

/* ---------- 2. samakan bentuk nilai ---------- */

function bentuk(v: Nilai): string {
  if (v === null) return "∅";
  if (typeof v === "boolean") return "n:" + (v ? 1 : 0);
  if (typeof v === "number") return "n:" + (Number.isInteger(v) ? String(v) : v.toFixed(4));
  const t = v.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) {
    const n = Number(t);
    return "n:" + (Number.isInteger(n) ? String(n) : n.toFixed(4));
  }
  return "s:" + t.toLowerCase();
}

/** MongoDB: buang _id, susun kolom menurut abjad supaya urutan field tidak berpengaruh. */
function tanpaId(h: HasilQuery): HasilQuery {
  if (!h.dokumen) return h;
  const docs = h.dokumen.map(({ _id, ...d }) => d);
  const kolom = [...new Set(docs.flatMap((d) => Object.keys(d)))].sort();
  const sel = (v: unknown): Nilai =>
    v === undefined ? null : v === null || ["string", "number", "boolean"].includes(typeof v) ? (v as Nilai) : JSON.stringify(v);
  return { ...h, kolom, baris: docs.map((d) => kolom.map((k) => sel(d[k]))) };
}

/* ---------- 3. bandingkan ---------- */

export function bandingkan(p: HasilQuery, k: HasilQuery, aturan: Soal["aturanKolom"], berurutan: boolean): string | null {
  const pk = p.kolom.map((c) => c.toLowerCase());
  const kk = k.kolom.map((c) => c.toLowerCase());
  let indeks: number[];
  if (aturan === "tepat") {
    if (pk.length !== kk.length)
      return pk.length > kk.length
        ? `Hasilmu punya ${pk.length} kolom, padahal yang dicari ${kk.length}. Cek lagi kolom setelah SELECT.`
        : `Hasilmu baru ${pk.length} kolom, yang dicari ${kk.length}. Ada kolom yang belum kamu pilih.`;
    const hilang = kk.filter((c) => !pk.includes(c));
    if (hilang.length) return `Kolom ${hilang.join(", ")} belum ada di hasilmu. Cek nama kolom atau alias.`;
  } else {
    const hilang = kk.filter((c) => !pk.includes(c));
    if (hilang.length) return `Kolom ${hilang.join(", ")} belum ada di hasilmu.`;
  }
  indeks = kk.map((c) => pk.indexOf(c));

  const pr = p.baris.map((r) => indeks.map((i) => bentuk(r[i])).join("␟"));
  const kr = k.baris.map((r) => r.map(bentuk).join("␟"));
  if (pr.length !== kr.length)
    return pr.length > kr.length
      ? `Hasilmu ${pr.length} baris, yang dicari ${kr.length} baris. Saringanmu masih terlalu longgar.`
      : `Hasilmu ${pr.length} baris, yang dicari ${kr.length} baris. Saringanmu terlalu ketat.`;
  const ps = [...pr].sort();
  const ks = [...kr].sort();
  if (!ps.every((v, i) => v === ks[i])) return "Jumlah baris dan kolomnya sudah pas, tapi isinya belum cocok.";
  if (berurutan && !pr.every((v, i) => v === kr[i])) return "Isinya sudah benar, tinggal urutannya.";
  return null;
}

function berurutan(soal: Soal, kunci: string, pemeriksa?: string): boolean {
  const acuan = pemeriksa ?? kunci;
  if (soal.mesin === "redis") return true;
  if (soal.mesin === "mingo") return /\.sort\s*\(|\$sort/.test(acuan);
  return pakaiOrderBy(acuan);
}

/* ---------- alur lengkap ---------- */

export async function nilaiJawaban(
  mesin: QueryEngine,
  soal: Soal,
  seed: Seed,
  kunci: { kunci: string; pemeriksa?: string },
  query: string,
): Promise<Putusan> {
  const tolak = cekPerintah(soal, query);
  if (tolak) return { benar: false, pesan: tolak };

  const jalan = (q: string) => (kunci.pemeriksa ? mesin.runThenCheck(seed, q, kunci.pemeriksa) : mesin.run(seed, q));
  const hp = await jalan(query);
  if (hp.galat) return { benar: false, pesan: hp.galat, hasil: hp };
  const hk = await jalan(kunci.kunci);
  if (hk.galat) return { benar: false, pesan: "Kunci jawaban soal ini rusak. Ini salah kami, bukan kamu." };

  const beda = bandingkan(tanpaId(hp), tanpaId(hk), soal.aturanKolom, berurutan(soal, kunci.kunci, kunci.pemeriksa));
  return beda ? { benar: false, pesan: beda, hasil: hp } : { benar: true, pesan: "Benar!", hasil: hp };
}
