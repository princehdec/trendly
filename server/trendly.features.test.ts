import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addItemToMoodBoard,
  createMoodBoard,
  deleteMoodBoard,
  getItem,
  getMoodBoard,
  getShareLink,
  incrementShareView,
  listBoardsForItem,
  listItemsPage,
  removeItemFromMoodBoard,
  reorderMoodBoard,
  saveShareLink,
  saveStyleTags,
  createCustomItem,
  listAllStyleTags,
  listItems,
  updateMoodBoardItemNotes,
  updateBookmarkNotes,
  getRelatedItems,
  addBookmark,
  removeBookmarkForItem,
  listBookmarks,
} from "./db";
import { askAssistant } from "./ai-assistant-service";

describe("Trendly enhanced features", () => {
  let itemId = 0;
  let secondItemId = 0;
  let boardId = 0;
  const shareToken = `test-share-${Date.now()}`;
  const expiringToken = `test-expiring-share-${Date.now()}`;

  beforeAll(async () => {
    const page = await listItemsPage(undefined, 3, 0);
    itemId = page.items[0]?.id || 0;
    secondItemId = page.items[1]?.id || 0;
    expect(itemId).toBeGreaterThan(0);
    expect(secondItemId).toBeGreaterThan(0);
    const board = await createMoodBoard(`Test board ${Date.now()}`, "Regression coverage");
    boardId = board?.id || 0;
    expect(boardId).toBeGreaterThan(0);
  });

  afterAll(async () => {
    if (boardId && itemId) await removeItemFromMoodBoard(boardId, itemId);
    if (boardId && secondItemId) await removeItemFromMoodBoard(boardId, secondItemId);
    if (boardId) await deleteMoodBoard(boardId);
  });

  it("returns a bounded page with a continuation offset", async () => {
    const page = await listItemsPage(undefined, 2, 0);
    expect(page.items).toHaveLength(2);
    expect(page.nextOffset).toBe(2);
    expect(page.total).toBeGreaterThanOrEqual(2);
    expect(page.hasMore).toBe(page.total > 2);
  });

  it("adds, reorders, and removes items from a custom mood board", async () => {
    await addItemToMoodBoard(boardId, itemId);
    await addItemToMoodBoard(boardId, secondItemId);
    const initial = await getMoodBoard(boardId);
    expect(initial?.items.map(item => item.id)).toEqual([itemId, secondItemId]);

    await reorderMoodBoard(boardId, [secondItemId, itemId]);
    const reordered = await getMoodBoard(boardId);
    expect(reordered?.items.map(item => item.id)).toEqual([secondItemId, itemId]);
    expect((await listBoardsForItem(itemId)).find(board => board.id === boardId)?.included).toBe(1);

    await removeItemFromMoodBoard(boardId, itemId);
    await removeItemFromMoodBoard(boardId, secondItemId);
    const afterRemove = await getMoodBoard(boardId);
    expect(afterRemove?.items).toHaveLength(0);
  });

  it("persists style tags alongside the analyzed item", async () => {
    await saveStyleTags(itemId, ["Japandi", "warm minimalism", "natural materials"], "curated");
    const item = await getItem(itemId);
    expect(item?.style_tags).toEqual(["Japandi", "warm minimalism", "natural materials"]);
    expect(item?.style_tags_source).toBe("curated");
  });

  it("persists share expiration and increments valid view counts", async () => {
    const share = await saveShareLink(shareToken, "item", itemId);
    expect(share).toMatchObject({ token: shareToken, resource_type: "item", resource_id: itemId, view_count: 0, expires_at: null });
    expect(await incrementShareView(shareToken)).toMatchObject({ token: shareToken, view_count: 1 });
    expect(await incrementShareView(shareToken)).toMatchObject({ token: shareToken, view_count: 2 });

    const expiredAt = new Date(Date.now() - 60_000).toISOString();
    await saveShareLink(expiringToken, "item", itemId, expiredAt);
    expect(await getShareLink(expiringToken)).toMatchObject({ token: expiringToken, expires_at: expiredAt, view_count: 0 });
  });

  it("creates custom interior items with tags and finds them via search", async () => {
    const customTitle = `Fluted Oak Vanity ${Date.now()}`;
    const customItem = await createCustomItem({
      title: customTitle,
      description: "Custom fluted European white oak vanity with inset stone sink.",
      category: "Furniture",
      style_tags: ["warm minimalism", "tactile joinery"],
    });

    expect(customItem.id).toBeGreaterThan(0);
    expect(customItem.title).toBe(customTitle);
    expect(customItem.category).toBe("Furniture");
    expect(customItem.style_tags).toContain("warm minimalism");

    // Search by title keyword
    const searchResult = await listItems({ search: "Fluted Oak" });
    expect(searchResult.some(item => item.id === customItem.id)).toBe(true);

    // Filter by tag
    const tagResult = await listItems({ tag: "tactile joinery" });
    expect(tagResult.some(item => item.id === customItem.id)).toBe(true);
  });

  it("lists all available style tags including curated defaults", async () => {
    const tags = await listAllStyleTags();
    expect(tags).toBeInstanceOf(Array);
    expect(tags).toContain("quiet luxury");
    expect(tags).toContain("Japandi");
    expect(tags).toContain("warm minimalism");
  });

  it("provides tailored interior design assistant advice for Shilpi's mood board", async () => {
    const response = await askAssistant({
      messages: [{ role: "user", content: "What color palette and hardware should I pair with this mood board?" }],
      context: { boardId },
    });

    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(50);
    expect(response.toLowerCase()).toContain("palette");
  });

  it("persists and clears personal notes on mood board items", async () => {
    await addItemToMoodBoard(boardId, itemId);
    const noteText = "Client requested brushed brass hardware for this piece";

    // Set note
    const updatedBoard = await updateMoodBoardItemNotes(boardId, itemId, noteText);
    const updatedItem = updatedBoard?.items.find(i => i.id === itemId);
    expect(updatedItem?.notes).toBe(noteText);

    // Verify retrieval via getMoodBoard
    const retrievedBoard = await getMoodBoard(boardId);
    const retrievedItem = retrievedBoard?.items.find(i => i.id === itemId);
    expect(retrievedItem?.notes).toBe(noteText);

    // Clear note
    await updateMoodBoardItemNotes(boardId, itemId, null);
    const clearedBoard = await getMoodBoard(boardId);
    const clearedItem = clearedBoard?.items.find(i => i.id === itemId);
    expect(clearedItem?.notes).toBeNull();

    await removeItemFromMoodBoard(boardId, itemId);
  });

  it("persists personal notes on bookmarked items", async () => {
    await addBookmark(itemId);
    const bookmarkNote = "Compare with French limestone sample";
    await updateBookmarkNotes(itemId, bookmarkNote);

    const bookmarks = await listBookmarks();
    const targetBookmark = bookmarks.find(b => b.id === itemId);
    expect(targetBookmark?.notes).toBe(bookmarkNote);

    await removeBookmarkForItem(itemId);
  });

  it("retrieves related interior design trends prioritizing matching category and style cues", async () => {
    const targetItem = await getItem(itemId);
    expect(targetItem).not.toBeNull();

    const related = await getRelatedItems(itemId, 4);
    expect(related).toBeInstanceOf(Array);
    expect(related.length).toBeGreaterThan(0);
    expect(related.length).toBeLessThanOrEqual(4);

    // Should never include the target item itself
    expect(related.some(r => r.id === itemId)).toBe(false);

    // Candidates in the same category or matching style cues should be prioritized
    const hasAffinity = related.some(
      r => r.category.toLowerCase() === targetItem!.category.toLowerCase() ||
      Boolean(r.style_tags && targetItem!.style_tags?.some(t => r.style_tags!.includes(t)))
    );
    expect(hasAffinity).toBe(true);
  });
});
