import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const systemRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    ok: true,
    at: new Date().toISOString(),
  })),
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => ({ greeting: `Halo, ${input.name}` })),
});
