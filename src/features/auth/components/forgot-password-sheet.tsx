"use client";

import { type FormEvent, useState } from "react";
import {
  buttonPrimary,
  fieldClass,
  inputClass,
  labelClass,
} from "@/components/ui/styles";
import { authClient } from "@/lib/auth-client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  initialEmail: string;
  onSent: (email: string) => void;
  onClose: () => void;
};

// Bottom sheet for "Lupa kata sandi?". Sends a reset link via Resend.
export function ForgotPasswordSheet({ initialEmail, onSent, onClose }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setInvalid(true);
      return;
    }

    setSubmitting(true);
    const { error } = await authClient.requestPasswordReset({
      email: trimmed,
      redirectTo: "/masuk",
    });
    setSubmitting(false);

    if (error) {
      setFormError("Tautan belum bisa dikirim. Coba lagi sebentar.");
      return;
    }
    onSent(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-title"
        className="w-full rounded-t-3xl bg-white px-5 pb-8 pt-3"
      >
        <div
          className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line"
          aria-hidden="true"
        />
        <h2 id="forgot-title" className="font-display text-2xl font-black">
          Atur ulang kata sandi
        </h2>
        <form noValidate onSubmit={onSubmit} className="mt-3 grid gap-3">
          <p className="text-[15px] text-ink-soft">
            Masukkan email akunmu. Kami kirim tautan untuk membuat kata sandi
            baru.
          </p>
          <div>
            <label htmlFor="fg-email" className={labelClass}>
              Email
            </label>
            <div className={fieldClass}>
              <input
                id="fg-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="nama@kampus.ac.id"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setInvalid(false);
                }}
                aria-invalid={invalid}
                className={inputClass}
              />
            </div>
            {invalid && (
              <p
                role="alert"
                className="mt-1.5 px-1 text-sm font-bold text-bad"
              >
                Format email belum benar, contoh nama@kampus.ac.id.
              </p>
            )}
          </div>
          {formError && (
            <p role="alert" className="px-1 text-sm font-bold text-bad">
              {formError}
            </p>
          )}
          <button type="submit" className={buttonPrimary} disabled={submitting}>
            {submitting ? "Mengirim…" : "Kirim tautan"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 text-center font-bold text-ind"
          >
            Batal
          </button>
        </form>
      </div>
    </div>
  );
}
