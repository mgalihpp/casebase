"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Mascot, type MascotMood } from "@/components/ui/mascot";
import {
  buttonPrimary,
  buttonSecondary,
  pageClass,
} from "@/components/ui/styles";
import { findCourse } from "@/features/course/data";
import { type RunOutcome, runSql } from "@/features/mission/engine/run-sql";
import {
  useMissionCheck,
  useMissionFail,
  useMissionHint,
  useMissionStart,
} from "@/features/mission/hooks";
import { useTRPC } from "@/trpc/client";

type Props = { courseId: string; nodeKey: string };

type Answer =
  | { type: "write"; query: string }
  | { type: "pilih"; choice: number }
  | { type: "susun"; order: string[] };

type Check = {
  correct: boolean;
  message: string;
  explanation: string | null;
  nodeDone: boolean;
};

type Sheet = "petunjuk" | "skema" | "keluar" | "nyawa" | null;

const HEARTS = 3;
const HEART_SLOTS = ["kiri", "tengah", "kanan"] as const;
const XP_PER_SOAL = 10;
const BIAYA_PETUNJUK = 10;

export function MissionScreen({ courseId, nodeKey }: Props) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, error, isPending } = useMissionStart(courseId, nodeKey);
  const check = useMissionCheck();
  const hint = useMissionHint();
  const fail = useMissionFail();
  const meta = findCourse(courseId);

  const [index, setIndex] = useState(0);
  const [code, setCode] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [placed, setPlaced] = useState<number[]>([]);
  const [run, setRun] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Check | null>(null);
  const [sendFailed, setSendFailed] = useState(false);
  const [hearts, setHearts] = useState(HEARTS);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintTexts, setHintTexts] = useState<string[]>([]);
  const [hintTotal, setHintTotal] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);

  const question = data?.questions[index];
  const keywords = useMemo(
    () => [
      ...new Set([...(question?.boleh ?? []), ...(question?.wajib ?? [])]),
    ],
    [question],
  );

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
        <div className="mt-6 h-12 animate-pulse rounded-2xl bg-line" />
      </main>
    );
  }

  const total = data.questions.length;
  const xp = Math.max(0, total * XP_PER_SOAL - hintsUsed * BIAYA_PETUNJUK);
  const mood: MascotMood = result
    ? result.correct
      ? "happy"
      : "sad"
    : finished
      ? "celebrate"
      : "idle";

  function resetQuestionInput() {
    setCode("");
    setChoice(null);
    setPlaced([]);
    setRun(null);
    setResult(null);
    setSendFailed(false);
    setHintTexts([]);
    setHintTotal(null);
  }

  function restartMission() {
    setIndex(0);
    setHearts(HEARTS);
    setMistakes(0);
    setHintsUsed(0);
    setStartedAt(Date.now());
    setSheet(null);
    resetQuestionInput();
  }

  function submit(answer: Answer) {
    check.mutate(
      { courseId, nodeKey, questionIndex: index, answer },
      {
        onSuccess: (outcome) => {
          setSendFailed(false);
          setResult(outcome);
          if (outcome.correct) return;
          setMistakes((count) => count + 1);
          const left = Math.max(0, hearts - 1);
          setHearts(left);
          if (left === 0) setSheet("nyawa");
        },
        onError: (failure) => {
          if (failure.data?.code === "UNAUTHORIZED") router.replace("/masuk");
          else setSendFailed(true);
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

  function retrySend() {
    const answer = check.variables?.answer;
    if (answer) submit(answer);
  }

  async function handleRun() {
    if (!data) return;
    setRunning(true);
    setRun(await runSql(data.case.seed, code));
    setRunning(false);
  }

  function openNextHint() {
    hint.mutate(
      { courseId, nodeKey, questionIndex: index, hintIndex: hintTexts.length },
      {
        onSuccess: (opened) => {
          setHintTexts((texts) => [...texts, opened.text]);
          setHintTotal(opened.total);
          setHintsUsed((count) => count + 1);
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

  function leaveAfterFailure() {
    fail.mutate(
      { courseId, nodeKey },
      { onSettled: () => router.push(`/belajar/${courseId}`) },
    );
  }

  const closeSheet = () => setSheet(null);

  if (finished) {
    return (
      <main className={`${pageClass} items-center pt-16 text-center`}>
        <Mascot name={meta.abbr} size={150} mood="celebrate" />
        <h1 className="mt-3 font-display text-[30px] font-black">
          Misi selesai!
        </h1>
        <p className="mt-2 text-base text-ink-soft">
          Satu bukti lagi masuk ke berkas. Pelakunya makin dekat.
        </p>
        <dl className="mt-6 grid w-full grid-cols-4 gap-2 rounded-2xl border-[1.5px] border-line bg-white py-3">
          <Stat label="Waktu" value={formatTime(elapsed)} />
          <Stat label="Salah" value={String(mistakes)} />
          <Stat label="Petunjuk" value={String(hintsUsed)} />
          <Stat label="XP" value={String(xp)} />
        </dl>
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

  const lines = code.split("\n").length;
  const statements = data.case.seed
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  const hintsLeft = hintTotal === null ? null : hintTotal - hintTexts.length;
  const canCheck =
    question.type === "write"
      ? code.trim() !== ""
      : question.type === "pilih"
        ? choice !== null
        : placed.length === question.pieces.length;

  return (
    <main className={`${pageClass} gap-3.5 bg-white pb-56 pt-2`}>
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
            className="h-full rounded-full bg-[#0E7490] transition-[width]"
            style={{ width: `${Math.max(4, (index / total) * 100)}%` }}
          />
        </div>
        <Hearts count={hearts} />
      </header>

      <div className="flex items-center justify-between">
        <span className="font-display text-[15px] font-black text-ind">
          Soal {index + 1} dari {total}
        </span>
        <div className="flex">
          <button
            type="button"
            onClick={() => setSheet("petunjuk")}
            aria-haspopup="dialog"
            className="min-h-11 px-2 font-display text-[15px] font-black text-ind"
          >
            Petunjuk
            {hintsLeft === null ? null : ` (${hintsLeft})`}
          </button>
          <button
            type="button"
            onClick={() => setSheet("skema")}
            aria-haspopup="dialog"
            className="min-h-11 px-2 font-display text-[15px] font-black text-ind"
          >
            Skema
          </button>
        </div>
      </div>

      <h2 className="font-display text-[22px] font-black leading-tight">
        {question.prompt}
      </h2>

      <div className="flex items-end gap-2">
        <span className="h-[72px] w-[72px] shrink-0">
          <Mascot name={meta.abbr} size={72} mood={mood} />
        </span>
        <p className="mb-2.5 rounded-2xl rounded-bl-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-[15px] leading-snug">
          {result
            ? result.message
            : `Misi ${data.node.topic ?? ""}, jawabanmu langsung dinilai.`}
        </p>
      </div>

      {question.type === "write" ? (
        <>
          <div className="rounded-2xl border-2 border-line border-b-4 bg-[#FCFCFF] focus-within:border-[#A5B4FC]">
            <div className="flex">
              <div
                aria-hidden="true"
                className="select-none border-r border-line px-3 py-3.5 text-right font-mono text-[14px] leading-[1.6] text-ink-soft"
              >
                {Array.from(
                  { length: Math.max(lines, 4) },
                  (_, i) => i + 1,
                ).map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>
              <label className="sr-only" htmlFor="sqled">
                Editor query
              </label>
              <textarea
                id="sqled"
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                placeholder="Tulis query di sini"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                rows={Math.max(lines, 4)}
                className="min-h-[132px] flex-1 resize-none bg-transparent px-3 py-3.5 font-mono text-[16px] leading-[1.6] text-ink outline-none"
              />
            </div>
          </div>

          <fieldset
            aria-label="Sisipkan kata kunci"
            className="-mx-4 flex gap-2 overflow-x-auto px-4"
          >
            {keywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() =>
                  setCode((value) =>
                    value.trim() ? `${value.trimEnd()} ${keyword}` : keyword,
                  )
                }
                className="min-h-11 shrink-0 rounded-xl border-[1.5px] border-b-[3px] border-line bg-white px-3.5 font-mono text-[15px] font-bold text-ind-7 active:translate-y-0.5"
              >
                {keyword}
              </button>
            ))}
          </fieldset>

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
                              {String(cell)}
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
                disabled={check.isPending}
                onClick={() => setChoice(position)}
                className={`min-h-14 rounded-2xl border-2 border-b-4 px-4 py-3 text-left font-body text-[16px] font-semibold transition active:translate-y-0.5 ${selected ? "border-ind bg-ind-soft text-ind-7" : "border-line bg-white text-ink"}`}
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
          disabled={check.isPending}
          onPlace={(position) => setPlaced((list) => [...list, position])}
          onRemove={(position) =>
            setPlaced((list) => list.filter((item) => item !== position))
          }
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[430px]">
        {result ? (
          <div
            role="status"
            className={`grid gap-3 px-4 pb-5 pt-4 ${result.correct ? "bg-[#E6F6FA] text-[#0E7490]" : "bg-[#FFF1F4] text-[#BE123C]"}`}
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
        ) : sendFailed ? (
          <div
            role="alert"
            className="grid gap-3 border-t border-line bg-white px-4 pb-4 pt-3"
          >
            <p className="text-[15px] font-semibold text-ink">
              Jawaban belum terkirim. Periksa koneksimu lalu coba lagi.
            </p>
            <button
              type="button"
              onClick={retrySend}
              disabled={check.isPending}
              className={buttonPrimary}
            >
              {check.isPending ? "Mengirim…" : "Coba lagi"}
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-2.5 border-t border-line bg-white px-4 pb-4 pt-2.5 ${question.type === "write" ? "grid-cols-2" : "grid-cols-1"}`}
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
        )}
      </div>

      <BottomSheet
        open={sheet === "petunjuk"}
        onClose={closeSheet}
        title="Petunjuk"
      >
        <div className="flex flex-col gap-2.5">
          {hintTexts.map((text) => (
            <div
              key={text}
              className="rounded-2xl rounded-bl-sm bg-[#FEF3C7] px-3.5 py-2.5 text-[15px] leading-snug text-[#78350F]"
            >
              <span className="block text-xs font-bold">-10 poin</span>
              {text}
            </div>
          ))}
          {hintTotal !== null && hintTexts.length >= hintTotal ? (
            <p className="text-[15px] text-ink-soft">
              Semua petunjuk untuk soal ini sudah dibuka.
            </p>
          ) : (
            <button
              type="button"
              onClick={openNextHint}
              disabled={hint.isPending}
              className={buttonSecondary}
            >
              {hint.isPending
                ? "Membuka…"
                : `Buka petunjuk, -${BIAYA_PETUNJUK} poin`}
            </button>
          )}
          {hint.isError ? (
            <p role="alert" className="text-[15px] text-bad">
              Petunjuk belum bisa dibuka. Coba lagi.
            </p>
          ) : null}
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === "skema"} onClose={closeSheet} title="Skema">
        <div className="overflow-x-auto rounded-2xl border-[1.5px] border-line bg-app p-3 font-mono text-[13px] leading-relaxed text-ink">
          {statements.map((statement) => (
            <p key={statement} className="whitespace-pre">
              {`${statement};`}
            </p>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet === "keluar"}
        onClose={closeSheet}
        title="Keluar dari misi?"
      >
        <p className="text-[15px] leading-normal text-ink-soft">
          Progres di misi ini belum disimpan sampai semua soal selesai.
        </p>
        <div className="mt-4 grid gap-2.5">
          <button
            type="button"
            onClick={closeSheet}
            className={buttonSecondary}
          >
            Lanjutkan misi
          </button>
          <Link
            href={`/belajar/${courseId}`}
            className={`${buttonPrimary} bg-bad! shadow-[0_5px_0_#A3123A]!`}
          >
            Keluar dari misi
          </Link>
        </div>
      </BottomSheet>

      {/* Lembar ini tidak bisa ditutup tanpa memilih, karena soal berikutnya tidak boleh dibuka tanpa nyawa. */}
      <BottomSheet
        open={sheet === "nyawa"}
        onClose={() => undefined}
        title="Nyawa habis"
      >
        <p className="text-[15px] leading-normal text-ink-soft">
          Nyawamu habis. Misi ini harus diulang dari soal pertama.
        </p>
        <div className="mt-4 grid gap-2.5">
          <button
            type="button"
            onClick={restartMission}
            className={buttonPrimary}
          >
            Ulangi misi
          </button>
          <button
            type="button"
            onClick={leaveAfterFailure}
            disabled={fail.isPending}
            className={buttonSecondary}
          >
            Kembali ke peta
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}

function Hearts({ count }: { count: number }) {
  return (
    <span
      role="img"
      aria-label={`Nyawa ${count} dari ${HEARTS}`}
      className="flex flex-none gap-1"
    >
      {HEART_SLOTS.map((slot, position) => (
        <svg
          key={slot}
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
          className={position < count ? "text-bad" : "text-line"}
        >
          <path
            d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"
            fill="currentColor"
          />
        </svg>
      ))}
    </span>
  );
}

// Susunan dibangun dengan mengetuk potongan. Potongan yang sudah dipasang
// bisa dilepas lagi dengan mengetuk ulang.
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
  const remaining = pieces
    .map((_, position) => position)
    .filter((position) => !placed.includes(position));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">
          Susunanmu
        </p>
        <div className="flex min-h-14 flex-wrap gap-2 rounded-2xl border-2 border-dashed border-line p-2">
          {placed.length === 0 ? (
            <span className="px-1 py-2 text-[14px] text-ink-soft">
              Ketuk potongan di bawah untuk menyusunnya.
            </span>
          ) : null}
          {placed.map((position) => (
            <button
              key={position}
              type="button"
              disabled={disabled}
              onClick={() => onRemove(position)}
              className="min-h-11 rounded-xl border-[1.5px] border-b-[3px] border-ind bg-ind-soft px-3 font-mono text-[15px] font-bold text-ind-7 active:translate-y-0.5"
            >
              {pieces[position]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">
          Potongan tersedia
        </p>
        <div className="flex flex-wrap gap-2">
          {remaining.map((position) => (
            <button
              key={position}
              type="button"
              disabled={disabled}
              onClick={() => onPlace(position)}
              className="min-h-11 rounded-xl border-[1.5px] border-b-[3px] border-line bg-white px-3 font-mono text-[15px] font-bold text-ink active:translate-y-0.5"
            >
              {pieces[position]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <dt className="text-[12px] font-semibold text-ink-soft">{label}</dt>
      <dd className="font-display text-[18px] font-black tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
