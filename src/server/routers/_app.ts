import { z } from "zod";
import { classRouter } from "@/features/class";
import { onboardingRouter } from "@/features/onboarding/router";
import { profileRouter } from "@/features/profile";
import { baseProcedure, createTRPCRouter } from "@/server/trpc";

export const appRouter = createTRPCRouter({
  health: baseProcedure.query(() => ({
    ok: true,
    at: new Date().toISOString(),
  })),
  hello: baseProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => ({ greeting: `Halo, ${input.name}` })),
  class: classRouter,
  onboarding: onboardingRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
