import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { completeOnboarding } from "./mutations";
import { completeInput } from "./schemas";

export const onboardingRouter = createTRPCRouter({
  complete: protectedProcedure
    .input(completeInput)
    .mutation(({ ctx, input }) => completeOnboarding(ctx.user.id, input)),
});
