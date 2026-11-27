import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";
import { ZodError, z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

export const createTRPCContext = cache(async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });
  return { db, headers: opts.headers, session };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? z.flattenError(error.cause)
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Masuk dulu ya." });
  }
  return next({
    ctx: { ...ctx, session: ctx.session, user: ctx.session.user },
  });
});
