import { describe, expect, it } from "vitest";
import { highlight } from "@/features/mission/highlight";

const KEYWORD = { c: "#4F46E5", w: "700" };
const STRING = "#0E7490";
const COMMENT = "#8B87A3";
const NUMBER = "#7C3AED";
const PUNCT = "#5C5878";

const joined = (code: string) =>
  highlight(code)
    .map((line) => line.map((t) => t.t).join(""))
    .join("\n");

describe("highlight", () => {
  it("setiap baris menjadi daftar token yang teksnya utuh", () => {
    const samples = [
      "SELECT nama FROM pelanggan WHERE id = 1;",
      "SELECT 'a b', \"kolom\" -- catatan",
      "  ORDER BY x DESC",
      "",
    ];
    for (const sample of samples) {
      expect(joined(sample)).toBe(sample);
    }
  });

  it("memisahkan setiap baris pada newline", () => {
    expect(highlight("SELECT 1\nFROM t")).toHaveLength(2);
  });

  it("memberi warna kata kunci SQL tanpa peduli huruf besar-kecil", () => {
    const [line] = highlight("select");
    expect(line[0]).toMatchObject({ t: "select", ...KEYWORD });
  });

  it("memberi warna string dengan kutip tunggal dan ganda", () => {
    const [line] = highlight("'teks' \"id\"");
    const strings = line.filter((t) => t.c === STRING).map((t) => t.t);
    expect(strings).toEqual(["'teks'", '"id"']);
  });

  it("memberi warna komentar sampai akhir baris", () => {
    const [line] = highlight("x -- catatan panjang");
    const comment = line.find((t) => t.t.startsWith("--"));
    expect(comment).toMatchObject({ t: "-- catatan panjang", c: COMMENT });
  });

  it("memberi warna angka dan tanda baca", () => {
    const [line] = highlight("f(12, 3);");
    expect(line.find((t) => t.t === "12")?.c).toBe(NUMBER);
    expect(line.find((t) => t.t === "(")?.c).toBe(PUNCT);
    // ")" dan ";" sama-sama tanda baca, jadi tergabung dalam satu token.
    expect(line.find((t) => t.t.includes(";"))?.c).toBe(PUNCT);
  });

  it("menggabungkan token berurutan yang punya warna dan bobot sama", () => {
    const [line] = highlight("abc def");
    // Spasi dan identifier sama-sama warna default, jadi jadi satu token.
    expect(line).toHaveLength(1);
    expect(line[0].t).toBe("abc def");
  });

  it("identifier yang mengandung titik tetap satu token", () => {
    const [line] = highlight("pelanggan.nama");
    expect(line.map((t) => t.t)).toEqual(["pelanggan.nama"]);
  });

  it("kata kunci di dalam identifier tidak diberi warna kata kunci", () => {
    const [line] = highlight("selectionx");
    expect(line[0].c).not.toBe(KEYWORD.c);
  });

  it("baris kosong menghasilkan daftar token kosong", () => {
    expect(highlight("")).toEqual([[]]);
  });
});
