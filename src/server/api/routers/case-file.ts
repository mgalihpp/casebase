import { z } from "zod";
import {
  getFile,
  listFiles,
  restoreFile,
  updateFile,
} from "@/features/mission/case-file";
import { authedProcedure, createTRPCRouter } from "../trpc";

export const caseFileRouter = createTRPCRouter({
  list: authedProcedure
    .input(
      z.object({
        status: z.enum(["semua", "aktif", "arsip", "selesai"]).default("semua"),
        course: z.string().nullable().default(null),
        q: z.string().max(100).default(""),
      }),
    )
    .query(({ ctx, input }) => listFiles(ctx.user.id, input)),

  get: authedProcedure
    .input(z.object({ caseId: z.string().min(1) }))
    .query(({ ctx, input }) => getFile(ctx.user.id, input.caseId)),

  update: authedProcedure
    .input(
      z.object({
        caseId: z.string().min(1),
        pinned: z.boolean().optional(),
        archived: z.boolean().optional(),
        deleted: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { caseId, ...patch } = input;
      return updateFile(ctx.user.id, caseId, patch);
    }),

  restore: authedProcedure
    .input(z.object({ caseId: z.string().min(1) }))
    .mutation(({ ctx, input }) => restoreFile(ctx.user.id, input.caseId)),
});
