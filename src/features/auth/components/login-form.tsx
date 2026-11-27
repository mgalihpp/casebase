"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ForgotPasswordSheet } from "./forgot-password-sheet";
import { GoogleSignInButton } from "./google-sign-in-button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError("Email dan kata sandi wajib diisi.");
      return;
    }

    setSubmitting(true);
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (error) {
      setFormError("Email atau kata sandi salah. Coba lagi.");
      return;
    }
    router.push("/onboarding/selesai");
  }

  return (
    <div className={`${pageClass} pt-[env(safe-area-inset-top)]`}>
      <div className="py-2">
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => router.push("/")}
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

      <form
        noValidate
        onSubmit={onSubmit}
        className="flex flex-1 flex-col gap-4 pt-2"
      >
        <div className="flex items-center gap-3">
          <Mascot name="Dibi" size={76} mood={formError ? "sad" : "wave"} />
          <div>
            <h1 className="font-display text-[28px] font-black leading-tight">
              Masuk
            </h1>
            <p className="mt-1 text-[15px] text-ink-soft">
              Kasusmu sudah menunggu, detektif.
            </p>
          </div>
        </div>

        <GoogleSignInButton callbackURL="/onboarding/selesai" />

        <div
          className="flex items-center gap-3 text-sm text-ink-soft"
          aria-hidden="true"
        >
          <span className="h-px flex-1 bg-line" />
          atau pakai email
          <span className="h-px flex-1 bg-line" />
        </div>

        <div>
          <label htmlFor="li-email" className={labelClass}>
            Email
          </label>
          <div className={fieldClass}>
            <input
              id="li-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nama@kampus.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="li-pw" className={labelClass}>
            Kata sandi
          </label>
          <div className={fieldClass}>
            <input
              id="li-pw"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Kata sandimu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                setForgotOpen(true);
              }}
              className="min-h-11 font-bold text-ind"
            >
              Lupa kata sandi?
            </button>
          </div>
        </div>

        {notice && (
          <p role="status" className="px-1 text-sm font-bold text-ok">
            {notice}
          </p>
        )}

        {formError && (
          <p role="alert" className="px-1 text-sm font-bold text-bad">
            {formError}
          </p>
        )}

        <div className="mt-auto pb-6 pt-2">
          <button type="submit" className={buttonPrimary} disabled={submitting}>
            {submitting ? "Memeriksa…" : "Masuk"}
          </button>
          <p className="mt-4 text-center text-sm text-ink-soft">
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-bold text-ind">
              Daftar
            </Link>
          </p>
        </div>
      </form>

      {forgotOpen && (
        <ForgotPasswordSheet
          initialEmail={email}
          onClose={() => setForgotOpen(false)}
          onSent={(sentTo) => {
            setForgotOpen(false);
            setNotice(`Tautan dikirim ke ${sentTo}. Cek kotak masukmu.`);
          }}
        />
      )}
    </div>
  );
}
