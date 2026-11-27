import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { classMember, classroom } from "./schema";

// Returns false when the code does not exist. The caller decides whether that is an error.
export async function joinClass(userId: string, code: string) {
  const [target] = await db
    .select({ id: classroom.id })
    .from(classroom)
    .where(eq(classroom.code, code))
    .limit(1);

  if (!target) return false;

  await db
    .insert(classMember)
    .values({ classId: target.id, userId })
    .onConflictDoNothing();

  return true;
}
