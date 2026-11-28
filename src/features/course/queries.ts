import { and, asc, count, eq } from "drizzle-orm";
import { nodeProgress } from "@/features/mission/schema";
import { db } from "@/server/db";
import { COURSES } from "./data";
import { computeNodeStatuses, type NodeStatus } from "./path";
import { caseContent, course } from "./schema";
import { caseBodySchema } from "./schemas";

export async function listCourses() {
  const rows = await db
    .select({ id: course.id, total: count(caseContent.id) })
    .from(course)
    .leftJoin(caseContent, eq(caseContent.courseId, course.id))
    .groupBy(course.id);
  const totals = new Map(rows.map((row) => [row.id, row.total]));

  return COURSES.map((item) => ({
    id: item.id,
    name: item.name,
    abbr: item.abbr,
    color: item.color,
    caseCount: totals.get(item.id) ?? 0,
  }));
}

// Kasus pertama kursus beserta status tiap node untuk pengguna ini.
// Mengembalikan null jika kursus belum punya kasus (keadaan "kasus sedang ditulis").
export async function loadCaseBundle(userId: string, courseId: string) {
  const [courseRow] = await db
    .select()
    .from(course)
    .where(eq(course.id, courseId))
    .limit(1);
  if (!courseRow) return null;

  const [caseRow] = await db
    .select()
    .from(caseContent)
    .where(eq(caseContent.courseId, courseId))
    .orderBy(asc(caseContent.number))
    .limit(1);
  if (!caseRow)
    return { course: courseRow, caseRow: null, body: null, statuses: null };

  const body = caseBodySchema.parse(caseRow.body);
  const completed = await db
    .select({ nodeKey: nodeProgress.nodeKey })
    .from(nodeProgress)
    .where(
      and(eq(nodeProgress.userId, userId), eq(nodeProgress.caseId, caseRow.id)),
    );
  const statuses = computeNodeStatuses(
    body.nodes,
    new Set(completed.map((row) => row.nodeKey)),
  );

  return { course: courseRow, caseRow, body, statuses };
}

export type LoadedCase = NonNullable<
  Awaited<ReturnType<typeof loadCaseBundle>>
>;

export function statusOf(statuses: Map<string, NodeStatus>, key: string) {
  return statuses.get(key) ?? "locked";
}
