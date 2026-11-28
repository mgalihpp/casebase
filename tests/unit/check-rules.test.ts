import { describe, expect, it } from "vitest";
import { checkRule } from "@/features/mission/check-rules";

describe("checkRule", () => {
  it("tidak menyelesaikan node dari soal terakhir saat soal sebelumnya belum dijawab benar", () => {
    const result = checkRule({
      activeIndex: 0,
      questionIndex: 2,
      total: 3,
      correct: true,
    });
    expect(result.accepted).toBe(false);
    expect(result.nodeDone).toBe(false);
    expect(result.advance).toBe(false);
  });

  it("menolak jawaban salah untuk soal yang bukan posisi aktif", () => {
    const result = checkRule({
      activeIndex: 1,
      questionIndex: 0,
      total: 3,
      correct: false,
    });
    expect(result.accepted).toBe(false);
    expect(result.advance).toBe(false);
  });

  it("tidak maju dan tidak selesai saat jawaban salah", () => {
    const result = checkRule({
      activeIndex: 2,
      questionIndex: 2,
      total: 3,
      correct: false,
    });
    expect(result).toEqual({ accepted: true, advance: false, nodeDone: false });
  });

  it("maju ke soal berikutnya saat jawaban benar bukan soal terakhir", () => {
    const result = checkRule({
      activeIndex: 0,
      questionIndex: 0,
      total: 3,
      correct: true,
    });
    expect(result).toEqual({ accepted: true, advance: true, nodeDone: false });
  });

  it("menyelesaikan node hanya saat soal terakhir dijawab benar di posisi aktif", () => {
    const result = checkRule({
      activeIndex: 2,
      questionIndex: 2,
      total: 3,
      correct: true,
    });
    expect(result).toEqual({ accepted: true, advance: false, nodeDone: true });
  });
});
