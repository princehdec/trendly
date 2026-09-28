import { relations } from "drizzle-orm";
import { items, bookmarks, moodBoards, moodBoardItems, shareLinks, itemStyleTags } from "./schema";

export const itemsRelations = relations(items, ({ many }) => ({
  bookmarks: many(bookmarks),
  moodBoardItems: many(moodBoardItems),
  styleTags: many(itemStyleTags),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  item: one(items, { fields: [bookmarks.item_id], references: [items.id] }),
}));

export const moodBoardsRelations = relations(moodBoards, ({ many }) => ({
  items: many(moodBoardItems),
}));

export const moodBoardItemsRelations = relations(moodBoardItems, ({ one }) => ({
  moodBoard: one(moodBoards, { fields: [moodBoardItems.mood_board_id], references: [moodBoards.id] }),
  item: one(items, { fields: [moodBoardItems.item_id], references: [items.id] }),
}));

export const itemStyleTagsRelations = relations(itemStyleTags, ({ one }) => ({
  item: one(items, { fields: [itemStyleTags.item_id], references: [items.id] }),
}));
