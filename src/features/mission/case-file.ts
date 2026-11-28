import "server-only";

import { TRPCError } from "@trpc/server";
import { and, asc, count, eq } from "drizzle-orm";
import { caseContent, course } from "@/features/course/schema";
import { db } from "@/server/db";
import { caseFile, nodeProgress } from "./schema";

export type FileStatus = "aktif" | "arsip" | "selesai";

type Patch = { pinned?: boolean; archived?: boolean; deleted?: boolean };

async function stateMap(userId: string) {
  const rows = await db
    .select()
    .from(caseFile)
    .where(eq(caseFile.userId, userId));
  return new Map(rows.map((row) => [row.caseId, row]));
}

async function progressMap(userId: string) {
  const rows = await db
    .select({ caseId: nodeProgress.caseId, done: count(nodeProgress.nodeKey) })
    .from(nodeProgress)
    .where(eq(nodeProgress.userId, userId))
    .groupBy(nodeProgress.caseId);
  return new Map(rows.map((row) => [row.caseId, row.done]));
}

async function allCases() {
  return db
    .select({
      id: caseContent.id,
      courseId: caseContent.courseId,
      courseName: course.name,
      number: caseContent.number,
      title: caseContent.title,
      body: caseContent.body,
    })
    .from(caseContent)
    .innerJoin(course, eq(course.id, caseContent.courseId))
    .orderBy(asc(caseContent.number));
}

export async function listFiles(
  userId: string,
  filter: { status: "semua" | FileStatus; course: string | null; q: string },
) {
  const [states, progress, cases] = await Promise.all([
    stateMap(userId),
    progressMap(userId),
    allCases(),
  ]);
  const query = filter.q.trim().toLowerCase();

  const items = [];
  for (const content of cases) {
    const state = states.get(content.id);
    if (state?.deleted) continue;

    const totalNodes = content.body.nodes.length;
    const doneCount = progress.get(content.id) ?? 0;
    const finished = totalNodes > 0 && doneCount >= totalNodes;
    const status: FileStatus = state?.archived
      ? "arsip"
      : finished
        ? "selesai"
        : "aktif";

    if (filter.status !== "semua" && filter.status !== status) continue;
    if (filter.course && filter.course !== content.courseId) continue;
    if (
      query &&
      !`${content.title} ${content.courseName}`.toLowerCase().includes(query)
    )
      continue;

    items.push({
      caseId: content.id,
      course: content.courseId,
      courseLabel: content.courseName,
      number: content.number,
      title: content.title,
      pinned: state?.pinned ?? false,
      status,
      doneCount: Math.min(doneCount, totalNodes),
      totalNodes,
      lastQuery: state?.lastQuery ?? null,
      updatedAt: state?.updatedAt ?? null,
    });
  }

  // Berkas yang disematkan selalu di atas, lalu urut judul.
  return items.sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) || a.title.localeCompare(b.title),
  );
}

export async function getFile(userId: string, caseId: string) {
  const [content] = await db
    .select({
      id: caseContent.id,
      courseId: caseContent.courseId,
      courseName: course.name,
      title: caseContent.title,
      body: caseContent.body,
    })
    .from(caseContent)
    .innerJoin(course, eq(course.id, caseContent.courseId))
    .where(eq(caseContent.id, caseId))
    .limit(1);
  if (!content)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Berkas tidak ditemukan.",
    });

  const [state] = await db
    .select()
    .from(caseFile)
    .where(and(eq(caseFile.userId, userId), eq(caseFile.caseId, caseId)))
    .limit(1);
  const [done] = await db
    .select({ total: count(nodeProgress.nodeKey) })
    .from(nodeProgress)
    .where(
      and(eq(nodeProgress.userId, userId), eq(nodeProgress.caseId, caseId)),
    );

  return {
    caseId,
    course: content.courseId,
    courseLabel: content.courseName,
    title: content.title,
    story: content.body.story,
    bukti: content.body.bukti ?? [],
    tersangka: content.body.tersangka ?? [],
    pinned: state?.pinned ?? false,
    archived: state?.archived ?? false,
    lastQuery: state?.lastQuery ?? null,
    doneCount: Math.min(done?.total ?? 0, content.body.nodes.length),
    totalNodes: content.body.nodes.length,
    updatedAt: state?.updatedAt ?? null,
  };
}

export async function updateFile(userId: string, caseId: string, patch: Patch) {
  const [exists] = await db
    .select({ id: caseContent.id })
    .from(caseContent)
    .where(eq(caseContent.id, caseId))
    .limit(1);
  if (!exists)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Berkas tidak ditemukan.",
    });

  await db
    .insert(caseFile)
    .values({ userId, caseId, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [caseFile.userId, caseFile.caseId],
      set: { ...patch, updatedAt: new Date() },
    });
  return { ok: true as const };
}

export async function restoreFile(userId: string, caseId: string) {
  return updateFile(userId, caseId, { deleted: false });
}
