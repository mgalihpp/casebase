import { z } from "zod";

export const dailyTargetSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(20),
]);

export const reminderSchema = z.enum(["morning", "noon", "evening"]);

export const updateInput = z
  .object({
    dailyTarget: dailyTargetSchema.optional(),
    reminder: reminderSchema.nullable().optional(),
  })
  .refine((v) => v.dailyTarget !== undefined || v.reminder !== undefined, {
    message: "Tidak ada yang diubah.",
  });
