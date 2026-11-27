import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { profile } from "./schema";
import type { updateInput } from "./schemas";

export async function updateProfile(
  userId: string,
  input: z.infer<typeof updateInput>,
) {
  await db
    .update(profile)
    .set({
      ...(input.dailyTarget !== undefined && {
        dailyTarget: input.dailyTarget,
      }),
      ...(input.reminder !== undefined && { reminder: input.reminder }),
    })
    .where(eq(profile.userId, userId));
}

// Deleting the user row cascades to sessions, accounts, and profile (CMP-01).
export async function deleteAccount(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
}
