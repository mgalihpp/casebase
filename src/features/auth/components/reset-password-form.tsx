"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  buttonPrimary,
  fieldClass,
  inputClass,
  labelClass,
  pageClass,
} from "@/components/ui/styles";
import { authClient } from "@/lib/auth-client";

// Reached from the link in the reset email. Better Auth sends ?token=... on success
// and ?error=INVALID_TOKEN when the link is expired or already used.
const MIN_LENGTH = 8;

function hasLetterAndDigit(value: string) {
  return /[A-Za-z]/.test(value) && /\d/.test(value);
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
      className="grid min-h-11 min-w-11 place-items-center rounded-full text-ink-soft"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
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

function RuleItem({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li
      className={`flex items-center gap-2.5 text-[14.5px] font-semibold ${ok ? "text-ok" : "text-ink-soft"}`}
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${ok ? "bg-ok text-white" : "bg-[#D9D6E8] text-[#6E6987]"}`}
        aria-hidden="true"
      >
        {ok ? (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : null}
      </span>
      {children}
    </li>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [repeatError, setRepeatError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const linkInvalid = !token || linkError === "INVALID_TOKEN";
  const lengthOk = password.length >= MIN_LENGTH;
  const mixOk = hasLetterAndDigit(password);
  const strength = [lengthOk, mixOk].filter(Boolean).length;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setRepeatError(null);
    if (!lengthOk || !mixOk) return;
    if (password !== repeat) {
      setRepeatError("Kata sandi belum sama. Ketik ulang dengan benar.");
      return;
    }
    if (!token) return;

    setSubmitting(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setSubmitting(false);

    if (error) {
      setFormError("Kata sandi belum bisa diubah. Minta tautan baru ya.");
      return;
    }
    router.push("/masuk");
  }

  if (linkInvalid) {
    return (
      <div className={`${pageClass} gap-5 pt-[env(safe-area-inset-top)]`}>
        <div className="py-2">
          <Link href="/masuk" className="font-bold text-ind">
            Kembali
          </Link>
        </div>
        <h1 className="font-display text-[28px] font-black leading-tight">
          Tautannya sudah tidak berlaku
        </h1>
        <p className="text-[15px] text-ink-soft">
          Minta tautan baru dari halaman masuk.
        </p>
        <Link href="/masuk" className={buttonPrimary}>
          Ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div className={`${pageClass} pt-[env(safe-area-inset-top)]`}>
      <nav className="relative -mx-4 flex h-14 items-center justify-center border-b border-line bg-app/95 px-2">
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => router.push("/masuk")}
          className="absolute left-2 grid min-h-11 min-w-11 place-items-center rounded-full text-ink-soft"
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
        <span className="font-body text-[17px] font-semibold">
          Atur ulang kata sandi
        </span>
      </nav>

      <form
        noValidate
        onSubmit={onSubmit}
        className="flex flex-1 flex-col pb-40 pt-5"
      >
        <h1 className="font-display text-[34px] font-black leading-[41px]">
          Kata sandi baru
        </h1>
        <p className="mb-4 mt-1.5 text-[15px] leading-normal text-ink-soft">
          Pilih kata sandi yang belum pernah kamu pakai di tempat lain.
        </p>

        <div className="grid gap-5">
          <div>
            <label htmlFor="rp-pw" className={labelClass}>
              Kata sandi baru
            </label>
            <div className={fieldClass}>
              <input
                id="rp-pw"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Masukkan kata sandi baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <EyeButton
                shown={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full ${i < strength * 2 ? "bg-ok" : "bg-[#D9D6E8]"}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rp-repeat" className={labelClass}>
              Ulangi kata sandi baru
            </label>
            <div className={`${fieldClass} ${repeatError ? "border-bad" : ""}`}>
              <input
                id="rp-repeat"
                type={showRepeat ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Ketik ulang"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                aria-invalid={!!repeatError}
                className={inputClass}
              />
              <EyeButton
                shown={showRepeat}
                onToggle={() => setShowRepeat((v) => !v)}
              />
            </div>
            {repeatError && (
              <p
                role="alert"
                className="mt-1.5 px-1 text-sm font-bold text-bad"
              >
                {repeatError}
              </p>
            )}
          </div>
        </div>

        <ul className="mt-6 grid gap-2.5" aria-label="Syarat kata sandi">
          <RuleItem ok={lengthOk}>Minimal 8 karakter</RuleItem>
          <RuleItem ok={mixOk}>Memuat huruf dan angka</RuleItem>
        </ul>

        {formError && (
          <p role="alert" className="mt-4 px-1 text-sm font-bold text-bad">
            {formError}
          </p>
        )}
      </form>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] bg-linear-to-t from-app from-70% to-app/0 px-4 pb-8 pt-3">
        <button
          type="submit"
          onClick={onSubmit}
          disabled={submitting}
          className={buttonPrimary}
        >
          {submitting ? "Menyimpan…" : "Simpan kata sandi"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/masuk")}
          className="mt-1.5 min-h-11 w-full font-bold text-ink-soft"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
