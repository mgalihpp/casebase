"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

// Signed-in change password screen, following the "Ubah kata sandi" design.
const MIN_LENGTH = 8;
const INK_SOFT = "#5C5878";

function hasLetterAndDigit(value: string) {
  return /[A-Za-z]/.test(value) && /\d/.test(value);
}

function strengthScore(value: string) {
  return [
    value.length >= MIN_LENGTH,
    hasLetterAndDigit(value),
    value.length >= 12,
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
}

function EyeButton({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      className="grid min-h-11 min-w-11 place-items-center rounded-[22px] px-2"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke={INK_SOFT}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}

function RuleIcon({ state }: { state: "ok" | "bad" | "todo" }) {
  const base = "grid h-6 w-6 shrink-0 place-items-center rounded-full";
  if (state === "ok") {
    return (
      <span className={`${base} bg-ok text-white`} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    );
  }
  if (state === "bad") {
    return (
      <span className={`${base} bg-bad text-white`} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-[#D9D6E8] text-[#6E6987]`}
      aria-hidden="true"
    />
  );
}

export function ChangePasswordForm() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [repeatError, setRepeatError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/masuk");
  }, [isPending, session, router]);

  const sameAsCurrent = password.length > 0 && password === current;
  const lengthOk = password.length >= MIN_LENGTH;
  const mixOk = hasLetterAndDigit(password);
  const differentOk = password.length > 0 && !sameAsCurrent;
  const score = strengthScore(password);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setCurrentError(null);
    setRepeatError(null);

    let valid = true;
    if (!current) {
      setCurrentError("Masukkan kata sandi saat ini.");
      valid = false;
    }
    if (!lengthOk || !mixOk || sameAsCurrent) valid = false;
    if (password !== repeat) {
      setRepeatError("Kata sandi belum sama. Ketik ulang dengan benar.");
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: password,
    });
    setSubmitting(false);

    if (error) {
      if (error.code === "INVALID_PASSWORD") {
        setCurrentError("Kata sandi saat ini salah.");
      } else {
        setFormError("Kata sandi belum bisa diubah. Coba lagi sebentar.");
      }
      return;
    }
    router.push("/profil");
  }

  if (isPending || !session) return null;

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-app">
      <nav className="absolute inset-x-0 top-0 z-10 h-14 bg-[rgba(246,245,251,0.92)] backdrop-blur-xl">
        <div className="relative flex h-14 items-center justify-between px-2">
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => router.push("/profil")}
            className="grid min-h-11 min-w-11 place-items-center rounded-[22px] px-2"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke={INK_SOFT}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <span className="pointer-events-none absolute inset-x-24 truncate text-center font-body text-[17px] font-semibold">
            Ubah kata sandi
          </span>
        </div>
      </nav>

      <form
        noValidate
        onSubmit={onSubmit}
        className="flex flex-1 flex-col overflow-y-auto px-4 pb-44 pt-[76px]"
      >
        <h1 className="m-0 font-display text-[34px] font-black leading-[41px]">
          Kata sandi baru
        </h1>
        <p className="mb-4 mt-1.5 text-[15px] leading-normal text-ink-soft">
          Pilih kata sandi yang belum pernah kamu pakai di tempat lain.
        </p>

        <div className="grid gap-5">
          <div>
            <label
              htmlFor="cp-now"
              className="mb-1.5 block font-body text-sm font-bold text-ink"
            >
              Kata sandi saat ini
            </label>
            <div
              className={`flex min-h-[52px] items-center rounded-[14px] border-[1.5px] bg-white pl-3.5 pr-1 focus-within:border-[#A5B4FC] focus-within:shadow-[0_0_0_4px_#EEEDFD] ${currentError ? "border-bad shadow-[0_0_0_4px_#FFF1F4]" : "border-line"}`}
            >
              <input
                id="cp-now"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                aria-invalid={!!currentError}
                className="h-12 min-w-0 flex-1 bg-transparent font-body text-[17px] text-ink outline-none placeholder:text-[#7D7896]"
              />
              <EyeButton
                shown={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
              />
            </div>
            {currentError && (
              <p
                role="alert"
                className="mx-0.5 mt-1.5 flex items-center gap-1.5 text-[13.5px] font-bold leading-[1.4] text-bad"
              >
                {currentError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="cp-new"
              className="mb-1.5 block font-body text-sm font-bold text-ink"
            >
              Kata sandi baru
            </label>
            <div
              className={`flex min-h-[52px] items-center rounded-[14px] border-[1.5px] bg-white pl-3.5 pr-1 focus-within:border-[#A5B4FC] focus-within:shadow-[0_0_0_4px_#EEEDFD] ${sameAsCurrent ? "border-bad shadow-[0_0_0_4px_#FFF1F4]" : "border-line"}`}
            >
              <input
                id="cp-new"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Masukkan kata sandi baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={sameAsCurrent}
                className="h-12 min-w-0 flex-1 bg-transparent font-body text-[17px] text-ink outline-none placeholder:text-[#7D7896]"
              />
              <EyeButton
                shown={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>
            {sameAsCurrent && (
              <p
                role="alert"
                className="mx-0.5 mt-1.5 flex items-center gap-1.5 text-[13.5px] font-bold leading-[1.4] text-bad"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                Harus berbeda dari kata sandi lama.
              </p>
            )}
            <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-[3px] ${i < score ? "bg-ok" : "bg-[#D9D6E8]"}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="cp-repeat"
              className="mb-1.5 block font-body text-sm font-bold text-ink"
            >
              Ulangi kata sandi baru
            </label>
            <div
              className={`flex min-h-[52px] items-center rounded-[14px] border-[1.5px] bg-white pl-3.5 pr-1 focus-within:border-[#A5B4FC] focus-within:shadow-[0_0_0_4px_#EEEDFD] ${repeatError ? "border-bad shadow-[0_0_0_4px_#FFF1F4]" : "border-line"}`}
            >
              <input
                id="cp-repeat"
                type={showRepeat ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Ketik ulang"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                aria-invalid={!!repeatError}
                className="h-12 min-w-0 flex-1 bg-transparent font-body text-[17px] text-ink outline-none placeholder:text-[#7D7896]"
              />
              <EyeButton
                shown={showRepeat}
                onToggle={() => setShowRepeat((v) => !v)}
              />
            </div>
            {repeatError && (
              <p
                role="alert"
                className="mx-0.5 mt-1.5 text-[13.5px] font-bold leading-[1.4] text-bad"
              >
                {repeatError}
              </p>
            )}
          </div>
        </div>

        <ul className="mt-6 grid gap-2.5" aria-label="Syarat kata sandi">
          <li
            className={`flex items-center gap-2.5 font-body text-[14.5px] font-semibold leading-[1.3] ${lengthOk ? "text-ok" : "text-ink-soft"}`}
          >
            <RuleIcon state={lengthOk ? "ok" : "todo"} />
            Minimal 8 karakter
          </li>
          <li
            className={`flex items-center gap-2.5 font-body text-[14.5px] font-semibold leading-[1.3] ${mixOk ? "text-ok" : "text-ink-soft"}`}
          >
            <RuleIcon state={mixOk ? "ok" : "todo"} />
            Memuat huruf dan angka
          </li>
          <li
            className={`flex items-center gap-2.5 font-body text-[14.5px] font-semibold leading-[1.3] ${sameAsCurrent ? "text-bad" : differentOk ? "text-ok" : "text-ink-soft"}`}
          >
            <RuleIcon
              state={sameAsCurrent ? "bad" : differentOk ? "ok" : "todo"}
            />
            Berbeda dari kata sandi lama
          </li>
        </ul>

        {formError && (
          <p role="alert" className="mt-4 text-sm font-bold text-bad">
            {formError}
          </p>
        )}
      </form>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-app from-70% to-app/0 px-4 pb-[30px] pt-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-ind font-display text-base font-black uppercase tracking-[0.05em] text-white shadow-[0_5px_0_#3730A3] disabled:opacity-60"
        >
          {submitting ? "Menyimpan…" : "Simpan kata sandi"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/profil")}
          className="mt-1.5 flex min-h-11 w-full items-center justify-center font-body text-[15px] font-bold text-ink-soft"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
