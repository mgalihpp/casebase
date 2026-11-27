import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "@/server/trpc";

export const appRouter = createTRPCRouter({
  health: baseProcedure.query(() => ({
    ok: true,
    at: new Date().toISOString(),
  })),
  hello: baseProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => ({ greeting: `Halo, ${input.name}` })),
});

export type AppRouter = typeof appRouter;
