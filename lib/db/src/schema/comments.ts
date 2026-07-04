import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { connectedPlatformsTable } from "./connectedPlatforms";

// Classified by actionability, not sentiment - per the product brief.
export const commentCategoryEnum = pgEnum("comment_category", [
  "request", // suggestion / question -> potential video idea
  "insult", // no substance -> hidden by default
  "ambiguous", // gray zone -> shown separately, never auto-decided
]);

export const commentsTable = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  platformId: uuid("platform_id")
    .notNull()
    .references(() => connectedPlatformsTable.id, { onDelete: "cascade" }),
  // The platform's own comment ID, so re-syncs don't create duplicates.
  externalId: text("external_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  category: commentCategoryEnum("category"),
  // Filtered from the default view, never destroyed - per the trust
  // safeguards in the product brief (no automatic hard-delete).
  hidden: boolean("hidden").notNull().default(false),
  sourceUrl: text("source_url"),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
