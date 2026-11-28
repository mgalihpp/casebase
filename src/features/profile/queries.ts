import { eq } from "drizzle-orm";
import { classMember, classroom } from "@/features/class/schema";
import { heartsNow } from "@/features/mission/rewards";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { profile } from "./schema";

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

  const { heartsUpdatedAt, hearts, ...rest } = row;
  return {
    ...rest,
    hearts: heartsNow(hearts, heartsUpdatedAt, new Date()),
    classroom: myClass ?? null,
  };
}
