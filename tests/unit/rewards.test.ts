import { describe, expect, it } from "vitest";
import {
  accuracyFor,
  calendarDate,
  HEART_REGEN_MS,
  HEARTS_MAX,
  heartsNow,
  leagueWeekStart,
  loseHeart,
  nextLantern,
  previousDate,
  scoreFor,
  xpFor,
} from "@/features/mission/rewards";

const at = (iso: string) => new Date(iso);

describe("heartsNow", () => {
  it("mengembalikan nyawa apa adanya jika belum ada waktu regenerasi", () => {
    const updated = at("2026-01-01T00:00:00Z");
    expect(heartsNow(3, updated, updated)).toBe(3);
  });

  it("menambah satu nyawa untuk setiap interval regenerasi penuh", () => {
    const updated = at("2026-01-01T00:00:00Z");
    const now = new Date(updated.getTime() + 2 * HEART_REGEN_MS);
    expect(heartsNow(1, updated, now)).toBe(3);
  });

  it("tidak menambah nyawa sebelum satu interval penuh berlalu", () => {
    const updated = at("2026-01-01T00:00:00Z");
    const now = new Date(updated.getTime() + HEART_REGEN_MS - 1);
    expect(heartsNow(1, updated, now)).toBe(1);
  });

  it("dibatasi HEARTS_MAX", () => {
    const updated = at("2026-01-01T00:00:00Z");
    const now = new Date(updated.getTime() + 100 * HEART_REGEN_MS);
    expect(heartsNow(0, updated, now)).toBe(HEARTS_MAX);
  });

  it("tidak pernah memakai waktu negatif (jam mundur)", () => {
    const updated = at("2026-01-02T00:00:00Z");
    const now = at("2026-01-01T00:00:00Z");
    expect(heartsNow(2, updated, now)).toBe(2);
  });
});

describe("loseHeart", () => {
  it("mengurangi satu nyawa dan mencatat waktu sekarang", () => {
    const updated = at("2026-01-01T00:00:00Z");
    const now = at("2026-01-01T01:00:00Z");
    expect(loseHeart(3, updated, now)).toEqual({ hearts: 2, updatedAt: now });
  });

  it("tidak turun di bawah nol", () => {
    const updated = at("2026-01-01T00:00:00Z");
    const now = at("2026-01-01T01:00:00Z");
    expect(loseHeart(0, updated, now).hearts).toBe(0);
  });

  it("menghitung regenerasi dulu sebelum dikurangi", () => {
    const updated = at("2026-01-01T00:00:00Z");
    const now = new Date(updated.getTime() + HEART_REGEN_MS);
    // 1 nyawa + 1 regenerasi = 2, lalu dikurangi 1.
    expect(loseHeart(1, updated, now).hearts).toBe(1);
  });
});

describe("scoreFor", () => {
  it.each([
    [0, 100],
    [1, 90],
    [5, 50],
    [10, 0],
    [20, 0],
  ])("%i petunjuk memberi skor %i", (hints, expected) => {
    expect(scoreFor(hints)).toBe(expected);
  });
});

describe("accuracyFor", () => {
  it("mengembalikan 0 jika belum ada jawaban", () => {
    expect(accuracyFor(0, 0)).toBe(0);
  });

  it("membulatkan persentase ke bilangan bulat terdekat", () => {
    expect(accuracyFor(2, 3)).toBe(67);
    expect(accuracyFor(1, 3)).toBe(33);
  });

  it("100 persen jika semua benar", () => {
    expect(accuracyFor(4, 4)).toBe(100);
  });
});

describe("xpFor", () => {
  it("memberi XP penuh untuk misi pertama dan XP kecil untuk pengulangan", () => {
    expect(xpFor(false)).toBe(10);
    expect(xpFor(true)).toBe(5);
  });
});

describe("calendarDate", () => {
  it("memakai zona waktu Asia/Jakarta, bukan UTC", () => {
    // 23:30 UTC pada 31 Des sudah 1 Jan di WIB (UTC+7).
    expect(calendarDate(at("2025-12-31T23:30:00Z"))).toBe("2026-01-01");
  });

  it("tetap tanggal yang sama sebelum tengah malam WIB", () => {
    expect(calendarDate(at("2026-03-10T10:00:00Z"))).toBe("2026-03-10");
  });

  it("bisa memakai zona waktu lain", () => {
    expect(calendarDate(at("2025-12-31T23:30:00Z"), "UTC")).toBe("2025-12-31");
  });
});

describe("previousDate", () => {
  it("mundur satu hari", () => {
    expect(previousDate("2026-03-01")).toBe("2026-02-28");
    expect(previousDate("2024-03-01")).toBe("2024-02-29");
  });
});

describe("nextLantern", () => {
  it("tetap sama jika sudah ada misi hari ini", () => {
    expect(nextLantern(4, "2026-05-10", "2026-05-10")).toBe(4);
  });

  it("bertambah satu jika misi terakhir kemarin", () => {
    expect(nextLantern(4, "2026-05-09", "2026-05-10")).toBe(5);
  });

  it("kembali ke 1 jika lebih dari satu hari terlewat", () => {
    expect(nextLantern(4, "2026-05-07", "2026-05-10")).toBe(1);
  });

  it("mulai dari 1 jika belum pernah ada misi", () => {
    expect(nextLantern(0, null, "2026-05-10")).toBe(1);
  });
});

describe("leagueWeekStart", () => {
  it("Senin adalah awal minggu, termasuk ketika hari itu Senin", () => {
    expect(leagueWeekStart("2026-05-11")).toBe("2026-05-11");
  });

  it("Minggu dihitung sebagai akhir minggu sebelumnya", () => {
    // 2026-05-17 adalah Minggu, awal minggunya Senin 11 Mei.
    expect(leagueWeekStart("2026-05-17")).toBe("2026-05-11");
  });

  it("Rabu kembali ke Senin di minggu yang sama", () => {
    expect(leagueWeekStart("2026-05-13")).toBe("2026-05-11");
  });
});
