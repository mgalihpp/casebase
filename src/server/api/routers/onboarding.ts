import { completeOnboarding } from "@/features/onboarding/mutations";
import { completeInput } from "@/features/onboarding/schemas";
import { authedProcedure, createTRPCRouter } from "../trpc";

export const onboardingRouter = createTRPCRouter({
  complete: authedProcedure
    .input(completeInput)
    .mutation(({ ctx, input }) => completeOnboarding(ctx.user.id, input)),
});
