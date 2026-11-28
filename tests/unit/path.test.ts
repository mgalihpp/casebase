import { describe, expect, it } from "vitest";
import { computeNodeStatuses } from "@/features/course/path";
import type { CaseNode } from "@/features/course/schemas";

const mission = (key: string): CaseNode => ({ key, type: "mission" });
const chest = (key: string): CaseNode => ({ key, type: "chest" });
const boss = (key: string): CaseNode => ({ key, type: "boss" });

describe("computeNodeStatuses", () => {
  it("node pertama menjadi current jika belum ada yang selesai", () => {
    const nodes = [mission("a"), mission("b")];
    const statuses = computeNodeStatuses(nodes, new Set(), new Set());
    expect(statuses.get("a")).toBe("current");
    expect(statuses.get("b")).toBe("locked");
  });

  it("node yang sudah selesai berstatus done dan node berikutnya menjadi current", () => {
    const nodes = [mission("a"), mission("b"), mission("c")];
    const statuses = computeNodeStatuses(nodes, new Set(["a"]), new Set());
    expect(statuses.get("a")).toBe("done");
    expect(statuses.get("b")).toBe("current");
    expect(statuses.get("c")).toBe("locked");
  });

  it("node aktif yang pernah gagal berstatus retry", () => {
    const nodes = [mission("a"), mission("b")];
    const statuses = computeNodeStatuses(nodes, new Set(["a"]), new Set(["b"]));
    expect(statuses.get("b")).toBe("retry");
  });

  it("kotak bukti (chest) ikut selesai ketika node sebelumnya selesai", () => {
    const nodes = [mission("a"), chest("box"), mission("b")];
    const statuses = computeNodeStatuses(nodes, new Set(["a"]), new Set());
    expect(statuses.get("box")).toBe("done");
    expect(statuses.get("b")).toBe("current");
  });

  it("kotak bukti di awal tetap selesai karena tidak ada node sebelumnya", () => {
    const nodes = [chest("box"), mission("a")];
    const statuses = computeNodeStatuses(nodes, new Set(), new Set());
    expect(statuses.get("box")).toBe("done");
    expect(statuses.get("a")).toBe("current");
  });

  it("kotak bukti tidak selesai jika node sebelumnya belum selesai", () => {
    const nodes = [mission("a"), chest("box")];
    const statuses = computeNodeStatuses(nodes, new Set(), new Set());
    expect(statuses.get("box")).toBe("locked");
  });

  it("hanya satu node yang bisa aktif pada satu waktu", () => {
    const nodes = [mission("a"), mission("b"), mission("c")];
    const statuses = computeNodeStatuses(nodes, new Set(), new Set(["a", "b"]));
    const active = [...statuses.values()].filter(
      (s) => s === "current" || s === "retry",
    );
    expect(active).toHaveLength(1);
    expect(statuses.get("a")).toBe("retry");
    expect(statuses.get("b")).toBe("locked");
  });

  it("boss ikut alur seperti misi biasa", () => {
    const nodes = [mission("a"), boss("final")];
    const statuses = computeNodeStatuses(nodes, new Set(["a"]), new Set());
    expect(statuses.get("final")).toBe("current");
  });

  it("daftar kosong menghasilkan map kosong", () => {
    expect(computeNodeStatuses([], new Set(), new Set()).size).toBe(0);
  });

  it("semua node selesai berstatus done", () => {
    const nodes = [mission("a"), mission("b")];
    const statuses = computeNodeStatuses(nodes, new Set(["a", "b"]), new Set());
    expect([...statuses.values()]).toEqual(["done", "done"]);
  });
});
