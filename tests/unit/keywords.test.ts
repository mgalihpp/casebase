import { describe, expect, it } from "vitest";
import {
  answerKeywords,
  keywordChips,
  parseTables,
} from "@/features/mission/keywords";

describe("parseTables", () => {
  it("membaca tabel dan kolom dari seed, tanpa baris constraint", () => {
    const tables = parseTables(
      "CREATE TABLE perusahaan (id INTEGER PRIMARY KEY, nama TEXT NOT NULL); " +
        "INSERT INTO perusahaan VALUES (1,'Delta'); " +
        "CREATE TABLE pemilik (id INTEGER, perusahaan_id INTEGER, PRIMARY KEY (id));",
    );

    expect(tables).toEqual([
      {
        name: "perusahaan",
        columns: [
          { name: "id", type: "INTEGER" },
          { name: "nama", type: "TEXT" },
        ],
      },
      {
        name: "pemilik",
        columns: [
          { name: "id", type: "INTEGER" },
          { name: "perusahaan_id", type: "INTEGER" },
        ],
      },
    ]);
  });
});

describe("answerKeywords", () => {
  it("mengambil kata kunci yang hanya tersirat di kalimat soal", () => {
    expect(
      answerKeywords(
        "SELECT rekening, SUM(jumlah) AS total FROM transaksi GROUP BY rekening ORDER BY total DESC",
      ),
    ).toEqual([
      "SELECT",
      "SUM",
      "(",
      ")",
      "AS",
      "FROM",
      "GROUP BY",
      "ORDER BY",
      "DESC",
    ]);
  });

  it("tidak membocorkan nilai teks, angka, atau kata kunci di dalam teks", () => {
    const words = answerKeywords(
      "SELECT * FROM pesan WHERE isi LIKE '%transfer dan LIMIT%' AND nominal > 1000",
    );
    expect(words).toEqual(["SELECT", "*", "FROM", "WHERE", "LIKE", "AND", ">"]);
    expect(words.join(" ")).not.toMatch(/transfer|1000|LIMIT/);
  });

  it("tidak memecah frasa panjang menjadi kata pendeknya", () => {
    expect(
      answerKeywords(
        "SELECT nama FROM tersangka LEFT JOIN alibi ON alibi.tersangka_id = tersangka.id WHERE alibi.saksi IS NOT NULL",
      ),
    ).toEqual([
      "SELECT",
      "FROM",
      "LEFT JOIN",
      "ON",
      "WHERE",
      "IS NOT NULL",
      "=",
    ]);
  });
});

describe("keywordChips", () => {
  it("menambah nama tabel dan kolom kasus setelah kata kunci", () => {
    const tables = parseTables(
      "CREATE TABLE perusahaan (id INTEGER, nama TEXT); CREATE TABLE pemilik (id INTEGER, nama_pemilik TEXT);",
    );
    expect(keywordChips(["SELECT", "FROM"], tables)).toEqual([
      "SELECT",
      "FROM",
      "perusahaan",
      "id",
      "nama",
      "pemilik",
      "nama_pemilik",
      ",",
    ]);
  });
});
