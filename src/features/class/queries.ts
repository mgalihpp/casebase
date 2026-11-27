import { count, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/server/db";
import { classMember, classroom } from "./schema";
import type { lookupInput } from "./schemas";

export async function lookupClass({ code }: z.infer<typeof lookupInput>) {
  const [row] = await db
    .select({
      id: classroom.id,
      name: classroom.name,
      lecturer: classroom.lecturer,
    })
    .from(classroom)
    .where(eq(classroom.code, code))
    .limit(1);

  if (!row) return null;

  const [{ total }] = await db
    .select({ total: count() })
    .from(classMember)
    .where(eq(classMember.classId, row.id));

  return {
    name: row.name,
    lecturer: row.lecturer,
    memberCount: total,
  };
}
