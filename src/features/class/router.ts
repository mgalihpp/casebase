import { TRPCError } from "@trpc/server";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc";
import { joinClass } from "./mutations";
import { lookupClass } from "./queries";
import { joinInput, lookupInput } from "./schemas";

const CLASS_NOT_FOUND =
  "Kode itu tidak ditemukan. Cek lagi ke dosen atau asistenmu.";

export const classRouter = createTRPCRouter({
  lookup: baseProcedure.input(lookupInput).query(async ({ input }) => {
    const classroom = await lookupClass(input);
    if (!classroom) {
      throw new TRPCError({ code: "NOT_FOUND", message: CLASS_NOT_FOUND });
    }
    return classroom;
  }),

  join: protectedProcedure.input(joinInput).mutation(async ({ input, ctx }) => {
    const joined = await joinClass(ctx.user.id, input.code);
    if (!joined) {
      throw new TRPCError({ code: "NOT_FOUND", message: CLASS_NOT_FOUND });
    }
    return { ok: true };
  }),
});
