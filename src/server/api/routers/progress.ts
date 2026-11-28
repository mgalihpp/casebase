import { eq } from "drizzle-orm";
import { nodeProgress } from "@/features/mission/schema";
import { computeStreak, toJakartaDate } from "@/features/progress/streak";
import { db } from "@/server/db";
import { authedProcedure, createTRPCRouter } from "../trpc";

export const progressRouter = createTRPCRouter({
  streak: authedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({ completedAt: nodeProgress.completedAt })
      .from(nodeProgress)
      .where(eq(nodeProgress.userId, ctx.user.id));

    const dates = [
      ...new Set(rows.map((row) => toJakartaDate(row.completedAt))),
    ]
      .sort()
      .reverse();
    const today = toJakartaDate(new Date());

    return {
      streak: computeStreak(dates, today),
      doneToday: dates.includes(today),
    };
  }),
});
