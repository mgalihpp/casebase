import { deleteAccount, updateProfile } from "@/features/profile/mutations";
import { getMyProfile } from "@/features/profile/queries";
import { updateInput } from "@/features/profile/schemas";
import { authedProcedure, createTRPCRouter } from "../trpc";

export const profileRouter = createTRPCRouter({
  me: authedProcedure.query(async ({ ctx }) => {
    return getMyProfile(ctx.user.id);
  }),

  update: authedProcedure
    .input(updateInput)
    .mutation(async ({ ctx, input }) => {
      await updateProfile(ctx.user.id, input);
      return { ok: true };
    }),

  delete: authedProcedure.mutation(async ({ ctx }) => {
    await deleteAccount(ctx.user.id);
    return { ok: true };
  }),
});
