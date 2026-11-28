import { and, count, eq, gte } from "drizzle-orm";
import { classMember, classroom } from "@/features/class/schema";
import { caseContent } from "@/features/course/schema";
import { listBadges } from "@/features/mission/badges";
import { calendarDate, heartsNow, TIME_ZONE } from "@/features/mission/rewards";
import { missionAttempt, nodeProgress } from "@/features/mission/schema";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { profile } from "./schema";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Menit belajar per hari di zona waktu pengguna, dari misi yang sudah selesai. */
async function minutesByDay(userId: string, now: Date) {
  const since = new Date(now.getTime() - 6 * DAY_MS);
  const rows = await db
    .select({
      startedAt: missionAttempt.startedAt,
      finishedAt: missionAttempt.finishedAt,
    })
    .from(missionAttempt)
    .where(
      and(
        eq(missionAttempt.userId, userId),
        eq(missionAttempt.status, "finished"),
        gte(missionAttempt.finishedAt, since),
      ),
    );

  const minutes = new Map<string, number>();
  for (const row of rows) {
    if (!row.finishedAt) continue;
    const day = calendarDate(row.finishedAt, TIME_ZONE);
    const spent = (row.finishedAt.getTime() - row.startedAt.getTime()) / 60000;
    minutes.set(day, (minutes.get(day) ?? 0) + spent);
  }
  return minutes;
}

/** Kasus yang semua node-nya sudah selesai oleh pengguna. */
async function casesDone(userId: string) {
  const cases = await db
    .select({ id: caseContent.id, body: caseContent.body })
    .from(caseContent);
  const done = await db
    .select({ caseId: nodeProgress.caseId, total: count() })
    .from(nodeProgress)
    .where(eq(nodeProgress.userId, userId))
    .groupBy(nodeProgress.caseId);
  const doneByCase = new Map(done.map((row) => [row.caseId, row.total]));
  return cases.filter(
    (item) =>
      item.body.nodes.length > 0 &&
      (doneByCase.get(item.id) ?? 0) >= item.body.nodes.length,
  ).length;
}

export async function getMyProfile(userId: string) {
  const [row] = await db
    .select({
      name: user.name,
      email: user.email,
      joinedAt: user.createdAt,
      dailyTarget: profile.dailyTarget,
      reminder: profile.reminder,
      course: profile.course,
      level: profile.level,
      onboardingCompletedAt: profile.onboardingCompletedAt,
      xp: profile.xp,
      coins: profile.coins,
      lantern: profile.lantern,
      leagueTier: profile.leagueTier,
      hearts: profile.hearts,
      heartsUpdatedAt: profile.heartsUpdatedAt,
    })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(eq(profile.userId, userId))
    .limit(1);

  if (!row) return null;

  const [myClass] = await db
    .select({ name: classroom.name, lecturer: classroom.lecturer })
    .from(classMember)
    .innerJoin(classroom, eq(classroom.id, classMember.classId))
    .where(eq(classMember.userId, userId))
    .limit(1);

  const now = new Date();
  const minutes = await minutesByDay(userId, now);
  const today = calendarDate(now, TIME_ZONE);
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = calendarDate(
      new Date(now.getTime() - (6 - index) * DAY_MS),
      TIME_ZONE,
    );
    return { date: day, minutes: Math.round(minutes.get(day) ?? 0) };
  });

  const { heartsUpdatedAt, hearts, ...rest } = row;
  return {
    ...rest,
    hearts: heartsNow(hearts, heartsUpdatedAt, now),
    classroom: myClass ?? null,
    casesDone: await casesDone(userId),
    minutesToday: Math.round(minutes.get(today) ?? 0),
    week,
    badges: await listBadges(userId),
  };
}
