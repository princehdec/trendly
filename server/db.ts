import "dotenv/config";
import { createClient, type Client, type InValue } from "@libsql/client";
import type { User } from "../drizzle/schema";

export type TrendItem = {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url: string;
  source_url: string | null;
  created_at: string;
  is_new_today: number;
  bookmarked?: number;
  style_tags?: string[];
  style_tags_source?: "ai" | "curated";
  notes?: string | null;
};

export type SavedItem = TrendItem & { bookmark_id: number; bookmarked: number };

export type MoodBoard = {
  id: number;
  name: string;
  description: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
};

export type MoodBoardDetail = MoodBoard & { items: TrendItem[] };

export type ShareLink = {
  token: string;
  resource_type: "item" | "mood_board";
  resource_id: number;
  created_at: string;
  expires_at: string | null;
  view_count: number;
};

let client: Client | null = null;
let schemaReady = false;

const categories = [
  "Flooring",
  "Wall Finishes",
  "Lighting",
  "Furniture",
  "Tiles",
  "Paint & Color",
  "Fabrics & Textiles",
  "Hardware",
  "Decor & Accessories",
] as const;

export const CATEGORY_LIST = [...categories];

export const IMAGE_POOL: Record<string, string[]> = {
  Flooring: [
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=1200&q=85",
  ],
  "Wall Finishes": [
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
  ],
  Lighting: [
    "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=1200&q=85",
  ],
  Furniture: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1567538096621-38d2284b23ff?auto=format&fit=crop&w=1200&q=85",
  ],
  Tiles: [
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600573472556-e636c2acda9e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=85",
  ],
  "Paint & Color": [
    "https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
  ],
  "Fabrics & Textiles": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1200&q=85",
  ],
  Hardware: [
    "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1618219740975-d40978bb7378?auto=format&fit=crop&w=1200&q=85",
  ],
  "Decor & Accessories": [
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
  ],
};

export const SEED_ITEMS = [
  { title: "Warm terrazzo, reimagined", description: "Large-scale terrazzo with caramel and clay aggregate is bringing movement back to quiet, tonal floors without feeling retro.", category: "Flooring" },
  { title: "Fluted oak panels", description: "Slim vertical ribs add soft rhythm and acoustic warmth to dining nooks, media walls, and entry moments.", category: "Wall Finishes" },
  { title: "Limewash in mineral neutrals", description: "Cloudy, hand-brushed limewash gives neutral rooms a lived-in depth that flat paint simply cannot match.", category: "Paint & Color" },
  { title: "The sculptural pendant", description: "Oversized paper, plaster, and ribbed glass pendants are turning everyday lighting into a quiet focal point.", category: "Lighting" },
  { title: "Bouclé beyond boucle", description: "Nubby, tactile upholstery is evolving into tighter weaves and earthy tones that feel both polished and inviting.", category: "Fabrics & Textiles" },
  { title: "Microcement, softened", description: "New microcement finishes pair subtle tonal variation with a satin touch for bathrooms and kitchens that feel monolithic, not cold.", category: "Wall Finishes" },
  { title: "Unlacquered brass hardware", description: "Living brass develops a beautiful patina over time, making cabinetry feel more personal and less showroom-perfect.", category: "Hardware" },
  { title: "Handmade zellige in chalky tones", description: "Irregular edges and glints of glaze give even the simplest backsplash a one-of-a-kind, hand-touched quality.", category: "Tiles" },
  { title: "The low-slung lounge chair", description: "Deep, grounded silhouettes are replacing upright accent chairs, creating living rooms that invite lingering.", category: "Furniture" },
  { title: "Checkerboard, made quiet", description: "Soft stone and warm wood pairings bring the checkerboard motif into contemporary rooms with less contrast and more longevity.", category: "Flooring" },
  { title: "Color-drenched powder rooms", description: "One saturated hue across walls, ceiling, and trim creates a jewel-box moment with a surprisingly calm effect.", category: "Paint & Color" },
  { title: "Linen curtains with weight", description: "Heavier linen and washed cotton drapery are framing daylight with a relaxed, tailored softness.", category: "Fabrics & Textiles" },
  { title: "Stoneware objects with texture", description: "Hand-thrown vessels, ridged bowls, and matte glazes are adding small, tactile pauses to otherwise minimal shelves.", category: "Decor & Accessories" },
  { title: "Mixed-metal moments", description: "Thoughtful combinations of aged brass, pewter, and blackened steel make kitchens feel collected instead of overly coordinated.", category: "Hardware" },
  { title: "Travertine side tables", description: "The porous, softly veined stone is back as a small-scale accent with a quieter, less glossy point of view.", category: "Furniture" },
  { title: "Fluted glass partitions", description: "Textured glass lets light travel while keeping a little privacy, making it a natural fit for compact, open-plan spaces.", category: "Wall Finishes" },
  { title: "Deep green as a neutral", description: "Moss, olive, and loden greens are grounding palettes with enough flexibility to sit comfortably beside timber, stone, and brass.", category: "Paint & Color" },
  { title: "Handmade tile borders", description: "A narrow border in a contrasting glaze creates architectural punctuation without requiring a full feature wall.", category: "Tiles" },
] as const;

export async function getDb(): Promise<Client> {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL || "file:./trendly.db";
  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}

export async function ensureSchema() {
  if (schemaReady) return;
  const db = await getDb();
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
  schemaReady = true;
}

function rowToItem(row: Record<string, unknown>): TrendItem {
  let styleTags: string[] | undefined;
  if (typeof row.style_tags_json === "string") {
    try {
      const parsed = JSON.parse(row.style_tags_json);
      if (Array.isArray(parsed)) styleTags = parsed.filter((tag): tag is string => typeof tag === "string");
    } catch { /* Ignore malformed legacy tag data. */ }
  }
  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category),
    image_url: String(row.image_url),
    source_url: row.source_url ? String(row.source_url) : null,
    created_at: String(row.created_at),
    is_new_today: Number(row.is_new_today),
    bookmarked: row.bookmarked === undefined ? undefined : Number(row.bookmarked),
    notes: row.notes !== undefined && row.notes !== null ? String(row.notes) : null,
    ...(styleTags?.length ? { style_tags: styleTags } : {}),
    ...(row.style_tags_source ? { style_tags_source: String(row.style_tags_source) as "ai" | "curated" } : {}),
  };
}

export async function countItems() {
  await ensureSchema();
  const result = await (await getDb()).execute("SELECT COUNT(*) AS count FROM items");
  return Number(result.rows[0]?.count || 0);
}

export async function seedIfEmpty() {
  if ((await countItems()) > 0) return false;
  const db = await getDb();
  const now = Date.now();
  await db.batch(SEED_ITEMS.map((item, index) => ({
    sql: `INSERT INTO items (title, description, category, image_url, source_url, created_at, is_new_today)
          VALUES (?, ?, ?, ?, ?, ?, 0)`,
    args: [
      item.title,
      item.description,
      item.category,
      IMAGE_POOL[item.category]?.[index % 2] || IMAGE_POOL.Flooring[0],
      `https://www.google.com/search?q=${encodeURIComponent(item.title + " interior design")}`,
      new Date(now - (SEED_ITEMS.length - index) * 86400000).toISOString(),
    ],
  })), "write");
  return true;
}

const SEED_STYLE_TAG_MAP: Record<string, string[]> = {
  "Warm terrazzo, reimagined": ["textural interiors", "earthy palette", "organic modern"],
  "Fluted oak panels": ["warm minimalism", "tactile layers", "quiet luxury"],
  "Limewash in mineral neutrals": ["quiet luxury", "earthy palette", "textural interiors"],
  "The sculptural pendant": ["soft modernism", "quiet luxury", "organic modern"],
  "Bouclé beyond boucle": ["textural interiors", "tactile layers", "warm minimalism"],
  "Microcement, softened": ["warm minimalism", "quiet luxury", "tactile layers"],
  "Unlacquered brass hardware": ["handcrafted", "quiet luxury", "tactile layers"],
  "Handmade zellige in chalky tones": ["handcrafted", "textural interiors", "earthy palette"],
  "The low-slung lounge chair": ["Japandi", "soft modernism", "organic modern"],
  "Checkerboard, made quiet": ["soft modernism", "earthy palette", "quiet luxury"],
  "Color-drenched powder rooms": ["earthy palette", "soft modernism"],
  "Linen curtains with weight": ["tactile layers", "warm minimalism", "Japandi"],
  "Stoneware objects with texture": ["handcrafted", "organic modern", "textural interiors"],
  "Mixed-metal moments": ["handcrafted", "quiet luxury"],
  "Travertine side tables": ["organic modern", "quiet luxury", "warm minimalism"],
  "Fluted glass partitions": ["soft modernism", "warm minimalism", "tactile layers"],
  "Deep green as a neutral": ["earthy palette", "quiet luxury"],
  "Handmade tile borders": ["handcrafted", "textural interiors"],
};

export async function ensureBaselineStyleTags() {
  const db = await getDb();
  const existingTags = await db.execute("SELECT COUNT(*) AS count FROM item_style_tags");
  if (Number(existingTags.rows[0]?.count || 0) < 5) {
    const itemsResult = await db.execute("SELECT id, title, category, source_url FROM items");
    for (const row of itemsResult.rows) {
      const id = Number(row.id);
      const title = String(row.title);
      const category = String(row.category);
      const tags = SEED_STYLE_TAG_MAP[title] || ["organic modern", "quiet luxury"];
      await saveStyleTags(id, tags, "curated");

      // Update source_url to Pinterest search for trending pins
      const currSource = String(row.source_url || "");
      if (!currSource || currSource.includes("google.com/search")) {
        const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(title + " " + category + " interior design trend")}`;
        await db.execute({ sql: "UPDATE items SET source_url = ? WHERE id = ?", args: [pinterestUrl, id] });
      }
    }
  }
}

export async function upgradeLegacyImages() {
  const db = await getDb();
  // Find any items that share duplicate image_urls from the old static pool
  const duplicates = await db.execute(`
    SELECT id, title, category, image_url FROM items
    WHERE image_url IN (
      SELECT image_url FROM items GROUP BY image_url HAVING COUNT(*) > 1
    )
    ORDER BY id ASC
  `);

  if (duplicates.rows.length > 0) {
    const { getImageForTrend } = await import("./unsplash-service");
    const seen = new Set<string>();
    for (let i = 0; i < duplicates.rows.length; i++) {
      const row = duplicates.rows[i];
      const url = String(row.image_url);
      if (seen.has(url)) {
        // Replace duplicate image with a fresh, distinct Unsplash photo
        const freshUrl = await getImageForTrend(String(row.title), String(row.category), i + 1);
        if (freshUrl && freshUrl !== url) {
          await db.execute({ sql: "UPDATE items SET image_url = ? WHERE id = ?", args: [freshUrl, row.id] });
          seen.add(freshUrl);
        }
      } else {
        seen.add(url);
      }
    }
  }
}

export async function initializeDatabase() {
  await ensureSchema();
  await seedIfEmpty();
  await ensureBaselineStyleTags();
  await upgradeLegacyImages();
}

export type ItemQueryOptions = {
  category?: string;
  search?: string;
  tag?: string;
};

export type NewItemInput = {
  title: string;
  description: string;
  category: string;
  image_url?: string;
  source_url?: string | null;
  style_tags?: string[];
};

function parseFilter(filter?: string | ItemQueryOptions): ItemQueryOptions {
  if (typeof filter === "string") return { category: filter };
  return filter || {};
}

function buildItemFilterClause(filter: ItemQueryOptions) {
  const clauses: string[] = [];
  const args: InValue[] = [];

  if (filter.category) {
    clauses.push("i.category = ?");
    args.push(filter.category);
  }

  if (filter.tag) {
    clauses.push("ist.tags_json LIKE ?");
    args.push(`%${filter.tag}%`);
  }

  if (filter.search && filter.search.trim()) {
    const s = `%${filter.search.trim()}%`;
    clauses.push("(i.title LIKE ? OR i.description LIKE ? OR i.category LIKE ? OR ist.tags_json LIKE ?)");
    args.push(s, s, s, s);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, args };
}

export async function listItems(filter?: string | ItemQueryOptions) {
  await initializeDatabase();
  const db = await getDb();
  const parsed = parseFilter(filter);
  const { where, args } = buildItemFilterClause(parsed);
  const query = {
    sql: `SELECT i.*, CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS bookmarked,
      ist.tags_json AS style_tags_json, ist.source AS style_tags_source
      FROM items i LEFT JOIN bookmarks b ON b.item_id = i.id
      LEFT JOIN item_style_tags ist ON ist.item_id = i.id ${where}
      ORDER BY datetime(i.created_at) DESC, i.id DESC`,
    args,
  };
  let result = await db.execute(query);

  // If user filtered by category, tag, or search and found 0 items, auto-extract from Unsplash & Pinterest
  if (result.rows.length === 0 && (parsed.category || parsed.tag || (parsed.search && parsed.search.trim()))) {
    try {
      const { extractTrendingDiscoveries } = await import("./discovery-extractor-service");
      await extractTrendingDiscoveries({ category: parsed.category, tag: parsed.tag, search: parsed.search });
      result = await db.execute(query);
    } catch (e) {
      console.warn("[Trendly] Auto-extraction fallback encountered error:", e);
    }
  }

  return result.rows.map(row => rowToItem(row as Record<string, unknown>));
}

export async function listItemsPage(filter: string | ItemQueryOptions | undefined, limit: number, offset: number) {
  await initializeDatabase();
  const db = await getDb();
  const parsed = parseFilter(filter);
  const { where, args } = buildItemFilterClause(parsed);
  let result = await db.execute({
    sql: `SELECT i.*, CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS bookmarked,
      ist.tags_json AS style_tags_json, ist.source AS style_tags_source
      FROM items i LEFT JOIN bookmarks b ON b.item_id = i.id
      LEFT JOIN item_style_tags ist ON ist.item_id = i.id ${where}
      ORDER BY datetime(i.created_at) DESC, i.id DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });
  let countResult = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM items i LEFT JOIN item_style_tags ist ON ist.item_id = i.id ${where}`,
    args,
  });
  let total = Number(countResult.rows[0]?.count || 0);

  // If user filtered by category, tag, or search and found 0 items, auto-extract from Unsplash & Pinterest
  if (total === 0 && (parsed.category || parsed.tag || (parsed.search && parsed.search.trim()))) {
    try {
      const { extractTrendingDiscoveries } = await import("./discovery-extractor-service");
      await extractTrendingDiscoveries({ category: parsed.category, tag: parsed.tag, search: parsed.search });
      result = await db.execute({
        sql: `SELECT i.*, CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS bookmarked,
          ist.tags_json AS style_tags_json, ist.source AS style_tags_source
          FROM items i LEFT JOIN bookmarks b ON b.item_id = i.id
          LEFT JOIN item_style_tags ist ON ist.item_id = i.id ${where}
          ORDER BY datetime(i.created_at) DESC, i.id DESC LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
      });
      countResult = await db.execute({
        sql: `SELECT COUNT(*) AS count FROM items i LEFT JOIN item_style_tags ist ON ist.item_id = i.id ${where}`,
        args,
      });
      total = Number(countResult.rows[0]?.count || 0);
    } catch (e) {
      console.warn("[Trendly] Auto-extraction fallback encountered error:", e);
    }
  }

  const items = result.rows.map(row => rowToItem(row as Record<string, unknown>));
  return { items, hasMore: offset + items.length < total, nextOffset: offset + items.length, total };
}

export async function createCustomItem(input: NewItemInput): Promise<TrendItem> {
  await initializeDatabase();
  const db = await getDb();
  const category = (CATEGORY_LIST.find(c => c.toLowerCase() === input.category.trim().toLowerCase()) || input.category.trim()) as (typeof CATEGORY_LIST)[number];
  const imageUrl = input.image_url?.trim() || imageForCategory(category);
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `INSERT INTO items (title, description, category, image_url, source_url, created_at, is_new_today)
          VALUES (?, ?, ?, ?, ?, ?, 1)`,
    args: [
      input.title.trim(),
      input.description.trim(),
      category,
      imageUrl,
      input.source_url?.trim() || null,
      now,
    ],
  });
  const id = Number(result.lastInsertRowid);
  if (input.style_tags && input.style_tags.length > 0) {
    await saveStyleTags(id, input.style_tags, "curated");
  }
  const item = await getItem(id);
  if (!item) throw new Error("Failed to retrieve created item");
  return item;
}

export async function listAllStyleTags(): Promise<string[]> {
  await initializeDatabase();
  const db = await getDb();
  const result = await db.execute("SELECT tags_json FROM item_style_tags");
  const tagSet = new Set<string>();
  for (const row of result.rows) {
    if (typeof row.tags_json === "string") {
      try {
        const parsed = JSON.parse(row.tags_json);
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            if (typeof t === "string" && t.trim()) tagSet.add(t.trim());
          }
        }
      } catch {}
    }
  }
  // Curated baseline tags to guarantee Shilpi always has beautiful aesthetic tags
  const defaultTags = [
    "quiet luxury",
    "warm minimalism",
    "Japandi",
    "organic modern",
    "textural interiors",
    "handcrafted",
    "earthy palette",
    "soft modernism",
    "tactile layers",
  ];
  for (const t of defaultTags) tagSet.add(t);
  return Array.from(tagSet).sort();
}


export async function getItem(id: number) {
  await initializeDatabase();
  const result = await (await getDb()).execute({
    sql: `SELECT i.*, CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS bookmarked,
      ist.tags_json AS style_tags_json, ist.source AS style_tags_source
      FROM items i LEFT JOIN bookmarks b ON b.item_id = i.id
      LEFT JOIN item_style_tags ist ON ist.item_id = i.id WHERE i.id = ? LIMIT 1`,
    args: [id],
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? rowToItem(row) : null;
}

export async function listBookmarks() {
  await initializeDatabase();
  const result = await (await getDb()).execute(`SELECT i.*, b.id AS bookmark_id, 1 AS bookmarked,
    ist.tags_json AS style_tags_json, ist.source AS style_tags_source,
    b.notes AS notes
    FROM bookmarks b JOIN items i ON i.id = b.item_id
    LEFT JOIN item_style_tags ist ON ist.item_id = i.id
    ORDER BY datetime(b.created_at) DESC, b.id DESC`);
  return result.rows.map(row => ({
    ...rowToItem(row as Record<string, unknown>),
    bookmark_id: Number((row as Record<string, unknown>).bookmark_id),
  }));
}

function rowToMoodBoard(row: Record<string, unknown>): MoodBoard {
  return {
    id: Number(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    cover_image: row.cover_image ? String(row.cover_image) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    item_count: Number(row.item_count || 0),
  };
}

export async function listMoodBoards() {
  await initializeDatabase();
  const result = await (await getDb()).execute(`SELECT b.*,
    COUNT(mbi.id) AS item_count,
    (SELECT i.image_url FROM mood_board_items mbi2 JOIN items i ON i.id = mbi2.item_id
      WHERE mbi2.mood_board_id = b.id ORDER BY mbi2.position ASC, mbi2.id ASC LIMIT 1) AS cover_image
    FROM mood_boards b LEFT JOIN mood_board_items mbi ON mbi.mood_board_id = b.id
    GROUP BY b.id ORDER BY datetime(b.updated_at) DESC, b.id DESC`);
  return result.rows.map(row => rowToMoodBoard(row as Record<string, unknown>));
}

export async function getMoodBoard(id: number): Promise<MoodBoardDetail | null> {
  await initializeDatabase();
  const db = await getDb();
  const boardResult = await db.execute({
    sql: `SELECT b.*,
      COUNT(mbi.id) AS item_count,
      (SELECT i.image_url FROM mood_board_items mbi2 JOIN items i ON i.id = mbi2.item_id
        WHERE mbi2.mood_board_id = b.id ORDER BY mbi2.position ASC, mbi2.id ASC LIMIT 1) AS cover_image
      FROM mood_boards b LEFT JOIN mood_board_items mbi ON mbi.mood_board_id = b.id
      WHERE b.id = ? GROUP BY b.id LIMIT 1`,
    args: [id],
  });
  const row = boardResult.rows[0];
  if (!row) return null;
  const board = rowToMoodBoard(row as Record<string, unknown>);
  const result = await db.execute({
    sql: `SELECT i.*, CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS bookmarked,
      ist.tags_json AS style_tags_json, ist.source AS style_tags_source,
      mbi.notes AS notes
      FROM mood_board_items mbi JOIN items i ON i.id = mbi.item_id
      LEFT JOIN bookmarks b ON b.item_id = i.id
      LEFT JOIN item_style_tags ist ON ist.item_id = i.id
      WHERE mbi.mood_board_id = ? ORDER BY mbi.position ASC, mbi.id ASC`,
    args: [id],
  });
  return { ...board, items: result.rows.map(row => rowToItem(row as Record<string, unknown>)) };
}

export async function updateMoodBoardItemNotes(boardId: number, itemId: number, notes: string | null): Promise<MoodBoardDetail | null> {
  await initializeDatabase();
  const db = await getDb();
  await db.execute({
    sql: "UPDATE mood_board_items SET notes = ? WHERE mood_board_id = ? AND item_id = ?",
    args: [notes && notes.trim() ? notes.trim() : null, boardId, itemId],
  });
  await db.execute({ sql: "UPDATE mood_boards SET updated_at = ? WHERE id = ?", args: [new Date().toISOString(), boardId] });
  return getMoodBoard(boardId);
}

export async function updateBookmarkNotes(itemId: number, notes: string | null): Promise<TrendItem | null> {
  await initializeDatabase();
  const db = await getDb();
  await db.execute({
    sql: "UPDATE bookmarks SET notes = ? WHERE item_id = ?",
    args: [notes && notes.trim() ? notes.trim() : null, itemId],
  });
  return getItem(itemId);
}

export async function getRelatedItems(itemId: number, limit = 4): Promise<TrendItem[]> {
  await initializeDatabase();
  const target = await getItem(itemId);
  if (!target) return [];

  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT i.*, CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS bookmarked,
      ist.tags_json AS style_tags_json, ist.source AS style_tags_source
      FROM items i
      LEFT JOIN bookmarks b ON b.item_id = i.id
      LEFT JOIN item_style_tags ist ON ist.item_id = i.id
      WHERE i.id != ?
      ORDER BY datetime(i.created_at) DESC`,
    args: [itemId],
  });

  const allItems = result.rows.map(row => rowToItem(row as Record<string, unknown>));
  const targetTags = new Set((target.style_tags || []).map(t => t.toLowerCase().trim()));

  const scored = allItems.map(item => {
    let score = 0;
    if (item.category === target.category) score += 5;
    if (item.style_tags && targetTags.size > 0) {
      for (const t of item.style_tags) {
        if (targetTags.has(t.toLowerCase().trim())) {
          score += 3;
        }
      }
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.item);
}

export async function createMoodBoard(name: string, description?: string | null) {
  await initializeDatabase();
  const now = new Date().toISOString();
  const result = await (await getDb()).execute({
    sql: "INSERT INTO mood_boards (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)",
    args: [name.trim(), description?.trim() || null, now, now],
  });
  return getMoodBoard(Number(result.lastInsertRowid));
}

export async function updateMoodBoard(id: number, name: string, description?: string | null) {
  await initializeDatabase();
  await (await getDb()).execute({
    sql: "UPDATE mood_boards SET name = ?, description = ?, updated_at = ? WHERE id = ?",
    args: [name.trim(), description?.trim() || null, new Date().toISOString(), id],
  });
  return getMoodBoard(id);
}

export async function deleteMoodBoard(id: number) {
  await initializeDatabase();
  const result = await (await getDb()).execute({ sql: "DELETE FROM mood_boards WHERE id = ?", args: [id] });
  return Number(result.rowsAffected || 0) > 0;
}

export async function addItemToMoodBoard(boardId: number, itemId: number) {
  await initializeDatabase();
  const db = await getDb();
  const maxPosition = await db.execute({ sql: "SELECT COALESCE(MAX(position), -1) AS position FROM mood_board_items WHERE mood_board_id = ?", args: [boardId] });
  await db.execute({
    sql: "INSERT OR IGNORE INTO mood_board_items (mood_board_id, item_id, position, created_at) VALUES (?, ?, ?, ?)",
    args: [boardId, itemId, Number(maxPosition.rows[0]?.position || -1) + 1, new Date().toISOString()],
  });
  await db.execute({ sql: "UPDATE mood_boards SET updated_at = ? WHERE id = ?", args: [new Date().toISOString(), boardId] });
  return getMoodBoard(boardId);
}

export async function reorderMoodBoard(boardId: number, itemIds: number[]) {
  await initializeDatabase();
  const db = await getDb();
  const current = await db.execute({ sql: "SELECT item_id FROM mood_board_items WHERE mood_board_id = ? ORDER BY position ASC, id ASC", args: [boardId] });
  const existingIds = current.rows.map(row => Number((row as Record<string, unknown>).item_id));
  const requested = itemIds.filter((itemId, index) => itemIds.indexOf(itemId) === index && existingIds.includes(itemId));
  const orderedIds = [...requested, ...existingIds.filter(itemId => !requested.includes(itemId))];
  if (orderedIds.length) {
    await db.batch(orderedIds.map((itemId, index) => ({ sql: "UPDATE mood_board_items SET position = ? WHERE mood_board_id = ? AND item_id = ?", args: [index, boardId, itemId] })), "write");
    await db.execute({ sql: "UPDATE mood_boards SET updated_at = ? WHERE id = ?", args: [new Date().toISOString(), boardId] });
  }
  return getMoodBoard(boardId);
}

export async function removeItemFromMoodBoard(boardId: number, itemId: number) {
  await initializeDatabase();
  const db = await getDb();
  const result = await db.execute({ sql: "DELETE FROM mood_board_items WHERE mood_board_id = ? AND item_id = ?", args: [boardId, itemId] });
  await db.execute({ sql: "UPDATE mood_boards SET updated_at = ? WHERE id = ?", args: [new Date().toISOString(), boardId] });
  return Number(result.rowsAffected || 0) > 0;
}

export async function listBoardsForItem(itemId: number) {
  await initializeDatabase();
  const result = await (await getDb()).execute({
    sql: `SELECT b.id, b.name, CASE WHEN mbi.id IS NULL THEN 0 ELSE 1 END AS included
      FROM mood_boards b LEFT JOIN mood_board_items mbi
      ON mbi.mood_board_id = b.id AND mbi.item_id = ? ORDER BY datetime(b.updated_at) DESC, b.id DESC`,
    args: [itemId],
  });
  return result.rows.map(row => ({ id: Number(row.id), name: String(row.name), included: Number(row.included) }));
}

export async function saveShareLink(token: string, resourceType: ShareLink["resource_type"], resourceId: number, expiresAt: string | null = null) {
  await initializeDatabase();
  const now = new Date().toISOString();
  await (await getDb()).execute({
    sql: "INSERT INTO share_links (token, resource_type, resource_id, created_at, expires_at, view_count) VALUES (?, ?, ?, ?, ?, 0)",
    args: [token, resourceType, resourceId, now, expiresAt],
  });
  return { token, resource_type: resourceType, resource_id: resourceId, created_at: now, expires_at: expiresAt, view_count: 0 } satisfies ShareLink;
}

export async function getShareLink(token: string): Promise<ShareLink | null> {
  await initializeDatabase();
  const result = await (await getDb()).execute({ sql: "SELECT token, resource_type, resource_id, created_at, expires_at, view_count FROM share_links WHERE token = ? LIMIT 1", args: [token] });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    token: String(row.token),
    resource_type: String(row.resource_type) as ShareLink["resource_type"],
    resource_id: Number(row.resource_id),
    created_at: String(row.created_at),
    expires_at: row.expires_at ? String(row.expires_at) : null,
    view_count: Number(row.view_count || 0),
  };
}

export async function incrementShareView(token: string) {
  await initializeDatabase();
  await (await getDb()).execute({ sql: "UPDATE share_links SET view_count = view_count + 1 WHERE token = ?", args: [token] });
  return getShareLink(token);
}

export async function saveStyleTags(itemId: number, tags: string[], source: "ai" | "curated", model?: string | null) {
  await initializeDatabase();
  const now = new Date().toISOString();
  await (await getDb()).execute({
    sql: `INSERT INTO item_style_tags (item_id, tags_json, source, model, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(item_id) DO UPDATE SET tags_json = excluded.tags_json, source = excluded.source, model = excluded.model, updated_at = excluded.updated_at`,
    args: [itemId, JSON.stringify(tags), source, model || null, now, now],
  });
  return getItem(itemId);
}

export async function addBookmark(itemId: number) {
  await initializeDatabase();
  const db = await getDb();
  await db.execute({ sql: "INSERT OR IGNORE INTO bookmarks (item_id, created_at) VALUES (?, ?)", args: [itemId, new Date().toISOString()] });
  const result = await db.execute({ sql: "SELECT id FROM bookmarks WHERE item_id = ? LIMIT 1", args: [itemId] });
  return Number(result.rows[0]?.id || 0);
}

export async function removeBookmark(bookmarkId: number) {
  await initializeDatabase();
  const result = await (await getDb()).execute({ sql: "DELETE FROM bookmarks WHERE id = ?", args: [bookmarkId] });
  return Number(result.rowsAffected || 0) > 0;
}

export async function removeBookmarkForItem(itemId: number) {
  await initializeDatabase();
  const result = await (await getDb()).execute({ sql: "DELETE FROM bookmarks WHERE item_id = ?", args: [itemId] });
  return Number(result.rowsAffected || 0) > 0;
}

export async function insertTrend(item: { title: string; description: string; category: string; image_url: string; source_url?: string | null }) {
  const result = await (await getDb()).execute({
    sql: `INSERT INTO items (title, description, category, image_url, source_url, created_at, is_new_today)
      VALUES (?, ?, ?, ?, ?, ?, 1)`,
    args: [item.title, item.description, item.category, item.image_url, item.source_url || null, new Date().toISOString()],
  });
  return Number(result.lastInsertRowid);
}

export async function markPreviousItemsNotNew() {
  await (await getDb()).execute("UPDATE items SET is_new_today = 0 WHERE is_new_today = 1");
}

export function imageForCategory(category: string, _index = 0) {
  // Legacy static pool is kept for seed data; for fresh trends, use unsplash-service.getImageForTrend()
  const pool = IMAGE_POOL[category] || IMAGE_POOL["Decor & Accessories"];
  // Randomize instead of deterministic index to provide variety
  return pool[Math.floor(Math.random() * pool.length)];
}

export { categories };

// The scaffold includes an OAuth helper that imports these names. Trendly intentionally
// does not use that flow, but retaining harmless no-op exports keeps the server bridge
// type-safe and lets the app remain login-free.
export async function upsertUser(_user: unknown): Promise<void> {
  return;
}

export async function getUserByOpenId(_openId: string): Promise<User | undefined> {
  return undefined;
}
