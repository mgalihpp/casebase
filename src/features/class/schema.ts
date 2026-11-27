import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "@/server/db/auth-schema";

export const classroom = pgTable("class", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  lecturer: text("lecturer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classMember = pgTable(
  "class_member",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classroom.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.classId, table.userId] }),
    index("class_member_user_id_idx").on(table.userId),
  ],
);
