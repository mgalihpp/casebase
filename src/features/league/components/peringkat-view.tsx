"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useTRPC } from "@/trpc/client";

type Row = {
  rank: number;
  name: string;
  xp: number;
  isMe: boolean;
  zoneUp: boolean;
  zoneDown: boolean;
};

const AVATAR_COLORS = [
  "#4F46E5",
  "#0E7490",
  "#BE123C",
  "#7C3AED",
  "#0369A1",
  "#B45309",
  "#047857",
];

function avatarColor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PeringkatView() {
  const trpc = useTRPC();
  const [scope, setScope] = useState<"liga" | "kelas">("liga");
  const league = useQuery({
    ...trpc.league.board.queryOptions(),
    enabled: scope === "liga",
  });
  const klass = useQuery({
    ...trpc.league.classBoard.queryOptions(),
    enabled: scope === "kelas",
  });

  const active = scope === "liga" ? league : klass;
  const leagueData = league.data;
  const classData = klass.data;
  const rows: Row[] =
    scope === "liga" ? (leagueData?.board ?? []) : (classData?.board ?? []);
  const title =
    scope === "liga"
      ? `Liga ${leagueData?.tier ?? ""}`.trim()
      : (classData?.name ?? "Kelas");
  const subtitle =
    scope === "liga"
      ? "Peringkat minggu ini. Reset tiap Senin pukul 00.00 WIB."
      : "Papan kelas, urut dari total XP.";
  const me = scope === "liga" ? leagueData?.me : rows.find((r) => r.isMe);
  const notStarted = scope === "liga" && !!leagueData && (me?.xp ?? 0) === 0;

  return (
    <AppShell tab="peringkat" title="Peringkat">
      <h1 className="px-4 pt-2 font-display text-[34px] font-black leading-[41px]">
        Peringkat
      </h1>

      <div
        role="tablist"
        aria-label="Jenis peringkat"
        className="mx-4 mt-2.5 flex rounded-[10px] bg-[#76748C]/12 p-0.5"
      >
        {(["liga", "kelas"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={scope === s}
            type="button"
            onClick={() => setScope(s)}
            className="min-h-10 flex-1 rounded-lg font-body text-[15px] font-semibold"
            style={{
              background: scope === s ? "#fff" : "transparent",
              boxShadow: scope === s ? "0 1px 3px rgba(30,27,58,.15)" : "none",
            }}
          >
            {s === "liga" ? "Liga" : "Kelas"}
          </button>
        ))}
      </div>

      {active.isPending ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Memuat peringkat"
          className="mx-4 mt-4 grid gap-2"
        >
          <div className="h-[76px] animate-pulse rounded-2xl bg-line" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-line" />
          ))}
        </div>
      ) : null}

      {active.isError ? (
        <p role="alert" className="mx-4 mt-6 text-[15px] text-[#BE123C]">
          Peringkat gagal dimuat. Coba lagi sebentar.
        </p>
      ) : null}

      {scope === "liga" && leagueData && notStarted ? (
        <div className="fade-in mx-8 mt-10 text-center">
          <p className="mb-1.5 font-display text-xl font-extrabold">
            Liga belum dimulai buatmu
          </p>
          <p className="mb-5 text-[15px] leading-relaxed text-ink-soft">
            Tuntaskan satu misi minggu ini untuk bersaing dengan{" "}
            {Math.max(leagueData.total - 1, 0)} detektif lain di Liga{" "}
            {leagueData.tier}.
          </p>
          <Link href="/belajar" className="btn-primary">
            Mulai misi
          </Link>
        </div>
      ) : null}

      {rows.length > 0 && !(scope === "liga" && notStarted) ? (
        <>
          <div className="mx-4 mt-3.5 flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
            <svg viewBox="0 0 24 26" width="44" height="48" aria-hidden="true">
              <path
                d="M12 1.5l9 3.4v6.6c0 6-3.9 10.3-9 12.5-5.1-2.2-9-6.5-9-12.5V4.9z"
                fill="#4F46E5"
              />
              <path
                d="M12 8.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z"
                fill="#fff"
              />
            </svg>
            <div className="flex-1">
              <p className="font-display text-xl font-black">{title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>
            </div>
          </div>

          <ol aria-label="Daftar peringkat" className="mx-4 mt-3 list-none p-0">
            {rows.map((row, i) => (
              <li key={`${row.rank}-${row.name}`}>
                {row.zoneDown && !rows[i - 1]?.zoneDown ? (
                  <ZoneLine label="Zona turun liga" color="#E11D48" />
                ) : null}
                <div
                  className={`row-in flex min-h-14 items-center gap-3 rounded-[14px] px-2.5 ${row.isMe ? "bg-ind-soft" : ""}`}
                  style={{ animationDelay: `${(row.rank - 1) * 0.035}s` }}
                >
                  <span
                    className="w-6 text-center font-display text-base font-black"
                    style={{ color: row.rank <= 3 ? "#B45309" : "#5C5878" }}
                  >
                    {row.rank}
                  </span>
                  <span
                    className="grid h-10 w-10 flex-none place-items-center rounded-full font-body text-sm font-extrabold text-white"
                    style={{
                      background: row.isMe ? "#4F46E5" : avatarColor(row.name),
                    }}
                  >
                    {row.isMe ? "ST" : initials(row.name)}
                  </span>
                  <span
                    className="flex-1 truncate font-body text-base font-semibold"
                    style={{ color: row.isMe ? "#3730A3" : "#1E1B3A" }}
                  >
                    {row.isMe ? "Kamu" : row.name}
                  </span>
                  <span className="font-body text-[15px] font-semibold tabular-nums text-ink-soft">
                    {row.xp.toLocaleString("id-ID")} XP
                  </span>
                </div>
                {row.zoneUp && !rows[i + 1]?.zoneUp ? (
                  <ZoneLine label="Zona naik liga" color="#0E7490" />
                ) : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </AppShell>
  );
}

function ZoneLine({ label, color }: { label: string; color: string }) {
  return (
    <div
      aria-hidden="true"
      className="my-2.5 flex items-center gap-2 px-1 font-body text-[11.5px] font-bold"
      style={{ color }}
    >
      <span className="h-px flex-1 bg-current opacity-40" />
      {label}
      <span className="h-px flex-1 bg-current opacity-40" />
    </div>
  );
}
