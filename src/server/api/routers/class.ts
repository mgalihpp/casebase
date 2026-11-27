import { TRPCError } from "@trpc/server";
import { joinClass } from "@/features/class/mutations";
import { lookupClass } from "@/features/class/queries";
import { joinInput, lookupInput } from "@/features/class/schemas";
import { authedProcedure, createTRPCRouter, publicProcedure } from "../trpc";

const CLASS_NOT_FOUND =
  "Kode itu tidak ditemukan. Cek lagi ke dosen atau asistenmu.";

export const classRouter = createTRPCRouter({
  lookup: publicProcedure.input(lookupInput).query(async ({ input }) => {
    const classroom = await lookupClass(input);
    if (!classroom) {
      throw new TRPCError({ code: "NOT_FOUND", message: CLASS_NOT_FOUND });
    }
    return classroom;
  }),

  join: authedProcedure.input(joinInput).mutation(async ({ input, ctx }) => {
    const joined = await joinClass(ctx.user.id, input.code);
    if (!joined) {
      throw new TRPCError({ code: "NOT_FOUND", message: CLASS_NOT_FOUND });
    }
    return { ok: true };
  }),
});
