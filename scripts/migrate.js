import "dotenv/config";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./trendly.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await db.batch([
  { sql: `CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    source_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_new_today INTEGER NOT NULL DEFAULT 0
  )`, args: [] },
  { sql: `CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL UNIQUE,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  )`, args: [] },
  { sql: `CREATE TABLE IF NOT EXISTS mood_boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`, args: [] },
  { sql: `CREATE TABLE IF NOT EXISTS mood_board_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mood_board_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (mood_board_id, item_id),
    FOREIGN KEY (mood_board_id) REFERENCES mood_boards(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  )`, args: [] },
  { sql: `CREATE TABLE IF NOT EXISTS share_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    resource_type TEXT NOT NULL,
    resource_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    view_count INTEGER NOT NULL DEFAULT 0
  )`, args: [] },
  { sql: `CREATE TABLE IF NOT EXISTS item_style_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL UNIQUE,
    tags_json TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'ai',
    model TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  )`, args: [] },
  { sql: "CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC)", args: [] },
  { sql: "CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)", args: [] },
  { sql: "CREATE INDEX IF NOT EXISTS idx_mood_board_items_board ON mood_board_items(mood_board_id)", args: [] },
  { sql: "CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token)", args: [] },
  { sql: "CREATE INDEX IF NOT EXISTS idx_item_style_tags_item ON item_style_tags(item_id)", args: [] },
], "write");

for (const sql of [
  "ALTER TABLE mood_board_items ADD COLUMN position INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE mood_board_items ADD COLUMN notes TEXT",
  "ALTER TABLE bookmarks ADD COLUMN notes TEXT",
  "ALTER TABLE share_links ADD COLUMN expires_at TEXT",
  "ALTER TABLE share_links ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0",
]) {
  try { await db.execute(sql); } catch { /* Existing databases already have this column. */ }
}

console.log("Trendly schema is ready.");
