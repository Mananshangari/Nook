import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const ideaTypeEnum = pgEnum("idea_type", [
  "text",
  "link",
  "voice",
  "photo",
]);

export const ideaStatusEnum = pgEnum("idea_status", [
  "ideas",
  "working",
  "published",
]);

export const ideasTable = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: ideaTypeEnum("type").notNull().default("text"),
  status: ideaStatusEnum("status").notNull().default("ideas"),
  // Simple denormalized tags to match the app's current model 1:1.
  // Worth normalizing into a tags/idea_tags join table once tag reuse
  // and tag-based filtering across ideas becomes a real feature.
  tags: text("tags")
    .array()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIdeaSchema = createInsertSchema(ideasTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideasTable.$inferSelect;
