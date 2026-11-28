import { describe, expect, it } from "vitest";
import { caseBodySchema, caseQuestionSchema } from "@/features/course/schemas";
import { answerInput, checkInput, hintInput } from "@/features/mission/schemas";
import { completeInput } from "@/features/onboarding/schemas";

const validBody = {
  course: "sql",
  number: "01",
  title: "Kasus Pertama",
  story: "Cerita singkat.",
  seed: "seed-1",
  nodes: [{ key: "n1", type: "mission" }],
  questions: [
    {
      node: "n1",
      type: "pilih",
      prompt: "Pilih satu",
      options: ["a", "b"],
      answerIndex: 0,
      hints: [],
      explanation: "",
    },
  ],
};

describe("caseBodySchema", () => {
  it("menerima dokumen kasus yang valid dan mengisi default", () => {
    const parsed = caseBodySchema.parse(validBody);
    expect(parsed.bukti).toEqual([]);
    expect(parsed.tersangka).toEqual([]);
  });

  it("menolak kasus tanpa node", () => {
    expect(() => caseBodySchema.parse({ ...validBody, nodes: [] })).toThrow();
  });

  it("menolak jenis node yang tidak dikenal", () => {
    expect(() =>
      caseBodySchema.parse({
        ...validBody,
        nodes: [{ key: "n1", type: "dragon" }],
      }),
    ).toThrow();
  });
});

describe("caseQuestionSchema", () => {
  it("menolak pilihan dengan answerIndex di luar jumlah opsi", () => {
    const result = caseQuestionSchema.safeParse({
      node: "n1",
      type: "pilih",
      prompt: "Pilih",
      options: ["a", "b"],
      answerIndex: 2,
      hints: [],
      explanation: "",
    });
    expect(result.success).toBe(false);
  });

  it("menolak soal susun jika jawaban bukan permutasi potongan", () => {
    const result = caseQuestionSchema.safeParse({
      node: "n1",
      type: "susun",
      prompt: "Susun",
      pieces: ["SELECT", "*"],
      answer: ["SELECT", "FROM"],
      hints: [],
      explanation: "",
    });
    expect(result.success).toBe(false);
  });

  it("menerima soal susun jika jawaban permutasi potongan", () => {
    const result = caseQuestionSchema.safeParse({
      node: "n1",
      type: "susun",
      prompt: "Susun",
      pieces: ["*", "SELECT"],
      answer: ["SELECT", "*"],
      hints: [],
      explanation: "",
    });
    expect(result.success).toBe(true);
  });

  it("soal tulis memakai pemeriksa null sebagai nilai valid", () => {
    const result = caseQuestionSchema.safeParse({
      node: "n1",
      type: "write",
      prompt: "Tulis",
      boleh: ["SELECT"],
      wajib: [],
      aturanKolom: "minimal",
      answer: "SELECT 1",
      pemeriksa: null,
      hints: [],
      explanation: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("answerInput", () => {
  it("membedakan tiga jenis jawaban", () => {
    expect(
      answerInput.safeParse({ type: "write", query: "SELECT 1" }).success,
    ).toBe(true);
    expect(answerInput.safeParse({ type: "pilih", choice: 0 }).success).toBe(
      true,
    );
    expect(answerInput.safeParse({ type: "susun", order: ["a"] }).success).toBe(
      true,
    );
  });

  it("menolak pilihan negatif", () => {
    expect(answerInput.safeParse({ type: "pilih", choice: -1 }).success).toBe(
      false,
    );
  });

  it("menolak query yang lebih dari 4000 karakter", () => {
    const query = "x".repeat(4001);
    expect(answerInput.safeParse({ type: "write", query }).success).toBe(false);
  });
});

describe("hintInput dan checkInput", () => {
  const start = { courseId: "sql", nodeKey: "n1" };

  it("menolak indeks negatif", () => {
    expect(
      hintInput.safeParse({ ...start, questionIndex: -1, hintIndex: 0 })
        .success,
    ).toBe(false);
  });

  it("menolak courseId kosong", () => {
    expect(
      checkInput.safeParse({
        courseId: "",
        nodeKey: "n1",
        questionIndex: 0,
        answer: { type: "pilih", choice: 0 },
      }).success,
    ).toBe(false);
  });

  it("menerima input pemeriksaan yang lengkap", () => {
    expect(
      checkInput.safeParse({
        ...start,
        questionIndex: 0,
        answer: { type: "pilih", choice: 0 },
      }).success,
    ).toBe(true);
  });
});

describe("completeInput (onboarding)", () => {
  const valid = {
    course: "sql",
    level: "new",
    reason: "school",
    dailyTarget: 10,
  };

  it("menerima input onboarding yang lengkap", () => {
    expect(completeInput.safeParse(valid).success).toBe(true);
  });

  it("menolak kode kursus yang tidak dikenal", () => {
    expect(completeInput.safeParse({ ...valid, course: "cobol" }).success).toBe(
      false,
    );
  });

  it("menolak target harian di luar pilihan yang tersedia", () => {
    expect(completeInput.safeParse({ ...valid, dailyTarget: 7 }).success).toBe(
      false,
    );
  });
});
