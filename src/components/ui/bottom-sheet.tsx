"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

// Fokus pindah ke lembar saat dibuka dan kembali ke pemicunya saat ditutup,
// supaya pengguna keyboard tidak tersesat di halaman di belakang.
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const returnTo =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panel.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      returnTo?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-0 z-50 mx-auto max-w-[430px]">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="sheet-up absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[24px] bg-white px-4 pb-6 pt-3 shadow-[0_-8px_30px_rgba(30,27,58,0.18)] outline-none"
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-line"
        />
        <h2 id={titleId} className="mb-3 font-display text-xl font-black">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
