/* Mesin SQL di browser (sql.js, SQLite WASM) dan penilai query. */
import { SEED_SQL, TABLES, VARIANT_SQL, type Mission } from "./content";

/* Tipe minimal dari sql.js yang kita pakai. */
export type SqlValue = number | string | Uint8Array | null;
export type ExecResult = { columns: string[]; values: SqlValue[][] };
export interface SqlDb {
  exec(sql: string): ExecResult[];
  run(sql: string): unknown;
}
export interface SqlJsStatic {
  Database: new () => SqlDb;
}
type InitSqlJs = (cfg?: { locateFile?: (f: string) => string }) => Promise<SqlJsStatic>;

export type QueryOk = { ok: true; columns: string[]; rows: SqlValue[][]; truncated: boolean };
export type QueryErr = { ok: false; error: string };
export type QueryResult = QueryOk | QueryErr;

const MAX_ROWS = 500;

declare global {
  interface Window {
    initSqlJs?: InitSqlJs;
    __CASEBASE_SQLJS_URL__?: string;
  }
}

let sqlPromise: Promise<SqlJsStatic> | null = null;

/** Muat sql.js sekali. Di Next.js file-nya dari /sqljs, di versi satu halaman skripnya sudah tertanam. */
export function loadSqlJs(): Promise<SqlJsStatic> {
  if (sqlPromise) return sqlPromise;
  sqlPromise = (async () => {
    if (!window.initSqlJs) {
      const base = window.__CASEBASE_SQLJS_URL__ ?? "/sqljs/";
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = base + "sql-wasm.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Gagal memuat mesin SQL."));
        document.head.appendChild(s);
      });
    }
    const base = window.__CASEBASE_SQLJS_URL__ ?? "/sqljs/";
    return window.initSqlJs!({ locateFile: (f) => base + f });
  })();
  sqlPromise.catch(() => (sqlPromise = null));
  return sqlPromise;
}

export type CaseDbs = { main: SqlDb; variant: SqlDb };

export function createCaseDbs(SQL: SqlJsStatic): CaseDbs {
  const main = new SQL.Database();
  main.exec(SEED_SQL);
  const variant = new SQL.Database();
  variant.exec(VARIANT_SQL);
  return { main, variant };
}

/* ---------- pemeriksaan sebelum query dijalankan ---------- */

/** Buang komentar dan titik koma penutup, tapi jangan sentuh isi string. */
export function cleanQuery(src: string): { sql: string } | { error: string } {
  let out = "";
  let i = 0;
  let inStr: string | null = null;
  while (i < src.length) {
    const ch = src[i];
    if (inStr) {
      out += ch;
      if (ch === inStr) {
        if (src[i + 1] === inStr) {
          out += src[i + 1];
          i += 2;
          continue;
        }
        inStr = null;
      }
      i++;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = ch;
      out += ch;
      i++;
      continue;
    }
    if ((ch === "-" && src[i + 1] === "-") || ch === "#") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 2;
      out += " ";
      continue;
    }
    out += ch;
    i++;
  }
  if (inStr) return { error: "Ada tanda kutip yang belum ditutup. Teks seperti 'Malam' butuh kutip pembuka dan penutup." };
  let sql = out.trim();
  while (sql.endsWith(";")) sql = sql.slice(0, -1).trim();
  if (!sql) return { error: "Editornya masih kosong. Tulis query dulu, misalnya SELECT * FROM karyawan." };
  if (hasSemicolonOutsideStrings(sql)) return { error: "Tulis satu query saja untuk tiap misi." };
  if (/^(insert|update|delete|replace|drop|create|alter|attach|detach|pragma|vacuum|reindex|analyze|begin|commit|rollback|savepoint|release|explain)\b/i.test(sql))
    return { error: "Di misi ini kamu hanya membaca bukti, jadi query harus diawali SELECT. Perintah yang mengubah data tidak dipakai di sini." };
  return { sql };
}

function hasSemicolonOutsideStrings(sql: string): boolean {
  let inStr: string | null = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (inStr) {
      if (ch === inStr) inStr = null;
    } else if (ch === "'" || ch === '"' || ch === "`") inStr = ch;
    else if (ch === ";") return true;
  }
  return false;
}

/* ---------- pesan error ramah ---------- */

const TABLE_NAMES = TABLES.map((t) => t.name);

export function friendlyError(raw: string): string {
  const msg = raw.replace(/^Error:\s*/, "");
  let m: RegExpMatchArray | null;
  if ((m = msg.match(/no such table: (\S+)/i)))
    return `Tabel "${m[1]}" tidak ada di berkas kasus ini. Tabel yang ada: ${TABLE_NAMES.join(", ")}.`;
  if ((m = msg.match(/no such column: (\S+)/i)))
    return `Kolom "${m[1]}" tidak dikenal. Cek ejaannya di panel skema. Kalau maksudnya teks, apit dengan tanda kutip tunggal, misalnya '${m[1]}'.`;
  if ((m = msg.match(/near "([^"]*)": syntax error/i)))
    return `Ada yang belum pas di dekat "${m[1]}". Cek urutan klausa: SELECT, FROM, WHERE, ORDER BY, lalu LIMIT.`;
  if (/incomplete input/i.test(msg)) return "Query-nya belum selesai. Mungkin ada kata atau tanda kutip yang belum lengkap.";
  if ((m = msg.match(/no such function: (\S+)/i)))
    return `Fungsi ${m[1]} belum didukung di mesin latihan ini. Coba cara lain yang lebih umum.`;
  if (/ambiguous column name: (\S+)/i.test(msg)) return "Nama kolomnya ada di lebih dari satu tabel. Tulis lengkap dengan nama tabelnya, misalnya karyawan.nama.";
  return `Mesin SQL bilang: ${msg}`;
}

/* ---------- menjalankan query ---------- */

export function runQuery(db: SqlDb, src: string): QueryResult {
  const c = cleanQuery(src);
  if ("error" in c) return { ok: false, error: c.error };
  try {
    const res = db.exec(c.sql);
    if (!res.length) return { ok: true, columns: [], rows: [], truncated: false };
    const { columns, values } = res[res.length - 1];
    return { ok: true, columns, rows: values.slice(0, MAX_ROWS), truncated: values.length > MAX_ROWS };
  } catch (e) {
    return { ok: false, error: friendlyError(String((e as Error)?.message ?? e)) };
  }
}

/* ---------- penilaian ---------- */

function norm(v: SqlValue): string {
  if (v === null) return "∅";
  if (typeof v === "number") return "n:" + (Number.isInteger(v) ? String(v) : v.toFixed(4));
  if (v instanceof Uint8Array) return "b:" + Array.from(v).join(",");
  const t = v.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) {
    const n = Number(t);
    return "n:" + (Number.isInteger(n) ? String(n) : n.toFixed(4));
  }
  return "s:" + t.toLowerCase();
}
const rowKey = (r: SqlValue[]) => r.map(norm).join("␟");

export type Verdict =
  | { ok: true; result: QueryOk }
  | { ok: false; kind: "error"; message: string }
  | { ok: false; kind: "mismatch"; message: string; result: QueryOk };

function compare(player: QueryOk, key: QueryOk, ordered: boolean): string | null {
  const pc = player.columns.length;
  const kc = key.columns.length;
  if (pc !== kc)
    return pc > kc
      ? `Hasilmu punya ${pc} kolom, padahal yang dicari cuma ${kc}. Cek lagi kolom setelah SELECT.`
      : `Hasilmu baru ${pc} kolom, yang dicari ${kc} kolom. Ada kolom yang belum kamu pilih.`;
  const pr = player.rows.map(rowKey);
  const kr = key.rows.map(rowKey);
  if (pr.length !== kr.length)
    return pr.length > kr.length
      ? `Hasilmu ${pr.length} baris, bukti yang dicari ${kr.length} baris. Saringanmu masih terlalu longgar.`
      : `Hasilmu ${pr.length} baris, bukti yang dicari ${kr.length} baris. Saringanmu terlalu ketat atau ada syarat yang salah.`;
  const ps = [...pr].sort();
  const ks = [...kr].sort();
  const sameSet = ps.every((v, i) => v === ks[i]);
  if (!sameSet) return "Jumlah baris dan kolomnya sudah pas, tapi isinya belum cocok. Cek urutan kolom dan nilai di syaratmu.";
  if (ordered && !pr.every((v, i) => v === kr[i])) return "Isinya sudah benar, tinggal urutannya. Misi ini meminta urutan tertentu.";
  return null;
}

/** Nilai hasil query pemain dengan membandingkannya ke hasil kunci, di dataset utama lalu dataset varian. */
export function grade(dbs: CaseDbs, mission: Mission, src: string): Verdict {
  const player = runQuery(dbs.main, src);
  if (!player.ok) return { ok: false, kind: "error", message: player.error };
  const key = runQuery(dbs.main, mission.answer);
  if (!key.ok) return { ok: false, kind: "error", message: "Kunci jawaban misi ini rusak. Ini salah kami, bukan kamu." };
  const diff = compare(player, key, mission.ordered);
  if (diff) return { ok: false, kind: "mismatch", message: diff, result: player };

  const pv = runQuery(dbs.variant, src);
  const kv = runQuery(dbs.variant, mission.answer);
  if (pv.ok && kv.ok && compare(pv, kv, mission.ordered))
    return {
      ok: false,
      kind: "mismatch",
      message:
        "Hasilnya cocok untuk data ini, tapi query-mu menghafal jawabannya (misalnya memakai id atau nama tertentu). Pakai syarat yang umum supaya tetap benar kalau datanya berubah.",
      result: player,
    };
  return { ok: true, result: player };
}
