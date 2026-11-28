import { describe, expect, it } from "vitest";
import { explainSqlError } from "@/features/mission/engine/sql-messages";

describe("explainSqlError", () => {
  it.each([
    ["no such column: umur", "Kolom umur tidak ada di tabel."],
    ["no such table: pesanan", "Tabel pesanan tidak ditemukan."],
    ['near "FORM": syntax error', 'Ada salah tulis di dekat "FORM".'],
    ["syntax error", "Ada salah tulis di query."],
    [
      "ambiguous column name: id",
      "Nama kolom ambigu. Beri nama tabel di depannya.",
    ],
    ["something unexpected", "Query gagal. Cek tulisanmu."],
  ])("menerjemahkan %j", (raw, expected) => {
    expect(explainSqlError(new Error(raw))).toBe(expected);
  });

  it("membaca teks dari nilai yang bukan Error", () => {
    expect(explainSqlError("no such table: x")).toBe(
      "Tabel x tidak ditemukan.",
    );
  });

  it("tidak peka huruf besar-kecil pada pola galat", () => {
    expect(explainSqlError(new Error("NO SUCH COLUMN: nama"))).toBe(
      "Kolom nama tidak ada di tabel.",
    );
  });
});
