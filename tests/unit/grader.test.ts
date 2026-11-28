import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CaseQuestion } from "@/features/course/schemas";
import type { Answer } from "@/features/mission/grader";
import { gradeAnswer } from "@/features/mission/grader";
import { runSandbox } from "@/features/mission/sandbox";

// Sandbox memakai worker_threads dan sql.js. Di tes, hasilnya dikendalikan lewat mock.
vi.mock("@/features/mission/sandbox", () => ({
  runSandbox: vi.fn(),
}));

const sandbox = vi.mocked(runSandbox);

const pilih: CaseQuestion = {
  node: "n1",
  type: "pilih",
  prompt: "Mana yang benar?",
  options: ["A", "B", "C"],
  answerIndex: 1,
  hints: [],
  explanation: "",
};

const susun: CaseQuestion = {
  node: "n2",
  type: "susun",
  prompt: "Susun kata kunci",
  pieces: ["FROM", "SELECT", "*"],
  answer: ["SELECT", "*", "FROM"],
  hints: [],
  explanation: "",
};

const write: CaseQuestion = {
  node: "n3",
  type: "write",
  prompt: "Tulis SELECT",
  boleh: ["SELECT"],
  wajib: ["FROM"],
  aturanKolom: "tepat",
  answer: "SELECT 1 AS n FROM t",
  pemeriksa: null,
  hints: [],
  explanation: "",
};

beforeEach(() => {
  sandbox.mockReset();
});

describe("gradeAnswer: pilih", () => {
  it("benar jika indeks pilihan sama dengan kunci", async () => {
    const answer: Answer = { type: "pilih", choice: 1 };
    await expect(gradeAnswer(pilih, "seed", answer)).resolves.toEqual({
      correct: true,
      message: "Benar. Buktinya cocok.",
    });
  });

  it("salah jika indeks pilihan berbeda", async () => {
    const answer: Answer = { type: "pilih", choice: 0 };
    const verdict = await gradeAnswer(pilih, "seed", answer);
    expect(verdict.correct).toBe(false);
    expect(verdict.message).toBe(
      "Pilihanmu belum benar. Baca soalnya sekali lagi.",
    );
  });

  it("tidak memanggil sandbox", async () => {
    await gradeAnswer(pilih, "seed", { type: "pilih", choice: 2 });
    expect(sandbox).not.toHaveBeenCalled();
  });
});

describe("gradeAnswer: susun", () => {
  it("benar jika urutan potongan sama persis", async () => {
    const answer: Answer = { type: "susun", order: ["SELECT", "*", "FROM"] };
    const verdict = await gradeAnswer(susun, "seed", answer);
    expect(verdict).toEqual({
      correct: true,
      message: "Benar. Buktinya cocok.",
    });
  });

  it("salah jika urutan berbeda", async () => {
    const answer: Answer = { type: "susun", order: ["SELECT", "FROM", "*"] };
    const verdict = await gradeAnswer(susun, "seed", answer);
    expect(verdict).toEqual({
      correct: false,
      message: "Urutannya belum benar.",
    });
  });

  it("salah jika jumlah potongan kurang", async () => {
    const answer: Answer = { type: "susun", order: ["SELECT", "*"] };
    const verdict = await gradeAnswer(susun, "seed", answer);
    expect(verdict.correct).toBe(false);
  });

  it("salah jika ada potongan yang tidak ada di kunci", async () => {
    const answer: Answer = {
      type: "susun",
      order: ["SELECT", "*", "WHERE"],
    };
    const verdict = await gradeAnswer(susun, "seed", answer);
    expect(verdict.correct).toBe(false);
  });
});

describe("gradeAnswer: write", () => {
  it("menilai query lewat sandbox dan benar jika hasilnya sama", async () => {
    sandbox.mockResolvedValue([
      { ok: true, columns: ["n"], rows: [[1]] },
      { ok: true, columns: ["n"], rows: [[1]] },
    ]);
    const verdict = await gradeAnswer(write, "seed-x", {
      type: "write",
      query: "SELECT 1 AS n FROM t",
    });
    expect(verdict).toEqual({
      correct: true,
      message: "Benar. Buktinya cocok.",
    });
    expect(sandbox).toHaveBeenCalledTimes(1);
    expect(sandbox.mock.calls[0][0]).toEqual([
      { seed: "seed-x", prelude: null, query: "SELECT 1 AS n FROM t" },
      { seed: "seed-x", prelude: null, query: "SELECT 1 AS n FROM t" },
    ]);
  });

  it("menolak sebelum sandbox jika kata wajib tidak ada", async () => {
    const verdict = await gradeAnswer(write, "seed", {
      type: "write",
      query: "SELECT 1 AS n",
    });
    expect(verdict.message).toBe("Query belum memakai FROM.");
    expect(sandbox).not.toHaveBeenCalled();
  });
});

describe("gradeAnswer: jenis jawaban tidak cocok", () => {
  it.each([
    ["pilihan untuk soal tulis", write, { type: "pilih", choice: 0 } as Answer],
    [
      "urutan untuk soal pilihan",
      pilih,
      { type: "susun", order: [] } as Answer,
    ],
    ["tulisan untuk soal susun", susun, { type: "write", query: "" } as Answer],
  ])("%s ditolak", async (_label, question, answer) => {
    const verdict = await gradeAnswer(question, "seed", answer);
    expect(verdict).toEqual({
      correct: false,
      message: "Jenis jawaban tidak sesuai soal.",
    });
    expect(sandbox).not.toHaveBeenCalled();
  });
});

describe("gradeAnswer: tebak, salah, pasang", () => {
  const tebak: CaseQuestion = {
    node: "n1",
    type: "tebak",
    prompt: "Baris mana?",
    columns: ["id"],
    rows: [[1], [2], [3]],
    answer: [0, 2],
    hints: [],
    explanation: "",
  };
  const salah: CaseQuestion = {
    node: "n1",
    type: "salah",
    prompt: "Mana yang keliru?",
    tokens: ["a", "b", "c"],
    wrongIndex: 1,
    options: ["x", "y"],
    fixIndex: 0,
    hints: [],
    explanation: "",
  };
  const pasang: CaseQuestion = {
    node: "n1",
    type: "pasang",
    prompt: "Pasangkan",
    kiri: ["a", "b"],
    kanan: ["y", "x"],
    answer: [1, 0],
    hints: [],
    explanation: "",
  };

  it("tebak benar tanpa peduli urutan ketuk dan ketukan ganda", async () => {
    const verdict = await gradeAnswer(tebak, "seed", {
      type: "tebak",
      rows: [2, 0, 2],
    });
    expect(verdict.correct).toBe(true);
  });

  it("tebak salah jika ada baris kurang atau lebih", async () => {
    expect(
      (await gradeAnswer(tebak, "seed", { type: "tebak", rows: [0] })).correct,
    ).toBe(false);
    expect(
      (await gradeAnswer(tebak, "seed", { type: "tebak", rows: [0, 1, 2] }))
        .correct,
    ).toBe(false);
  });

  it("salah butuh token dan perbaikan yang tepat", async () => {
    const ok = { type: "salah", token: 1, fix: 0 } as const;
    expect((await gradeAnswer(salah, "seed", ok)).correct).toBe(true);
    expect(
      (await gradeAnswer(salah, "seed", { ...ok, token: 2 })).correct,
    ).toBe(false);
    expect((await gradeAnswer(salah, "seed", { ...ok, fix: 1 })).correct).toBe(
      false,
    );
  });

  it("pasang benar hanya jika setiap pasangan cocok", async () => {
    expect(
      (await gradeAnswer(pasang, "seed", { type: "pasang", pairs: [1, 0] }))
        .correct,
    ).toBe(true);
    expect(
      (await gradeAnswer(pasang, "seed", { type: "pasang", pairs: [0, 1] }))
        .correct,
    ).toBe(false);
    expect(
      (await gradeAnswer(pasang, "seed", { type: "pasang", pairs: [1] }))
        .correct,
    ).toBe(false);
  });
});
