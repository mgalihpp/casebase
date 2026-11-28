"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Mascot } from "@/components/ui/mascot";
import {
  buttonPrimary,
  fieldClass,
  fieldClassFor,
  inputClass,
  labelClass,
  pageClass,
} from "@/components/ui/styles";
import { authClient } from "@/lib/auth-client";
import { markBackNavigation } from "@/lib/nav-direction";
import { GoogleSignInButton } from "./google-sign-in-button";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

function validate(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = "Nama wajib diisi.";
  if (!EMAIL_PATTERN.test(email.trim()))
    errors.email = "Email belum benar. Contoh: nama@kampus.ac.id";
  if (password.length < 8) errors.password = "Kata sandi minimal 8 karakter.";
  return errors;
}

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function continueAsGuest() {
    setFormError(null);
    setSubmitting(true);
    const { error } = await authClient.signIn.anonymous();
    setSubmitting(false);

    if (error) {
      setFormError("Belum bisa mulai sekarang. Coba lagi sebentar.");
      setAttempt((value) => value + 1);
      return;
    }
    router.push("/onboarding/selesai");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setAttempt((n) => n + 1);
    const errors = validate(name, email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (error) {
      setFormError(
        error.status === 422 || error.code === "USER_ALREADY_EXISTS"
          ? "Email ini sudah terdaftar. Coba masuk saja."
          : "Akun belum bisa dibuat. Coba lagi sebentar.",
      );
      return;
    }
    router.push("/onboarding/selesai");
  }

  return (
    <div
      className={`${pageClass} anim-slide-in-right pt-[env(safe-area-inset-top)]`}
    >
      <div className="py-2">
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => {
            markBackNavigation();
            router.push("/");
          }}
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
          <Mascot name="Dibi" size={76} mood="happy" />
          <div>
            <h1 className="font-display text-[28px] font-black leading-tight">
              Simpan progresmu
            </h1>
            <p className="mt-1 text-[15px] text-ink-soft">
              Lentera, XP, dan berkas kasusmu tersimpan di akun, bisa dibuka
              dari HP mana pun.
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
          <label htmlFor="su-name" className={labelClass}>
            Nama
          </label>
          <div className={fieldClassFor(!!fieldErrors.name)}>
            <input
              id="su-name"
              type="text"
              autoComplete="name"
              placeholder="Nama panggilanmu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "su-name-err" : undefined}
              className={inputClass}
            />
          </div>
          {fieldErrors.name && (
            <p
              key={attempt}
              id="su-name-err"
              role="alert"
              className="mt-1.5 px-1 text-sm font-bold text-bad"
            >
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="su-email" className={labelClass}>
            Email
          </label>
          <div className={fieldClassFor(!!fieldErrors.email)}>
            <input
              id="su-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nama@kampus.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "su-email-err" : undefined}
              className={inputClass}
            />
          </div>
          {fieldErrors.email && (
            <p
              key={attempt}
              id="su-email-err"
              role="alert"
              className="mt-1.5 px-1 text-sm font-bold text-bad"
            >
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="su-pw" className={labelClass}>
            Kata sandi
          </label>
          <div className={fieldClassFor(!!fieldErrors.password)}>
            <input
              id="su-pw"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "su-pw-err" : undefined}
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
          {fieldErrors.password && (
            <p
              key={attempt}
              id="su-pw-err"
              role="alert"
              className="mt-1.5 px-1 text-sm font-bold text-bad"
            >
              {fieldErrors.password}
            </p>
          )}
        </div>

        <p className="px-1 text-sm leading-relaxed text-ink-soft">
          Dengan membuat akun, kamu setuju dengan{" "}
          <Link href="/ketentuan" className="font-bold text-ind underline">
            Ketentuan Layanan
          </Link>{" "}
          dan{" "}
          <Link href="/privasi" className="font-bold text-ind underline">
            Kebijakan Privasi
          </Link>{" "}
          SQL Quest.
        </p>

        {formError && (
          <p
            key={attempt}
            role="alert"
            className="px-1 text-sm font-bold text-bad"
          >
            {formError}
          </p>
        )}

        <div className="mt-auto pb-6 pt-2">
          <button type="submit" className={buttonPrimary} disabled={submitting}>
            {submitting ? "Membuat akun…" : "Buat akun"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={continueAsGuest}
            className="mt-3 min-h-11 w-full text-center font-bold text-ind"
          >
            Nanti saja
          </button>
          <p className="mt-4 text-center text-sm text-ink-soft">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-bold text-ind">
              Masuk
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
