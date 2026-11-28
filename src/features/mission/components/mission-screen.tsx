"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Mascot, type MascotMood } from "@/components/ui/mascot";
import {
  buttonPrimary,
  buttonSecondary,
  pageClass,
} from "@/components/ui/styles";
import { findCourse } from "@/features/course/data";
import { type RunOutcome, runSql } from "@/features/mission/engine/run-sql";
import { useMissionCheck, useMissionStart } from "@/features/mission/hooks";
import { useTRPC } from "@/trpc/client";

type Props = { courseId: string; nodeKey: string };

type Check = {
  correct: boolean;
  message: string;
  explanation: string | null;
  nodeDone: boolean;
};

export function MissionScreen({ courseId, nodeKey }: Props) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, error, isPending } = useMissionStart(courseId, nodeKey);
  const check = useMissionCheck();
  const meta = findCourse(courseId);

  const [index, setIndex] = useState(0);
  const [code, setCode] = useState("");
  const [run, setRun] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Check | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [finished, setFinished] = useState(false);

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
  const mood: MascotMood = result
    ? result.correct
      ? "happy"
      : "sad"
    : finished
      ? "celebrate"
      : "idle";

  function resetForNext() {
    setCode("");
    setRun(null);
    setResult(null);
    setShowSchema(false);
  }

  async function handleRun() {
    if (!data) return;
    setRunning(true);
    setRun(await runSql(data.case.seed, code));
    setRunning(false);
  }

  function handleCheck() {
    check.mutate(
      { courseId, nodeKey, questionIndex: index, query: code },
      {
        onSuccess: (outcome) => setResult(outcome),
        onError: (failure) => {
          if (failure.data?.code === "UNAUTHORIZED") router.replace("/masuk");
          else
            setResult({
              correct: false,
              message: failure.message,
              explanation: null,
              nodeDone: false,
            });
        },
      },
    );
  }

  function handleNext() {
    if (!result) return;
    if (index + 1 < total) {
      setIndex(index + 1);
      resetForNext();
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: trpc.course.path.queryKey(),
    });
    setFinished(true);
  }

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
        <Link href={`/belajar/${courseId}`} className={`${buttonPrimary} mt-8`}>
          Kembali ke Belajar
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

  return (
    <main className={`${pageClass} gap-3.5 bg-white pb-56 pt-2`}>
      <header className="-mx-2 flex items-center gap-1.5">
        <Link
          href={`/belajar/${courseId}`}
          aria-label="Keluar dari misi"
          className="grid h-11 w-11 place-items-center text-ink-soft"
        >
          ✕
        </Link>
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
      </header>

      <div className="flex items-center justify-between">
        <span className="font-display text-[15px] font-black text-ind">
          Soal {index + 1} dari {total}
        </span>
        <button
          type="button"
          onClick={() => setShowSchema((value) => !value)}
          aria-expanded={showSchema}
          className="min-h-11 px-2 font-display text-[15px] font-black text-ind"
        >
          Skema
        </button>
      </div>

      {showSchema ? (
        <pre className="overflow-x-auto rounded-2xl border-[1.5px] border-line bg-white p-3 font-mono text-[13px] leading-relaxed text-ink">
          {data.case.seed.replace(/; /g, ";\n")}
        </pre>
      ) : null}

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

      <div className="rounded-2xl border-2 border-line border-b-4 bg-[#FCFCFF] focus-within:border-[#A5B4FC]">
        <div className="flex">
          <div
            aria-hidden="true"
            className="select-none border-r border-line px-3 py-3.5 text-right font-mono text-[14px] leading-[1.6] text-ink-soft"
          >
            {Array.from({ length: Math.max(lines, 4) }, (_, i) => i + 1).map(
              (n) => (
                <div key={n}>{n}</div>
              ),
            )}
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
        ) : (
          <div className="grid grid-cols-2 gap-2.5 border-t border-line bg-white px-4 pb-4 pt-2.5">
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className={buttonSecondary}
            >
              {running ? "Menjalankan…" : "Jalankan"}
            </button>
            <button
              type="button"
              onClick={handleCheck}
              disabled={check.isPending || !code.trim()}
              className={buttonPrimary}
            >
              {check.isPending ? "Memeriksa…" : "Periksa"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
