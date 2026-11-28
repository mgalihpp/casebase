"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/ui/mascot";
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  fieldClassFor,
  inputClass,
  labelClass,
  pageClass,
} from "@/components/ui/styles";
import { authClient } from "@/lib/auth-client";
import { markBackNavigation } from "@/lib/nav-direction";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import {
  COURSES,
  courseOf,
  DAILY_TARGET_OPTIONS,
  FIRST_CASE_BY_COURSE,
  LEVEL_OPTIONS,
  REASON_OPTIONS,
  REMINDER_OPTIONS,
  STEP_PROMPTS,
} from "../data";
import { toCompletePayload, useOnboardingStore } from "../store";

const TOTAL_STEPS = 7;

// Small info callout shown under a choice list.
function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-ind-soft px-3.5 py-3 text-sm leading-snug text-ind-7">
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
        className="mt-px shrink-0"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 7.5v.5" />
      </svg>
      <span>{children}</span>
    </div>
  );
}
const DEFAULT_MASCOT_INDEX = 0;
const CLASS_NOT_FOUND =
  "Kode itu tidak ditemukan. Cek lagi ke dosen atau asistenmu.";

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const completeMutation = useMutation(
    trpc.onboarding.complete.mutationOptions(),
  );

  const draft = useOnboardingStore();
  const [classCodeInput, setClassCodeInput] = useState("");
  const [classCodeError, setClassCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    useOnboardingStore.persist.rehydrate();
    setClassCodeInput(useOnboardingStore.getState().classCode ?? "");
  }, []);

  const stepParam = Number(searchParams.get("langkah"));
  const step = Number.isInteger(stepParam)
    ? Math.min(Math.max(stepParam, 1), TOTAL_STEPS)
    : 1;

  const [shownStep, setShownStep] = useState({ step, back: false });
  if (shownStep.step !== step) {
    setShownStep({ step, back: step < shownStep.step });
  }
  const stepAnim = shownStep.back
    ? "anim-onboard-back"
    : "anim-onboard-forward";

  const selectedCourse = draft.course ? courseOf(draft.course) : null;
  const firstCase = draft.course ? FIRST_CASE_BY_COURSE[draft.course] : null;
  const bubbleText =
    selectedCourse && step === 1 ? selectedCourse.tip : STEP_PROMPTS[step - 1];
  const mascot = selectedCourse ?? COURSES[DEFAULT_MASCOT_INDEX];

  function goToStep(n: number) {
    router.push(`?langkah=${n}`);
  }

  function goBack() {
    if (step > 1) goToStep(step - 1);
    else {
      markBackNavigation();
      router.push("/");
    }
  }

  const canContinue = (() => {
    switch (step) {
      case 1:
        return !!draft.course;
      case 2:
        return !!draft.level;
      case 3:
        return !!draft.reason;
      case 4:
        return !!draft.dailyTarget;
      case 6:
        return !!draft.reminder;
      default:
        return true;
    }
  })();

  async function continueFromClassCode(skip: boolean) {
    setClassCodeError(null);
    setAttempt((n) => n + 1);
    const code = classCodeInput.trim().toUpperCase();
    if (skip || !code) {
      draft.setDraft({ classCode: undefined });
      goToStep(6);
      return;
    }
    setCheckingCode(true);
    try {
      await trpcClient.class.lookup.query({ code });
      draft.setDraft({ classCode: code });
      goToStep(6);
    } catch (err) {
      setClassCodeError(err instanceof Error ? err.message : CLASS_NOT_FOUND);
    } finally {
      setCheckingCode(false);
    }
  }

  async function finish() {
    setSaveError(null);
    setAttempt((n) => n + 1);
    const payload = toCompletePayload(useOnboardingStore.getState());
    if (!payload) return;

    if (!session) {
      // Guest: the draft stays in the store and is sent after the account is created.
      router.push("/daftar");
      return;
    }

    try {
      await completeMutation.mutateAsync(payload);
      draft.reset();
      router.push(`/belajar/${payload.course}`);
    } catch {
      setSaveError("Progresmu belum tersimpan. Coba lagi ya.");
    }
  }

  const canFinish = !!toCompletePayload(draft);

  return (
    <div
      className={`${pageClass} pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}
    >
      <div className="sticky top-0 z-20 flex shrink-0 items-center gap-2 bg-app py-2 pr-4">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-6 z-10 h-6 bg-linear-to-b from-app to-app/0"
        />
        <button
          type="button"
          aria-label="Kembali"
          onClick={goBack}
          className="grid min-h-11 min-w-11 place-items-center rounded-full text-ink-soft"
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
        </button>
        <div
          role="progressbar"
          aria-label={`Langkah ${step} dari ${TOTAL_STEPS}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((step / TOTAL_STEPS) * 100)}
          className="h-3.5 flex-1 overflow-hidden rounded-full bg-[#D9D6E8]"
        >
          <div
            className="relative h-full overflow-hidden rounded-full bg-ok transition-[width] duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          >
            <span className="anim-shimmer-sweep" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 pb-4 pt-3">
        <div className="flex min-h-26 items-end gap-2.5">
          <Mascot
            name={mascot.mascot}
            size={92}
            mood={step === TOTAL_STEPS ? "celebrate" : "idle"}
          />
          <p
            key={bubbleText}
            className="bubble-in mb-4 rounded-2xl rounded-bl-sm border-[1.5px] border-line bg-white px-3.5 py-2.5 font-body text-base font-semibold leading-snug"
          >
            {bubbleText}
          </p>
        </div>

        <div key={step} className={stepAnim}>
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2.5">
              {COURSES.map((course, index) => {
                const selected = draft.course === course.key;
                const isLastOdd =
                  index === COURSES.length - 1 && COURSES.length % 2 === 1;
                return (
                  <button
                    key={course.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => draft.setDraft({ course: course.key })}
                    className={`relative flex min-h-34 gap-0.5 rounded-[18px] border-2 border-b-4 px-2 pb-3 pt-2 text-center ${isLastOdd ? "col-span-2 flex-row items-center gap-4 px-4 py-3 text-left" : "flex-col items-center"} ${selected ? "border-ind bg-ind-soft" : "border-line bg-white"}`}
                  >
                    <span
                      className={`grid overflow-hidden rounded-xl ${isLastOdd ? "h-28 w-36 shrink-0 place-items-center" : "mb-1.5 h-19 w-full place-items-end justify-center"}`}
                      style={{ background: course.tint }}
                    >
                      <Mascot
                        name={course.mascot}
                        size={isLastOdd ? 88 : 60}
                        className={isLastOdd ? "" : "mb-1"}
                      />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-display text-base font-black">
                        {course.name}
                      </span>
                      <span className="text-[12.5px] text-ink-soft">
                        {course.sub}
                      </span>
                    </span>
                    {selected && (
                      <span
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ind text-white"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-2.5">
              {(draft.course ? LEVEL_OPTIONS[draft.course] : []).map(
                ([value, title, description], index) => {
                  const selected = draft.level === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => draft.setDraft({ level: value })}
                      className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 border-b-4 px-3.5 py-3 text-left ${selected ? "border-ind bg-ind-soft" : "border-line bg-white"}`}
                    >
                      <span
                        className="flex h-5.5 items-end gap-0.5"
                        aria-hidden="true"
                      >
                        {[1, 2, 3].map((bar) => (
                          <span
                            key={bar}
                            className="w-1.5 rounded-sm"
                            style={{
                              height: [8, 14, 20][bar - 1],
                              background:
                                bar <= index + 1 ? "#4F46E5" : "#D9D6E8",
                            }}
                          />
                        ))}
                      </span>
                      <span className="flex-1">
                        <span className="block font-body text-base font-bold">
                          {title}
                        </span>
                        <span className="mt-0.5 block text-[13.5px] text-ink-soft">
                          {description}
                        </span>
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-2.5">
              {REASON_OPTIONS.map(([value, title, description]) => {
                const selected = draft.reason === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => draft.setDraft({ reason: value })}
                    className={`flex min-h-16 flex-col justify-center rounded-2xl border-2 border-b-4 px-3.5 py-3 text-left ${selected ? "border-ind bg-ind-soft" : "border-line bg-white"}`}
                  >
                    <span className="font-body text-base font-bold">
                      {title}
                    </span>
                    <span className="mt-0.5 text-[13.5px] text-ink-soft">
                      {description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-2.5">
              {DAILY_TARGET_OPTIONS.map(([value, title, label]) => {
                const selected = draft.dailyTarget === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => draft.setDraft({ dailyTarget: value })}
                    className={`flex min-h-16 items-center justify-between rounded-2xl border-2 border-b-4 px-3.5 py-3 text-left ${selected ? "border-ind bg-ind-soft" : "border-line bg-white"}`}
                  >
                    <span className="font-body text-base font-bold">
                      {title}
                    </span>
                    <span className="text-sm font-bold text-ink-soft">
                      {label}
                    </span>
                  </button>
                );
              })}
              <InfoNote>Bisa diubah kapan saja dari Profil.</InfoNote>
            </div>
          )}

          {step === 5 && (
            <div>
              <label htmlFor="class-code" className={labelClass}>
                Kode kelas
              </label>
              <div className={fieldClassFor(!!classCodeError)}>
                <input
                  id="class-code"
                  type="text"
                  autoCapitalize="characters"
                  placeholder="Contoh: BD-TI2B"
                  value={classCodeInput}
                  onChange={(e) => setClassCodeInput(e.target.value)}
                  className={inputClass}
                />
              </div>
              {classCodeError && (
                <p
                  key={attempt}
                  role="alert"
                  className="mt-2 px-1 text-sm font-bold text-bad"
                >
                  {classCodeError}
                </p>
              )}
              <p className="mt-3 px-1 text-sm text-ink-soft">
                Tidak punya kode? Lewati saja. Kamu bisa gabung kelas nanti dari
                Profil.
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="grid gap-2.5">
              {REMINDER_OPTIONS.map(([value, title, description]) => {
                const selected = draft.reminder === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => draft.setDraft({ reminder: value })}
                    className={`flex min-h-16 flex-col justify-center rounded-2xl border-2 border-b-4 px-3.5 py-3 text-left ${selected ? "border-ind bg-ind-soft" : "border-line bg-white"}`}
                  >
                    <span className="font-body text-base font-bold">
                      {title}
                    </span>
                    <span className="mt-0.5 text-[13.5px] text-ink-soft">
                      {description}
                    </span>
                  </button>
                );
              })}
              <InfoNote>Kamu bisa mematikan pengingat kapan saja.</InfoNote>
            </div>
          )}

          {step === 7 && (
            <div className="pt-7">
              <div className="relative rounded-[4px_18px_18px_18px] border-2 border-[#EBD3A0] bg-[#FDF3DC] px-4 pb-4 pt-[18px] text-[#4A3413]">
                <span className="absolute -top-7 -left-0.5 flex h-[26px] items-center rounded-t-xl border-2 border-b-0 border-[#EBD3A0] bg-[#FDF3DC] px-3.5 font-body text-[13px] font-bold">
                  Berkas kasus 01
                </span>
                <h2 className="mb-1.5 font-display text-2xl font-black leading-tight text-[#3A270B]">
                  {firstCase?.title ?? "Kasus pertamamu"}
                </h2>
                <p className="text-[15px] leading-normal">{firstCase?.story}</p>
                {firstCase && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {firstCase.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-white/70 px-2 py-1 font-mono text-xs font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3.5">
                <InfoNote>Waktu mengerjakan sekitar 3 menit.</InfoNote>
              </div>
            </div>
          )}
        </div>

        {saveError && (
          <p
            key={attempt}
            role="alert"
            className="px-1 text-sm font-bold text-bad"
          >
            {saveError}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 z-20 grid shrink-0 gap-3 bg-app pb-6 pt-2">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-6 z-10 h-6 bg-linear-to-b from-app/0 to-app"
        />
        {step === 5 ? (
          <>
            <button
              type="button"
              className={buttonPrimary}
              disabled={checkingCode}
              onClick={() => continueFromClassCode(false)}
            >
              {checkingCode ? "Memeriksa…" : "Lanjut"}
            </button>
            <button
              type="button"
              className={buttonGhost}
              onClick={() => continueFromClassCode(true)}
            >
              Lewati, aku belajar sendiri
            </button>
          </>
        ) : step === TOTAL_STEPS ? (
          <button
            type="button"
            className={buttonPrimary}
            disabled={
              sessionPending || completeMutation.isPending || !canFinish
            }
            onClick={finish}
          >
            {session
              ? completeMutation.isPending
                ? "Menyimpan…"
                : "Mulai misi"
              : "Buka berkas"}
          </button>
        ) : (
          <button
            type="button"
            className={buttonPrimary}
            disabled={!canContinue}
            onClick={() => goToStep(step + 1)}
          >
            Lanjut
          </button>
        )}

        {step === 6 && (
          <button
            type="button"
            className={buttonSecondary}
            onClick={() => {
              draft.setDraft({ reminder: undefined });
              goToStep(7);
            }}
          >
            Nanti saja
          </button>
        )}
      </div>
    </div>
  );
}
