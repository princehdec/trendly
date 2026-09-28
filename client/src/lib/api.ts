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
  notes?: string | null;
  style_tags?: string[];
  style_tags_source?: "ai" | "curated";
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

export type BoardMembership = { id: number; name: string; included: number };

export type ShareResponse = {
  token: string;
  resource_type: "item" | "mood_board";
  resource_id: number;
  created_at: string;
  expires_at: string | null;
  view_count: number;
  path: string;
};

export type SharedResource = {
  share: Omit<ShareResponse, "path">;
  resource: TrendItem | MoodBoardDetail;
};

export type ItemsPage = { items: TrendItem[]; hasMore: boolean; nextOffset: number; total: number };

export type ItemFilterParams = {
  category?: string;
  search?: string;
  tag?: string;
};

export type CreateItemInput = {
  title: string;
  description: string;
  category: string;
  image_url?: string;
  source_url?: string;
  style_tags?: string[];
};

export type AssistantChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AssistantContext = {
  boardId?: number;
  category?: string;
  itemId?: number;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Something went wrong");
  }
  return response.json() as Promise<T>;
}

export const api = {
  items: (filter?: string | ItemFilterParams) => {
    const params = typeof filter === "string" ? { category: filter } : (filter || {});
    const sp = new URLSearchParams();
    if (params.category) sp.set("category", params.category);
    if (params.search) sp.set("q", params.search);
    if (params.tag) sp.set("tag", params.tag);
    const qs = sp.toString();
    return request<TrendItem[]>(qs ? `/api/items?${qs}` : "/api/items");
  },
  itemsPage: (filter: string | ItemFilterParams | undefined, limit: number, offset: number) => {
    const params = typeof filter === "string" ? { category: filter } : (filter || {});
    const sp = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (params.category) sp.set("category", params.category);
    if (params.search) sp.set("q", params.search);
    if (params.tag) sp.set("tag", params.tag);
    return request<ItemsPage>(`/api/items?${sp.toString()}`);
  },
  createItem: (input: CreateItemInput) => request<TrendItem>("/api/items", { method: "POST", body: JSON.stringify(input) }),
  styleTags: () => request<string[]>("/api/style-tags"),
  item: (id: string | number) => request<TrendItem>(`/api/items/${id}`),
  relatedItems: (id: string | number, limit = 4) => request<TrendItem[]>(`/api/items/${id}/related?limit=${limit}`),
  suggestStyleTags: (itemId: number, force = false) => request<TrendItem>(`/api/items/${itemId}/style-tags`, { method: "POST", body: JSON.stringify({ force }) }),
  saved: () => request<SavedItem[]>("/api/bookmarks"),
  save: (itemId: number) => request<{ id: number; item_id: number }>("/api/bookmarks", { method: "POST", body: JSON.stringify({ item_id: itemId }) }),
  removeBookmark: (bookmarkId: number) => request<{ success: boolean }>(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" }),
  removeItemBookmark: (itemId: number) => request<{ success: boolean }>(`/api/bookmarks/item/${itemId}`, { method: "DELETE" }),
  updateBookmarkNotes: (itemId: number, notes: string | null) =>
    request<TrendItem>(`/api/bookmarks/item/${itemId}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) }),
  moodBoards: () => request<MoodBoard[]>("/api/mood-boards"),
  moodBoard: (id: number) => request<MoodBoardDetail>(`/api/mood-boards/${id}`),
  createMoodBoard: (name: string, description?: string) => request<MoodBoardDetail>("/api/mood-boards", { method: "POST", body: JSON.stringify({ name, description }) }),
  updateMoodBoard: (id: number, name: string, description?: string) => request<MoodBoardDetail>(`/api/mood-boards/${id}`, { method: "PATCH", body: JSON.stringify({ name, description }) }),
  deleteMoodBoard: (id: number) => request<{ success: boolean }>(`/api/mood-boards/${id}`, { method: "DELETE" }),
  itemBoards: (itemId: number) => request<BoardMembership[]>(`/api/items/${itemId}/mood-boards`),
  addToMoodBoard: (boardId: number, itemId: number) => request<MoodBoardDetail>(`/api/mood-boards/${boardId}/items`, { method: "POST", body: JSON.stringify({ item_id: itemId }) }),
  reorderMoodBoard: (boardId: number, itemIds: number[]) => request<MoodBoardDetail>(`/api/mood-boards/${boardId}/items/order`, { method: "PATCH", body: JSON.stringify({ item_ids: itemIds }) }),
  removeFromMoodBoard: (boardId: number, itemId: number) => request<{ success: boolean }>(`/api/mood-boards/${boardId}/items/${itemId}`, { method: "DELETE" }),
  updateMoodBoardItemNotes: (boardId: number, itemId: number, notes: string | null) =>
    request<MoodBoardDetail>(`/api/mood-boards/${boardId}/items/${itemId}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) }),
  shareItem: (itemId: number, expiresInDays: number | null = null) => request<ShareResponse>(`/api/shares/items/${itemId}`, { method: "POST", body: JSON.stringify({ expires_in_days: expiresInDays }) }),
  shareMoodBoard: (boardId: number, expiresInDays: number | null = null) => request<ShareResponse>(`/api/shares/mood-boards/${boardId}`, { method: "POST", body: JSON.stringify({ expires_in_days: expiresInDays }) }),
  shared: (token: string) => request<SharedResource>(`/api/shares/${token}`),
  refresh: () => request<{ success: boolean; source: "openrouter" | "fallback"; items: TrendItem[] }>("/api/refresh-trends", { method: "POST" }),
  extractTrending: (params: { category?: string; tag?: string; search?: string }) =>
    request<{ success: boolean; items: TrendItem[] }>("/api/discover/extract", { method: "POST", body: JSON.stringify(params) }),
  askAssistant: (messages: AssistantChatMessage[], context?: AssistantContext) =>
    request<{ response: string }>("/api/ai/assistant", { method: "POST", body: JSON.stringify({ messages, context }) }),
};

export function isNewToday(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}
