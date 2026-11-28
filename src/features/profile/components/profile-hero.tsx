"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
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

const STAR =
  "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z";
const FLAME =
  "M12 2c1 3.5 5 5.5 5 10.5A5 5 0 0 1 7 12.5c0-2 1-3.5 2-4.5.2 1.6 1 2.6 2 3-.6-3 .3-6 1-9z";

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

function Chevron({ open }: { open: boolean }) {
  return (
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
      className="flex-none transition-transform duration-[250ms]"
      style={{ transform: open ? "rotate(180deg)" : "none" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ProfileSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Memuat profil">
      <div className="mt-3 flex items-center gap-3.5 rounded-2xl border border-line bg-white p-4">
        <span className="anim-skeleton h-16 w-16 flex-none rounded-[20px]" />
        <span className="grid flex-1 gap-2">
          <span className="anim-skeleton h-[18px] w-1/2 rounded-md" />
          <span className="anim-skeleton h-3 w-3/4 rounded-md" />
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <span className="anim-skeleton h-[68px] rounded-2xl" />
        <span className="anim-skeleton h-[68px] rounded-2xl" />
        <span className="anim-skeleton h-[68px] rounded-2xl" />
        <span className="anim-skeleton h-[68px] rounded-2xl" />
      </div>
      <span className="anim-skeleton mt-6 mb-2.5 block h-5 w-[110px] rounded-md" />
      <div className="grid grid-cols-3 gap-2">
        <span className="anim-skeleton h-28 rounded-2xl" />
        <span className="anim-skeleton h-28 rounded-2xl" />
        <span className="anim-skeleton h-28 rounded-2xl" />
      </div>
    </div>
  );
}

export function ProfileHero({
  data,
  onSignOut,
}: {
  data: ProfileHeroData;
  onSignOut: () => void;
}) {
  const streak = useStreak();
  const [openBadge, setOpenBadge] = useState<Badge | null>(null);
  const [weekOpen, setWeekOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const maxMinutes = Math.max(40, ...data.week.map((day) => day.minutes));

  useEffect(() => {
    if (!tipOpen) return;
    const timer = setTimeout(() => setTipOpen(false), 3000);
    return () => clearTimeout(timer);
  }, [tipOpen]);

  return (
    <>
      <section
        aria-label="Ringkasan profil"
        className="mt-3 flex items-center gap-3.5 rounded-2xl border border-line bg-white p-4"
      >
        <span className="grid h-16 w-16 flex-none place-items-center rounded-[20px] bg-ind font-display text-2xl font-black text-white">
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
              width="22"
              height="22"
              fill="#F59E0B"
              aria-hidden="true"
            >
              <path d={FLAME} />
            </svg>
          }
        />
        <StatCard value={data.xp.toLocaleString("id-ID")} label="Total XP" />
        <StatCard value={data.leagueTier} label="Liga sekarang" />
        <StatCard value={String(data.casesDone)} label="Kasus selesai" />
      </div>

      <h2 className="mt-6 mb-2 font-display text-[20px] font-extrabold">
        Lencana
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {data.badges.map((badge, index) => (
          <button
            key={badge.key}
            type="button"
            onClick={() => setOpenBadge(badge)}
            aria-label={`Lencana ${badge.title}, ${badge.earned ? "sudah didapat" : "belum didapat"}`}
            className="nodein flex min-h-28 flex-col items-center gap-2 rounded-2xl border border-line bg-white px-1.5 py-3 text-center"
            style={{ animationDelay: `${(index * 0.06).toFixed(2)}s` }}
          >
            <span
              className="grid h-[52px] w-[52px] place-items-center rounded-full"
              style={{
                background: badge.earned ? "#F59E0B" : "#D9D6E8",
                color: badge.earned ? "#fff" : "#6E6987",
                boxShadow: `0 4px 0 ${badge.earned ? "#B45309" : "#BDB8D3"}`,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={STAR} />
              </svg>
            </span>
            <span className="font-body text-[12.5px] leading-[1.25] font-semibold">
              {badge.title}
            </span>
          </button>
        ))}
      </div>

      <h2 className="mt-6 mb-2 font-display text-[20px] font-extrabold">
        Lainnya
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <button
          type="button"
          aria-expanded={weekOpen}
          onClick={() => setWeekOpen((open) => !open)}
          className="flex min-h-[52px] w-full items-center justify-between bg-white px-3.5 font-body text-[17px]"
        >
          Aktivitas minggu ini
          <span className="text-ink-soft">
            <Chevron open={weekOpen} />
          </span>
        </button>
        {weekOpen ? (
          <div className="anim-fade-in flex h-[120px] items-end gap-2 px-3.5 pt-1 pb-3.5">
            {data.week.map((day, index) => (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="font-body text-[11px] font-semibold text-ink-soft">
                  {day.minutes}
                </span>
                <span
                  className="w-full rounded-md"
                  style={{
                    height: `${Math.round((day.minutes / maxMinutes) * 64)}px`,
                    background:
                      index === data.week.length - 1 ? "#4F46E5" : "#C7C4F4",
                  }}
                />
                <span className="font-body text-xs font-semibold text-ink-soft">
                  {weekdayLabel(day.date)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="ml-3.5 h-[0.5px] bg-line" />
        <button
          type="button"
          aria-expanded={goalOpen}
          onClick={() => setGoalOpen((open) => !open)}
          className="flex min-h-[52px] w-full items-center justify-between bg-white px-3.5 font-body text-[17px]"
        >
          Target harian
          <span className="inline-flex items-center gap-1.5 text-ink-soft">
            {data.dailyTarget} menit
            <Chevron open={goalOpen} />
          </span>
        </button>
        {goalOpen ? (
          <p className="anim-fade-in px-3.5 pb-3.5 text-[15px] leading-normal text-ink-soft">
            Lenteramu tetap menyala kalau kamu belajar {data.dailyTarget} menit
            sehari. Hari ini kamu sudah belajar {data.minutesToday} menit.
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setTipOpen(true)}
        className="mt-4 flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-2.5 text-left"
      >
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-ind-soft text-ind">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="6" y="2.5" width="12" height="19" rx="3" />
            <path d="M12 7v7M9 11l3 3 3-3" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block font-body text-base font-bold">
            Pasang di layar utama
          </span>
          <span className="block text-[13.5px] text-ink-soft">
            Buka SQL Quest seperti aplikasi, tanpa unduh dari toko aplikasi.
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => setLogoutOpen(true)}
        className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-line bg-white font-body text-[17px] font-semibold text-bad"
      >
        Keluar dari akun
      </button>

      {tipOpen ? (
        <p
          role="status"
          className="anim-fade-in fixed inset-x-4 top-4 z-50 mx-auto max-w-[398px] rounded-2xl bg-ink px-4 py-3 text-[15px] font-semibold text-white"
        >
          Buka menu browser, lalu pilih Tambahkan ke layar utama.
        </p>
      ) : null}

      <BottomSheet
        open={openBadge !== null}
        onClose={() => setOpenBadge(null)}
        title={openBadge?.title ?? "Lencana"}
      >
        {openBadge ? (
          <div className="flex flex-col items-center gap-2.5 text-center">
            <span
              className="grid h-[84px] w-[84px] place-items-center rounded-full"
              style={{
                background: openBadge.earned ? "#F59E0B" : "#D9D6E8",
                color: openBadge.earned ? "#fff" : "#6E6987",
                boxShadow: `0 5px 0 ${openBadge.earned ? "#B45309" : "#BDB8D3"}`,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="38"
                height="38"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={STAR} />
              </svg>
            </span>
            <p className="text-base leading-normal">{openBadge.description}</p>
            <p
              className={`text-sm font-bold ${openBadge.earned ? "text-ok" : "text-ink-soft"}`}
            >
              {openBadge.earned
                ? "Sudah didapat"
                : `Progres: ${openBadge.progress}`}
            </p>
            <div className="mt-[18px] w-full">
              <button
                type="button"
                className={buttonPrimary}
                onClick={() => setOpenBadge(null)}
              >
                Oke
              </button>
            </div>
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Keluar dari akun?"
      >
        <p className="mb-4 text-base leading-normal text-ink-soft">
          Progresmu aman tersimpan di akun. Masuk lagi kapan saja untuk
          melanjutkan.
        </p>
        <div className="grid gap-3">
          <button
            type="button"
            className={buttonSecondary}
            onClick={() => setLogoutOpen(false)}
          >
            Batal
          </button>
          <button
            type="button"
            className="min-h-12 w-full font-body text-[17px] font-bold text-bad"
            onClick={onSignOut}
          >
            Keluar
          </button>
        </div>
      </BottomSheet>
    </>
  );
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
    <div className="rounded-2xl border border-line bg-white px-3.5 py-3">
      <span className="flex items-center gap-1.5 font-display text-[22px] font-black">
        {icon}
        {value}
      </span>
      <span className="block text-[13px] text-ink-soft">{label}</span>
    </div>
  );
}
