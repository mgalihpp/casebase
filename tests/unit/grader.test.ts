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
      message: "Tepat sekali!",
    });
  });

  it("salah jika indeks pilihan berbeda", async () => {
    const answer: Answer = { type: "pilih", choice: 0 };
    const verdict = await gradeAnswer(pilih, "seed", answer);
    expect(verdict.correct).toBe(false);
    expect(verdict.message).toBe(
      "Pilihanmu belum tepat. Coba baca soalnya lagi.",
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
    expect(verdict).toEqual({ correct: true, message: "Tepat sekali!" });
  });

  it("salah jika urutan berbeda", async () => {
    const answer: Answer = { type: "susun", order: ["SELECT", "FROM", "*"] };
    const verdict = await gradeAnswer(susun, "seed", answer);
    expect(verdict).toEqual({
      correct: false,
      message: "Urutannya belum tepat.",
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
    expect(verdict).toEqual({ correct: true, message: "Tepat sekali!" });
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
      message: "Jenis jawaban tidak cocok dengan soal.",
    });
    expect(sandbox).not.toHaveBeenCalled();
  });
});
