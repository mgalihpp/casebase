import { and, asc, count, eq, inArray } from "drizzle-orm";
import { nodeFailure, nodeProgress } from "@/features/mission/schema";
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

export type CaseListItem = {
  id: string;
  number: string;
  title: string;
  status: "done" | "current" | "locked";
};

// Kasus yang sedang dikerjakan: kasus pertama yang belum tuntas, atau kasus terakhir jika semua tuntas.
// Mengembalikan caseRow null jika kursus belum punya kasus (keadaan "kasus sedang ditulis").
export async function loadCaseBundle(userId: string, courseId: string) {
  const [courseRow] = await db
    .select()
    .from(course)
    .where(eq(course.id, courseId))
    .limit(1);
  if (!courseRow) return null;

  const caseRows = await db
    .select()
    .from(caseContent)
    .where(eq(caseContent.courseId, courseId))
    .orderBy(asc(caseContent.number));
  if (caseRows.length === 0)
    return {
      course: courseRow,
      caseRow: null,
      body: null,
      statuses: null,
      cases: [] as CaseListItem[],
    };

  const progress = await db
    .select({ caseId: nodeProgress.caseId, nodeKey: nodeProgress.nodeKey })
    .from(nodeProgress)
    .where(
      and(
        eq(nodeProgress.userId, userId),
        inArray(
          nodeProgress.caseId,
          caseRows.map((row) => row.id),
        ),
      ),
    );
  const completedByCase = new Map<string, Set<string>>();
  for (const row of progress) {
    const keys = completedByCase.get(row.caseId) ?? new Set<string>();
    keys.add(row.nodeKey);
    completedByCase.set(row.caseId, keys);
  }
  const isComplete = (row: (typeof caseRows)[number]) => {
    const keys = completedByCase.get(row.id);
    return row.body.nodes
      .filter((node) => node.type !== "chest")
      .every((node) => keys?.has(node.key));
  };

  const firstOpen = caseRows.findIndex((row) => !isComplete(row));
  const selectedIndex = firstOpen === -1 ? caseRows.length - 1 : firstOpen;
  const caseRow = caseRows[selectedIndex];
  const cases = caseRows.map(
    (row, index): CaseListItem => ({
      id: row.id,
      number: row.number,
      title: row.title,
      status: isComplete(row)
        ? "done"
        : index === selectedIndex
          ? "current"
          : "locked",
    }),
  );

  const body = caseBodySchema.parse(caseRow.body);
  const failed = await db
    .select({ nodeKey: nodeFailure.nodeKey })
    .from(nodeFailure)
    .where(
      and(eq(nodeFailure.userId, userId), eq(nodeFailure.caseId, caseRow.id)),
    );
  const statuses = computeNodeStatuses(
    body.nodes,
    completedByCase.get(caseRow.id) ?? new Set<string>(),
    new Set(failed.map((row) => row.nodeKey)),
  );

  return { course: courseRow, caseRow, body, statuses, cases };
}

export type LoadedCase = NonNullable<
  Awaited<ReturnType<typeof loadCaseBundle>>
>;

export function statusOf(statuses: Map<string, NodeStatus>, key: string) {
  return statuses.get(key) ?? "locked";
}
