"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Mascot } from "@/components/ui/mascot";
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
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const linkInvalid = !token || linkError === "INVALID_TOKEN";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldError(null);
    if (password.length < 8) {
      setFieldError("Kata sandi minimal 8 karakter.");
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
      setFormError("Kata sandi belum bisa diubah. Coba minta tautan baru.");
      return;
    }
    router.push("/masuk");
  }

  return (
    <div className={`${pageClass} pt-[env(safe-area-inset-top)]`}>
      <div className="py-2">
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => router.push("/masuk")}
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
      </div>

      <div className="flex items-center gap-3">
        <Mascot name="Dibi" size={76} mood={linkInvalid ? "sad" : "idle"} />
        <div>
          <h1 className="font-display text-[28px] font-black leading-tight">
            Atur ulang kata sandi
          </h1>
          <p className="mt-1 text-[15px] text-ink-soft">
            {linkInvalid
              ? "Tautannya sudah tidak berlaku."
              : "Buat kata sandi baru untuk akunmu."}
          </p>
        </div>
      </div>

      {linkInvalid ? (
        <div className="mt-6 grid gap-3">
          <Link href="/masuk" className={buttonPrimary}>
            Kembali ke halaman masuk
          </Link>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div>
            <label htmlFor="rp-pw" className={labelClass}>
              Kata sandi baru
            </label>
            <div className={fieldClass}>
              <input
                id="rp-pw"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldError}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="min-h-11 px-2 font-bold text-ind"
              >
                {showPassword ? "Sembunyikan" : "Lihat"}
              </button>
            </div>
            {fieldError && (
              <p
                role="alert"
                className="mt-1.5 px-1 text-sm font-bold text-bad"
              >
                {fieldError}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="px-1 text-sm font-bold text-bad">
              {formError}
            </p>
          )}

          <button type="submit" className={buttonPrimary} disabled={submitting}>
            {submitting ? "Menyimpan…" : "Simpan kata sandi baru"}
          </button>
        </form>
      )}
    </div>
  );
}
