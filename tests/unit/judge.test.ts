import { describe, expect, it, vi } from "vitest";
import type { CaseWriteQuestion } from "@/features/course/schemas";
import {
  compareTables,
  containsKeyword,
  judgeWrite,
  mainCommand,
  type RunOutcome,
  splitStatements,
} from "@/features/mission/judge";

const baseQuestion = (
  overrides: Partial<CaseWriteQuestion> = {},
): CaseWriteQuestion => ({
  node: "n1",
  type: "write",
  prompt: "Tulis query yang menampilkan semua pelanggan.",
  boleh: ["SELECT"],
  wajib: [],
  aturanKolom: "tepat",
  answer: "SELECT id FROM pelanggan",
  pemeriksa: null,
  hints: [],
  explanation: "",
  ...overrides,
});

const table = (columns: string[], rows: unknown[][]): RunOutcome => ({
  ok: true,
  columns,
  rows,
});

describe("splitStatements", () => {
  it("memisah statement pada titik koma", () => {
    expect(splitStatements("SELECT 1; SELECT 2;")).toEqual([
      "SELECT 1",
      "SELECT 2",
    ]);
  });

  it("tidak memisah titik koma di dalam kutip", () => {
    expect(splitStatements("SELECT 'a;b'")).toEqual(["SELECT 'a;b'"]);
    expect(splitStatements('SELECT "x;y" FROM t')).toEqual([
      'SELECT "x;y" FROM t',
    ]);
  });

  it("tidak memisah titik koma di dalam tanda kurung", () => {
    expect(splitStatements("SELECT (1;2)")).toEqual(["SELECT (1;2)"]);
  });

  it("membuang statement kosong dan spasi", () => {
    expect(splitStatements("  ;  ; SELECT 1 ;;")).toEqual(["SELECT 1"]);
  });

  it("string kosong menghasilkan daftar kosong", () => {
    expect(splitStatements("   ")).toEqual([]);
  });
});

describe("mainCommand", () => {
  it.each([
    ["select * from t", "SELECT"],
    ["  insert into t values (1)", "INSERT"],
    ["DELETE FROM t", "DELETE"],
    ["pragma table_info(t)", "PRAGMA"],
  ])("%s -> %s", (statement, expected) => {
    expect(mainCommand(statement)).toBe(expected);
  });

  it("untuk WITH, memakai perintah utama setelah CTE", () => {
    expect(mainCommand("WITH x AS (SELECT 1) SELECT * FROM x")).toBe("SELECT");
    expect(mainCommand("with x as (select 1) delete from t")).toBe("DELETE");
  });

  it("kata SELECT di dalam CTE tidak dianggap perintah utama", () => {
    expect(mainCommand("WITH a AS (SELECT 1 AS n) SELECT n FROM a")).toBe(
      "SELECT",
    );
  });

  it("mengembalikan null untuk statement kosong", () => {
    expect(mainCommand("")).toBeNull();
    expect(mainCommand("   ")).toBeNull();
  });
});

describe("containsKeyword", () => {
  it("mencocokkan kata kunci tanpa peduli huruf besar-kecil", () => {
    expect(containsKeyword("select * from t where x=1", "WHERE")).toBe(true);
  });

  it("mencocokkan frasa dengan spasi bebas di antara kata", () => {
    expect(containsKeyword("SELECT *\n  ORDER\tBY id", "ORDER BY")).toBe(true);
  });

  it("tidak cocok jika kata hanya bagian dari kata lain", () => {
    expect(containsKeyword("SELECT wherever FROM t", "WHERE")).toBe(false);
  });

  it("aman terhadap karakter regex di kata kunci", () => {
    expect(containsKeyword("SELECT a.b FROM t", "a.b")).toBe(true);
    expect(containsKeyword("SELECT axb FROM t", "a.b")).toBe(false);
  });
});

describe("compareTables", () => {
  const expected = {
    columns: ["nama", "kota"],
    rows: [
      ["Ani", "Bandung"],
      ["Budi", "Jakarta"],
    ],
  };

  it("cocok jika isi sama meski urutan baris berbeda", () => {
    const user = {
      columns: ["nama", "kota"],
      rows: [
        ["Budi", "Jakarta"],
        ["Ani", "Bandung"],
      ],
    };
    expect(compareTables(user, expected, "tepat", false)).toBe(true);
  });

  it("cocok jika nama kolom sama tetapi urutan kolom berbeda", () => {
    const user = {
      columns: ["kota", "nama"],
      rows: [
        ["Bandung", "Ani"],
        ["Jakarta", "Budi"],
      ],
    };
    expect(compareTables(user, expected, "tepat", false)).toBe(true);
  });

  it("nama kolom tidak peka huruf besar-kecil", () => {
    const user = { columns: ["NAMA", "Kota"], rows: expected.rows };
    expect(compareTables(user, expected, "tepat", false)).toBe(true);
  });

  it("gagal jika ada baris yang berbeda", () => {
    const user = {
      columns: ["nama", "kota"],
      rows: [["Ani", "Bandung"]],
    };
    expect(compareTables(user, expected, "tepat", false)).toBe(false);
  });

  it("gagal jika nilai satu sel berbeda", () => {
    const user = {
      columns: ["nama", "kota"],
      rows: [
        ["Ani", "Bandung"],
        ["Budi", "Surabaya"],
      ],
    };
    expect(compareTables(user, expected, "tepat", false)).toBe(false);
  });

  it("aturan 'tepat' menolak kolom ekstra", () => {
    const user = {
      columns: ["nama", "kota", "umur"],
      rows: [["Ani", "Bandung", 20]],
    };
    expect(compareTables(user, expected, "tepat", false)).toBe(false);
  });

  it("aturan 'minimal' menerima kolom ekstra selama kolom kunci ada", () => {
    const user = {
      columns: ["nama", "kota", "umur"],
      rows: [
        ["Ani", "Bandung", 20],
        ["Budi", "Jakarta", 30],
      ],
    };
    expect(compareTables(user, expected, "minimal", false)).toBe(true);
  });

  it("gagal jika kolom kunci hilang, walaupun aturan 'minimal'", () => {
    const user = { columns: ["nama"], rows: [["Ani"], ["Budi"]] };
    expect(compareTables(user, expected, "minimal", false)).toBe(false);
  });

  it("gagal jika kolom duplikat pada aturan 'tepat'", () => {
    const user = {
      columns: ["nama", "nama"],
      rows: [
        ["Ani", "Ani"],
        ["Budi", "Budi"],
      ],
    };
    const keyOnlyName = { columns: ["nama"], rows: [["Ani"], ["Budi"]] };
    expect(compareTables(user, keyOnlyName, "tepat", false)).toBe(false);
  });

  it("gagal jika jumlah baris berbeda", () => {
    const user = { columns: ["nama", "kota"], rows: [] };
    expect(compareTables(user, expected, "tepat", false)).toBe(false);
  });

  it("dengan ORDER BY, urutan baris harus sama", () => {
    const reversed = {
      columns: ["nama", "kota"],
      rows: [
        ["Budi", "Jakarta"],
        ["Ani", "Bandung"],
      ],
    };
    expect(compareTables(reversed, expected, "tepat", true)).toBe(false);
    expect(compareTables(expected, expected, "tepat", true)).toBe(true);
  });

  it("NULL dan teks 'NULL' dianggap sama, angka dan teksnya juga sama", () => {
    const key = { columns: ["x"], rows: [[null], [1]] };
    const user = { columns: ["x"], rows: [["NULL"], ["1"]] };
    expect(compareTables(user, key, "tepat", false)).toBe(true);
  });

  it("spasi di awal dan akhir sel diabaikan", () => {
    const key = { columns: ["x"], rows: [["Ani"]] };
    const user = { columns: ["x"], rows: [["  Ani "]] };
    expect(compareTables(user, key, "tepat", false)).toBe(true);
  });
});

describe("judgeWrite", () => {
  it("meminta query kosong ditulis dulu", async () => {
    const run = vi.fn();
    const verdict = await judgeWrite(baseQuestion(), "seed", "   ", run);
    expect(verdict).toEqual({ correct: false, message: "Tulis query dulu." });
    expect(run).not.toHaveBeenCalled();
  });

  it("menolak perintah yang dikenal tetapi tidak diizinkan misi", async () => {
    const run = vi.fn();
    const verdict = await judgeWrite(
      baseQuestion(),
      "seed",
      "DELETE FROM pelanggan",
      run,
    );
    expect(verdict.correct).toBe(false);
    expect(verdict.message).toBe("Perintah DELETE belum dipakai di misi ini.");
    expect(run).not.toHaveBeenCalled();
  });

  it("menolak perintah yang tidak dikenali", async () => {
    const run = vi.fn();
    const verdict = await judgeWrite(baseQuestion(), "seed", "HAHA x", run);
    expect(verdict).toEqual({
      correct: false,
      message: "Perintah pertama belum dikenali. Periksa penulisannya.",
    });
    expect(run).not.toHaveBeenCalled();
  });

  it("menolak jika salah satu statement dalam query tidak diizinkan", async () => {
    const run = vi.fn();
    const verdict = await judgeWrite(
      baseQuestion(),
      "seed",
      "SELECT 1; DROP TABLE pelanggan",
      run,
    );
    expect(verdict.message).toBe("Perintah DROP belum dipakai di misi ini.");
    expect(run).not.toHaveBeenCalled();
  });

  it("menolak jika kata wajib tidak ada", async () => {
    const run = vi.fn();
    const verdict = await judgeWrite(
      baseQuestion({ wajib: ["WHERE"] }),
      "seed",
      "SELECT id FROM pelanggan",
      run,
    );
    expect(verdict).toEqual({
      correct: false,
      message: "Query belum memakai WHERE.",
    });
    expect(run).not.toHaveBeenCalled();
  });

  it("menjalankan kunci dan query pengguna lalu membandingkan hasilnya", async () => {
    const run = vi.fn(async () => [
      table(["id"], [[1], [2]]),
      table(["id"], [[2], [1]]),
    ]);
    const verdict = await judgeWrite(
      baseQuestion(),
      "seed-1",
      "  SELECT id FROM pelanggan  ",
      run,
    );
    expect(verdict).toEqual({ correct: true, message: "Tepat sekali!" });
    expect(run).toHaveBeenCalledWith([
      { seed: "seed-1", prelude: null, query: "SELECT id FROM pelanggan" },
      { seed: "seed-1", prelude: null, query: "SELECT id FROM pelanggan" },
    ]);
  });

  it("hasil salah memakai pesan standar tanpa pemeriksa", async () => {
    const run = vi.fn(async () => [table(["id"], [[1]]), table(["id"], [[9]])]);
    const verdict = await judgeWrite(baseQuestion(), "seed", "SELECT 9", run);
    expect(verdict).toEqual({
      correct: false,
      message: "Hasilnya belum sama dengan bukti yang dicari.",
    });
  });

  it("dengan pemeriksa, query pengguna dijalankan sebagai prelude", async () => {
    const run = vi.fn(async () => [
      table(["total"], [[3]]),
      table(["total"], [[3]]),
    ]);
    const question = baseQuestion({
      answer: "UPDATE pelanggan SET aktif = 1",
      pemeriksa: "SELECT COUNT(*) AS total FROM pelanggan WHERE aktif = 1",
      boleh: ["UPDATE"],
      aturanKolom: "minimal",
    });
    const verdict = await judgeWrite(
      question,
      "seed-2",
      "UPDATE pelanggan SET aktif = 1",
      run,
    );
    expect(verdict.correct).toBe(true);
    expect(run).toHaveBeenCalledWith([
      {
        seed: "seed-2",
        prelude: "UPDATE pelanggan SET aktif = 1",
        query: "SELECT COUNT(*) AS total FROM pelanggan WHERE aktif = 1",
      },
      {
        seed: "seed-2",
        prelude: "UPDATE pelanggan SET aktif = 1",
        query: "SELECT COUNT(*) AS total FROM pelanggan WHERE aktif = 1",
      },
    ]);
  });

  it("dengan pemeriksa dan hasil salah, memakai pesan khusus pemeriksa", async () => {
    const run = vi.fn(async () => [
      table(["total"], [[3]]),
      table(["total"], [[5]]),
    ]);
    const question = baseQuestion({
      answer: "UPDATE pelanggan SET aktif = 1",
      pemeriksa: "SELECT COUNT(*) AS total FROM pelanggan",
      boleh: ["UPDATE"],
    });
    const verdict = await judgeWrite(question, "seed", "UPDATE t SET x=1", run);
    expect(verdict).toEqual({
      correct: false,
      message: "Data setelah perintahmu belum sama dengan yang dicari.",
    });
  });

  it("meneruskan galat dari query pengguna", async () => {
    const run = vi.fn(async () => [
      { ok: false, message: "Kolom foo tidak ada di tabel." } as RunOutcome,
      table(["id"], [[1]]),
    ]);
    const verdict = await judgeWrite(
      baseQuestion(),
      "seed",
      "SELECT foo FROM pelanggan",
      run,
    );
    expect(verdict).toEqual({
      correct: false,
      message: "Kolom foo tidak ada di tabel.",
    });
  });

  it("meneruskan galat dari kunci jawaban", async () => {
    const run = vi.fn(async () => [
      table(["id"], [[1]]),
      { ok: false, message: "Kunci rusak." } as RunOutcome,
    ]);
    const verdict = await judgeWrite(
      baseQuestion(),
      "seed",
      "SELECT id FROM pelanggan",
      run,
    );
    expect(verdict).toEqual({ correct: false, message: "Kunci rusak." });
  });

  it("urutan hasil ikut dinilai jika kunci memakai ORDER BY", async () => {
    const run = vi.fn(async () => [
      table(["id"], [[2], [1]]),
      table(["id"], [[1], [2]]),
    ]);
    const question = baseQuestion({
      answer: "SELECT id FROM pelanggan ORDER BY id",
    });
    const verdict = await judgeWrite(
      question,
      "seed",
      "SELECT id FROM pelanggan",
      run,
    );
    expect(verdict.correct).toBe(false);
  });

  it("perintah WITH ... SELECT diizinkan jika SELECT termasuk yang boleh", async () => {
    const run = vi.fn(async () => [table(["n"], [[1]]), table(["n"], [[1]])]);
    const verdict = await judgeWrite(
      baseQuestion(),
      "seed",
      "WITH a AS (SELECT 1 AS n) SELECT n FROM a",
      run,
    );
    expect(verdict.correct).toBe(true);
  });
});
