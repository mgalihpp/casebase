"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonPrimary, pageClass } from "@/components/ui/styles";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { toCompletePayload, useOnboardingStore } from "../store";

type Status = "loading" | "saving" | "error";

// Destination after sign-up or sign-in. If guest onboarding choices are still in the store,
// they are sent to the server first, then the user is taken to the profile page.
export function FinishOnboarding() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: session, isPending } = authClient.useSession();
  const completeMutation = useMutation(
    trpc.onboarding.complete.mutationOptions(),
  );
  const [status, setStatus] = useState<Status>("loading");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useOnboardingStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: completeMutation is stable; run once when data is ready.
  useEffect(() => {
    if (isPending || !hydrated) return;
    if (!session) {
      router.replace("/masuk");
      return;
    }

    const payload = toCompletePayload(useOnboardingStore.getState());
    if (!payload) {
      router.replace("/profil");
      return;
    }

    setStatus("saving");
    completeMutation
      .mutateAsync(payload)
      .then(() => {
        useOnboardingStore.getState().reset();
        router.replace(`/belajar/${payload.course}`);
      })
      .catch(() => setStatus("error"));
    // completeMutation is stable across renders; run once when the data is ready.
  }, [isPending, session, hydrated, router]);

  return (
    <div
      className={`${pageClass} anim-tab-in items-center justify-center gap-4 text-center`}
    >
      {status === "error" ? (
        <>
          <p role="alert" className="font-body font-bold text-bad">
            Progresmu belum tersimpan. Progres di browser aman, coba lagi ya.
          </p>
          <button
            type="button"
            className={buttonPrimary}
            onClick={() => window.location.reload()}
          >
            Coba lagi
          </button>
        </>
      ) : (
        <p
          key={status}
          role="status"
          className="anim-fade-in font-body text-ink-soft"
        >
          {status === "saving" ? "Menyiapkan berkasmu…" : "Memuat akun…"}
        </p>
      )}
    </div>
  );
}
