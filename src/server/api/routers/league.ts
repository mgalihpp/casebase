import { classBoard, leagueBoard } from "@/features/mission/league";
import { authedProcedure, createTRPCRouter } from "../trpc";

export const leagueRouter = createTRPCRouter({
  board: authedProcedure.query(({ ctx }) =>
    leagueBoard(ctx.user.id, new Date()),
  ),

  classBoard: authedProcedure.query(({ ctx }) => classBoard(ctx.user.id)),
});
