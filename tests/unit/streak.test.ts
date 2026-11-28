import { describe, expect, it } from "vitest";
import { computeStreak, toJakartaDate } from "@/features/progress/streak";

describe("toJakartaDate", () => {
  it("menghitung tanggal WIB dari waktu UTC", () => {
    expect(toJakartaDate(new Date("2026-06-01T18:00:00Z"))).toBe("2026-06-02");
  });

  it("memakai format yyyy-mm-dd dengan angka nol di depan", () => {
    expect(toJakartaDate(new Date("2026-01-05T03:00:00Z"))).toBe("2026-01-05");
  });
});

describe("computeStreak", () => {
  it("nol jika tidak ada aktivitas sama sekali", () => {
    expect(computeStreak([], "2026-05-10")).toBe(0);
  });

  it("menghitung hari berturut-turut sampai hari ini", () => {
    expect(
      computeStreak(["2026-05-08", "2026-05-09", "2026-05-10"], "2026-05-10"),
    ).toBe(3);
  });

  it("hari ini belum aktif tidak memutus streak dari kemarin", () => {
    expect(computeStreak(["2026-05-08", "2026-05-09"], "2026-05-10")).toBe(2);
  });

  it("streak putus jika dua hari terakhir tidak aktif", () => {
    expect(computeStreak(["2026-05-07", "2026-05-08"], "2026-05-10")).toBe(0);
  });

  it("hanya menghitung rentetan terbaru, bukan semua hari", () => {
    expect(
      computeStreak(
        ["2026-05-01", "2026-05-02", "2026-05-05", "2026-05-06", "2026-05-07"],
        "2026-05-07",
      ),
    ).toBe(3);
  });

  it("melewati batas bulan dan tahun dengan benar", () => {
    expect(computeStreak(["2025-12-31", "2026-01-01"], "2026-01-01")).toBe(2);
  });

  it("melewati tahun kabisat", () => {
    expect(
      computeStreak(["2024-02-28", "2024-02-29", "2024-03-01"], "2024-03-01"),
    ).toBe(3);
  });

  it("duplikat tanggal hanya dihitung sekali", () => {
    expect(
      computeStreak(["2026-05-09", "2026-05-09", "2026-05-10"], "2026-05-10"),
    ).toBe(2);
  });
});
