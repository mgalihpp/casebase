"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Mascot, type MascotMood } from "@/components/ui/mascot";
import {
  buttonPrimary,
  buttonSecondary,
  pageClass,
} from "@/components/ui/styles";
import { findCourse } from "@/features/course/data";
import { type RunOutcome, runSql } from "@/features/mission/engine/run-sql";
import { highlight, type Token } from "@/features/mission/highlight";
import {
  useMissionCheck,
  useMissionHint,
  useMissionStart,
} from "@/features/mission/hooks";
import { useTRPC } from "@/trpc/client";

type Props = { courseId: string; nodeKey: string };

type Answer =
  | { type: "write"; query: string }
  | { type: "pilih"; choice: number }
  | { type: "susun"; order: string[] };

type Reward = { xp: number; score: number; lantern: number };

type Check = {
  correct: boolean;
  message: string;
  explanation: string | null;
  nodeDone: boolean;
  hearts: number;
  reward: Reward | null;
};

type Sheet = "petunjuk" | "skema" | "keluar" | null;

const HEARTS = 5;
const HINT_MAX = 3;
const XP_PER_SOAL = 10;
const BIAYA_PETUNJUK = 10;
const GAGAL_KIRIM = "Jawaban belum terkirim. Periksa koneksimu lalu coba lagi.";
const KETUKAN_KATA_KUNCI = [
  "SELECT",
  "*",
  "FROM",
  "transaksi",
  "ORDER BY",
  "jumlah",
  "DESC",
  "LIMIT",
  "3",
  "WHERE",
  ",",
];
const KOLOM_TRANSAKSI = [
  ["id", "INTEGER"],
  ["rekening", "TEXT"],
  ["jumlah", "INTEGER"],
  ["waktu", "TEXT"],
];
const LABEL_SOAL = {
  write: "Tulis query",
  pilih: "Pilih jawaban",
  susun: "Susun query",
} as const;
const CONFETTI_COLORS = [
  "#4F46E5",
  "#0E7490",
  "#F59E0B",
  "#E11D48",
  "#00758F",
  "#13AA52",
];
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  left: (i * 37 + 7) % 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  duration: 2.4 + (i % 5) * 0.45,
  delay: (i * 0.17) % 1.6,
  rotate: (i * 47) % 360,
}));

// Pewarnaan sederhana untuk editor, meniru highlight di desain.
function rupiah(value: unknown) {
  return `Rp${Number(value).toLocaleString("id-ID")}`;
}

export function MissionScreen({ courseId, nodeKey }: Props) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, error, isPending } = useMissionStart(courseId, nodeKey);
  const check = useMissionCheck();
  const hint = useMissionHint();
  const meta = findCourse(courseId);

  const [index, setIndex] = useState(0);
  const [code, setCode] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [placed, setPlaced] = useState<number[]>([]);
  const [run, setRun] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Check | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [heartsLeft, setHeartsLeft] = useState<number | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hintTexts, setHintTexts] = useState<string[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);

  const question = data?.questions[index];

  // Petunjuk yang sudah dibuka di server dimuat ulang teksnya satu per satu. Pemanggilan ini tidak memotong koin.
  useEffect(() => {
    if (!data || hint.isPending) return;
    const openedCount = data.hintsOpened[index]?.length ?? 0;
    if (hintTexts.length >= openedCount) return;
    hint.mutate(
      { courseId, nodeKey, questionIndex: index, hintIndex: hintTexts.length },
      {
        onSuccess: (opened) => setHintTexts((texts) => [...texts, opened.text]),
      },
    );
  }, [
    data,
    index,
    hintTexts.length,
    hint.isPending,
    hint.mutate,
    courseId,
    nodeKey,
  ]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  if (error?.data?.code === "UNAUTHORIZED") {
    router.replace("/masuk");
    return null;
  }

  if (error) {
    return (
      <main className={pageClass}>
        <p className="mt-10 text-center text-ink-soft">{error.message}</p>
        <Link
          href={`/belajar/${courseId}`}
          className="mt-4 text-center font-display font-black text-ind"
        >
          Kembali ke Belajar
        </Link>
      </main>
    );
  }

  if (isPending || !data || !meta) {
    return (
      <main className={pageClass} aria-busy="true">
        <div className="mt-6 h-12 anim-skeleton rounded-2xl bg-line" />
      </main>
    );
  }

  const total = data.questions.length;
  const hintsUsed = data.hintsOpened.reduce(
    (sum, list) => sum + list.length,
    0,
  );
  const openedHere = data.hintsOpened[index]?.length ?? 0;
  const hearts = heartsLeft ?? data.hearts ?? HEARTS;
  const xp = Math.max(0, total * XP_PER_SOAL - hintsUsed * BIAYA_PETUNJUK);
  const score = Math.max(0, 100 - hintsUsed * 10 - mistakes * 5);
  const accuracy = Math.round((total / Math.max(attempts, total)) * 100);
  const mood: MascotMood = result
    ? result.correct
      ? "happy"
      : hearts === 0
        ? "shock"
        : "sad"
    : finished
      ? "celebrate"
      : question?.type === "write" && !run
        ? "think"
        : "idle";

  function resetQuestionInput() {
    setCode("");
    setChoice(null);
    setPlaced([]);
    setRun(null);
    setResult(null);
    setHintTexts([]);
  }

  function submit(answer: Answer) {
    check.mutate(
      { courseId, nodeKey, questionIndex: index, answer },
      {
        onSuccess: (outcome) => {
          setResult(outcome);
          setAttempts((count) => count + 1);
          setHeartsLeft(outcome.hearts);
          if (outcome.reward) setReward(outcome.reward);
          if (outcome.correct) return;
          setMistakes((count) => count + 1);
        },
        onError: (failure) => {
          if (failure.data?.code === "UNAUTHORIZED") router.replace("/masuk");
          else if (failure.data?.code === "PRECONDITION_FAILED")
            setHeartsLeft(0);
          else setToast(GAGAL_KIRIM);
        },
      },
    );
  }

  function handleCheck() {
    if (!question) return;
    if (question.type === "write") {
      submit({ type: "write", query: code });
    } else if (question.type === "pilih") {
      if (choice !== null) submit({ type: "pilih", choice });
    } else {
      submit({
        type: "susun",
        order: placed.map((position) => question.pieces[position] ?? ""),
      });
    }
  }

  async function handleRun() {
    if (!data) return;
    setRunning(true);
    setRun(await runSql(data.case.seed, code));
    setRunning(false);
  }

  function insertKeyword(keyword: string) {
    setCode((value) => {
      const separator = value === "" || /[\s(]$/.test(value) ? "" : " ";
      return `${value}${separator}${keyword}`;
    });
  }

  function openNextHint() {
    hint.mutate(
      { courseId, nodeKey, questionIndex: index, hintIndex: openedHere },
      {
        onSuccess: (opened) => {
          setHintTexts((texts) => [...texts, opened.text]);
          void queryClient.invalidateQueries({
            queryKey: trpc.mission.start.queryKey(),
          });
        },
      },
    );
  }

  function handleNext() {
    if (!result) return;
    if (index + 1 < total) {
      setIndex(index + 1);
      resetQuestionInput();
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: trpc.course.path.queryKey(),
    });
    setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    setFinished(true);
  }

  const closeSheet = () => setSheet(null);

  if (hearts === 0 && !finished) {
    return (
      <OutOfHearts
        nextHeartAt={data.nextHeartAt}
        onBack={() => router.replace(`/belajar/${courseId}`)}
      />
    );
  }

  if (finished) {
    return (
      <main
        className={`${pageClass} items-center pt-16 text-center relative isolate overflow-hidden`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          {CONFETTI.map((piece) => (
            <i
              key={piece.id}
              className="anim-confetti"
              style={{
                left: `${piece.left}%`,
                background: piece.color,
                animationDuration: `${piece.duration}s`,
                animationDelay: `${piece.delay}s`,
                transform: `rotate(${piece.rotate}deg)`,
              }}
            />
          ))}
        </div>
        <Mascot name={meta.abbr} size={150} mood="celebrate" />
        <h1
          className="mt-3 font-display text-[30px] font-black anim-row-in"
          style={{ animationDelay: "0.15s" }}
        >
          Misi selesai!
        </h1>
        <p className="mt-2 text-base text-ink-soft">
          Satu bukti lagi masuk ke berkas. Pelakunya makin dekat.
        </p>
        <dl className="mt-6 grid w-full grid-cols-3 gap-2 rounded-2xl border-[1.5px] border-line bg-white py-3">
          <Stat label="XP" value={`+${reward?.xp ?? xp}`} delay={0.35} />
          <Stat label="Akurasi" value={`${accuracy}%`} delay={0.5} tone />
          <Stat label="Waktu" value={formatTime(elapsed)} delay={0.65} />
        </dl>
        <p className="mt-3.5 text-sm text-ink-soft">
          Skor {reward?.score ?? score} dari 100, memakai {hintsUsed} petunjuk
        </p>
        <Link href={`/belajar/${courseId}`} className={`${buttonPrimary} mt-8`}>
          Lanjut
        </Link>
      </main>
    );
  }

  if (!question) {
    return (
      <main className={pageClass}>
        <p className="mt-10 text-center text-ink-soft">
          Misi ini belum punya soal.
        </p>
        <Link
          href={`/belajar/${courseId}`}
          className="mt-4 text-center font-display font-black text-ind"
        >
          Kembali ke Belajar
        </Link>
      </main>
    );
  }

  const hintMaxed = openedHere >= HINT_MAX;
  const canCheck =
    question.type === "write"
      ? code.trim() !== ""
      : question.type === "pilih"
        ? choice !== null
        : placed.length > 0;
  const bubble = result
    ? result.correct
      ? "Mantap! Bukti ini langsung kucatat."
      : "Hmm, belum tepat. Soal ini kita ulang nanti."
    : "";

  return (
    <main className={`${pageClass} gap-3.5 bg-white pb-56 pt-2`}>
      {toast ? (
        <div
          role="status"
          className="fixed inset-x-0 top-16 z-30 mx-auto max-w-[430px] px-4"
        >
          <p className="anim-slide-up rounded-2xl bg-[#FFF1F4] px-4 py-3 text-[15px] font-semibold text-[#BE123C] shadow-[0_6px_16px_rgba(30,27,58,0.12)]">
            {toast}
          </p>
        </div>
      ) : null}

      <div className="anim-slide-up flex flex-col gap-3.5">
        <header className="-mx-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSheet("keluar")}
            aria-label="Keluar dari misi"
            className="grid h-11 w-11 flex-none place-items-center text-ink-soft"
          >
            ✕
          </button>
          <div
            role="progressbar"
            aria-label="Progres misi"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((index / total) * 100)}
            className="h-3.5 flex-1 overflow-hidden rounded-full bg-line"
          >
            <div
              className="relative h-full overflow-hidden rounded-full bg-[#0E7490] transition-[width] duration-500 ease-[cubic-bezier(0.3,1.3,0.5,1)]"
              style={{ width: `${Math.max(4, (index / total) * 100)}%` }}
            >
              <span aria-hidden="true" className="anim-shimmer-sweep" />
            </div>
          </div>
          <Hearts count={hearts} />
        </header>

        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-[15px] font-black text-ind">
            {LABEL_SOAL[question.type]}
          </span>
          {question.type === "write" ? (
            <div className="flex">
              <button
                type="button"
                onClick={() => setSheet("skema")}
                aria-haspopup="dialog"
                className="min-h-11 px-2 font-display text-[15px] font-black text-ind"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                  className="mr-1 inline"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 10h18M9 10v10" />
                </svg>
                Skema
              </button>
              <button
                type="button"
                onClick={() => setSheet("petunjuk")}
                aria-haspopup="dialog"
                className="min-h-11 px-2 font-display text-[15px] font-black text-ind"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="mr-1 inline"
                >
                  <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" />
                </svg>
                Petunjuk {openedHere}/{HINT_MAX}
              </button>
            </div>
          ) : null}
        </div>

        <h2
          key={`question-${index}`}
          className="font-display text-[22px] font-black leading-tight anim-tab-in"
        >
          {question.prompt}
        </h2>

        <div className="mb-2.5 flex items-end gap-2">
          <span className="h-[72px] w-[72px] shrink-0">
            <Mascot name={meta.abbr} size={72} mood={mood} />
          </span>
          {bubble ? (
            <p className="rounded-2xl rounded-bl-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-[15px] leading-snug">
              {bubble}
            </p>
          ) : null}
        </div>

        <div
          key={`mistakes-${mistakes}`}
          className={`flex flex-col gap-3.5 ${result && !result.correct ? "anim-shake" : ""}`}
        >
          {question.type === "write" ? (
            <>
              <div className="relative rounded-2xl border-2 border-b-4 border-line bg-[#FCFCFF] focus-within:border-[#A5B4FC]">
                <label className="sr-only" htmlFor="sqled">
                  Editor query
                </label>
                <pre
                  aria-hidden="true"
                  className="pointer-events-none m-0 min-h-[132px] whitespace-pre-wrap break-words px-4 py-3.5 font-mono text-[16px] leading-[1.6] text-ink"
                >
                  {highlight(code).map((tokens, lineIndex) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: baris editor tidak punya id dan urutannya tetap
                      key={lineIndex}
                      className="block min-h-[25.6px]"
                    >
                      {tokens.map((token, tokenIndex) => (
                        <span
                          // biome-ignore lint/suspicious/noArrayIndexKey: token dibangun ulang setiap render dari teks yang sama
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
                  ))}
                </pre>
                <textarea
                  id="sqled"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  placeholder="Tulis query di sini"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="absolute inset-0 h-full w-full resize-none overflow-hidden bg-transparent px-4 py-3.5 font-mono text-[16px] leading-[1.6] text-transparent caret-ind outline-none placeholder:text-ink-soft"
                />
              </div>

              {hintTexts.map((text) => (
                <p
                  key={text}
                  className="anim-pop-in rounded-xl bg-[#FEF3C7] px-3 py-2.5 text-sm leading-snug text-[#78350F]"
                >
                  <b>Petunjuk {hintTexts.indexOf(text) + 1}.</b> {text}
                </p>
              ))}

              {run ? (
                run.ok ? (
                  <div>
                    <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">
                      {run.rows.length} baris hasil
                    </p>
                    <div className="overflow-x-auto rounded-xl border-[1.5px] border-line">
                      <table className="w-full border-collapse text-sm tabular-nums">
                        <thead>
                          <tr>
                            {run.columns.map((column) => (
                              <th
                                key={column}
                                className="whitespace-nowrap bg-app px-2.5 py-2 text-left font-mono text-xs text-ink-soft"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {run.rows.map((row, rowIndex) => (
                            <tr
                              // biome-ignore lint/suspicious/noArrayIndexKey: hasil query tidak punya id dan tidak diurutkan ulang
                              key={rowIndex}
                            >
                              {row.map((cell, cellIndex) => (
                                <td
                                  // biome-ignore lint/suspicious/noArrayIndexKey: sel hasil query tidak punya id
                                  key={cellIndex}
                                  className="whitespace-nowrap border-t border-line px-2.5 py-2"
                                >
                                  {run.columns[cellIndex] === "jumlah"
                                    ? rupiah(cell)
                                    : String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#FFF1F4] px-3 py-2.5 text-sm text-[#BE123C]">
                    <b>Belum pas.</b> {run.message}
                  </p>
                )
              ) : null}
            </>
          ) : question.type === "pilih" ? (
            <fieldset
              className="flex flex-col gap-2.5"
              aria-label="Pilihan jawaban"
            >
              {question.options.map((option, position) => {
                const selected = choice === position;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    disabled={check.isPending || result !== null}
                    onClick={() => setChoice(position)}
                    className={`min-h-14 rounded-2xl border-2 border-b-4 px-4 py-3 text-left font-body text-[16px] font-semibold transition active:translate-y-0.5 ${selected ? "border-ind bg-ind-soft text-ind-7 anim-tap-bounce" : "border-line bg-white text-ink"}`}
                  >
                    {option}
                  </button>
                );
              })}
            </fieldset>
          ) : (
            <SusunPieces
              pieces={question.pieces}
              placed={placed}
              disabled={check.isPending || result !== null}
              onPlace={(position) => setPlaced((list) => [...list, position])}
              onRemove={(position) =>
                setPlaced((list) => list.filter((item) => item !== position))
              }
            />
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[430px]">
        {result ? (
          <div
            role="status"
            className={`grid gap-3 px-4 pb-5 pt-4 anim-slide-up ${result.correct ? "bg-[#E6F6FA] text-[#0E7490]" : "bg-[#FFF1F4] text-[#BE123C]"}`}
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {result.correct ? (
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  ) : (
                    <path d="M6 6l12 12M18 6L6 18" />
                  )}
                </svg>
              </span>
              <div>
                <p className="mb-1 mt-1.5 font-display text-xl font-black">
                  {result.correct ? "Tepat sekali!" : "Jejaknya meleset"}
                </p>
                <p className="text-[15px] leading-[1.45]">
                  {result.correct ? result.explanation : result.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className={`${buttonPrimary} ${result.correct ? "bg-ok! shadow-[0_5px_0_#0A5870]!" : "bg-bad! shadow-[0_5px_0_#A3123A]!"}`}
            >
              Lanjut
            </button>
          </div>
        ) : (
          <div className="grid gap-2.5 border-t border-line bg-white px-4 pb-4 pt-2.5">
            {question.type === "write" ? (
              <div
                role="group"
                aria-label="Sisipkan kata kunci"
                className="-mx-4 flex gap-1.5 overflow-x-auto px-4"
              >
                {KETUKAN_KATA_KUNCI.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => insertKeyword(keyword)}
                    className="min-h-11 shrink-0 rounded-xl border-[1.5px] border-b-[3px] border-line bg-white px-3 font-mono text-[15px] font-bold text-ind-7 active:translate-y-0.5"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            ) : null}
            <div
              className={`grid gap-2.5 ${question.type === "write" ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {question.type === "write" ? (
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={running}
                  className={buttonSecondary}
                >
                  {running ? "Menjalankan…" : "Jalankan"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleCheck}
                disabled={check.isPending || !canCheck}
                className={buttonPrimary}
              >
                {check.isPending ? "Memeriksa…" : "Periksa"}
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomSheet
        open={sheet === "petunjuk"}
        onClose={closeSheet}
        title="Petunjuk"
      >
        <div className="flex flex-col gap-2.5">
          <p className="text-[15px] leading-normal text-ink-soft">
            Petunjuk dibuka satu per satu, makin lama makin jelas. Tiap petunjuk
            mengurangi skor {BIAYA_PETUNJUK} poin.
          </p>
          {Array.from({ length: HINT_MAX }, (_, position) => {
            const text = hintTexts[position];
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: tiga petunjuk berurutan dengan panjang tetap
                key={position}
                className={`rounded-2xl p-3 text-[15px] leading-snug ${text ? "bg-[#FEF3C7] text-[#78350F]" : "bg-app text-ink-soft"}`}
              >
                {text ? (
                  <>
                    <b>Petunjuk {position + 1}.</b> {text}
                  </>
                ) : (
                  `Terkunci (−${BIAYA_PETUNJUK} skor)`
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={openNextHint}
            disabled={hint.isPending || hintMaxed}
            className={`${buttonSecondary} mt-2`}
          >
            {hint.isPending
              ? "Membuka…"
              : hintMaxed
                ? "Semua petunjuk terbuka"
                : `Buka petunjuk ${openedHere + 1}`}
          </button>
          {hint.isError ? (
            <p role="alert" className="text-[15px] text-bad">
              Petunjuk belum bisa dibuka. Coba lagi.
            </p>
          ) : null}
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === "skema"} onClose={closeSheet} title="Skema">
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-ink-soft">
            Kolom yang bisa kamu pakai di tabel ini.
          </p>
          <div className="overflow-hidden rounded-2xl border-[1.5px] border-line">
            <p className="bg-[#EEEDFD] px-3.5 py-2.5 font-mono text-[15px] font-bold text-[#3730A3]">
              transaksi
            </p>
            {KOLOM_TRANSAKSI.map(([name, type]) => (
              <div
                key={name}
                className="flex justify-between border-t border-line px-3.5 py-3 font-mono text-[15px]"
              >
                <span>{name}</span>
                <span className="text-ink-soft">{type}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={closeSheet}
            className={buttonSecondary}
          >
            Kembali ke editor
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet === "keluar"}
        onClose={closeSheet}
        title="Keluar dari misi?"
      >
        <p className="text-base leading-normal text-ink-soft">
          Jawabanmu di misi ini tidak disimpan, dan nyawa yang sudah hilang
          tidak kembali.
        </p>
        <div className="mt-4 grid gap-3">
          <button type="button" onClick={closeSheet} className={buttonPrimary}>
            Lanjutkan misi
          </button>
          <Link
            href={`/belajar/${courseId}`}
            className="flex min-h-12 items-center justify-center font-body text-[17px] font-bold text-bad"
          >
            Keluar dari misi
          </Link>
        </div>
      </BottomSheet>
    </main>
  );
}

function Hearts({ count }: { count: number }) {
  return (
    <span
      role="img"
      aria-label={`${count} nyawa`}
      className="flex flex-none items-center gap-1 font-display text-base font-black text-bad"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M12 21s-8-4.7-8-10.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8 2.8C20 16.3 12 21 12 21z" />
      </svg>
      {count}
    </span>
  );
}

// Potongan diketuk untuk dipasang; potongan di bank yang sudah dipakai menjadi nonaktif.
function SusunPieces({
  pieces,
  placed,
  disabled,
  onPlace,
  onRemove,
}: {
  pieces: string[];
  placed: number[];
  disabled: boolean;
  onPlace: (position: number) => void;
  onRemove: (position: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset
        aria-label="Jawabanmu"
        className="m-0 flex min-h-28 min-w-0 flex-wrap content-start gap-2 border-0 p-0 py-1.5"
        style={{
          background:
            "repeating-linear-gradient(to bottom, transparent 0 52px, #E4E1F0 52px 54px)",
        }}
      >
        {placed.map((position) => (
          <button
            key={position}
            type="button"
            disabled={disabled}
            aria-label={`Lepas ${pieces[position]}`}
            onClick={() => onRemove(position)}
            className="anim-pop-in min-h-11 rounded-xl border-[1.5px] border-b-4 border-line bg-white px-3 font-mono text-[15px] font-bold text-ink active:translate-y-0.5"
          >
            {pieces[position]}
          </button>
        ))}
      </fieldset>
      <div className="flex flex-wrap justify-center gap-2">
        {pieces.map((piece, position) => {
          const used = placed.includes(position);
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: posisi potongan adalah identitasnya di bank
              key={`${piece}-${position}`}
              type="button"
              disabled={disabled || used}
              aria-label={used ? `${piece}, sudah dipakai` : `Tambah ${piece}`}
              onClick={() => onPlace(position)}
              className={`min-h-11 rounded-xl border-[1.5px] border-b-[3px] px-3 font-mono text-[15px] font-bold active:translate-y-0.5 ${used ? "border-[#EDEBF5] bg-[#EDEBF5] text-[#EDEBF5]" : "border-line bg-white text-ink"}`}
            >
              {piece}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  delay,
  tone,
}: {
  label: string;
  value: string;
  delay: number;
  tone?: boolean;
}) {
  return (
    <div
      className="flex flex-col-reverse items-center gap-1 anim-row-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <dd
        className={`font-display text-[22px] font-black tabular-nums ${tone ? "text-[#0E7490]" : ""}`}
      >
        {value}
      </dd>
      <dt className="text-[12.5px] font-semibold text-ink-soft">{label}</dt>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// FR-MIS-07: nyawa habis menghentikan misi dan menampilkan kapan nyawa berikutnya datang.
function OutOfHearts({
  nextHeartAt,
  onBack,
}: {
  nextHeartAt: Date | null;
  onBack: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remainingSeconds = nextHeartAt
    ? Math.max(0, Math.ceil((nextHeartAt.getTime() - now) / 1000))
    : 0;

  return (
    <main
      className={`${pageClass} items-center justify-center gap-4 text-center`}
    >
      <h1 className="font-display text-[28px] font-black">Nyawamu habis</h1>
      <p className="text-[16px] leading-normal text-ink-soft">
        Misi ini dihentikan. Jawabanmu di misi ini tidak disimpan.
      </p>
      {nextHeartAt ? (
        <p className="text-[15px] text-ink-soft">
          Nyawa berikutnya dalam{" "}
          <span className="font-display text-[22px] font-black tabular-nums text-ink">
            {formatTime(remainingSeconds)}
          </span>
        </p>
      ) : null}
      <button type="button" onClick={onBack} className={buttonPrimary}>
        Kembali ke Belajar
      </button>
    </main>
  );
}
