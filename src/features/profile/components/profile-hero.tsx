"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useStreak } from "@/features/progress/hooks";

type Badge = {
  key: string;
  title: string;
  description: string;
  earned: boolean;
  progress: string;
};

type Week = { date: string; minutes: number }[];

export type ProfileHeroData = {
  name: string;
  joinedAt: Date | string;
  classroom: { name: string } | null;
  xp: number;
  leagueTier: string;
  casesDone: number;
  minutesToday: number;
  dailyTarget: number;
  week: Week;
  badges: Badge[];
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function weekdayLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("id-ID", {
    weekday: "short",
    timeZone: "UTC",
  });
}

function joinedLabel(joinedAt: Date | string) {
  return new Date(joinedAt).toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-line bg-white px-3.5 py-3">
      <span className="flex items-center gap-1.5 font-display text-[22px] font-black">
        {icon}
        {value}
      </span>
      <span className="text-[13px] text-ink-soft">{label}</span>
    </div>
  );
}

export function ProfileHero({ data }: { data: ProfileHeroData }) {
  const streak = useStreak();
  const [openBadge, setOpenBadge] = useState<Badge | null>(null);
  const [weekOpen, setWeekOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const maxMinutes = Math.max(1, ...data.week.map((day) => day.minutes));

  return (
    <>
      <section
        aria-label="Ringkasan profil"
        className="anim-row-in flex items-center gap-3.5 rounded-2xl border-2 border-line bg-white p-4"
      >
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-ind font-display text-2xl font-black text-white">
          {initialsOf(data.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-[22px] font-black">
            {data.name}
          </span>
          <span className="block text-sm text-ink-soft">
            {data.classroom ? `Kelas ${data.classroom.name}, ` : ""}
            bergabung {joinedLabel(data.joinedAt)}
          </span>
        </span>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <StatCard
          value={String(streak.data?.streak ?? 0)}
          label="Hari beruntun"
          icon={
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="#F59E0B"
              aria-hidden="true"
            >
              <path d="M12 2c1 3.5 5 5.5 5 10.5A5 5 0 0 1 7 12.5c0-2 1-3.5 2-4.5.2 1.6 1 2.6 2 3-.6-3 .3-6 1-9z" />
            </svg>
          }
        />
        <StatCard value={data.xp.toLocaleString("id-ID")} label="Total XP" />
        <StatCard value={data.leagueTier} label="Liga sekarang" />
        <StatCard value={String(data.casesDone)} label="Kasus selesai" />
      </div>

      <h2 className="mt-6 mb-2.5 font-display text-lg font-black">Lencana</h2>
      <div className="grid grid-cols-3 gap-2">
        {data.badges.map((badge) => (
          <button
            key={badge.key}
            type="button"
            onClick={() => setOpenBadge(badge)}
            aria-label={`Lencana ${badge.title}, ${badge.earned ? "sudah didapat" : "belum didapat"}`}
            className="flex min-h-28 flex-col items-center gap-2 rounded-2xl border-2 border-line bg-white px-1.5 py-3 text-center"
          >
            <span
              className={`grid h-13 w-13 place-items-center rounded-full ${badge.earned ? "bg-[#F59E0B] text-white" : "bg-[#D9D6E8] text-[#6E6987]"}`}
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
              </svg>
            </span>
            <span className="text-[12.5px] leading-tight font-semibold">
              {badge.title}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border-2 border-line bg-white">
        <button
          type="button"
          aria-expanded={weekOpen}
          onClick={() => setWeekOpen((open) => !open)}
          className="flex min-h-13 w-full items-center justify-between px-3.5 text-[17px]"
        >
          Aktivitas minggu ini
          <span aria-hidden="true">{weekOpen ? "▴" : "▾"}</span>
        </button>
        {weekOpen ? (
          <div className="flex h-32 items-end gap-2 px-3.5 pb-3.5">
            {data.week.map((day) => (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="text-[11px] font-semibold text-ink-soft">
                  {day.minutes}
                </span>
                <span
                  className="w-full rounded-md bg-ind"
                  style={{
                    height: `${Math.max(4, (day.minutes / maxMinutes) * 72)}px`,
                  }}
                />
                <span className="text-[11px] text-ink-soft">
                  {weekdayLabel(day.date)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="h-px bg-line" />
        <button
          type="button"
          aria-expanded={goalOpen}
          onClick={() => setGoalOpen((open) => !open)}
          className="flex min-h-13 w-full items-center justify-between px-3.5 text-[17px]"
        >
          Target harian
          <span aria-hidden="true">{goalOpen ? "▴" : "▾"}</span>
        </button>
        {goalOpen ? (
          <p className="px-3.5 pb-3.5 text-[15px] leading-normal text-ink-soft">
            Lenteramu tetap menyala kalau kamu belajar {data.dailyTarget} menit
            sehari. Hari ini kamu sudah belajar {data.minutesToday} menit.
          </p>
        ) : null}
      </div>

      <BottomSheet
        open={openBadge !== null}
        onClose={() => setOpenBadge(null)}
        title={openBadge?.title ?? "Lencana"}
      >
        {openBadge ? (
          <div className="flex flex-col gap-2.5">
            <p className="text-[15px] leading-normal text-ink-soft">
              {openBadge.description}
            </p>
            <p
              className={`text-[15px] font-bold ${openBadge.earned ? "text-[#0E7490]" : "text-ink-soft"}`}
            >
              {openBadge.earned
                ? "Sudah didapat"
                : `Progres: ${openBadge.progress}`}
            </p>
          </div>
        ) : null}
      </BottomSheet>
    </>
  );
}
