import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/server/db/auth-schema";

export const profile = pgTable(
  "profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    course: text("course"),
    level: text("level"),
    reason: text("reason"),
    dailyTarget: integer("daily_target").notNull().default(10),
    reminder: text("reminder"),
    consentedAt: timestamp("consented_at").defaultNow().notNull(),
    onboardingCompletedAt: timestamp("onboarding_completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "profile_daily_target_check",
      sql`${table.dailyTarget} in (5, 10, 15, 20)`,
    ),
  ],
);
