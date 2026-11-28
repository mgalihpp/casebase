"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Mascot, type MascotMood } from "@/components/ui/mascot";
import { buttonPrimary, pageClass } from "@/components/ui/styles";
import { findCourse } from "@/features/course/data";
import { useCoursePath } from "@/features/course/hooks";
import type { NodeStatus } from "@/features/course/path";

type Props = { courseId: string };

// Pola geser node dari peta misi di desain (zig-zag).
const OFFSETS = [0, -48, 0, 48, 0, -48];
const STEP_HEIGHT = 44;

type IconProps = { size: number; stroke?: number };

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
}: {
  from: number;
  to: number;
  stepIndex: number;
  state: "walked" | "walking" | "ahead";
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
  const { data, isPending, error } = useCoursePath(courseId);
  const meta = findCourse(courseId);
  const [caseOpen, setCaseOpen] = useState(false);
  const [mood, setMood] = useState<MascotMood>("idle");
  const [tip, setTip] = useState<string | null>(null);
  const pokeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(pokeTimer.current);
    };
  }, []);

  if (error) {
    return (
      <main className={pageClass}>
        <p className="mt-10 text-center text-ink-soft">{error.message}</p>
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
        <div className="h-10 w-40 animate-pulse rounded-xl bg-line" />
        <div className="mt-4 h-32 animate-pulse rounded-[20px] bg-line" />
        <div className="flex flex-col items-center gap-10 pt-12">
          {(["a", "b", "c", "d", "e"] as const).map((id, i) => (
            <div
              key={id}
              className="h-[66px] w-[72px] animate-pulse rounded-full bg-line"
              style={{ transform: `translateX(${OFFSETS[i]}px)` }}
            />
          ))}
        </div>
      </main>
    );
  }

  const nav = (
    <header
      className={`fixed inset-x-0 top-0 z-20 mx-auto flex h-14 max-w-[430px] items-center px-2 backdrop-blur-xl ${scrolled ? "border-b border-ink/15 bg-app/90" : "bg-app/70"}`}
    >
      <Link
        href="/belajar/sql"
        aria-label={`Kursus sekarang ${meta.name}`}
        className="flex min-h-11 items-center gap-2 rounded-full pl-1.5 pr-2 font-body text-base font-bold"
      >
        <span
          className="grid h-8 w-8 place-items-end justify-center overflow-hidden rounded-[10px]"
          style={{ background: `${meta.color}1F` }}
        >
          <Mascot name={meta.abbr} size={34} />
        </span>
        <span className="max-w-[140px] truncate">{meta.name}</span>
      </Link>
    </header>
  );

  if (!data.case) {
    return (
      <>
        {nav}
        <main className={`${pageClass} items-center pt-24 text-center`}>
          <Mascot name={meta.abbr} size={124} />
          <h1 className="mt-3 font-display text-[22px] font-black leading-tight">
            Kasus baru sedang ditulis
          </h1>
          <p className="mt-2 max-w-[300px] text-[15px] leading-normal text-ink-soft">
            Tim kami masih menyiapkan kasus untuk kursus ini. Sambil menunggu,
            coba pecahkan kasus di kursus lain.
          </p>
          <Link href="/belajar/sql" className={`${buttonPrimary} mt-6`}>
            Pilih kursus lain
          </Link>
        </main>
      </>
    );
  }

  const nodes = data.nodes;
  const currentIndex = nodes.findIndex((node) => node.status === "current");
  const current = currentIndex >= 0 ? nodes[currentIndex] : undefined;
  const chips = nodes
    .filter((node) => node.type === "mission" && node.topic)
    .map((node) => node.topic as string);
  const currentIsMission = current?.type === "mission";
  const ctaLabel = !current
    ? "Kasus selesai"
    : current.type === "mission"
      ? `Lanjutkan: ${current.title ?? "misi"}`
      : "Interogasi segera hadir";

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
      <main className={`${pageClass} pb-32 pt-14`}>
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
              </div>
            ) : null}
          </section>
        </div>

        <ol className="mt-[52px] flex flex-col items-center pb-2">
          {nodes.map((node, index) => {
            const isChest = node.type === "chest";
            const isBoss = node.type === "boss";
            const isCurrent = node.status === "current";
            const interactive =
              node.type === "mission" && node.status !== "locked";
            const x = OFFSETS[index % OFFSETS.length] ?? 0;
            const prevX = OFFSETS[(index - 1) % OFFSETS.length] ?? 0;
            const label = isChest
              ? "Kotak bukti"
              : isBoss
                ? "Interogasi"
                : (node.title ?? "Misi");
            const tag = isChest ? "BUKA" : isBoss ? "INTEROGASI" : "MULAI";
            const stepState: "walked" | "walking" | "ahead" =
              index <= currentIndex || currentIndex < 0
                ? index === currentIndex
                  ? "walking"
                  : "walked"
                : "ahead";

            const body = (
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
                {isBoss && isCurrent ? <SearchIcon size={30} /> : null}
                {!isChest && node.status === "locked" ? (
                  <LockIcon size={26} />
                ) : null}
              </span>
            );

            return (
              <li key={node.key} className="contents">
                {index > 0 ? (
                  <Footprints
                    from={prevX}
                    to={x}
                    stepIndex={index - 1}
                    state={stepState}
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
                          <span className="node-tag absolute -top-[46px] left-1/2 whitespace-nowrap rounded-[10px] border-[1.5px] border-line bg-white px-2.5 py-1.5 font-display text-xs font-black tracking-[0.1em] text-ind shadow-[0_3px_0_#E4E1F0]">
                            {tag}
                          </span>
                        </>
                      ) : null}
                      {interactive ? (
                        <Link
                          href={`/belajar/${courseId}/misi/${node.key}`}
                          aria-label={`${label}, ${statusLabel(node.status)}`}
                          className="relative block rounded-full"
                        >
                          {body}
                        </Link>
                      ) : (
                        <span
                          role="img"
                          aria-label={`${label}, ${statusLabel(node.status)}`}
                          className="relative block"
                        >
                          {body}
                        </span>
                      )}
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

        <div className="mt-1 flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 text-ink-soft">
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
        </div>
        <p className="mx-6 mt-[18px] text-center text-[13px] text-ink-soft">
          Ketuk misi berikutnya dan lanjutkan penyelidikan.
        </p>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[430px] bg-gradient-to-b from-app/0 from-0% to-app to-[38%] px-4 pb-3 pt-[18px]">
        {currentIsMission && current ? (
          <Link
            href={`/belajar/${courseId}/misi/${current.key}`}
            className={`${buttonPrimary} pointer-events-auto gap-2`}
          >
            <PlayIcon size={18} />
            <span className="truncate">{ctaLabel}</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={`${buttonPrimary} pointer-events-auto`}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </>
  );
}

function nodeStyle(status: NodeStatus, isChest: boolean) {
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
  return {
    background: "#D9D6E8",
    color: "#6E6987",
    boxShadow: "0 6px 0 #BDB8D3",
  };
}

function statusLabel(status: NodeStatus) {
  if (status === "done") return "selesai";
  if (status === "current") return "misi berikutnya";
  return "terkunci";
}
