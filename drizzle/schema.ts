import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Trendly database schema — matches the runtime tables created in server/db.ts
 * and scripts/migrate.js. Uses SQLite / libSQL via @libsql/client.
 */

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  image_url: text("image_url").notNull(),
  source_url: text("source_url"),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  is_new_today: integer("is_new_today").notNull().default(0),
});

export const bookmarks = sqliteTable("bookmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  item_id: integer("item_id").notNull().unique().references(() => items.id, { onDelete: "cascade" }),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const moodBoards = sqliteTable("mood_boards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  cover_image: text("cover_image"),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const moodBoardItems = sqliteTable("mood_board_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mood_board_id: integer("mood_board_id").notNull().references(() => moodBoards.id, { onDelete: "cascade" }),
  item_id: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const shareLinks = sqliteTable("share_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  resource_type: text("resource_type").notNull(),
  resource_id: integer("resource_id").notNull(),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  expires_at: text("expires_at"),
  view_count: integer("view_count").notNull().default(0),
});

export const itemStyleTags = sqliteTable("item_style_tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  item_id: integer("item_id").notNull().unique().references(() => items.id, { onDelete: "cascade" }),
  tags_json: text("tags_json").notNull(),
  source: text("source").notNull().default("ai"),
  model: text("model"),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Legacy User type re-export for scaffold compatibility (server/db.ts exports a no-op getUserByOpenId)
export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};