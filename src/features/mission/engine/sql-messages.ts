// Mengubah galat sql.js (Inggris) menjadi pesan Bahasa Indonesia.
export function explainSqlError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  const column = raw.match(/no such column:\s*(\S+)/i);
  if (column) return `Kolom ${column[1]} tidak ada di tabel.`;

  const table = raw.match(/no such table:\s*(\S+)/i);
  if (table) return `Tabel ${table[1]} tidak ditemukan.`;

  const near = raw.match(/near "([^"]+)": syntax error/i);
  if (near) return `Ada yang salah tulis di dekat "${near[1]}".`;

  if (/syntax error/i.test(raw)) return "Ada yang salah tulis di query-mu.";
  if (/ambiguous column name/i.test(raw)) {
    return "Nama kolom ambigu. Tambahkan nama tabel di depannya.";
  }

  return "Query gagal dijalankan. Cek lagi tulisanmu.";
}
