"use client";

import type { ReactNode } from "react";

/** Lembar bawah dari desain: redup di belakang, panel naik dari bawah, dengan grip dan tombol tutup. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div
        className="fade-in fixed inset-0 z-30 bg-[#141228]/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-up fixed inset-x-0 bottom-0 z-40 mx-auto max-h-[88dvh] max-w-[430px] overflow-y-auto rounded-t-3xl bg-white px-5 pb-6 pt-2 shadow-[0_-8px_30px_rgba(30,27,58,.18)]"
      >
        <div
          className="mx-auto mb-1.5 h-[5px] w-9 rounded-full bg-line"
          aria-hidden="true"
        />
        <div className="flex min-h-11 items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-8 w-8 place-items-center rounded-full bg-ind-soft text-ink-soft"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
