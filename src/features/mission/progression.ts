import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { profile } from "@/features/profile/schema";
import { db } from "@/server/db";
import { addWeekXp, type Executor } from "./league";
import {
  calendarDate,
  heartsNow,
  loseHeart,
  nextLantern,
  scoreFor,
  xpFor,
} from "./rewards";
import { missionAttempt, nodeProgress } from "./schema";

export async function readHearts(userId: string, now: Date) {
  const [row] = await db
    .select({ hearts: profile.hearts, updatedAt: profile.heartsUpdatedAt })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);
  return row ? heartsNow(row.hearts, row.updatedAt, now) : 0;
}

/** Percobaan aktif untuk node ini, atau percobaan baru jika belum ada. */
export async function openAttempt(
  tx: Executor,
  userId: string,
  caseId: string,
  nodeKey: string,
) {
  const [active] = await tx
    .select()
    .from(missionAttempt)
    .where(
      and(
        eq(missionAttempt.userId, userId),
        eq(missionAttempt.caseId, caseId),
        eq(missionAttempt.nodeKey, nodeKey),
        eq(missionAttempt.status, "active"),
      ),
    )
    .limit(1);
  if (active) return active;

  const [done] = await tx
    .select({ nodeKey: nodeProgress.nodeKey })
    .from(nodeProgress)
    .where(
      and(
        eq(nodeProgress.userId, userId),
        eq(nodeProgress.caseId, caseId),
        eq(nodeProgress.nodeKey, nodeKey),
      ),
    )
    .limit(1);

  const [created] = await tx
    .insert(missionAttempt)
    .values({
      id: randomUUID(),
      userId,
      caseId,
      nodeKey,
      isRepeat: Boolean(done),
    })
    .returning();
  if (!created) throw new Error("Gagal membuat percobaan misi.");
  return created;
}

/** Jawaban salah mengurangi 1 nyawa. Mengembalikan jumlah nyawa setelahnya. */
export async function applyWrongAnswer(
  tx: Executor,
  userId: string,
  now: Date,
) {
  const [row] = await tx
    .select({ hearts: profile.hearts, updatedAt: profile.heartsUpdatedAt })
    .from(profile)
    .where(eq(profile.userId, userId))
    .for("update");
  if (!row) return 0;
  const next = loseHeart(row.hearts, row.updatedAt, now);
  await tx
    .update(profile)
    .set({ hearts: next.hearts, heartsUpdatedAt: next.updatedAt })
    .where(eq(profile.userId, userId));
  return next.hearts;
}

/**
 * Menutup percobaan dengan skor, XP, lentera, dan liga. Idempoten: percobaan
 * yang sudah selesai tidak menambah XP lagi.
 */
export async function completeAttempt(
  tx: Executor,
  userId: string,
  attemptId: string,
  caseId: string,
  nodeKey: string,
  now: Date,
) {
  const [attempt] = await tx
    .select()
    .from(missionAttempt)
    .where(eq(missionAttempt.id, attemptId))
    .limit(1);
  if (attempt?.status !== "active") return null;

  const xp = xpFor(attempt.isRepeat);
  const score = scoreFor(attempt.hints);
  const [closed] = await tx
    .update(missionAttempt)
    .set({ status: "finished", score, xp, finishedAt: now })
    .where(
      and(
        eq(missionAttempt.id, attemptId),
        eq(missionAttempt.status, "active"),
      ),
    )
    .returning({ id: missionAttempt.id });
  if (!closed) return null;

  await tx
    .insert(nodeProgress)
    .values({ userId, caseId, nodeKey })
    .onConflictDoNothing();

  const [me] = await tx
    .select({
      xp: profile.xp,
      lantern: profile.lantern,
      lastMissionDate: profile.lastMissionDate,
      leagueTier: profile.leagueTier,
    })
    .from(profile)
    .where(eq(profile.userId, userId))
    .for("update");
  if (!me) return null;

  const today = calendarDate(now);
  const lantern = nextLantern(me.lantern, me.lastMissionDate, today);
  await tx
    .update(profile)
    .set({ xp: me.xp + xp, lantern, lastMissionDate: today })
    .where(eq(profile.userId, userId));
  await addWeekXp(tx, userId, me.leagueTier, xp, now);

  return { xp, score, lantern };
}
