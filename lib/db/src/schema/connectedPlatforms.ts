import { pgTable, uuid, text, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const platformNameEnum = pgEnum("platform_name", [
  "YouTube",
  "Instagram",
]);

export const connectedPlatformsTable = pgTable(
  "connected_platforms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: platformNameEnum("name").notNull(),
    handle: text("handle").notNull(),
    // OAuth tokens for pulling comments server-side. Never expose these
    // to the client — only the backend should read/write this column.
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    connectedAt: timestamp("connected_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.userId, table.name)],
);

export const insertConnectedPlatformSchema = createInsertSchema(
  connectedPlatformsTable,
).omit({
  id: true,
  connectedAt: true,
});
export type InsertConnectedPlatform = z.infer<
  typeof insertConnectedPlatformSchema
>;
export type ConnectedPlatform = typeof connectedPlatformsTable.$inferSelect;
