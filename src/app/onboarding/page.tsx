import { Suspense } from "react";
import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}
