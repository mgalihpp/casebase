import { jsonb, pgTable, text, unique } from "drizzle-orm/pg-core";
import type { CaseBody } from "./schemas";

export const course = pgTable("course", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  abbr: text("abbr").notNull(),
  color: text("color").notNull(),
});

export const caseContent = pgTable(
  "case_content",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    title: text("title").notNull(),
    body: jsonb("body").$type<CaseBody>().notNull(),
  },
  (table) => [
    unique("case_content_course_number_key").on(table.courseId, table.number),
  ],
);
