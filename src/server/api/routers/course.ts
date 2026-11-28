import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  listCourses,
  loadCaseBundle,
  statusOf,
} from "@/features/course/queries";
import { authedProcedure, createTRPCRouter } from "../trpc";

export const courseRouter = createTRPCRouter({
  list: authedProcedure.query(() => listCourses()),

  path: authedProcedure
    .input(z.object({ courseId: z.string().min(1).max(32) }))
    .query(async ({ input, ctx }) => {
      const bundle = await loadCaseBundle(ctx.user.id, input.courseId);
      if (!bundle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kursus tidak ditemukan.",
        });
      }
      if (!bundle.body || !bundle.caseRow || !bundle.statuses) {
        return {
          course: bundle.course,
          case: null,
          nodes: [],
          done: 0,
          total: 0,
        };
      }

      const { statuses } = bundle;
      const nodes = bundle.body.nodes.map((node) => ({
        key: node.key,
        type: node.type,
        title: node.title ?? null,
        topic: node.topic ?? null,
        coins: node.coins ?? null,
        status: statusOf(statuses, node.key),
      }));

      return {
        course: bundle.course,
        case: {
          number: bundle.body.number,
          title: bundle.body.title,
          story: bundle.body.story,
        },
        nodes,
        done: nodes.filter((node) => node.status === "done").length,
        total: nodes.length,
      };
    }),
});
