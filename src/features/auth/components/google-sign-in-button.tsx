"use client";

import { buttonSecondary } from "@/components/ui/styles";
import { authClient } from "@/lib/auth-client";

export function GoogleSignInButton({ callbackURL }: { callbackURL: string }) {
  return (
    <button
      type="button"
      className={buttonSecondary}
      onClick={() =>
        authClient.signIn.social({ provider: "google", callbackURL })
      }
    >
      Lanjutkan dengan Google
    </button>
  );
}
