/* Alat bantu teks SQL: buang komentar dan pecah per perintah tanpa menyentuh isi string. */

/** Pecah skrip menjadi perintah. Komentar dibuang, titik koma di dalam string diabaikan. */
export function pecahPerintah(src: string): { perintah: string[] } | { galat: string } {
  const hasil: string[] = [];
  let cur = "";
  let inStr: string | null = null;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      cur += ch;
      if (ch === inStr) {
        if (src[i + 1] === inStr) {
          cur += src[++i];
          continue;
        }
        inStr = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = ch;
      cur += ch;
    } else if (ch === "-" && src[i + 1] === "-") {
      while (i < src.length && src[i] !== "\n") i++;
      cur += " ";
    } else if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 1;
      cur += " ";
    } else if (ch === ";") {
      if (cur.trim()) hasil.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (inStr) return { galat: "Ada tanda kutip yang belum ditutup." };
  if (cur.trim()) hasil.push(cur.trim());
  if (!hasil.length) return { galat: "Editornya masih kosong. Tulis query dulu." };
  return { perintah: hasil };
}

/** Kata pertama tiap perintah, huruf besar. "START TRANSACTION" dihitung BEGIN.
    WITH ... dihitung menurut perintah utamanya (SELECT, UPDATE, dan seterusnya) di luar tanda kurung. */
export function kataPerintah(perintah: string): string {
  const w = perintah.trim().split(/[\s(]+/)[0]?.toUpperCase() ?? "";
  if (w === "WITH") return perintahUtamaWith(perintah);
  return w === "START" ? "BEGIN" : w === "END" ? "COMMIT" : w === "ABORT" ? "ROLLBACK" : w;
}

function perintahUtamaWith(s: string): string {
  let kedalaman = 0;
  let inStr: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"') inStr = ch;
    else if (ch === "(") kedalaman++;
    else if (ch === ")") kedalaman--;
    else if (kedalaman === 0 && /[A-Za-z]/.test(ch) && !/\w/.test(s[i - 1] ?? "")) {
      const m = /^(select|insert|update|delete|merge)\b/i.exec(s.slice(i));
      if (m) return m[1].toUpperCase();
    }
  }
  return "WITH";
}

/** FR-EDT-04: tolak perintah di luar daftar boleh milik soal. */
export function cekPerintahBoleh(src: string, boleh: string[]): string | null {
  const p = pecahPerintah(src);
  if ("galat" in p) return p.galat;
  const set = new Set(boleh.map((b) => b.toUpperCase()));
  for (const s of p.perintah) {
    const k = kataPerintah(s);
    if (!set.has(k)) return `Perintah ${k} tidak dipakai di soal ini. Yang boleh: ${boleh.join(", ")}.`;
  }
  return null;
}

const KONTROL_TRANSAKSI = new Set(["BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT", "RELEASE", "PREPARE", "ABORT"]);

/** true jika skrip berisi BEGIN/COMMIT dan sejenisnya (butuh database salinan, bukan transaksi bungkus). */
export function adaKontrolTransaksi(src: string): boolean {
  const p = pecahPerintah(src);
  if ("galat" in p) return false;
  return p.perintah.some((s) => KONTROL_TRANSAKSI.has(kataPerintah(s)));
}

export const pakaiOrderBy = (sql: string) => /\border\s+by\b/i.test(sql);
