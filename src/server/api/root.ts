import { classRouter } from "./routers/class";
import { onboardingRouter } from "./routers/onboarding";
import { profileRouter } from "./routers/profile";
import { systemRouter } from "./routers/system";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  system: systemRouter,
  class: classRouter,
  onboarding: onboardingRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
