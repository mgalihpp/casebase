import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { profile } from "@/features/profile/schema";
import { db } from "@/server/db";
import { awardBadges } from "./badges";
import { addWeekXp, type Executor } from "./league";
import {
  CHECKS_PER_MINUTE,
  calendarDate,
  FAST_ANSWER_MS,
  HEART_REGEN_MS,
  HEARTS_MAX,
  heartsNow,
  loseHeart,
  nextLantern,
  scoreFor,
  xpFor,
} from "./rewards";
import { checkRate, missionAttempt, missionHint, nodeProgress } from "./schema";

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
  now: Date,
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
      startedAt: now,
      lastEventAt: now,
    })
    .returning();
  if (!created) throw new Error("Gagal membuat percobaan misi.");
  return created;
}

export type HintOutcome =
  | { status: "urutan" }
  | { status: "sudah-dibuka"; coins: number }
  | { status: "baru"; coins: number };

/**
 * Membuka satu petunjuk. Petunjuk dibuka berurutan per soal. Petunjuk baru
 * memotong 1 koin jika saldo ada, dan menambah hitungan petunjuk percobaan.
 */
export async function openHint(
  tx: Executor,
  userId: string,
  attemptId: string,
  questionKey: string,
  hintIndex: number,
): Promise<HintOutcome> {
  const opened = await tx
    .select({ hintIndex: missionHint.hintIndex })
    .from(missionHint)
    .where(
      and(
        eq(missionHint.attemptId, attemptId),
        eq(missionHint.questionKey, questionKey),
      ),
    );
  if (opened.some((row) => row.hintIndex === hintIndex)) {
    const coins = await currentCoins(tx, userId);
    return { status: "sudah-dibuka", coins };
  }
  if (hintIndex > opened.length) return { status: "urutan" };

  await tx.insert(missionHint).values({ attemptId, questionKey, hintIndex });
  await tx
    .update(missionAttempt)
    .set({ hints: sql`${missionAttempt.hints} + 1` })
    .where(eq(missionAttempt.id, attemptId));

  await tx
    .update(profile)
    .set({ coins: sql`${profile.coins} - 1` })
    .where(and(eq(profile.userId, userId), gt(profile.coins, 0)));
  const coins = await currentCoins(tx, userId);
  return { status: "baru", coins };
}

async function currentCoins(tx: Executor, userId: string) {
  const [me] = await tx
    .select({ coins: profile.coins })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);
  return me?.coins ?? 0;
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
 * Mencatat satu jawaban. Jawaban benar yang datang kurang dari 30 detik
 * setelah kejadian sebelumnya di percobaan ini dihitung untuk Query Kilat.
 */
export async function recordAnswer(
  tx: Executor,
  attemptId: string,
  correct: boolean,
  now: Date,
) {
  const [attempt] = await tx
    .select({ lastEventAt: missionAttempt.lastEventAt })
    .from(missionAttempt)
    .where(eq(missionAttempt.id, attemptId))
    .limit(1);
  const fast =
    correct &&
    attempt !== undefined &&
    now.getTime() - attempt.lastEventAt.getTime() < FAST_ANSWER_MS;

  await tx
    .update(missionAttempt)
    .set({
      answered: sql`${missionAttempt.answered} + 1`,
      correct: sql`${missionAttempt.correct} + ${correct ? 1 : 0}`,
      fastCorrect: sql`${missionAttempt.fastCorrect} + ${fast ? 1 : 0}`,
      lastEventAt: now,
    })
    .where(eq(missionAttempt.id, attemptId));
}

/**
 * Menutup percobaan dengan skor, XP, lentera, liga, dan lencana. Idempoten:
 * percobaan yang sudah selesai tidak menambah XP lagi.
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

  const newBadges = await awardBadges(tx, userId);
  return { xp, score, lantern, newBadges };
}

/**
 * Batas laju cek jawaban: CHECKS_PER_MINUTE per menit per pengguna.
 * Mengembalikan false jika pengguna sudah melewati batas pada menit ini.
 */
export async function consumeCheck(tx: Executor, userId: string, now: Date) {
  const minute = now.toISOString().slice(0, 16);
  const [row] = await tx
    .insert(checkRate)
    .values({ userId, minute, count: 1 })
    .onConflictDoUpdate({
      target: [checkRate.userId, checkRate.minute],
      set: { count: sql`${checkRate.count} + 1` },
    })
    .returning({ count: checkRate.count });
  return (row?.count ?? CHECKS_PER_MINUTE + 1) <= CHECKS_PER_MINUTE;
}

export async function readCoins(userId: string) {
  const [row] = await db
    .select({ coins: profile.coins })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);
  return row?.coins ?? 0;
}

/** Nyawa sekarang dan waktu nyawa berikutnya bertambah. `nextHeartAt` null jika sudah penuh. */
export async function readHeartsDetail(userId: string, now: Date) {
  const [row] = await db
    .select({ hearts: profile.hearts, updatedAt: profile.heartsUpdatedAt })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);
  if (!row) return { hearts: 0, nextHeartAt: null };
  const hearts = heartsNow(row.hearts, row.updatedAt, now);
  if (hearts >= HEARTS_MAX) return { hearts, nextHeartAt: null };
  const gained = Math.floor(
    (now.getTime() - row.updatedAt.getTime()) / HEART_REGEN_MS,
  );
  const nextHeartAt = new Date(
    row.updatedAt.getTime() + (Math.max(0, gained) + 1) * HEART_REGEN_MS,
  );
  return { hearts, nextHeartAt };
}
