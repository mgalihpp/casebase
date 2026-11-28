import { classRouter } from "./routers/class";
import { courseRouter } from "./routers/course";
import { missionRouter } from "./routers/mission";
import { onboardingRouter } from "./routers/onboarding";
import { profileRouter } from "./routers/profile";
import { progressRouter } from "./routers/progress";
import { systemRouter } from "./routers/system";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  system: systemRouter,
  class: classRouter,
  onboarding: onboardingRouter,
  profile: profileRouter,
  course: courseRouter,
  mission: missionRouter,
  progress: progressRouter,
});

export type AppRouter = typeof appRouter;
