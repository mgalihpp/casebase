import "server-only";

import { randomUUID } from "node:crypto";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { classMember, classroom } from "@/features/class/schema";
import { profile } from "@/features/profile/schema";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { calendarDate, leagueWeekStart } from "./rewards";
import { leagueGroup, leagueMember } from "./schema";

/** SRS 2.2 menyebut Perunggu dan Safir sebagai contoh. Daftar lengkap belum diputuskan. */
export const LEAGUE_TIERS = ["Perunggu", "Safir"] as const;

/** Ukuran grup sekitar 30 (FR-RNK-02). */
export const GROUP_SIZE = 30;

/**
 * Jumlah peserta zona naik dan zona turun belum diputuskan (SRS 5.2, SDD 5.2).
 * Nilai ini sementara dan wajib diganti setelah keputusan.
 */
export const ZONE_UP = 3;
export const ZONE_DOWN = 3;

export type Executor =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function findOrCreateGroup(tx: Executor, tier: string, week: string) {
  const [existing] = await tx
    .select({ id: leagueGroup.id, size: count(leagueMember.userId) })
    .from(leagueGroup)
    .leftJoin(leagueMember, eq(leagueMember.groupId, leagueGroup.id))
    .where(and(eq(leagueGroup.tier, tier), eq(leagueGroup.weekStart, week)))
    .groupBy(leagueGroup.id)
    .having(sql`count(${leagueMember.userId}) < ${GROUP_SIZE}`)
    .limit(1);
  if (existing) return existing.id;

  const id = randomUUID();
  await tx.insert(leagueGroup).values({ id, tier, weekStart: week });
  return id;
}

export async function leagueBoard(userId: string, now: Date) {
  const week = leagueWeekStart(calendarDate(now));
  const [me] = await db
    .select({ tier: profile.leagueTier })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);
  if (!me) return null;

  const [membership] = await db
    .select({ groupId: leagueMember.groupId })
    .from(leagueMember)
    .innerJoin(leagueGroup, eq(leagueGroup.id, leagueMember.groupId))
    .where(
      and(eq(leagueMember.userId, userId), eq(leagueGroup.weekStart, week)),
    )
    .limit(1);

  let groupId = membership?.groupId ?? null;
  if (!groupId) {
    groupId = await findOrCreateGroup(db, me.tier, week);
    await db
      .insert(leagueMember)
      .values({ groupId, userId, xpWeek: 0 })
      .onConflictDoNothing();
  }

  const rows = await db
    .select({
      userId: leagueMember.userId,
      name: user.name,
      xp: leagueMember.xpWeek,
    })
    .from(leagueMember)
    .innerJoin(user, eq(user.id, leagueMember.userId))
    .where(eq(leagueMember.groupId, groupId))
    .orderBy(desc(leagueMember.xpWeek), user.name);

  const total = rows.length;
  const board = rows.map((row, index) => {
    const rank = index + 1;
    return {
      rank,
      name: row.name,
      xp: row.xp,
      isMe: row.userId === userId,
      zoneUp: total > ZONE_UP && rank <= ZONE_UP,
      zoneDown: total > ZONE_UP + ZONE_DOWN && rank > total - ZONE_DOWN,
    };
  });

  return {
    tier: me.tier,
    weekStart: week,
    groupId,
    total,
    board,
    me: board.find((r) => r.isMe) ?? null,
  };
}

/** Papan kelas: anggota kelas pengguna, diurutkan dari total XP. */
export async function classBoard(userId: string) {
  const [mine] = await db
    .select({ classId: classMember.classId, name: classroom.name })
    .from(classMember)
    .innerJoin(classroom, eq(classroom.id, classMember.classId))
    .where(eq(classMember.userId, userId))
    .limit(1);
  if (!mine) return null;

  const rows = await db
    .select({ userId: classMember.userId, name: user.name, xp: profile.xp })
    .from(classMember)
    .innerJoin(user, eq(user.id, classMember.userId))
    .innerJoin(profile, eq(profile.userId, classMember.userId))
    .where(eq(classMember.classId, mine.classId))
    .orderBy(desc(profile.xp), user.name);

  return {
    name: mine.name,
    total: rows.length,
    board: rows.map((row, index) => ({
      rank: index + 1,
      name: row.name,
      xp: row.xp,
      isMe: row.userId === userId,
      zoneUp: false,
      zoneDown: false,
    })),
  };
}

/**
 * Menambah XP minggu ini ke grup liga pengguna. Grup dan keanggotaan dibuat
 * jika belum ada, supaya XP dari misi tidak hilang sebelum papan liga dibuka.
 */
export async function addWeekXp(
  tx: Executor,
  userId: string,
  tier: string,
  xp: number,
  now: Date,
) {
  const week = leagueWeekStart(calendarDate(now));
  const groupId = await findOrCreateGroup(tx, tier, week);
  await tx
    .insert(leagueMember)
    .values({ groupId, userId, xpWeek: xp })
    .onConflictDoUpdate({
      target: [leagueMember.groupId, leagueMember.userId],
      set: { xpWeek: sql`${leagueMember.xpWeek} + ${xp}` },
    });
}
