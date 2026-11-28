"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  buttonGhost,
  buttonSecondary,
  fieldClass,
  inputClass,
  labelClass,
  pageClass,
} from "@/components/ui/styles";
import {
  DAILY_TARGET_OPTIONS,
  type DailyTarget,
  REMINDER_OPTIONS,
  type ReminderKey,
} from "@/features/onboarding/data";
import {
  ProfileHero,
  ProfileSkeleton,
} from "@/features/profile/components/profile-hero";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

type Confirm = "delete-account" | null;

export function ProfileView() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const profileQuery = useQuery({
    ...trpc.profile.me.queryOptions(),
    enabled: !!session,
  });
  const updateProfile = useMutation(trpc.profile.update.mutationOptions());
  const deleteAccount = useMutation(trpc.profile.delete.mutationOptions());
  const joinClass = useMutation(trpc.class.join.mutationOptions());

  const [classCode, setClassCode] = useState("");
  const [classError, setClassError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!sessionPending && !session) router.replace("/masuk");
  }, [session, sessionPending, router]);

  const data = profileQuery.data;
  const loading = sessionPending || (session && profileQuery.isPending);

  async function changeSettings(input: {
    dailyTarget?: DailyTarget;
    reminder?: ReminderKey | null;
  }) {
    setError(null);
    try {
      await updateProfile.mutateAsync(input);
      await profileQuery.refetch();
    } catch {
      setError("Perubahan belum tersimpan. Coba lagi.");
    }
  }

  async function handleJoinClass() {
    setClassError(null);
    setAttempt((n) => n + 1);
    const code = classCode.trim();
    if (!code) return;
    try {
      await joinClass.mutateAsync({ code });
      setClassCode("");
      await profileQuery.refetch();
    } catch (err) {
      setClassError(
        err instanceof Error
          ? err.message
          : "Kode itu tidak ditemukan. Cek lagi ke dosen atau asistenmu.",
      );
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/");
  }

  async function handleDeleteAccount() {
    setError(null);
    try {
      await deleteAccount.mutateAsync();
      await authClient.signOut().catch(() => undefined);
      router.replace("/");
    } catch {
      setError("Akun belum bisa dihapus. Coba lagi.");
    }
  }

  return (
    <div className={`${pageClass} anim-tab-in pt-8 pb-28`}>
      <h1 className="pt-0.5 font-display text-[34px] leading-[41px] font-black tracking-[0.2px]">
        Profil
      </h1>

      {loading ? <ProfileSkeleton /> : null}
      {!loading && data ? (
        <>
          <ProfileHero data={data} onSignOut={handleSignOut} />

          <section
            aria-labelledby="daily-target"
            className="anim-row-in mt-6 rounded-2xl border-2 border-line bg-white p-4"
          >
            <h2 id="daily-target" className="font-display text-lg font-black">
              Target harian
            </h2>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {DAILY_TARGET_OPTIONS.map(([value]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={data.dailyTarget === value}
                  onClick={() => changeSettings({ dailyTarget: value })}
                  className={`min-h-11 rounded-xl border-2 text-sm font-bold ${data.dailyTarget === value ? "border-ind bg-ind-soft" : "border-line"}`}
                >
                  {value} mnt
                </button>
              ))}
            </div>
          </section>

          <section
            style={{ animationDelay: "0.07s" }}
            aria-labelledby="reminder"
            className="anim-row-in rounded-2xl border-2 border-line bg-white p-4"
          >
            <h2 id="reminder" className="font-display text-lg font-black">
              Pengingat
            </h2>
            <div className="mt-3 grid gap-2">
              {REMINDER_OPTIONS.map(([value, title]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={data.reminder === value}
                  onClick={() => changeSettings({ reminder: value })}
                  className={`min-h-11 rounded-xl border-2 px-3 text-left font-bold ${data.reminder === value ? "border-ind bg-ind-soft" : "border-line"}`}
                >
                  {title}
                </button>
              ))}
              {data.reminder && (
                <button
                  type="button"
                  className={buttonGhost}
                  onClick={() => changeSettings({ reminder: null })}
                >
                  Matikan pengingat
                </button>
              )}
            </div>
          </section>

          <section
            style={{ animationDelay: "0.14s" }}
            aria-labelledby="class"
            className="anim-row-in rounded-2xl border-2 border-line bg-white p-4"
          >
            <h2 id="class" className="font-display text-lg font-black">
              Kelas
            </h2>
            {data.classroom ? (
              <p className="mt-2 text-ink-soft">
                {data.classroom.name} · {data.classroom.lecturer}
              </p>
            ) : (
              <div className="mt-3">
                <label htmlFor="profile-class-code" className={labelClass}>
                  Kode kelas
                </label>
                <div className={fieldClass}>
                  <input
                    id="profile-class-code"
                    type="text"
                    autoCapitalize="characters"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {classError && (
                  <p
                    key={attempt}
                    role="alert"
                    className="mt-2 text-sm font-bold text-bad"
                  >
                    {classError}
                  </p>
                )}
                <button
                  type="button"
                  className={`${buttonSecondary} mt-3`}
                  onClick={handleJoinClass}
                >
                  Gabung kelas
                </button>
              </div>
            )}
          </section>

          {error && (
            <p role="alert" className="text-sm font-bold text-bad">
              {error}
            </p>
          )}

          <section className="anim-row-in grid gap-3 pb-8">
            {confirm === "delete-account" ? (
              <div className="grid gap-2 rounded-2xl border-2 border-bad bg-white p-4">
                <p className="font-bold text-bad">
                  Hapus akun? Semua progres, berkas, dan keanggotaan kelas akan
                  hilang dan tidak bisa dikembalikan.
                </p>
                <button
                  type="button"
                  className="flex min-h-13 w-full items-center justify-center rounded-2xl bg-bad font-display font-black text-white"
                  onClick={handleDeleteAccount}
                >
                  Ya, hapus akun saya
                </button>
                <button
                  type="button"
                  className={buttonGhost}
                  onClick={() => setConfirm(null)}
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={buttonGhost}
                onClick={() => setConfirm("delete-account")}
              >
                Hapus akun
              </button>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
