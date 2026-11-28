import { describe, expect, it } from "vitest";
import { briefingSteps, shouldShowBriefing } from "@/features/mission/briefing";

describe("briefing misi", () => {
  it("mendaftar tiap soal berurutan dengan jenis dan perintahnya", () => {
    const steps = briefingSteps([
      { type: "pasang", prompt: "Pasangkan perusahaan dengan pemiliknya." },
      { type: "salah", prompt: "Ketuk bagian yang keliru." },
      { type: "write", prompt: "Tampilkan nama perusahaan." },
    ]);

    expect(steps).toEqual([
      {
        no: 1,
        label: "Pasangkan kunci",
        prompt: "Pasangkan perusahaan dengan pemiliknya.",
      },
      { no: 2, label: "Cari kesalahan", prompt: "Ketuk bagian yang keliru." },
      { no: 3, label: "Tulis query", prompt: "Tampilkan nama perusahaan." },
    ]);
  });

  it("muncul saat misi baru dimulai, tidak saat melanjutkan di tengah", () => {
    expect(shouldShowBriefing(0)).toBe(true);
    expect(shouldShowBriefing(2)).toBe(false);
  });
});
