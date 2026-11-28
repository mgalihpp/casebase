import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { caseContent } from "@/features/course/schema";
import { user } from "@/server/db/auth-schema";

// Node yang sudah selesai per pengguna. Sprint 3 menambah mission_attempt dan XP.
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
