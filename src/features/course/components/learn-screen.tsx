"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Mascot, type MascotMood } from "@/components/ui/mascot";
import { buttonPrimary, pageClass } from "@/components/ui/styles";
import { findCourse } from "@/features/course/data";
import {
  useCourseList,
  useCoursePath,
  useOpenChest,
} from "@/features/course/hooks";
import { useStreak } from "@/features/progress/hooks";

type Props = { courseId: string };

// Pola geser node dari peta misi di desain (zig-zag).
const OFFSETS = [0, -48, 0, 48, 0, -48];
const STEP_HEIGHT = 44;
const WEEK_LABELS = ["S", "S", "R", "K", "J", "S", "M"];

type IconProps = { size: number; stroke?: number };
type PathNode = NonNullable<
  ReturnType<typeof useCoursePath>["data"]
>["nodes"][number];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function CheckIcon({ size, stroke = 3 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function StarIcon({ size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    </svg>
  );
}

function FlameIcon({ size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.5c.8 3.4 5 5.6 5 10.5a5 5 0 0 1-10 0c0-2.1.9-3.6 2-4.7.2 1.6.9 2.6 1.9 3.1C10.6 8.2 10.9 5.2 12 2.5z" />
    </svg>
  );
}

function HeartIcon({ size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
    </svg>
  );
}

function SearchIcon({ size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.8}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </svg>
  );
}

function LockIcon({ size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ChestIcon({ size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="8" width="18" height="5" rx="1" />
      <path d="M5 13v7h14v-7M12 8v12M12 8c-2-4-6-4-6-1.5S12 8 12 8s6 1 6-1.5S14 4 12 8" />
    </svg>
  );
}

function ChevronIcon({ size, open }: { size: number; open?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform duration-200"
      style={{ transform: open ? "rotate(180deg)" : undefined }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function PlayIcon({ size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 4.5v15l12-7.5z" />
    </svg>
  );
}

// Tiga jejak kaki di antara dua node. Warna mengikuti seberapa jauh jalur sudah ditempuh.
function Footprints({
  from,
  to,
  stepIndex,
  state,
  duration,
}: {
  from: number;
  to: number;
  stepIndex: number;
  state: "walked" | "walking" | "ahead";
  duration: string;
}) {
  const dx = to - from;
  const len = Math.hypot(dx, STEP_HEIGHT);
  const rotation = Math.round((Math.atan2(dx, -STEP_HEIGHT) * 180) / Math.PI);
  const color =
    state === "walked"
      ? "#0E7490"
      : state === "walking"
        ? "#4F46E5"
        : "#C9C5DD";

  return (
    <div aria-hidden="true" className="relative h-11 w-full">
      {[0.18, 0.5, 0.82].map((t, j) => {
        const side = j % 2 ? 1 : -1;
        const x = Math.round(from + dx * t + (-STEP_HEIGHT / len) * side * 6);
        const y = Math.round(STEP_HEIGHT * t);
        const animated = state !== "ahead";
        return (
          <svg
            key={t}
            aria-hidden="true"
            viewBox="0 0 12 24"
            width={8}
            height={16}
            className={animated ? "foot-step" : undefined}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: y,
              transform: `translate(-50%,-50%) rotate(${rotation}deg)`,
              color,
              opacity: animated ? 0.3 : 1,
              animationDelay: `${((stepIndex * 3 + j) * 0.16).toFixed(2)}s`,
              animationDuration: duration,
            }}
          >
            <path
              d="M6 1c3 0 4.5 4 4.5 8.5S9 16 6 16 1.5 13.5 1.5 9 3 1 6 1z"
              fill="currentColor"
            />
            <ellipse cx="6" cy="20.5" rx="3.4" ry="2.8" fill="currentColor" />
          </svg>
        );
      })}
    </div>
  );
}

export function LearnScreen({ courseId }: Props) {
  const { data, isPending, error, refetch } = useCoursePath(courseId);
  const courses = useCourseList();
  const streak = useStreak();
  const hearts = streak.data?.hearts ?? 5;
  const openChest = useOpenChest();
  const meta = findCourse(courseId);
  const [caseOpen, setCaseOpen] = useState(false);
  const [mood, setMood] = useState<MascotMood>("idle");
  const [tip, setTip] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pokeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [scrollY, setScrollY] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(pokeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(id);
  }, [notice]);

  if (error) {
    return (
      <main
        className={`${pageClass} anim-tab-in items-center pt-24 text-center`}
      >
        {meta ? <Mascot name={meta.abbr} size={124} mood="shock" /> : null}
        <h1 className="mt-3 font-display text-[22px] font-black leading-tight">
          Ups, peta kasus gagal dimuat
        </h1>
        <p className="mt-2 max-w-[300px] text-[15px] leading-normal text-ink-soft">
          Server kami sedang sibuk. Tenang, progresmu tetap aman. Coba lagi
          sebentar.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className={`${buttonPrimary} mt-6`}
        >
          Coba lagi
        </button>
        {error.data?.httpStatus ? (
          <p className="mt-3 font-mono text-xs text-ink-soft">
            Kode galat {error.data.httpStatus}
          </p>
        ) : null}
      </main>
    );
  }

  if (isPending || !meta) {
    return (
      <main
        className={pageClass}
        aria-busy="true"
        aria-label="Memuat peta kasus"
      >
        <div className="h-14" aria-hidden="true" />
        <div className="h-10 w-40 anim-skeleton rounded-xl" />
        <div className="mt-4 h-32 anim-skeleton rounded-[20px]" />
        <div className="flex flex-col items-center gap-10 pt-12">
          {(["a", "b", "c", "d", "e"] as const).map((id, i) => (
            <div
              key={id}
              className="h-[66px] w-[72px] anim-skeleton rounded-full"
              style={{ transform: `translateX(${OFFSETS[i]}px)` }}
            />
          ))}
        </div>
      </main>
    );
  }

  const streakCount = streak.data?.streak ?? 0;
  const titleOpacity = clamp((scrollY - 30) / 16, 0, 1);
  const scrolled = scrollY > 20;

  const nav = (
    <header
      className={`fixed inset-x-0 top-0 z-20 mx-auto flex h-14 max-w-[430px] items-center px-2 backdrop-blur-xl ${scrolled ? "border-b border-ink/15 bg-app/90" : "bg-app/70"}`}
    >
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Ganti kursus, sekarang ${meta.name}`}
        className="flex min-h-11 items-center gap-2 rounded-full pl-1.5 pr-2 font-body text-base font-bold"
      >
        <span
          className="grid h-8 w-8 place-items-end justify-center overflow-hidden rounded-[10px]"
          style={{ background: `${meta.color}1F` }}
        >
          <Mascot name={meta.abbr} size={34} />
        </span>
        <span className="max-w-[120px] truncate">{meta.name}</span>
        <ChevronIcon size={18} />
      </button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-display text-[17px] font-extrabold"
        style={{ opacity: titleOpacity }}
      >
        Belajar
      </span>
      <button
        type="button"
        onClick={() => setStreakOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Status harian: ${streakCount} hari beruntun, ${hearts} nyawa`}
        className="ml-auto flex min-h-11 items-center gap-2.5 font-display text-base font-extrabold"
      >
        <span className="flex items-center gap-[3px] text-[#B45309]">
          <FlameIcon size={18} />
          {streakCount}
        </span>
        <span className="flex items-center gap-[3px] text-[#BE123C]">
          <HeartIcon size={18} />
          {hearts}
        </span>
      </button>
    </header>
  );

  const pct = data?.total ? Math.round((data.done / data.total) * 100) : 0;

  const sheets = (
    <>
      <BottomSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Pilih kursus"
      >
        <p className="mb-3 text-[15px] text-ink-soft">
          Progres tiap kursus disimpan terpisah, jadi kamu bisa pindah kapan
          saja.
        </p>
        {courses.isPending ? (
          <p className="text-ink-soft">Memuat kursus…</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(courses.data ?? []).map((item) => {
              const isCurrent = item.id === courseId;
              return (
                <li key={item.id}>
                  <Link
                    href={`/belajar/${item.id}`}
                    aria-current={isCurrent ? "page" : undefined}
                    onClick={() => setPickerOpen(false)}
                    className={`flex min-h-[72px] items-center gap-3 rounded-2xl border-2 py-2 pl-2 pr-3 ${isCurrent ? "border-ind bg-ind-soft" : "border-line bg-white"}`}
                  >
                    <span
                      className="grid h-14 w-14 flex-none place-items-end justify-center overflow-hidden rounded-2xl"
                      style={{ background: `${item.color}1F` }}
                    >
                      <Mascot name={item.abbr} size={48} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[17px] font-extrabold">
                        {item.name}
                      </span>
                      <span className="block text-[13px] text-ink-soft">
                        {findCourse(item.id)?.sub}
                      </span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${isCurrent ? pct : 0}%`,
                            background: item.color,
                          }}
                        />
                      </span>
                    </span>
                    {isCurrent ? (
                      <span className="text-[13px] font-bold text-ind">
                        Aktif
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </BottomSheet>

      <BottomSheet
        open={streakOpen}
        onClose={() => setStreakOpen(false)}
        title="Status harian"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#F59E0B]">
            <FlameIcon size={40} />
          </span>
          <div>
            <p className="font-display text-[26px] font-black leading-tight">
              {streakCount} hari beruntun
            </p>
            <p className="text-[15px] text-ink-soft">
              Selesaikan satu misi hari ini supaya lenteramu tetap menyala.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-between rounded-2xl bg-app p-3">
          {WEEK_LABELS.map((label, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: tujuh hari dalam urutan tetap
              key={i}
              className="flex flex-col items-center gap-1.5 text-xs font-semibold text-ink-soft"
            >
              <span
                className={`h-[30px] w-[30px] rounded-full border-2 border-[#F59E0B] ${i < Math.min(streakCount, 7) ? "bg-[#F59E0B]" : "bg-white"}`}
              />
              {label}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-line bg-white p-3">
            <span className="flex items-center gap-1.5 font-display text-xl font-black">
              <span className="text-[#BE123C]">
                <HeartIcon size={20} />
              </span>
              {hearts}/5
            </span>
            <span className="text-[13px] text-ink-soft">
              Nyawa, bertambah 1 tiap 4 jam
            </span>
          </div>
          <div className="rounded-2xl border border-line bg-white p-3">
            <span className="block font-display text-xl font-black">
              {streak.data?.coins ?? 0}
            </span>
            <span className="text-[13px] text-ink-soft">Koin petunjuk</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStreakOpen(false)}
          className={`${buttonPrimary} mt-4`}
        >
          Oke
        </button>
      </BottomSheet>
    </>
  );

  if (!data.case) {
    return (
      <>
        {nav}
        <main
          className={`${pageClass} anim-tab-in items-center pt-24 text-center`}
        >
          <Mascot name={meta.abbr} size={124} mood="think" />
          <h1 className="mt-3 font-display text-[22px] font-black leading-tight">
            Kasus baru sedang ditulis
          </h1>
          <p className="mt-2 max-w-[300px] text-[15px] leading-normal text-ink-soft">
            Tim kami masih menyiapkan kasus untuk kursus ini. Sambil menunggu,
            coba pecahkan kasus di kursus lain.
          </p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-haspopup="dialog"
            className={`${buttonPrimary} mt-6`}
          >
            Pilih kursus lain
          </button>
        </main>
        {sheets}
      </>
    );
  }

  const nodes = data.nodes;
  const currentIndex = nodes.findIndex((node) => node.status === "current");
  // Durasi kedipan jejak mengikuti panjang jalur yang sudah ditempuh, seperti di desain.
  const walkedNodes = Math.min(
    currentIndex < 0 ? nodes.length : currentIndex,
    nodes.length - 1,
  );
  const footprintDuration = `${(walkedNodes * 3 * 0.16 + 1.4).toFixed(2)}s`;
  const current = currentIndex >= 0 ? nodes[currentIndex] : undefined;
  const lastNode = nodes[nodes.length - 1];
  const chips = nodes
    .filter((node) => node.type === "mission" && node.topic)
    .map((node) => node.topic as string);
  const selectedIndex = nodes.findIndex((node) => node.key === selectedKey);
  const selected = selectedIndex >= 0 ? nodes[selectedIndex] : undefined;
  const ctaLabel = !current
    ? "Ulangi interogasi"
    : current.type === "chest"
      ? "Buka kotak bukti"
      : `Lanjutkan: ${current.title ?? "misi"}`;

  function poke() {
    setMood("wave");
    setTip("Ayo lanjut, detektif! Bukti berikutnya menunggu.");
    clearTimeout(pokeTimer.current);
    pokeTimer.current = setTimeout(() => {
      setMood("idle");
      setTip(null);
    }, 2600);
  }

  return (
    <>
      {nav}
      {notice ? (
        <div
          role="status"
          className="fixed inset-x-0 top-16 z-30 mx-auto max-w-[430px] px-4"
        >
          <p className="anim-slide-up rounded-2xl bg-ind px-4 py-3 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(30,27,58,0.2)]">
            {notice}
          </p>
        </div>
      ) : null}
      <main className={`${pageClass} anim-tab-in pb-32 pt-14`}>
        <h1 className="px-0 pt-0.5 font-display text-[34px] font-black leading-[41px] tracking-[0.2px]">
          Belajar
        </h1>
        <p className="mt-0.5 text-[15px] text-ink-soft">
          {meta.name}, {data.done} dari {data.total} misi selesai
        </p>

        <div className="sticky top-14 z-10 -mx-4 mt-1.5 bg-gradient-to-b from-app from-[78%] to-app/0 px-4 pb-3.5 pt-2">
          <section
            aria-label="Kasus aktif"
            className={`relative px-4 pb-1.5 pt-4 text-white ${caseOpen ? "rounded-t-[20px]" : "rounded-[20px] shadow-[0_5px_0_rgba(0,0,0,0.16)]"}`}
            style={{ background: meta.color }}
          >
            <div className="flex items-center justify-between">
              <span className="font-body text-sm font-semibold opacity-90">
                Kasus {data.case.number}
              </span>
              <span className="rounded-full bg-white/20 px-[9px] py-[3px] font-display text-[13px] font-extrabold">
                {data.done}/{data.total} misi
              </span>
            </div>
            <h2 className="my-1 font-display text-2xl font-black leading-[1.15]">
              {data.case.title}
            </h2>
            {chips.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-lg bg-white/15 px-2 py-1 font-mono text-[11.5px] font-bold"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              aria-expanded={caseOpen}
              onClick={() => setCaseOpen((open) => !open)}
              className="mt-2 flex min-h-11 w-full items-center justify-between border-t border-white/25 font-body text-[15px] font-semibold"
            >
              Detail kasus
              <ChevronIcon size={20} open={caseOpen} />
            </button>
            {caseOpen ? (
              <div
                className="drop-in absolute inset-x-0 top-[calc(100%-1px)] rounded-b-[20px] px-4 pb-4 pt-1 shadow-[0_5px_0_rgba(0,0,0,0.16),0_16px_30px_rgba(30,27,58,0.22)]"
                style={{ background: meta.color }}
              >
                <p className="text-[15px] leading-normal">{data.case.story}</p>
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white/20 px-3.5 font-body text-[15px] font-semibold"
                >
                  Buka berkas kasus
                  <ChevronIcon size={16} open={false} />
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <ol className="mt-[52px] flex flex-col items-center pb-2">
          {nodes.map((node, index) => {
            const isChest = node.type === "chest";
            const isBoss = node.type === "boss";
            const isCurrent = node.status === "current";
            const isRetry = node.status === "retry";
            const x = OFFSETS[index % OFFSETS.length] ?? 0;
            const prevX = OFFSETS[(index - 1) % OFFSETS.length] ?? 0;
            const label =
              node.title ??
              (isChest ? "Kotak bukti" : isBoss ? "Interogasi" : "Misi");
            const tag = isRetry
              ? "ULANGI"
              : isChest
                ? "BUKA"
                : isBoss
                  ? "INTEROGASI"
                  : "MULAI";
            const stepState: "walked" | "walking" | "ahead" =
              index <= currentIndex || currentIndex < 0
                ? index === currentIndex
                  ? "walking"
                  : "walked"
                : "ahead";

            return (
              <li key={node.key} className="contents">
                {index > 0 ? (
                  <Footprints
                    from={prevX}
                    to={x}
                    stepIndex={index - 1}
                    state={stepState}
                    duration={footprintDuration}
                  />
                ) : null}
                <div className="relative flex h-[76px] w-full justify-center">
                  <div
                    className="relative h-[72px] w-[72px]"
                    style={{ transform: `translateX(${x}px)` }}
                  >
                    <div
                      className="node-pop absolute inset-0"
                      style={{
                        animationDelay: `${(index * 0.07).toFixed(2)}s`,
                      }}
                    >
                      {isCurrent || isRetry ? (
                        <>
                          {isCurrent ? (
                            <>
                              <span
                                aria-hidden="true"
                                className="node-ring pointer-events-none absolute -left-2.5 -top-2.5 h-[92px] w-[92px] rounded-full border-[5px] border-ind"
                              />
                              <span
                                aria-hidden="true"
                                className="node-ring pointer-events-none absolute -left-2.5 -top-2.5 h-[92px] w-[92px] rounded-full border-[5px] border-ind [animation-delay:0.9s]"
                              />
                            </>
                          ) : null}
                          <span
                            className={`node-tag absolute -top-[46px] left-1/2 whitespace-nowrap rounded-[10px] border-[1.5px] border-line bg-white px-2.5 py-1.5 font-display text-xs font-black tracking-[0.1em] shadow-[0_3px_0_#E4E1F0] ${isRetry ? "text-bad" : "text-ind"}`}
                          >
                            {tag}
                          </span>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelectedKey(node.key)}
                        aria-haspopup="dialog"
                        aria-label={`${label}, ${statusLabel(node.status)}`}
                        className="relative block rounded-full"
                      >
                        <span
                          className={`relative grid h-[66px] w-[72px] place-items-center rounded-full transition active:translate-y-1 ${isCurrent ? "node-breathe" : ""}`}
                          style={nodeStyle(node.status, isChest)}
                        >
                          {isChest ? <ChestIcon size={30} /> : null}
                          {!isChest && node.status === "done" ? (
                            <CheckIcon size={32} />
                          ) : null}
                          {!isChest && isCurrent && !isBoss ? (
                            <StarIcon size={30} />
                          ) : null}
                          {!isChest && isBoss && isCurrent ? (
                            <SearchIcon size={30} />
                          ) : null}
                          {isRetry ? (
                            <span
                              aria-hidden="true"
                              className="font-display text-[34px] font-black leading-none"
                            >
                              !
                            </span>
                          ) : null}
                          {!isChest && node.status === "locked" ? (
                            <LockIcon size={26} />
                          ) : null}
                        </span>
                      </button>
                      {isCurrent ? (
                        <>
                          <button
                            type="button"
                            aria-label={`Sapa ${meta.abbr}`}
                            onClick={poke}
                            className="absolute -top-5 h-[84px] w-[84px]"
                            style={{ left: x >= 0 ? -100 : 88 }}
                          >
                            <Mascot name={meta.abbr} size={84} mood={mood} />
                          </button>
                          {tip ? (
                            <p
                              className="bubble-in absolute -top-[76px] z-10 w-[170px] rounded-[14px] border-[1.5px] border-line bg-white px-[11px] py-[9px] text-[13px] font-semibold leading-[1.4] shadow-[0_6px_16px_rgba(30,27,58,0.12)]"
                              style={{ left: x >= 0 ? -112 : 52 }}
                            >
                              {tip}
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={() =>
            setNotice(
              current
                ? "Selesaikan Interogasi dulu"
                : "Kasus 02 sedang disiapkan",
            )
          }
          className="mt-1 flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 text-left text-ink-soft"
        >
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[#D9D6E8]">
            <LockIcon size={20} />
          </span>
          <span className="flex-1">
            <span className="block font-body text-[13px] font-semibold">
              Kasus berikutnya
            </span>
            <span className="block font-display text-[17px] font-extrabold text-ink">
              Kasus 02: {meta.next}
            </span>
            <span className="block text-[13px]">
              {current ? "Terbuka setelah Interogasi selesai" : "Segera hadir"}
            </span>
          </span>
        </button>
        <p className="mx-6 mt-[18px] text-center text-[13px] text-ink-soft">
          Ketuk misi berikutnya dan lanjutkan penyelidikan.
        </p>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[430px] bg-gradient-to-b from-app/0 from-0% to-app to-[38%] px-4 pb-3 pt-[18px]">
        {!current ? (
          <Link
            href={`/belajar/${courseId}/misi/${lastNode.key}`}
            className={`${buttonPrimary} pointer-events-auto gap-2`}
          >
            <PlayIcon size={18} />
            <span className="truncate">{ctaLabel}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setSelectedKey(current.key)}
            className={`${buttonPrimary} pointer-events-auto gap-2`}
          >
            <PlayIcon size={18} />
            <span className="truncate">{ctaLabel}</span>
          </button>
        )}
      </div>

      {sheets}
      <BottomSheet
        open={selected !== undefined}
        onClose={() => setSelectedKey(null)}
        title={selected ? (selected.title ?? nodeFallbackTitle(selected)) : ""}
      >
        {selected ? (
          <NodeDetail
            node={selected}
            index={selectedIndex}
            total={nodes.length}
            courseId={courseId}
            onClose={() => setSelectedKey(null)}
            onOpenChest={() => {
              if (!selected) return;
              setSelectedKey(null);
              openChest.mutate(
                { courseId, nodeKey: selected.key },
                {
                  onSuccess: ({ gained }) =>
                    setNotice(
                      gained > 0
                        ? `+${gained} koin petunjuk`
                        : "Kotak ini sudah dibuka.",
                    ),
                  onError: () =>
                    setNotice("Kotak belum bisa dibuka. Coba lagi."),
                },
              );
            }}
          />
        ) : null}
      </BottomSheet>
    </>
  );
}

function NodeDetail({
  node,
  index,
  total,
  courseId,
  onClose,
  onOpenChest,
}: {
  node: PathNode;
  index: number;
  total: number;
  courseId: string;
  onClose: () => void;
  onOpenChest: () => void;
}) {
  const meta = `Misi ${index + 1} dari ${total}`;
  const topic = node.topic ? `${node.topic}. ` : "";

  if (node.type === "chest") {
    if (node.status === "locked") {
      return (
        <NodeSheet
          meta={meta}
          text="Kotak bukti terbuka setelah misi sebelumnya selesai."
          buttonLabel="Mengerti"
          onClick={onClose}
        />
      );
    }
    if (node.status === "done") {
      return (
        <NodeSheet
          meta={meta}
          text="Kotak ini sudah dibuka. Isinya 5 koin petunjuk untuk misi yang sulit."
          buttonLabel="Oke"
          onClick={onClose}
        />
      );
    }
    return (
      <NodeSheet
        meta={meta}
        text="Kotak bukti siap dibuka. Isinya koin petunjuk."
        buttonLabel="Buka kotak"
        onClick={onOpenChest}
      />
    );
  }

  if (node.status === "locked") {
    return (
      <NodeSheet
        meta={meta}
        text={`Selesaikan misi sebelumnya untuk membuka misi ini.${node.topic ? ` Materi: ${node.topic}.` : ""}`}
        buttonLabel="Mengerti"
        onClick={onClose}
      />
    );
  }

  const done = node.status === "done";
  const xp = done ? "+5 XP" : node.type === "boss" ? "+20 XP" : "+10 XP";

  return (
    <div className="flex flex-col">
      <p className="text-sm font-semibold text-ink-soft">{meta}</p>
      <p className="mt-1.5 text-base leading-normal">
        {topic}
        {done
          ? "Misi ini sudah selesai. Ulangi untuk latihan."
          : "Misi singkat, jawabanmu langsung dinilai."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1.5 text-[13px] font-semibold text-[#78350F]">
          {xp}
        </span>
      </div>
      <Link
        href={`/belajar/${courseId}/misi/${node.key}`}
        className={`${buttonPrimary} mt-[18px]`}
      >
        {done ? "Ulangi misi" : "Mulai misi"}
      </Link>
    </div>
  );
}

function NodeSheet({
  meta,
  text,
  buttonLabel,
  onClick,
}: {
  meta: string;
  text: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-sm font-semibold text-ink-soft">{meta}</p>
      <p className="mt-1.5 text-base leading-normal">{text}</p>
      <button
        type="button"
        onClick={onClick}
        className={`${buttonPrimary} mt-[18px]`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function nodeFallbackTitle(node: PathNode) {
  if (node.type === "chest") return "Kotak bukti";
  if (node.type === "boss") return "Interogasi";
  return "Misi";
}

function nodeStyle(status: PathNode["status"], isChest: boolean) {
  if (isChest && status === "done")
    return {
      background: "#FFFFFF",
      color: "#F59E0B",
      boxShadow: "0 6px 0 #E4E1F0",
    };
  if (status === "done")
    return {
      background: "#0E7490",
      color: "#fff",
      boxShadow: "0 6px 0 #0A5870",
    };
  if (status === "current")
    return {
      background: "#4F46E5",
      color: "#fff",
      boxShadow: "0 6px 0 #3730A3",
    };
  if (status === "retry")
    return {
      background: "#E11D48",
      color: "#fff",
      boxShadow: "0 6px 0 #A3123A",
    };
  return {
    background: "#D9D6E8",
    color: "#6E6987",
    boxShadow: "0 6px 0 #BDB8D3",
  };
}

function statusLabel(status: PathNode["status"]) {
  if (status === "done") return "selesai";
  if (status === "current") return "misi berikutnya";
  if (status === "retry") return "perlu diulang";
  return "terkunci";
}
