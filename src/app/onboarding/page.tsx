import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";
import { auth } from "@/lib/auth";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/belajar");

  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}
