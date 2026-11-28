import {
  boolean,
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
    questionIndex: integer("question_index").notNull().default(0),
    answered: integer("answered").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    fastCorrect: integer("fast_correct").notNull().default(0),
    lastEventAt: timestamp("last_event_at").defaultNow().notNull(),
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
  ],
);

// Petunjuk yang sudah dibuka pada satu soal dalam satu percobaan. Membuka ulang tidak memotong koin lagi.
export const missionHint = pgTable(
  "mission_hint",
  {
    attemptId: text("attempt_id")
      .notNull()
      .references(() => missionAttempt.id, { onDelete: "cascade" }),
    questionKey: text("question_key").notNull(),
    hintIndex: integer("hint_index").notNull(),
    openedAt: timestamp("opened_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.attemptId, table.questionKey, table.hintIndex],
    }),
  ],
);

// Kotak bukti yang sudah dibuka. Koin hanya diberikan sekali per kotak.
export const chestOpen = pgTable(
  "chest_open",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    caseId: text("case_id")
      .notNull()
      .references(() => caseContent.id, { onDelete: "cascade" }),
    nodeKey: text("node_key").notNull(),
    openedAt: timestamp("opened_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.caseId, table.nodeKey] }),
  ],
);

// Lencana yang sudah didapat. Progres lencana yang belum didapat dihitung dari data lain.
export const userBadge = pgTable(
  "user_badge",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    badgeKey: text("badge_key").notNull(),
    earnedAt: timestamp("earned_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.badgeKey] })],
);

// Jumlah percobaan cek jawaban per pengguna per menit, untuk batas laju.
export const checkRate = pgTable(
  "check_rate",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    minute: text("minute").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userId, table.minute] })],
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
    closed: boolean("closed").notNull().default(false),
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
