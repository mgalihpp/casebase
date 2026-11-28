import { checkAnswer, failMission } from "@/features/mission/mutations";
import { getHint, startMission } from "@/features/mission/queries";
import { checkInput, hintInput, startInput } from "@/features/mission/schemas";
import { authedProcedure, createTRPCRouter } from "../trpc";

export const missionRouter = createTRPCRouter({
  start: authedProcedure
    .input(startInput)
    .query(({ input, ctx }) => startMission(ctx.user.id, input)),

  hint: authedProcedure
    .input(hintInput)
    .query(({ input, ctx }) => getHint(ctx.user.id, input)),

  check: authedProcedure
    .input(checkInput)
    .mutation(({ input, ctx }) => checkAnswer(ctx.user.id, input)),

  fail: authedProcedure
    .input(startInput)
    .mutation(({ input, ctx }) => failMission(ctx.user.id, input)),
});
