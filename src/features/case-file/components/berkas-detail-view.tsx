"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useTRPC } from "@/trpc/client";

export function BerkasDetailView({ caseId }: { caseId: string }) {
  const trpc = useTRPC();
  const file = useQuery(trpc.caseFile.get.queryOptions({ caseId }));
  const [storyOpen, setStoryOpen] = useState(true);
  const [queryOpen, setQueryOpen] = useState(true);

  const nav = (
    <Link
      href="/berkas"
      aria-label="Kembali ke Berkas"
      className="grid min-h-11 min-w-11 place-items-center text-ink"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
    </Link>
  );

  const data = file.data;
  const pct =
    data && data.totalNodes > 0
      ? Math.round((data.doneCount / data.totalNodes) * 100)
      : 0;

  return (
    <AppShell
      tab="berkas"
      title={data?.title ?? "Berkas"}
      nav={nav}
      showNav={false}
    >
      {file.isPending ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Memuat berkas"
          className="grid gap-2.5 px-4 pt-6"
        >
          <div className="h-[52px] animate-pulse rounded-[14px] bg-line" />
          <div className="h-24 animate-pulse rounded-[14px] bg-line" />
        </div>
      ) : null}

      {file.isError ? (
        <p role="alert" className="mx-4 mt-6 text-[15px] text-[#BE123C]">
          Berkas gagal dimuat. Coba lagi sebentar.
        </p>
      ) : null}

      {data ? (
        <>
          <p className="mx-4 mt-2 flex items-center gap-1.5 font-body text-[13px] font-semibold text-[#00758F]">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-[#00758F]" />
            {data.courseLabel}
          </p>
          <h1 className="px-4 font-display text-[30px] font-black leading-9">
            {data.title}
          </h1>
          <div className="mx-4 mt-2.5">
            <div className="h-2.5 overflow-hidden rounded-full bg-lock">
              <div
                className="h-full rounded-full bg-[#0E7490]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">
              {data.doneCount}/{data.totalNodes} misi,{" "}
              {data.archived
                ? "diarsipkan"
                : data.doneCount === data.totalNodes
                  ? "selesai"
                  : "aktif"}
            </p>
          </div>

          <div className="mx-4 mt-4 overflow-hidden rounded-2xl border border-line bg-white">
            <Accordion
              label="Cerita kasus"
              open={storyOpen}
              onToggle={() => setStoryOpen((v) => !v)}
            >
              <p className="text-[15px] leading-relaxed text-[#3F3B5C]">
                {data.story}
              </p>
            </Accordion>
            <div className="h-px bg-line" />
            <Accordion
              label="Query terakhir"
              open={queryOpen}
              onToggle={() => setQueryOpen((v) => !v)}
            >
              {data.lastQuery ? (
                <pre className="whitespace-pre-wrap rounded-[14px] border-[1.5px] border-line bg-[#FCFCFF] p-3 font-mono text-sm leading-relaxed">
                  {data.lastQuery}
                </pre>
              ) : (
                <p className="text-[15px] text-ink-soft">
                  Belum ada query yang ditulis di kasus ini.
                </p>
              )}
            </Accordion>
          </div>

          <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[430px] bg-gradient-to-b from-app/0 via-app to-app px-4 pb-[88px] pt-4">
            <Link href="/belajar" className="btn-primary">
              {data.doneCount === data.totalNodes && data.totalNodes > 0
                ? "Ulangi kasus"
                : "Lanjutkan misi"}
            </Link>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}

function Accordion({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-[52px] w-full items-center justify-between px-3.5 font-body text-base font-semibold"
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 text-ink-soft transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open ? <div className="fade-in px-3.5 pb-3.5">{children}</div> : null}
    </div>
  );
}
