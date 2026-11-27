"use client";
/* Halaman uji POC mesin query (langkah 2). Bukan layar produk: hanya untuk membuktikan dan mengukur. */
import { useEffect, useRef, useState } from "react";
import { dengarMuat, jalankan, matikanWorker, siapkan, type LaporanMuat } from "./klien";
import { QUERY_TAK_BERUJUNG, SEEDS, SOAL, type Soal } from "./kasus01";
import type { HasilQuery } from "./types";

type Cek = { putusan: { benar: boolean; pesan: string }; ukur: { msMesin: number; msTotal: number; mulaiDingin: boolean } };

const persen = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.ceil((p / 100) * xs.length) - 1)];
const mb = (b: number) => `${(b / 1048576).toFixed(2)} MB`;
const ms = (x: number) => `${Math.round(x)} ms`;

async function cekServer(soalId: string, query: string): Promise<{ data: Cek; msJaringan: number }> {
  const t = performance.now();
  const r = await fetch("/api/poc/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ soalId, query }) });
  const data = (await r.json()) as Cek;
  return { data, msJaringan: performance.now() - t };
}

/** Ukuran unduhan sebenarnya (terkompresi) dari Resource Timing. */
function ukuranUnduhan(pola: RegExp) {
  return performance
    .getEntriesByType("resource")
    .filter((e) => pola.test(e.name))
    .map((e) => {
      const r = e as PerformanceResourceTiming;
      return { berkas: r.name.split("/").slice(-2).join("/"), terkirim: r.encodedBodySize, asli: r.decodedBodySize, ms: Math.round(r.duration) };
    });
}

export default function PocHalaman() {
  const [soal, setSoal] = useState<Soal>(SOAL[0]);
  const [query, setQuery] = useState(SOAL[0].contoh);
  const [hasil, setHasil] = useState<HasilQuery | null>(null);
  const [info, setInfo] = useState("");
  const [cek, setCek] = useState<string>("");
  const [sibuk, setSibuk] = useState(false);
  const [log, setLog] = useState<LaporanMuat[]>([]);
  const [ukur, setUkur] = useState<Record<string, unknown> | null>(null);
  const siap = useRef(new Set<string>());

  useEffect(() => dengarMuat((l) => setLog((x) => [...x, l])) as unknown as () => void, []);

  const pilih = (s: Soal) => {
    setSoal(s);
    setQuery(s.contoh);
    setHasil(null);
    setCek("");
    setInfo("");
  };

  async function pastikanSiap(s: Soal) {
    if (siap.current.has(s.mesin)) return;
    setInfo(s.mesin === "pglite" ? "Memuat mesin PostgreSQL (sekali saja)..." : "Memuat mesin...");
    const t = performance.now();
    const b = await siapkan(s.mesin, SEEDS[s.seed]);
    if (!b.ok) throw new Error(b.galat);
    siap.current.add(s.mesin);
    setInfo(`Mesin dimuat dalam ${ms(performance.now() - t)}.`);
  }

  async function klikJalankan(q = query) {
    setSibuk(true);
    setCek("");
    try {
      await pastikanSiap(soal);
      const b = await jalankan(soal.mesin, SEEDS[soal.seed], q);
      if (!b.ok) {
        siap.current.delete(soal.mesin); // worker dimatikan
        setHasil({ kolom: [], baris: [], galat: b.galat, terpotong: false });
      } else setHasil(b.hasil!);
      setInfo((x) => `${x} Jalankan: ${ms(b.ms)}.`.trim());
    } catch (e) {
      setInfo(String(e));
    } finally {
      setSibuk(false);
    }
  }

  async function klikCek() {
    setSibuk(true);
    try {
      const { data, msJaringan } = await cekServer(soal.id, query);
      setCek(`${data.putusan.benar ? "✔" : "✘"} ${data.putusan.pesan}  (server ${ms(data.ukur.msMesin)}, total ${ms(msJaringan)}${data.ukur.mulaiDingin ? ", mulai dingin" : ""})`);
    } finally {
      setSibuk(false);
    }
  }

  /** Semua ukuran di tabel brief, berurutan. Hasil juga di window.__pocUkur untuk diambil skrip. */
  async function ukurSemua() {
    setSibuk(true);
    setUkur(null);
    matikanWorker();
    siap.current.clear();
    const u: Record<string, unknown> = { perangkat: navigator.userAgent, koneksi: (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number } }).connection ?? null };
    const sql = SOAL.find((s) => s.id === "sql-top3")!;
    const pg = SOAL.find((s) => s.id === "pg-top3")!;
    const pgTx = SOAL.find((s) => s.id === "pg-bekukan")!;
    const muat: LaporanMuat[] = [];
    const lepas = dengarMuat((l) => muat.push(l));
    try {
      let t = performance.now();
      await siapkan("sqljs", SEEDS.sqlite);
      u.sqljs_muat_ms = Math.round(performance.now() - t);

      const xs: number[] = [];
      for (let i = 0; i < 20; i++) xs.push((await jalankan("sqljs", SEEDS.sqlite, sql.contoh)).ms);
      u.sqljs_jalankan_kasus01 = { p50: +persen(xs, 50).toFixed(1), p95: +persen(xs, 95).toFixed(1), maks: +Math.max(...xs).toFixed(1) };

      t = performance.now();
      await siapkan("pglite", SEEDS.postgres);
      u.pglite_muat_pertama_ms = Math.round(performance.now() - t);
      u.rincian_muat = muat.map((m) => ({ tahap: m.mesin, ms: Math.round(m.ms), unduh_mb: m.byte ? +(m.byte / 1048576).toFixed(2) : undefined }));

      const ys: number[] = [];
      for (let i = 0; i < 20; i++) ys.push((await jalankan("pglite", SEEDS.postgres, pg.contoh)).ms);
      u.pglite_jalankan_kasus01 = { p50: +persen(ys, 50).toFixed(1), p95: +persen(ys, 95).toFixed(1), maks: +Math.max(...ys).toFixed(1) };

      const tx = await jalankan("pglite", SEEDS.postgres, `${pgTx.contoh}\nSELECT id, rekening, keterangan FROM transaksi WHERE rekening = 'BEKU-01' ORDER BY id;`);
      const setelah = await jalankan("pglite", SEEDS.postgres, "SELECT count(*) AS beku FROM transaksi WHERE rekening = 'BEKU-01'");
      u.pglite_begin_commit = {
        jalan: tx.ok && !tx.hasil?.galat && tx.hasil?.baris.length === 3,
        baris_setelah_commit: tx.ok ? tx.hasil?.baris.length : tx.galat,
        data_kembali_utuh_di_jalankan_berikutnya: setelah.ok ? setelah.hasil?.baris[0]?.[0] === 0 : setelah.galat,
      };

      t = performance.now();
      const henti = await jalankan("sqljs", SEEDS.sqlite, QUERY_TAK_BERUJUNG.sqljs!);
      u.tak_berujung_sqljs_dihentikan_ms = Math.round(performance.now() - t);
      u.tak_berujung_pesan = henti.ok ? "TIDAK dihentikan" : henti.galat;

      // Batas yang sama untuk PGlite: worker baru harus memuat PGlite lagi (dari cache HTTP), jadi siapkan dulu.
      await siapkan("pglite", SEEDS.postgres);
      t = performance.now();
      const henti2 = await jalankan("pglite", SEEDS.postgres, QUERY_TAK_BERUJUNG.pglite!);
      u.tak_berujung_pglite_dihentikan_ms = Math.round(performance.now() - t);
      u.tak_berujung_pglite_ok = !henti2.ok;

      const galat = [
        await jalankan("sqljs", SEEDS.sqlite, "SELECT umur FROM transaksi"),
        await (async () => (await siapkan("pglite", SEEDS.postgres), jalankan("pglite", SEEDS.postgres, "SELECT umur FROM transaksi")))(),
      ];
      u.contoh_galat_diterjemahkan = galat.map((g) => (g.ok ? g.hasil?.galat : g.galat));

      const zs: number[] = [];
      const zm: number[] = [];
      for (let i = 0; i < 20; i++) {
        const { data, msJaringan } = await cekServer("sql-top3", sql.contoh);
        zs.push(msJaringan);
        zm.push(data.ukur.msMesin);
      }
      u.cek_server_dari_browser = { p50: Math.round(persen(zs, 50)), p95: Math.round(persen(zs, 95)), mesin_p95: +persen(zm, 95).toFixed(1) };

      // Berkas JS di halaman (worker.js dan chunk PGlite diunduh worker, jadi tidak tercatat di sini).
      u.unduhan_halaman = ukuranUnduhan(/\/(poc-worker)\//);
    } catch (e) {
      u.galat = String(e);
    } finally {
      lepas();
      siap.current.clear();
      setSibuk(false);
    }
    (window as unknown as { __pocUkur: unknown }).__pocUkur = u;
    setUkur(u);
  }

  const takBerujung = QUERY_TAK_BERUJUNG[soal.mesin];

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: 16, background: "var(--paper)", minHeight: "100dvh" }}>
      <h1 style={{ font: "800 22px var(--f-display)", margin: "4px 0 2px" }}>POC mesin query</h1>
      <p style={{ margin: "0 0 12px", color: "var(--ink-2)", fontSize: 14 }}>Kasus 01, tabel transaksi. Jalankan di browser (Web Worker), Cek di server.</p>

      <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {SOAL.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === soal.id}
            onClick={() => pilih(s)}
            style={{ padding: "8px 10px", borderRadius: 10, border: "2px solid var(--line)", background: s.id === soal.id ? "var(--indigo)" : "#fff", color: s.id === soal.id ? "#fff" : "var(--ink)", font: "700 13px var(--f-body)", minHeight: 44 }}
          >
            {s.kursus} · {s.id}
          </button>
        ))}
      </div>

      <p style={{ font: "600 15px/1.45 var(--f-body)", margin: "0 0 8px" }}>{soal.pertanyaan}</p>
      <label htmlFor="q" style={{ font: "700 12px var(--f-body)", color: "var(--ink-2)" }}>
        Query ({soal.mesin})
      </label>
      <textarea
        id="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        spellCheck={false}
        rows={5}
        style={{ width: "100%", font: "500 14px/1.5 var(--f-mono)", background: "var(--code-bg)", color: "var(--code-fg)", borderRadius: 12, padding: 12, border: 0, marginTop: 4 }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "10px 0" }}>
        <button className="btn indigo" disabled={sibuk} onClick={() => klikJalankan()}>Jalankan</button>
        <button className="btn teal" disabled={sibuk} onClick={klikCek}>Cek jawaban</button>
      </div>
      {takBerujung && (
        <button className="btn soft" disabled={sibuk} onClick={() => klikJalankan(takBerujung)} style={{ marginBottom: 10 }}>
          Uji query tak berujung
        </button>
      )}
      {info && <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "4px 0" }} aria-live="polite">{info}</p>}
      {cek && <p style={{ font: "700 14px/1.4 var(--f-body)", margin: "6px 0" }} aria-live="polite">{cek}</p>}

      {hasil && (
        <div style={{ overflowX: "auto", background: "#fff", border: "2px solid var(--line)", borderRadius: 12, marginTop: 8 }}>
          {hasil.galat ? (
            <p style={{ color: "var(--coral-d)", padding: 12, margin: 0, fontWeight: 600 }}>{hasil.galat}</p>
          ) : (
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
              <thead>
                <tr>{hasil.kolom.map((k) => <th key={k} style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid var(--line)" }}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {hasil.baris.map((r, i) => (
                  <tr key={i}>{r.map((v, j) => <td key={j} style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)", fontFamily: "var(--f-mono)", whiteSpace: "nowrap" }}>{v === null ? "NULL" : String(v)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
          {hasil.terpotong && <p style={{ fontSize: 12, padding: "6px 8px", margin: 0 }}>Hasil dipotong di 200 baris.</p>}
        </div>
      )}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ font: "800 17px var(--f-display)", margin: "0 0 6px" }}>Ukur</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 8px" }}>
          Buka halaman ini di HP dengan cache kosong, lalu tekan tombol di bawah. Hasilnya bisa disalin ke brief.
        </p>
        <button className="btn" disabled={sibuk} onClick={ukurSemua} id="ukur-semua">Jalankan semua ukuran</button>
        {ukur && (
          <>
            <pre id="hasil-ukur" style={{ fontSize: 11, whiteSpace: "pre-wrap", background: "#fff", border: "2px solid var(--line)", borderRadius: 12, padding: 10, marginTop: 10 }}>
              {JSON.stringify(ukur, null, 2)}
            </pre>
            <button className="btn soft" onClick={() => navigator.clipboard?.writeText(JSON.stringify(ukur, null, 2))}>Salin hasil</button>
          </>
        )}
        {log.length > 0 && (
          <p style={{ fontSize: 12, color: "var(--ink-2)" }}>
            Pemuatan: {log.map((l) => `${l.mesin} ${ms(l.ms)}${l.byte ? ` (${mb(l.byte)} diunduh)` : ""}`).join(" · ")}
          </p>
        )}
      </section>
    </main>
  );
}
