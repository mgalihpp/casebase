/* Mesin MongoDB: mingo di atas data JSON. Query ditulis gaya mongosh, diurai tanpa eval. */
import { aggregate, find } from "mingo";
import { galat, potong, type HasilQuery, type Nilai, type QueryEngine, type Seed } from "../types";

type Doc = Record<string, unknown>;
type Panggilan = { metode: string; arg: unknown[] };

/* ---------- pengurai nilai gaya JavaScript yang longgar (kunci tanpa kutip, kutip tunggal) ---------- */

class Pengurai {
  i = 0;
  constructor(readonly s: string) {}
  gagal(pesan: string): never {
    throw new SyntaxError(`${pesan} (posisi ${this.i + 1})`);
  }
  spasi() {
    while (this.i < this.s.length && /\s/.test(this.s[this.i])) this.i++;
  }
  lihat() {
    this.spasi();
    return this.s[this.i];
  }
  harus(ch: string) {
    if (this.lihat() !== ch) this.gagal(`Kurang tanda "${ch}"`);
    this.i++;
  }
  nama(): string {
    this.spasi();
    const m = /^[A-Za-z_$][\w$]*/.exec(this.s.slice(this.i));
    if (!m) this.gagal("Nama tidak terbaca");
    this.i += m[0].length;
    return m[0];
  }
  teks(): string {
    const q = this.s[this.i++];
    let out = "";
    while (this.i < this.s.length && this.s[this.i] !== q) {
      if (this.s[this.i] === "\\") this.i++;
      out += this.s[this.i++];
    }
    if (this.i >= this.s.length) this.gagal("Ada tanda kutip yang belum ditutup");
    this.i++;
    return out;
  }
  nilai(): unknown {
    const ch = this.lihat();
    if (ch === "{") {
      this.i++;
      const o: Doc = {};
      while (this.lihat() !== "}") {
        const c = this.lihat();
        const k = c === '"' || c === "'" ? this.teks() : this.nama();
        this.harus(":");
        o[k] = this.nilai();
        if (this.lihat() === ",") this.i++;
        else break;
      }
      this.harus("}");
      return o;
    }
    if (ch === "[") {
      this.i++;
      const a: unknown[] = [];
      while (this.lihat() !== "]") {
        a.push(this.nilai());
        if (this.lihat() === ",") this.i++;
        else break;
      }
      this.harus("]");
      return a;
    }
    if (ch === '"' || ch === "'") return this.teks();
    const m = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(this.s.slice(this.i));
    if (m) {
      this.i += m[0].length;
      return Number(m[0]);
    }
    const w = this.nama();
    if (w === "true") return true;
    if (w === "false") return false;
    if (w === "null") return null;
    this.gagal(`Nilai "${w}" tidak dikenal`);
  }
}

/** db.<koleksi>.<metode>(arg).<metode>(arg)... */
export function uraiMongo(src: string): { koleksi: string; rantai: Panggilan[] } {
  const p = new Pengurai(src.trim().replace(/;\s*$/, ""));
  if (p.nama() !== "db") p.gagal('Query MongoDB diawali "db.", misalnya db.transaksi.find()');
  p.harus(".");
  const koleksi = p.nama();
  const rantai: Panggilan[] = [];
  while (p.lihat() === ".") {
    p.i++;
    const metode = p.nama();
    p.harus("(");
    const arg: unknown[] = [];
    while (p.lihat() !== ")") {
      arg.push(p.nilai());
      if (p.lihat() === ",") p.i++;
      else break;
    }
    p.harus(")");
    rantai.push({ metode, arg });
  }
  if (p.lihat() !== undefined) p.gagal("Ada teks lebih setelah query");
  if (!rantai.length) p.gagal("Tambahkan metode, misalnya .find()");
  return { koleksi, rantai };
}

const DILARANG = ["$where", "$function", "$accumulator"];
function cekOperator(v: unknown) {
  const s = JSON.stringify(v);
  for (const d of DILARANG) if (s.includes(`"${d}"`)) throw new SyntaxError(`Operator ${d} tidak dipakai di latihan ini.`);
}

/** Ubah dokumen jadi tabel: kolom = gabungan field sesuai urutan kemunculan. */
function keTabel(docs: Doc[]): HasilQuery {
  const kolom: string[] = [];
  for (const d of docs) for (const k of Object.keys(d)) if (!kolom.includes(k)) kolom.push(k);
  const sel = (v: unknown): Nilai =>
    v === undefined ? null : v === null || ["string", "number", "boolean"].includes(typeof v) ? (v as Nilai) : JSON.stringify(v);
  const r = potong(kolom, docs.map((d) => kolom.map((k) => sel(d[k]))));
  r.dokumen = docs.slice(0, r.baris.length);
  return r;
}

const salin = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function jalankan(data: Record<string, Doc[]>, src: string): HasilQuery {
  try {
    const { koleksi, rantai } = uraiMongo(src);
    cekOperator(rantai);
    const docs = data[koleksi];
    if (!docs) return galat(`Koleksi "${koleksi}" tidak ada. Yang ada: ${Object.keys(data).join(", ")}.`);
    const [awal, ...sisa] = rantai;
    switch (awal.metode) {
      case "aggregate": {
        if (sisa.length) throw new SyntaxError("aggregate() tidak bisa disambung metode lain.");
        if (!Array.isArray(awal.arg[0])) throw new SyntaxError("aggregate() butuh daftar tahap, misalnya aggregate([{ $match: {...} }])");
        return keTabel(aggregate(docs, awal.arg[0] as Doc[]) as Doc[]);
      }
      case "countDocuments": {
        const n = find(docs, (awal.arg[0] ?? {}) as Doc).all().length;
        return { kolom: ["jumlah"], baris: [[n]], galat: null, terpotong: false };
      }
      case "find":
      case "findOne": {
        let c = find(docs, (awal.arg[0] ?? {}) as Doc, awal.arg[1] as Doc | undefined);
        if (awal.metode === "findOne") c = c.limit(1);
        let hitung = false;
        for (const s of sisa) {
          if (s.metode === "sort") c = c.sort(s.arg[0] as Record<string, 1 | -1>);
          else if (s.metode === "limit") c = c.limit(Number(s.arg[0]));
          else if (s.metode === "skip") c = c.skip(Number(s.arg[0]));
          else if (s.metode === "count") hitung = true;
          else throw new SyntaxError(`Metode .${s.metode}() belum didukung setelah find().`);
        }
        const hasil = c.all() as Doc[];
        if (hitung) return { kolom: ["jumlah"], baris: [[hasil.length]], galat: null, terpotong: false };
        return keTabel(hasil);
      }
      default:
        throw new SyntaxError(`Metode .${awal.metode}() belum didukung. Coba find, aggregate, atau countDocuments.`);
    }
  } catch (e) {
    return galat(`Query MongoDB belum pas: ${(e as Error).message}`);
  }
}

export function buatMingoEngine(): QueryEngine {
  const data = (seed: Seed) => {
    if (seed.jenis !== "mongo") throw new Error("Seed mingo harus berjenis mongo");
    return salin(seed.koleksi) as Record<string, Doc[]>;
  };
  return {
    jenis: "mingo",
    async run(seed, query) {
      return jalankan(data(seed), query);
    },
    async runThenCheck(seed, query, pemeriksa) {
      const d = data(seed);
      const r = jalankan(d, query);
      return r.galat ? r : jalankan(d, pemeriksa);
    },
  };
}
