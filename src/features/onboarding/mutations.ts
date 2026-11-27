import type { z } from "zod";
import { joinClass } from "@/features/class";
import { profile } from "@/features/profile/schema";
import { db } from "@/server/db";
import type { completeInput } from "./schemas";

export async function completeOnboarding(
  userId: string,
  input: z.infer<typeof completeInput>,
) {
  const values = {
    course: input.course,
    level: input.level,
    reason: input.reason,
    dailyTarget: input.dailyTarget,
    reminder: input.reminder ?? null,
    onboardingCompletedAt: new Date(),
  };

  await db
    .insert(profile)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: profile.userId, set: values });

  // The class code is optional. An unknown code does not fail onboarding (FR-PRF-04).
  let joinedClass = false;
  if (input.classCode) {
    joinedClass = await joinClass(userId, input.classCode);
  }

  return { ok: true, joinedClass };
}
