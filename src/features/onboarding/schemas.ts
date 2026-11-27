import { z } from "zod";
import { classCodeSchema } from "@/features/class/schemas";
import { dailyTargetSchema, reminderSchema } from "@/features/profile/schemas";

export const COURSE_KEYS = ["sql", "pg", "mongo", "redis", "lite"] as const;
export const LEVEL_KEYS = ["new", "basic", "advanced"] as const;
export const REASON_KEYS = ["school", "work", "curious", "teacher"] as const;

export const completeInput = z.object({
  course: z.enum(COURSE_KEYS),
  level: z.enum(LEVEL_KEYS),
  reason: z.enum(REASON_KEYS),
  dailyTarget: dailyTargetSchema,
  classCode: classCodeSchema.nullable().optional(),
  reminder: reminderSchema.nullable().optional(),
});
