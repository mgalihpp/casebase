/* Mesin Redis: peniru kecil untuk SET, GET, DEL, EXISTS, EXPIRE, TTL, INCR, INCRBY, DECR. */
import { galat, potong, type HasilQuery, type Nilai, type QueryEngine, type Seed } from "../types";

type Isi = { v: string; habis?: number };

/** Jam dibekukan selama satu kali jalan, supaya TTL di hasil query pengguna dan kunci selalu sama. */
class Toko {
  peta = new Map<string, Isi>();
  constructor(readonly sekarang: number) {}
  ambil(k: string): Isi | undefined {
    const x = this.peta.get(k);
    if (x?.habis !== undefined && x.habis <= this.sekarang) {
      this.peta.delete(k);
      return undefined;
    }
    return x;
  }
}

export function pecahToken(baris: string): string[] {
  const out: string[] = [];
  const re = /"((?:\\.|[^"\\])*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(baris))) out.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, "$1") : (m[2] ?? m[3]));
  return out;
}

class GalatRedis extends Error {}
const bulat = (s: string) => {
  if (!/^-?\d+$/.test(s)) throw new GalatRedis("nilainya bukan bilangan bulat");
  return Number(s);
};
const jumlahArg = (a: string[], n: number, contoh: string) => {
  if (a.length !== n) throw new GalatRedis(`jumlah argumen salah. Contoh: ${contoh}`);
};

function perintah(t: Toko, [cmd, ...a]: string[]): Nilai {
  switch (cmd.toUpperCase()) {
    case "SET": {
      if (a.length < 2) throw new GalatRedis("jumlah argumen salah. Contoh: SET kunci nilai EX 60");
      const [k, v, ...opsi] = a;
      let habis: number | undefined;
      let nx = false;
      let xx = false;
      for (let i = 0; i < opsi.length; i++) {
        const o = opsi[i].toUpperCase();
        if (o === "EX" || o === "PX") {
          const n = bulat(opsi[++i] ?? "");
          if (n <= 0) throw new GalatRedis("waktu kedaluwarsa harus lebih dari 0");
          habis = t.sekarang + (o === "EX" ? n * 1000 : n);
        } else if (o === "NX") nx = true;
        else if (o === "XX") xx = true;
        else throw new GalatRedis(`opsi ${opsi[i]} tidak dikenal`);
      }
      const ada = t.ambil(k) !== undefined;
      if ((nx && ada) || (xx && !ada)) return null;
      t.peta.set(k, { v, habis });
      return "OK";
    }
    case "GET":
      jumlahArg(a, 1, "GET kunci");
      return t.ambil(a[0])?.v ?? null;
    case "DEL":
      if (!a.length) throw new GalatRedis("jumlah argumen salah. Contoh: DEL kunci");
      return a.filter((k) => t.ambil(k) && t.peta.delete(k)).length;
    case "EXISTS":
      if (!a.length) throw new GalatRedis("jumlah argumen salah. Contoh: EXISTS kunci");
      return a.filter((k) => t.ambil(k)).length;
    case "EXPIRE": {
      jumlahArg(a, 2, "EXPIRE kunci 60");
      const x = t.ambil(a[0]);
      if (!x) return 0;
      x.habis = t.sekarang + bulat(a[1]) * 1000;
      return 1;
    }
    case "TTL": {
      jumlahArg(a, 1, "TTL kunci");
      const x = t.ambil(a[0]);
      if (!x) return -2;
      return x.habis === undefined ? -1 : Math.ceil((x.habis - t.sekarang) / 1000);
    }
    case "INCR":
    case "DECR":
    case "INCRBY": {
      const up = cmd.toUpperCase();
      jumlahArg(a, up === "INCRBY" ? 2 : 1, up === "INCRBY" ? "INCRBY kunci 5" : `${up} kunci`);
      const x = t.ambil(a[0]);
      const n = bulat(x?.v ?? "0") + (up === "INCRBY" ? bulat(a[1]) : up === "DECR" ? -1 : 1);
      t.peta.set(a[0], { v: String(n), habis: x?.habis });
      return n;
    }
    default:
      throw new GalatRedis(`perintah ${cmd} belum didukung. Yang ada: SET, GET, DEL, EXISTS, EXPIRE, TTL, INCR, INCRBY, DECR`);
  }
}

function jalankan(t: Toko, src: string): HasilQuery {
  const baris: Nilai[][] = [];
  const daftar = src.split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
  if (!daftar.length) return galat("Editornya masih kosong. Tulis perintah dulu, misalnya GET kunci.");
  for (const [i, s] of daftar.entries()) {
    try {
      baris.push([s, perintah(t, pecahToken(s))]);
    } catch (e) {
      if (e instanceof GalatRedis) return galat(`Baris ${i + 1} (${s}): ${e.message}.`);
      throw e;
    }
  }
  return potong(["perintah", "balasan"], baris);
}

export function buatRedisEngine(jam: () => number = Date.now): QueryEngine {
  const baru = (seed: Seed) => {
    if (seed.jenis !== "redis") throw new Error("Seed Redis harus berjenis redis");
    const t = new Toko(jam());
    const r = jalankan(t, seed.perintah);
    if (r.galat) throw new Error("Seed Redis rusak: " + r.galat);
    return t;
  };
  return {
    jenis: "redis",
    async run(seed, query) {
      return jalankan(baru(seed), query);
    },
    async runThenCheck(seed, query, pemeriksa) {
      const t = baru(seed);
      const r = jalankan(t, query);
      return r.galat ? r : jalankan(t, pemeriksa);
    },
  };
}
