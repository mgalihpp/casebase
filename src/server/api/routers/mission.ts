import { checkAnswer } from "@/features/mission/mutations";
import { startMission } from "@/features/mission/queries";
import { checkInput, startInput } from "@/features/mission/schemas";
import { authedProcedure, createTRPCRouter } from "../trpc";

export const missionRouter = createTRPCRouter({
  start: authedProcedure
    .input(startInput)
    .query(({ input, ctx }) => startMission(ctx.user.id, input)),

  check: authedProcedure
    .input(checkInput)
    .mutation(({ input, ctx }) => checkAnswer(ctx.user.id, input)),
});
