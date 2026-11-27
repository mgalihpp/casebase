/* Menerjemahkan pesan galat mesin ke bahasa Indonesia yang ramah (FR-EDT-03). */

const URUTAN = "Cek urutan klausa: SELECT, FROM, WHERE, GROUP BY, ORDER BY, lalu LIMIT.";

/** Pesan galat sql.js (SQLite). */
export function terjemahSqlite(raw: string): string {
  const msg = raw.replace(/^Error:\s*/, "");
  let m: RegExpMatchArray | null;
  if ((m = msg.match(/no such table: (\S+)/i))) return `Tabel "${m[1]}" tidak ada di berkas kasus ini.`;
  if ((m = msg.match(/no such column: (\S+)/i)))
    return `Kolom "${m[1]}" tidak dikenal. Cek ejaannya di panel skema. Kalau maksudnya teks, apit dengan tanda kutip tunggal.`;
  if ((m = msg.match(/near "([^"]*)": syntax error/i))) return `Ada yang belum pas di dekat "${m[1]}". ${URUTAN}`;
  if (/incomplete input/i.test(msg)) return "Query-nya belum selesai. Mungkin ada kata atau tanda kutip yang belum lengkap.";
  if (/unrecognized token: "'/i.test(msg)) return "Ada tanda kutip yang belum ditutup.";
  if ((m = msg.match(/no such function: (\S+)/i))) return `Fungsi ${m[1]} belum didukung di mesin latihan ini.`;
  if ((m = msg.match(/ambiguous column name: (\S+)/i)))
    return `Kolom "${m[1]}" ada di lebih dari satu tabel. Tulis lengkap dengan nama tabelnya.`;
  if (/UNIQUE constraint failed/i.test(msg)) return "Data dengan kunci yang sama sudah ada.";
  if (/cannot start a transaction within a transaction/i.test(msg)) return "Transaksi sudah dimulai. BEGIN cukup ditulis sekali.";
  if (/cannot commit - no transaction is active/i.test(msg)) return "COMMIT ditulis tanpa BEGIN sebelumnya.";
  return `Mesin SQL bilang: ${msg}`;
}

/** Galat PGlite membawa kode SQLSTATE; kode lebih stabil daripada teks pesan. */
export function terjemahPostgres(e: { message?: string; code?: string }): string {
  const msg = e.message ?? String(e);
  let m: RegExpMatchArray | null;
  switch (e.code) {
    case "42P01":
      if ((m = msg.match(/relation "([^"]+)"/))) return `Tabel "${m[1]}" tidak ada di berkas kasus ini.`;
      break;
    case "42703":
      if ((m = msg.match(/column "([^"]+)"/)))
        return `Kolom "${m[1]}" tidak dikenal. Cek ejaannya. Di PostgreSQL, teks diapit kutip tunggal, bukan kutip ganda.`;
      break;
    case "42601":
      if (/unterminated quoted string/.test(msg)) return "Ada tanda kutip yang belum ditutup.";
      if ((m = msg.match(/at or near "([^"]*)"/))) return `Ada yang belum pas di dekat "${m[1]}". ${URUTAN}`;
      if (/at end of input/.test(msg)) return "Query-nya belum selesai.";
      break;
    case "42883":
      return "Fungsi atau operator itu tidak cocok dengan tipe datanya. Cek tipe kolom, misalnya angka dibandingkan dengan teks.";
    case "42702":
      if ((m = msg.match(/column reference "([^"]+)"/)))
        return `Kolom "${m[1]}" ada di lebih dari satu tabel. Tulis lengkap dengan nama tabelnya.`;
      break;
    case "42803":
      return "Kolom yang tidak dikelompokkan harus masuk GROUP BY atau dibungkus fungsi agregat seperti SUM.";
    case "22P02":
      return "Nilainya tidak cocok dengan tipe kolom, misalnya teks dimasukkan ke kolom angka.";
    case "23505":
      return "Data dengan kunci yang sama sudah ada.";
    case "25P02":
      return "Ada perintah yang galat di dalam transaksi, jadi sisa transaksi diabaikan. Tulis ROLLBACK lalu ulangi.";
  }
  return `PostgreSQL bilang: ${msg}`;
}
