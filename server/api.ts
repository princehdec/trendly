import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import {
  addItemToMoodBoard,
  addBookmark,
  createMoodBoard,
  getItem,
  getMoodBoard,
  getShareLink,
  listBoardsForItem,
  listBookmarks,
  listItems,
  listItemsPage,
  listMoodBoards,
  removeItemFromMoodBoard,
  removeBookmark,
  removeBookmarkForItem,
  deleteMoodBoard,
  incrementShareView,
  reorderMoodBoard,
  saveShareLink,
  updateMoodBoard,
  updateMoodBoardItemNotes,
  updateBookmarkNotes,
  getRelatedItems,
  createCustomItem,
  listAllStyleTags,
  type ItemQueryOptions,
} from "./db";
import { refreshTrends } from "./trend-service";
import { suggestStyleTags } from "./style-tag-service";
import { askAssistant } from "./ai-assistant-service";

function numberParam(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function queryInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(typeof value === "string" ? value : fallback);
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function expiryDate(value: unknown) {
  const days = Number(value);
  return Number.isInteger(days) && [1, 7, 30].includes(days)
    ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    : null;
}

export function registerTrendRoutes(app: Express) {
  app.get("/api/items", async (req: Request, res: Response) => {
    try {
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const search = typeof req.query.q === "string" ? req.query.q : typeof req.query.search === "string" ? req.query.search : undefined;
      const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
      const filter: ItemQueryOptions = { category, search, tag };

      if (req.query.limit !== undefined || req.query.offset !== undefined) {
        const limit = queryInt(req.query.limit, 8, 1, 30);
        const offset = queryInt(req.query.offset, 0, 0, 100000);
        return res.json(await listItemsPage(filter, limit, offset));
      }
      res.json(await listItems(filter));
    } catch (error) {
      console.error("[Trendly] Failed to list items", error);
      res.status(500).json({ error: "Unable to load trends" });
    }
  });

  app.get("/api/style-tags", async (_req: Request, res: Response) => {
    try {
      res.json(await listAllStyleTags());
    } catch (error) {
      console.error("[Trendly] Failed to list style tags", error);
      res.status(500).json({ error: "Unable to load style tags" });
    }
  });

  app.post("/api/items", async (req: Request, res: Response) => {
    try {
      const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
      const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
      const category = typeof req.body?.category === "string" ? req.body.category.trim() : "";
      const imageUrl = typeof req.body?.image_url === "string" ? req.body.image_url.trim() : typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : undefined;
      const sourceUrl = typeof req.body?.source_url === "string" ? req.body.source_url.trim() : typeof req.body?.sourceUrl === "string" ? req.body.sourceUrl.trim() : undefined;
      const styleTags = Array.isArray(req.body?.style_tags) ? req.body.style_tags.filter((t: unknown) => typeof t === "string") : undefined;

      if (!title || !description || !category) {
        return res.status(400).json({ error: "title, description, and category are required" });
      }

      const item = await createCustomItem({
        title,
        description,
        category,
        image_url: imageUrl,
        source_url: sourceUrl,
        style_tags: styleTags,
      });

      return res.status(201).json(item);
    } catch (error) {
      console.error("[Trendly] Failed to create custom discovery", error);
      res.status(500).json({ error: "Unable to save custom discovery" });
    }
  });

  app.get("/api/items/:id", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid item id" });
    try {
      const item = await getItem(id);
      if (!item) return res.status(404).json({ error: "Item not found" });
      return res.json(item);
    } catch (error) {
      console.error("[Trendly] Failed to load item", error);
      return res.status(500).json({ error: "Unable to load item" });
    }
  });

  app.get("/api/items/:id/related", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid item id" });
    const limit = queryInt(req.query.limit, 4, 1, 12);
    try {
      const items = await getRelatedItems(id, limit);
      return res.json(items);
    } catch (error) {
      console.error("[Trendly] Failed to load related items", error);
      return res.status(500).json({ error: "Unable to load related items" });
    }
  });

  app.post("/api/items/:id/style-tags", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid item id" });
    try {
      const item = await suggestStyleTags(id, req.body?.force === true);
      if (!item) return res.status(404).json({ error: "Item not found" });
      return res.json(item);
    } catch (error) {
      console.error("[Trendly] Failed to suggest style tags", error);
      return res.status(500).json({ error: "Unable to analyze the saved image" });
    }
  });

  app.post("/api/bookmarks", async (req: Request, res: Response) => {
    const itemId = numberParam(req.body?.item_id ?? req.body?.itemId);
    if (!itemId) return res.status(400).json({ error: "item_id is required" });
    try {
      const bookmarkId = await addBookmark(itemId);
      return res.status(201).json({ id: bookmarkId, item_id: itemId });
    } catch (error) {
      console.error("[Trendly] Failed to save bookmark", error);
      return res.status(500).json({ error: "Unable to save bookmark" });
    }
  });

  app.delete("/api/bookmarks/:id", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid bookmark id" });
    try {
      return res.json({ success: await removeBookmark(id) });
    } catch (error) {
      console.error("[Trendly] Failed to remove bookmark", error);
      return res.status(500).json({ error: "Unable to remove bookmark" });
    }
  });

  app.delete("/api/bookmarks/item/:id", async (req: Request, res: Response) => {
    const itemId = numberParam(req.params.id);
    if (!itemId) return res.status(400).json({ error: "Invalid item id" });
    try {
      return res.json({ success: await removeBookmarkForItem(itemId) });
    } catch (error) {
      console.error("[Trendly] Failed to remove item bookmark", error);
      return res.status(500).json({ error: "Unable to remove bookmark" });
    }
  });

  app.patch("/api/bookmarks/item/:id/notes", async (req: Request, res: Response) => {
    const itemId = numberParam(req.params.id);
    if (!itemId) return res.status(400).json({ error: "Invalid item id" });
    const notes = typeof req.body?.notes === "string" ? req.body.notes : null;
    try {
      const item = await updateBookmarkNotes(itemId, notes);
      if (!item) return res.status(404).json({ error: "Item not found" });
      return res.json(item);
    } catch (error) {
      console.error("[Trendly] Failed to update bookmark notes", error);
      return res.status(500).json({ error: "Unable to update bookmark notes" });
    }
  });

  app.get("/api/bookmarks", async (_req: Request, res: Response) => {
    try {
      res.json(await listBookmarks());
    } catch (error) {
      console.error("[Trendly] Failed to list bookmarks", error);
      res.status(500).json({ error: "Unable to load saved items" });
    }
  });

  app.get("/api/mood-boards", async (_req: Request, res: Response) => {
    try {
      res.json(await listMoodBoards());
    } catch (error) {
      console.error("[Trendly] Failed to list mood boards", error);
      res.status(500).json({ error: "Unable to load mood boards" });
    }
  });

  app.post("/api/mood-boards", async (req: Request, res: Response) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ error: "name is required" });
    try {
      const board = await createMoodBoard(name, req.body?.description);
      return res.status(201).json(board);
    } catch (error) {
      console.error("[Trendly] Failed to create mood board", error);
      return res.status(500).json({ error: "Unable to create mood board" });
    }
  });

  app.get("/api/mood-boards/:id", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid mood board id" });
    try {
      const board = await getMoodBoard(id);
      if (!board) return res.status(404).json({ error: "Mood board not found" });
      return res.json(board);
    } catch (error) {
      console.error("[Trendly] Failed to load mood board", error);
      return res.status(500).json({ error: "Unable to load mood board" });
    }
  });

  app.patch("/api/mood-boards/:id", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!id) return res.status(400).json({ error: "Invalid mood board id" });
    if (!name) return res.status(400).json({ error: "name is required" });
    try {
      const board = await updateMoodBoard(id, name, req.body?.description);
      if (!board) return res.status(404).json({ error: "Mood board not found" });
      return res.json(board);
    } catch (error) {
      console.error("[Trendly] Failed to update mood board", error);
      return res.status(500).json({ error: "Unable to update mood board" });
    }
  });

  app.delete("/api/mood-boards/:id", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid mood board id" });
    try {
      return res.json({ success: await deleteMoodBoard(id) });
    } catch (error) {
      console.error("[Trendly] Failed to delete mood board", error);
      return res.status(500).json({ error: "Unable to delete mood board" });
    }
  });

  app.get("/api/items/:id/mood-boards", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid item id" });
    try {
      return res.json(await listBoardsForItem(id));
    } catch (error) {
      console.error("[Trendly] Failed to list item boards", error);
      return res.status(500).json({ error: "Unable to load item boards" });
    }
  });

  app.post("/api/mood-boards/:id/items", async (req: Request, res: Response) => {
    const boardId = numberParam(req.params.id);
    const itemId = numberParam(req.body?.item_id ?? req.body?.itemId);
    if (!boardId || !itemId) return res.status(400).json({ error: "board id and item_id are required" });
    try {
      const board = await addItemToMoodBoard(boardId, itemId);
      if (!board) return res.status(404).json({ error: "Mood board not found" });
      return res.status(201).json(board);
    } catch (error) {
      console.error("[Trendly] Failed to add item to mood board", error);
      return res.status(500).json({ error: "Unable to add item to mood board" });
    }
  });

  app.patch("/api/mood-boards/:id/items/order", async (req: Request, res: Response) => {
    const boardId = numberParam(req.params.id);
    const itemIds = Array.isArray(req.body?.item_ids) ? req.body.item_ids.map(Number).filter(Number.isInteger) : [];
    if (!boardId || itemIds.length === 0) return res.status(400).json({ error: "board id and item_ids are required" });
    try {
      const board = await reorderMoodBoard(boardId, itemIds);
      if (!board) return res.status(404).json({ error: "Mood board not found" });
      return res.json(board);
    } catch (error) {
      console.error("[Trendly] Failed to reorder mood board", error);
      return res.status(500).json({ error: "Unable to reorder mood board" });
    }
  });

  app.delete("/api/mood-boards/:id/items/:itemId", async (req: Request, res: Response) => {
    const boardId = numberParam(req.params.id);
    const itemId = numberParam(req.params.itemId);
    if (!boardId || !itemId) return res.status(400).json({ error: "Invalid board or item id" });
    try {
      return res.json({ success: await removeItemFromMoodBoard(boardId, itemId) });
    } catch (error) {
      console.error("[Trendly] Failed to remove item from mood board", error);
      return res.status(500).json({ error: "Unable to remove item from mood board" });
    }
  });

  app.patch("/api/mood-boards/:id/items/:itemId/notes", async (req: Request, res: Response) => {
    const boardId = numberParam(req.params.id);
    const itemId = numberParam(req.params.itemId);
    if (!boardId || !itemId) return res.status(400).json({ error: "Invalid board or item id" });
    const notes = typeof req.body?.notes === "string" ? req.body.notes : null;
    try {
      const board = await updateMoodBoardItemNotes(boardId, itemId, notes);
      if (!board) return res.status(404).json({ error: "Mood board not found" });
      return res.json(board);
    } catch (error) {
      console.error("[Trendly] Failed to update mood board item notes", error);
      return res.status(500).json({ error: "Unable to update mood board item notes" });
    }
  });

  app.post("/api/shares/items/:id", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid item id" });
    try {
      if (!(await getItem(id))) return res.status(404).json({ error: "Item not found" });
      const share = await saveShareLink(nanoid(12), "item", id, expiryDate(req.body?.expires_in_days));
      return res.status(201).json({ ...share, path: `/share/${share.token}` });
    } catch (error) {
      console.error("[Trendly] Failed to create item share link", error);
      return res.status(500).json({ error: "Unable to create share link" });
    }
  });

  app.post("/api/shares/mood-boards/:id", async (req: Request, res: Response) => {
    const id = numberParam(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid mood board id" });
    try {
      if (!(await getMoodBoard(id))) return res.status(404).json({ error: "Mood board not found" });
      const share = await saveShareLink(nanoid(12), "mood_board", id, expiryDate(req.body?.expires_in_days));
      return res.status(201).json({ ...share, path: `/share/${share.token}` });
    } catch (error) {
      console.error("[Trendly] Failed to create mood board share link", error);
      return res.status(500).json({ error: "Unable to create share link" });
    }
  });

  app.get("/api/shares/:token", async (req: Request, res: Response) => {
    try {
      const share = await getShareLink(req.params.token);
      if (!share) return res.status(404).json({ error: "Share link not found" });
      if (share.expires_at && Date.parse(share.expires_at) <= Date.now()) return res.status(410).json({ error: "This share link has expired", expired: true });
      const resource = share.resource_type === "item" ? await getItem(share.resource_id) : await getMoodBoard(share.resource_id);
      if (!resource) return res.status(404).json({ error: "Shared resource not found" });
      return res.json({ share: await incrementShareView(req.params.token), resource });
    } catch (error) {
      console.error("[Trendly] Failed to resolve share link", error);
      return res.status(500).json({ error: "Unable to open share link" });
    }
  });

  app.post("/api/refresh-trends", async (_req: Request, res: Response) => {
    try {
      const result = await refreshTrends();
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("[Trendly] Manual refresh failed", error);
      res.status(500).json({ error: "Unable to refresh trends" });
    }
  });

  app.post("/api/discover/extract", async (req: Request, res: Response) => {
    try {
      const { extractTrendingDiscoveries } = await import("./discovery-extractor-service");
      const category = typeof req.body?.category === "string" ? req.body.category.trim() : undefined;
      const tag = typeof req.body?.tag === "string" ? req.body.tag.trim() : undefined;
      const search = typeof req.body?.search === "string" ? req.body.search.trim() : typeof req.body?.q === "string" ? req.body.q.trim() : undefined;
      const items = await extractTrendingDiscoveries({ category, tag, search });
      res.json({ success: true, items });
    } catch (error) {
      console.error("[Trendly] Discovery extraction failed", error);
      res.status(500).json({ error: "Unable to extract trending discoveries from Unsplash & Pinterest" });
    }
  });

  app.post("/api/ai/assistant", async (req: Request, res: Response) => {
    try {
      const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
      if (messages.length === 0) {
        return res.status(400).json({ error: "messages array is required" });
      }
      const response = await askAssistant({
        messages,
        context: req.body?.context,
      });
      return res.json({ response });
    } catch (error) {
      console.error("[Trendly] AI Assistant failed", error);
      return res.status(500).json({ error: "Unable to consult AI design co-pilot" });
    }
  });
}
