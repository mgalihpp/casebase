"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { highlight } from "@/features/mission/highlight";
import { useTRPC } from "@/trpc/client";

const COURSE_COLOR: Record<string, string> = { sql: "#00758F" };

function updatedLabel(value: Date | string | null) {
  if (!value) return "belum pernah";
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "hari ini";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function BerkasDetailView({ caseId }: { caseId: string }) {
  const trpc = useTRPC();
  const file = useQuery(trpc.caseFile.get.queryOptions({ caseId }));
  const [open, setOpen] = useState({
    story: true,
    evidence: false,
    query: false,
    suspects: false,
  });
  const toggle = (key: keyof typeof open) =>
    setOpen((state) => ({ ...state, [key]: !state[key] }));

  const data = file.data;
  const pct =
    data && data.totalNodes > 0
      ? Math.round((data.doneCount / data.totalNodes) * 100)
      : 0;
  const complete =
    !!data && data.totalNodes > 0 && data.doneCount >= data.totalNodes;
  const status = data?.archived ? "diarsipkan" : complete ? "selesai" : "aktif";

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
          <p
            className="mx-4 mt-2 flex items-center gap-1.5 font-body text-[13px] font-semibold"
            style={{ color: COURSE_COLOR[data.course] ?? "#00758F" }}
          >
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: COURSE_COLOR[data.course] ?? "#00758F" }}
            />
            {data.courseLabel}
          </p>
          <h1 className="px-4 font-display text-[30px] font-black leading-9">
            {data.title}
          </h1>
          <div className="mx-4 mt-2.5">
            <div className="h-2.5 overflow-hidden rounded-full bg-[#D9D6E8]">
              <div
                className="h-full rounded-full bg-[#0E7490]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">
              {data.doneCount}/{data.totalNodes} misi, {status}, diperbarui{" "}
              {updatedLabel(data.updatedAt)}
            </p>
          </div>

          <div className="mx-4 mt-4 overflow-hidden rounded-2xl border-2 border-line bg-white">
            <AccordionRow
              label="Cerita kasus"
              count=""
              open={open.story}
              onToggle={() => toggle("story")}
            >
              <p className="text-[15px] leading-[1.55] text-[#3F3B5C]">
                {data.story}
              </p>
            </AccordionRow>
            <Separator />
            <AccordionRow
              label="Bukti terkumpul"
              count={String((data.bukti ?? []).length)}
              open={open.evidence}
              onToggle={() => toggle("evidence")}
            >
              <ul className="m-0 list-none p-0">
                {(data.bukti ?? []).map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 py-[7px] text-[15px] leading-snug text-[#3F3B5C]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="#0E7490"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ flex: "none", marginTop: 2 }}
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </AccordionRow>
            <Separator />
            <AccordionRow
              label="Query terakhir"
              count=""
              open={open.query}
              onToggle={() => toggle("query")}
            >
              {data.lastQuery ? (
                <div className="rounded-[14px] border-[1.5px] border-line bg-[#FCFCFF] py-2.5 font-mono text-sm leading-[1.65] text-ink">
                  {highlight(data.lastQuery).map((tokens, lineIndex) => (
                    <div key={lineIndex} className="flex">
                      <span
                        aria-hidden="true"
                        className="w-[34px] flex-none pr-3 text-right text-[#B5B1CC]"
                      >
                        {lineIndex + 1}
                      </span>
                      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pr-3">
                        {tokens.map((token, tokenIndex) => (
                          <span
                            key={tokenIndex}
                            style={{
                              color: token.c,
                              fontWeight: Number(token.w),
                            }}
                          >
                            {token.t}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-ink-soft">
                  Belum ada query yang ditulis di kasus ini.
                </p>
              )}
            </AccordionRow>
            <Separator />
            <AccordionRow
              label="Tersangka"
              count={String((data.tersangka ?? []).length)}
              open={open.suspects}
              onToggle={() => toggle("suspects")}
            >
              <ul className="m-0 list-none p-0">
                {(data.tersangka ?? []).map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 py-[7px] text-[15px] leading-snug text-[#3F3B5C]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="#0E7490"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ flex: "none", marginTop: 2 }}
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </AccordionRow>
          </div>

          <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[430px] bg-gradient-to-b from-app/0 via-app to-app px-4 pb-[88px] pt-4">
            <Link href={`/belajar/${data.course}`} className="btn-primary">
              {complete ? "Ulangi kasus" : "Lanjutkan misi"}
            </Link>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}

function Separator() {
  return <div className="ml-3.5 h-[0.5px] bg-line" />;
}

function AccordionRow({
  label,
  count,
  open,
  onToggle,
  children,
}: {
  label: string;
  count: string;
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
        className="flex min-h-[52px] w-full items-center justify-between bg-white px-3.5 font-body text-base font-semibold"
      >
        {label}
        <span className="inline-flex items-center gap-1.5 font-normal text-ink-soft">
          {count}
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform .25s",
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {open ? <div className="fade-in px-3.5 pb-3.5">{children}</div> : null}
    </div>
  );
}
