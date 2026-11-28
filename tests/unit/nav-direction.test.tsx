// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { markBackNavigation, useEnterClass } from "@/lib/nav-direction";

beforeEach(() => {
  sessionStorage.clear();
});

describe("useEnterClass", () => {
  it("memakai kelas maju secara default jika tidak ada navigasi mundur", () => {
    const { result } = renderHook(() =>
      useEnterClass("slide-back", "slide-forward"),
    );
    expect(result.current).toBe("slide-forward");
  });

  it("kelas kosong jika forwardClass tidak diberikan", () => {
    const { result } = renderHook(() => useEnterClass("slide-back"));
    expect(result.current).toBe("");
  });

  it("memakai kelas mundur setelah markBackNavigation", () => {
    markBackNavigation();
    const { result } = renderHook(() =>
      useEnterClass("slide-back", "slide-forward"),
    );
    expect(result.current).toBe("slide-back");
  });

  it("menghapus penanda setelah dibaca, sehingga navigasi berikutnya maju", () => {
    markBackNavigation();
    renderHook(() => useEnterClass("slide-back", "slide-forward"));
    expect(sessionStorage.getItem("nav-direction")).toBeNull();

    const { result } = renderHook(() =>
      useEnterClass("slide-back", "slide-forward"),
    );
    expect(result.current).toBe("slide-forward");
  });

  it("markBackNavigation menyimpan penanda 'back' di sessionStorage", () => {
    markBackNavigation();
    expect(sessionStorage.getItem("nav-direction")).toBe("back");
  });

  it("memperbarui kelas ketika backClass berubah", () => {
    markBackNavigation();
    const { result, rerender } = renderHook(
      ({ back }) => useEnterClass(back, "maju"),
      { initialProps: { back: "mundur-a" } },
    );
    expect(result.current).toBe("mundur-a");
    act(() => {
      markBackNavigation();
    });
    rerender({ back: "mundur-b" });
    expect(result.current).toBe("mundur-b");
  });
});
