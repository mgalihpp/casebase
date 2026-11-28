import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { caseContent } from "@/features/course/schema";
import { user } from "@/server/db/auth-schema";

// Node yang sudah selesai per pengguna.
export const nodeProgress = pgTable(
  "node_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    caseId: text("case_id")
      .notNull()
      .references(() => caseContent.id, { onDelete: "cascade" }),
    nodeKey: text("node_key").notNull(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.caseId, table.nodeKey] }),
  ],
);

// Misi yang ditandai gagal (mis. pengguna menyerah). Hanya berisi node yang belum selesai.
export const nodeFailure = pgTable(
  "node_failure",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    caseId: text("case_id")
      .notNull()
      .references(() => caseContent.id, { onDelete: "cascade" }),
    nodeKey: text("node_key").notNull(),
    failedAt: timestamp("failed_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.caseId, table.nodeKey] }),
  ],
);

// Satu percobaan misi. Dicatat saat soal pertama dijawab, ditutup saat node selesai.
export const missionAttempt = pgTable(
  "mission_attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    caseId: text("case_id")
      .notNull()
      .references(() => caseContent.id, { onDelete: "cascade" }),
    nodeKey: text("node_key").notNull(),
    isRepeat: boolean("is_repeat").notNull().default(false),
    status: text("status", { enum: ["active", "finished", "quit"] })
      .notNull()
      .default("active"),
    hints: integer("hints").notNull().default(0),
    answered: integer("answered").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    score: integer("score"),
    xp: integer("xp").notNull().default(0),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
  },
  (table) => [
    index("mission_attempt_user_finished_idx").on(
      table.userId,
      table.finishedAt,
    ),
    check("mission_attempt_hints_check", sql`${table.hints} between 0 and 3`),
  ],
);

// Berkas kasus: pin, arsip, hapus lunak, dan kueri terakhir per pengguna.
export const caseFile = pgTable(
  "case_file",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    caseId: text("case_id")
      .notNull()
      .references(() => caseContent.id, { onDelete: "cascade" }),
    pinned: boolean("pinned").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    deleted: boolean("deleted").notNull().default(false),
    lastQuery: text("last_query"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.caseId] })],
);

// Grup liga per jenjang dan minggu (Senin 00.00 WIB).
export const leagueGroup = pgTable(
  "league_group",
  {
    id: text("id").primaryKey(),
    tier: text("tier").notNull(),
    weekStart: text("week_start").notNull(),
  },
  (table) => [
    index("league_group_tier_week_idx").on(table.tier, table.weekStart),
  ],
);

export const leagueMember = pgTable(
  "league_member",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => leagueGroup.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    xpWeek: integer("xp_week").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.userId] }),
    index("league_member_group_xp_idx").on(table.groupId, table.xpWeek),
  ],
);
