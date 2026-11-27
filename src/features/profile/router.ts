import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { deleteAccount, updateProfile } from "./mutations";
import { getMyProfile } from "./queries";
import { updateInput } from "./schemas";

export const profileRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return getMyProfile(ctx.user.id);
  }),

  update: protectedProcedure
    .input(updateInput)
    .mutation(async ({ ctx, input }) => {
      await updateProfile(ctx.user.id, input);
      return { ok: true };
    }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteAccount(ctx.user.id);
    return { ok: true };
  }),
});
