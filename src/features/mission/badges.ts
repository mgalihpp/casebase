import "server-only";

import { and, count, countDistinct, eq, inArray, sql, sum } from "drizzle-orm";
import { caseContent } from "@/features/course/schema";
import { profile } from "@/features/profile/schema";
import { db } from "@/server/db";
import type { Executor } from "./league";
import { QUERY_KILAT_TARGET } from "./rewards";
import { missionAttempt, missionHint, nodeProgress, userBadge } from "./schema";

export const BADGES = [
  {
    key: "detektif-pemula",
    title: "Detektif Pemula",
    description: "Selesaikan misi pertama.",
  },
  {
    key: "tanpa-petunjuk",
    title: "Tanpa Petunjuk",
    description: "Selesaikan satu kasus tanpa membuka petunjuk.",
  },
  {
    key: "query-kilat",
    title: "Query Kilat",
    description: "Jawab benar kurang dari 30 detik sebanyak 5 kali.",
  },
  {
    key: "ahli-join",
    title: "Ahli JOIN",
    description: "Selesaikan Kasus 03: Jejak Digital.",
  },
  {
    key: "lentera-30",
    title: "Lentera 30",
    description: "Belajar 30 hari beruntun.",
  },
  {
    key: "lima-kursus",
    title: "Lima Kursus",
    description: "Mulai kelima kursus database.",
  },
] as const;

export type BadgeKey = (typeof BADGES)[number]["key"];

export type BadgeStatus = {
  key: BadgeKey;
  title: string;
  description: string;
  earned: boolean;
  progress: string;
};

const LENTERA_TARGET = 30;
const COURSE_TARGET = 5;
const JEJAK_DIGITAL_NUMBER = "03";

/** Metrik yang dibutuhkan semua lencana, dibaca dari data pengguna. */
async function metrics(tx: Executor, userId: string) {
  const [{ finished }] = await tx
    .select({ finished: count() })
    .from(missionAttempt)
    .where(
      and(
        eq(missionAttempt.userId, userId),
        eq(missionAttempt.status, "finished"),
      ),
    );

  const [{ fast }] = await tx
    .select({ fast: sum(missionAttempt.fastCorrect).mapWith(Number) })
    .from(missionAttempt)
    .where(eq(missionAttempt.userId, userId));

  const [{ courses }] = await tx
    .select({ courses: countDistinct(caseContent.courseId) })
    .from(missionAttempt)
    .innerJoin(caseContent, eq(caseContent.id, missionAttempt.caseId))
    .where(eq(missionAttempt.userId, userId));

  const [me] = await tx
    .select({ lantern: profile.lantern })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  const cases = await tx
    .select({
      id: caseContent.id,
      number: caseContent.number,
      nodes:
        sql<number>`jsonb_array_length(${caseContent.body} -> 'nodes')`.mapWith(
          Number,
        ),
    })
    .from(caseContent);

  const done = await tx
    .select({ caseId: nodeProgress.caseId, total: count() })
    .from(nodeProgress)
    .where(eq(nodeProgress.userId, userId))
    .groupBy(nodeProgress.caseId);
  const doneByCase = new Map(done.map((row) => [row.caseId, row.total]));

  const hints = await tx
    .select({ caseId: missionAttempt.caseId, total: count() })
    .from(missionHint)
    .innerJoin(missionAttempt, eq(missionAttempt.id, missionHint.attemptId))
    .where(eq(missionAttempt.userId, userId))
    .groupBy(missionAttempt.caseId);
  const hintsByCase = new Map(hints.map((row) => [row.caseId, row.total]));

  const completedCases = cases.filter(
    (item) => item.nodes > 0 && (doneByCase.get(item.id) ?? 0) >= item.nodes,
  );

  return {
    finished,
    fast: fast ?? 0,
    courses,
    lantern: me?.lantern ?? 0,
    cases,
    completedCases,
    hintsByCase,
  };
}

export async function badgeStatuses(
  tx: Executor,
  userId: string,
): Promise<BadgeStatus[]> {
  const m = await metrics(tx, userId);
  const hintFreeCases = m.completedCases.filter(
    (item) => (m.hintsByCase.get(item.id) ?? 0) === 0,
  );
  const jejak = m.cases.find((item) => item.number === JEJAK_DIGITAL_NUMBER);
  const jejakDone =
    jejak !== undefined &&
    m.completedCases.some((item) => item.id === jejak.id);

  const values: Record<BadgeKey, { earned: boolean; progress: string }> = {
    "detektif-pemula": {
      earned: m.finished >= 1,
      progress: `${Math.min(m.finished, 1)} dari 1 misi`,
    },
    "tanpa-petunjuk": {
      earned: hintFreeCases.length >= 1,
      progress: `${Math.min(hintFreeCases.length, 1)} dari 1 kasus`,
    },
    "query-kilat": {
      earned: m.fast >= QUERY_KILAT_TARGET,
      progress: `${Math.min(m.fast, QUERY_KILAT_TARGET)} dari ${QUERY_KILAT_TARGET}`,
    },
    "ahli-join": {
      earned: jejakDone,
      progress: jejak ? (jejakDone ? "Selesai" : "Belum selesai") : "Terkunci",
    },
    "lentera-30": {
      earned: m.lantern >= LENTERA_TARGET,
      progress: `${Math.min(m.lantern, LENTERA_TARGET)} dari ${LENTERA_TARGET}`,
    },
    "lima-kursus": {
      earned: m.courses >= COURSE_TARGET,
      progress: `${Math.min(m.courses, COURSE_TARGET)} dari ${COURSE_TARGET}`,
    },
  };

  return BADGES.map((badge) => ({ ...badge, ...values[badge.key] }));
}

/**
 * Mencatat lencana yang baru terpenuhi. Mengembalikan kunci lencana yang baru
 * didapat pada panggilan ini, supaya layar selesai bisa menampilkannya.
 */
export async function awardBadges(tx: Executor, userId: string) {
  const statuses = await badgeStatuses(tx, userId);
  const earned = statuses.filter((item) => item.earned).map((item) => item.key);
  if (earned.length === 0) return [];

  const owned = await tx
    .select({ key: userBadge.badgeKey })
    .from(userBadge)
    .where(
      and(eq(userBadge.userId, userId), inArray(userBadge.badgeKey, earned)),
    );
  const ownedKeys = new Set(owned.map((row) => row.key));
  const fresh = earned.filter((key) => !ownedKeys.has(key));
  if (fresh.length === 0) return [];

  await tx
    .insert(userBadge)
    .values(fresh.map((badgeKey) => ({ userId, badgeKey })))
    .onConflictDoNothing();
  return fresh;
}

export async function listBadges(userId: string) {
  return badgeStatuses(db, userId);
}
