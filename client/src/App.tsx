import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Compass,
  FolderPlus,
  GripVertical,
  Grid2X2,
  Layers3,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Share2,
  Sparkles,
  Store,
  SunMedium,
  Tag,
  Trash2,
  Eye,
  Search,
  X,
  Plus,
  Printer,
  SlidersHorizontal,
  MessageSquare,
} from "lucide-react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import MoodBoardPicker from "@/components/MoodBoardPicker";
import ShareMenu from "@/components/ShareMenu";
import SkeletonImage from "@/components/SkeletonImage";
import TrendCard from "@/components/TrendCard";
import AddDiscoveryModal from "@/components/AddDiscoveryModal";
import ClientSpecSheetModal from "@/components/ClientSpecSheetModal";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";
import ItemNoteModal from "@/components/ItemNoteModal";
import { api, isNewToday, type MoodBoard, type MoodBoardDetail, type SavedItem, type SharedResource, type TrendItem } from "@/lib/api";

const CATEGORIES = [
  { name: "Flooring", note: "Grounded surfaces", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85" },
  { name: "Wall Finishes", note: "Texture & depth", image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=900&q=85" },
  { name: "Lighting", note: "A softer glow", image: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=900&q=85" },
  { name: "Furniture", note: "Objects to linger with", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85" },
  { name: "Tiles", note: "Small-scale pattern", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85" },
  { name: "Paint & Color", note: "The mood of a room", image: "https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?auto=format&fit=crop&w=900&q=85" },
  { name: "Fabrics & Textiles", note: "Tactile layers", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85" },
  { name: "Hardware", note: "The finishing touch", image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=900&q=85" },
  { name: "Decor & Accessories", note: "Little pauses", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85" },
];

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(date));
}

function AppShell() {
  const location = useLocation();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [activeBoardForAI, setActiveBoardForAI] = useState<MoodBoardDetail | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, location.search]);

  return (
    <div className="app-frame">
      <div className="grain" />
      <header className="topbar page-width print:hidden">
        <Link to="/" className="brand-mark" aria-label="Trendly home"><span className="brand-dot" /><span>trendly</span></Link>
        <div className="topbar-right">
          <button
            type="button"
            onClick={() => setAiDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0e7dc] text-[#96513d] hover:bg-[#e6d8ca] font-semibold text-xs transition-colors"
          >
            <Sparkles size={13} />
            <span>AI Co-Pilot</span>
          </button>
          <span className="desktop-date">{formatDate()}</span>
          <div className="profile-chip" aria-label="Profile: Shilpi"><span>S</span><span className="profile-name">Shilpi</span></div>
        </div>
      </header>
      <main className="page-width app-main">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/saved" element={<SavedPage onActiveBoardChange={setActiveBoardForAI} onOpenAI={() => setAiDrawerOpen(true)} />} />
          <Route path="/item/:id" element={<DetailPage />} />
          <Route path="/share/:token" element={<SharedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <button
        type="button"
        onClick={() => setAiDrawerOpen(true)}
        className="fixed right-6 bottom-24 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#2c2926] text-[#fffdf9] border border-stone-700 shadow-xl hover:bg-[#b9684f] hover:border-[#b9684f] transition-all transform hover:-translate-y-0.5 print:hidden"
        aria-label="Consult AI Design Co-Pilot"
      >
        <Sparkles size={15} className="text-[#b9684f]" />
        <span className="text-xs font-semibold tracking-wide">Design Co-Pilot</span>
      </button>
      <AIAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        activeBoard={activeBoardForAI}
      />
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const links = [
    { to: "/", label: "Feed", icon: Compass, end: true },
    { to: "/categories", label: "Categories", icon: Tag },
    { to: "/saved", label: "Saved", icon: Bookmark },
  ];
  return <nav className="bottom-nav" aria-label="Primary navigation"><div className="bottom-nav-inner">
    {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Icon size={20} strokeWidth={1.75} /><span>{label}</span></NavLink>)}
    <div className="nav-rule" /><span className="nav-caption">A daily edit<br />for considered spaces</span>
  </div></nav>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-line" />{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>;
}

function LoadingState({ label = "Curating your edit" }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={22} /><span>{label}</span></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="empty-state"><div className="empty-icon"><SunMedium size={22} /></div><h2>Something went quiet</h2><p>{message}</p>{onRetry && <button type="button" className="text-button" onClick={onRetry}>Try again <ChevronRight size={15} /></button>}</div>;
}

function FeedSkeleton() {
  return <div className="feed-grid feed-skeleton-grid">{Array.from({ length: 6 }).map((_, index) => <div className={`feed-item feed-item-${index % 3}`} key={index}><article className="trend-card"><div className="trend-image-wrap skeleton-block" /><div className="card-copy"><div className="skeleton-line skeleton-line-title" /><div className="skeleton-line skeleton-line-copy" /><div className="skeleton-line skeleton-line-copy short" /></div></article></div>)}</div>;
}

function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || undefined;
  const activeTag = searchParams.get("tag") || undefined;
  const activeQuery = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(activeQuery);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [items, setItems] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const [pickerItem, setPickerItem] = useState<TrendItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleExtractFromPinterestUnsplash = async () => {
    setExtracting(true);
    try {
      const res = await api.extractTrending({ category: activeCategory, tag: activeTag, search: activeQuery });
      if (res.items && res.items.length > 0) {
        setItems(res.items);
        setNotice(`Extracted ${res.items.length} trending discoveries from Unsplash & Pinterest.`);
      } else {
        await loadPage(0, true);
      }
    } catch (e) {
      console.error(e);
      await loadPage(0, true);
    } finally {
      setExtracting(false);
    }
  };

  useEffect(() => {
    setSearchInput(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    api.styleTags().then(setAvailableTags).catch(() => undefined);
  }, []);

  const loadPage = useCallback(async (nextOffset: number, reset = false) => {
    if (reset) { setLoading(true); setError(""); } else setLoadingMore(true);
    try {
      const page = await api.itemsPage(
        { category: activeCategory, search: activeQuery || undefined, tag: activeTag },
        8,
        nextOffset
      );
      setItems(current => reset ? page.items : [...current, ...page.items.filter(item => !current.some(existing => existing.id === item.id))]);
      setOffset(page.nextOffset);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the feed");
    } finally {
      if (reset) setLoading(false); else setLoadingMore(false);
    }
  }, [activeCategory, activeQuery, activeTag]);

  useEffect(() => { void loadPage(0, true); }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting && hasMore && !loadingMore) void loadPage(offset); }, { rootMargin: "520px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, offset, loadPage]);

  const toggleBookmark = async (item: TrendItem) => {
    setItems(current => current.map(entry => entry.id === item.id ? { ...entry, bookmarked: item.bookmarked ? 0 : 1 } : entry));
    try { if (item.bookmarked) await api.removeItemBookmark(item.id); else { await api.save(item.id); void api.suggestStyleTags(item.id).catch(() => undefined); } }
    catch { setItems(current => current.map(entry => entry.id === item.id ? { ...entry, bookmarked: item.bookmarked } : entry)); }
  };

  const refresh = async () => {
    setRefreshing(true); setNotice("");
    try { const result = await api.refresh(); setNotice(`${result.items.length} fresh finds added${result.source === "fallback" ? " in preview mode" : ""}.`); await loadPage(0, true); }
    catch (err) { setNotice(err instanceof Error ? err.message : "Refresh unavailable"); }
    finally { setRefreshing(false); }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      next.set("q", searchInput.trim());
    } else {
      next.delete("q");
    }
    setSearchParams(next);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next);
  };

  const handleTagToggle = (tag: string) => {
    const next = new URLSearchParams(searchParams);
    if (activeTag?.toLowerCase() === tag.toLowerCase()) {
      next.delete("tag");
    } else {
      next.set("tag", tag);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchInput("");
  };

  const handleItemCreated = (newItem: TrendItem) => {
    setItems(current => [newItem, ...current]);
    setNotice(`"${newItem.title}" added to your catalog.`);
    setPickerItem(newItem);
  };

  const hasActiveFilters = Boolean(activeCategory || activeTag || activeQuery);

  return <>
    <PageHeading
      eyebrow={hasActiveFilters ? "Filtered discoveries" : "The daily edit"}
      title={activeCategory || (activeTag ? `${activeTag} edit` : (() => { const h = new Date().getHours(); return h < 12 ? "Good morning, Shilpi." : h < 17 ? "Good afternoon, Shilpi." : "Good evening, Shilpi."; })())}
      description={activeCategory ? `A focused look at what is moving in ${activeCategory.toLowerCase()} right now.` : "A considered collection of materials, finishes, and objects worth specifying next."}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="refresh-button"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add discovery</span>
          </button>
          <button
            type="button"
            className={`refresh-button ${refreshing ? "loading" : ""}`}
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            {refreshing ? "Refreshing" : "Refresh trends"}
          </button>
        </div>
      }
    />

    {/* Search & Style Tag Filter Controls */}
    <div className="feed-controls">
      <form onSubmit={handleSearchSubmit} className="feed-search-form">
        <Search size={16} className="feed-search-icon" />
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search materials, finishes, concepts (e.g. 'travertine', 'Japandi', 'oak')..."
          className="feed-search-input"
        />
        {searchInput && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="feed-search-clear"
            aria-label="Clear search query"
          >
            <X size={12} />
          </button>
        )}
      </form>

      {/* Style Tags Filter Bar */}
      {availableTags.length > 0 && (
        <div className="style-tag-filter-bar">
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("tag");
              setSearchParams(next);
            }}
            className={`style-tag-filter-chip ${!activeTag ? "active" : ""}`}
          >
            All Cues
          </button>
          {availableTags.map(tag => {
            const isActive = activeTag?.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`style-tag-filter-chip ${isActive ? "active" : ""}`}
              >
                <Tag size={11} className={isActive ? "text-white" : "text-[#b9684f]"} />
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="active-filters-row">
          <span>Active filters:</span>
          {activeCategory && (
            <span className="active-filter-badge">
              Category: {activeCategory}
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("category");
                  setSearchParams(next);
                }}
              >
                <X size={11} />
              </button>
            </span>
          )}
          {activeTag && (
            <span className="active-filter-badge">
              Style: {activeTag}
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("tag");
                  setSearchParams(next);
                }}
              >
                <X size={11} />
              </button>
            </span>
          )}
          {activeQuery && (
            <span className="active-filter-badge">
              Query: "{activeQuery}"
              <button type="button" onClick={handleClearSearch}>
                <X size={11} />
              </button>
            </span>
          )}
          <button type="button" onClick={clearAllFilters} className="clear-filter" style={{ margin: 0 }}>
            Reset all
          </button>
        </div>
      )}
    </div>

    {notice && <div className="notice"><Sparkles size={16} />{notice}</div>}
    {loading ? (
      <FeedSkeleton />
    ) : error ? (
      <ErrorState message={error} onRetry={() => void loadPage(0, true)} />
    ) : items.length === 0 ? (
      <div className="empty-state">
        <div className="empty-icon"><Search size={22} /></div>
        <h2>No discoveries matched yet</h2>
        <p>Extract trending materials and products tailored to your filter directly from Unsplash & Pinterest.</p>
        <div className="empty-actions flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
          <button
            type="button"
            className="extract-empty-btn"
            onClick={handleExtractFromPinterestUnsplash}
            disabled={extracting}
          >
            {extracting ? (
              <><LoaderCircle className="spin" size={15} /> Curating from Unsplash & Pinterest...</>
            ) : (
              <><Sparkles size={15} /> Extract from Pinterest & Unsplash</>
            )}
          </button>
          <button type="button" className="text-button" onClick={clearAllFilters}>
            Clear all filters <ArrowLeft size={14} />
          </button>
        </div>
      </div>
    ) : (
      <>
        <div className="feed-grid">
          {items.map((item, index) => (
            <div className={`feed-item feed-item-${index % 3}`} key={item.id}>
              <TrendCard item={item} onToggleBookmark={toggleBookmark} onOpenBoards={setPickerItem} showTags />
            </div>
          ))}
        </div>
        <div ref={sentinelRef} className="feed-sentinel">
          {loadingMore ? (
            <><LoaderCircle className="spin" size={18} />Finding more discoveries</>
          ) : hasMore ? (
            ""
          ) : (
            <span>You've reached the end of this edit.</span>
          )}
        </div>
      </>
    )}
    {pickerItem && <MoodBoardPicker item={pickerItem} onClose={() => setPickerItem(null)} />}
    <AddDiscoveryModal
      isOpen={showAddModal}
      onClose={() => setShowAddModal(false)}
      onCreated={handleItemCreated}
    />
  </>;
}

function CategoriesPage() {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.items().then(setItems).finally(() => setLoading(false)); }, []);
  const counts = useMemo(() => items.reduce<Record<string, number>>((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc; }, {}), [items]);
  return <><PageHeading eyebrow="Browse the library" title="Find your material." description="Start with a category, then follow the thread wherever it leads." />{loading ? <LoadingState label="Mapping the library" /> : <div className="category-grid">{CATEGORIES.map((category, index) => <Link to={`/?category=${encodeURIComponent(category.name)}`} className={`category-tile tile-${index % 4}`} key={category.name}><SkeletonImage src={category.image} alt="" loading="lazy" wrapperClassName="category-image" /><div className="category-overlay" /><div className="category-tile-copy"><span className="category-count">{counts[category.name] || 0} discoveries</span><h2>{category.name}</h2><p>{category.note}</p></div><ChevronRight className="tile-arrow" size={20} /></Link>)}</div>}</>;
}

function CreateBoardForm({ onCreated, onCancel }: { onCreated: (board: MoodBoard) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try { const board = await api.createMoodBoard(name, description); onCreated(board); }
    finally { setSaving(false); }
  };
  return <form className="create-board-form" onSubmit={submit}><div className="create-board-heading"><div><p className="eyebrow"><span className="eyebrow-line" />New collection</p><h2>Give your next idea a home.</h2></div><button type="button" className="close-button" onClick={onCancel} aria-label="Close create board form">×</button></div><input value={name} onChange={event => setName(event.target.value)} placeholder="Board name — e.g. Quiet kitchen" aria-label="Mood board name" autoFocus /><textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="A short note about the feeling or project" aria-label="Mood board description" rows={2} /><button type="submit" className="create-board-submit" disabled={saving || !name.trim()}><FolderPlus size={16} />{saving ? "Creating board" : "Create mood board"}</button></form>;
}

function MoodBoardCard({ board, active, onSelect, onDelete }: { board: MoodBoard; active: boolean; onSelect: () => void; onDelete: () => void }) {
  return <article className={`mood-board-card ${active ? "active" : ""}`}>
    <button type="button" className="mood-board-card-main" onClick={onSelect}>
      <div className="mood-board-card-visual">{board.cover_image ? <SkeletonImage src={board.cover_image} alt="" wrapperClassName="board-cover-image" /> : <div className="board-cover-placeholder"><Layers3 size={24} /></div>}<span className="board-count">{board.item_count} {board.item_count === 1 ? "find" : "finds"}</span></div>
      <div className="mood-board-card-copy"><span className="mood-board-card-name">{board.name}</span><span className="mood-board-card-description">{board.description || "A considered collection"}</span></div>
    </button>
    <div className="board-card-actions"><button type="button" aria-label={`Delete ${board.name}`} onClick={onDelete}><Trash2 size={14} /></button><ChevronRight size={17} /></div>
  </article>;
}

function BoardDetail({ board, onRefresh, onOpenAI }: { board: MoodBoardDetail; onRefresh: () => void; onOpenAI?: () => void }) {
  const [orderedItems, setOrderedItems] = useState(board.items);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showSpecSheet, setShowSpecSheet] = useState(false);
  const [noteItem, setNoteItem] = useState<TrendItem | null>(null);

  useEffect(() => { setOrderedItems(board.items); }, [board.id, board.items]);

  const persistOrder = async (nextItems: TrendItem[]) => {
    const previous = orderedItems;
    setOrderedItems(nextItems);
    setSavingOrder(true);
    try {
      await api.reorderMoodBoard(board.id, nextItems.map(item => item.id));
      onRefresh();
    } catch {
      setOrderedItems(previous);
    } finally {
      setSavingOrder(false);
      setDraggingId(null);
      setDragOverId(null);
    }
  };

  const moveItem = (itemId: number, direction: -1 | 1) => {
    const from = orderedItems.findIndex(item => item.id === itemId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= orderedItems.length) return;
    const next = [...orderedItems];
    [next[from], next[to]] = [next[to], next[from]];
    void persistOrder(next);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, itemId: number) => {
    setDraggingId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(itemId));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: number) => {
    event.preventDefault();
    const sourceId = Number(event.dataTransfer.getData("text/plain")) || draggingId;
    if (!sourceId || sourceId === targetId) return;
    const from = orderedItems.findIndex(item => item.id === sourceId);
    const to = orderedItems.findIndex(item => item.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...orderedItems];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persistOrder(next);
  };

  return <section className="board-detail-panel">
    <div className="board-detail-header">
      <div>
        <p className="eyebrow"><span className="eyebrow-line" />Mood board</p>
        <h2>{board.name}</h2>
        {board.description && <p>{board.description}</p>}
      </div>
      <div className="board-detail-actions">
        <span className="board-order-hint"><GripVertical size={14} /> Drag to arrange</span>
        <button
          type="button"
          className="board-action-button"
          onClick={() => setShowSpecSheet(true)}
          title="Open client presentation & printable spec sheet"
        >
          <Printer size={13} />
          <span>Client Spec</span>
        </button>
        {onOpenAI && (
          <button
            type="button"
            className="board-action-button"
            onClick={onOpenAI}
            title="Consult AI design co-pilot about this collection"
          >
            <Sparkles size={13} className="text-[#b9684f]" />
            <span>AI Advice</span>
          </button>
        )}
        <ShareMenu resourceType="mood_board" resourceId={board.id} title={board.name} compact />
        <button type="button" className="board-refresh" onClick={onRefresh} aria-label="Refresh board"><RefreshCw size={15} /></button>
      </div>
    </div>
    {board.items.length === 0 ? <div className="board-empty"><Grid2X2 size={22} /><p>Start shaping this board by adding finds from the feed.</p><Link to="/" className="text-button">Explore the feed <ChevronRight size={15} /></Link></div> : <div className={`board-item-grid ${savingOrder ? "is-saving-order" : ""}`}>
      {orderedItems.map((item, index) => <div key={item.id} draggable={!savingOrder} onDragStart={event => handleDragStart(event, item.id)} onDragOver={event => { event.preventDefault(); setDragOverId(item.id); }} onDrop={event => handleDrop(event, item.id)} onDragEnd={() => { setDraggingId(null); setDragOverId(null); }} className={`board-item ${draggingId === item.id ? "is-dragging" : ""} ${dragOverId === item.id ? "is-drag-over" : ""}`}>
        <SkeletonImage src={item.image_url} alt={item.title} className="board-item-image" wrapperClassName="board-item-image-wrap" />
        <div className="board-item-caption">
          <span>{item.category}</span>
          <strong>{item.title}</strong>
          {item.notes ? (
            <button
              type="button"
              className="board-item-note-badge"
              onClick={(e) => { e.stopPropagation(); setNoteItem(item); }}
              title={`Personal note: ${item.notes}`}
            >
              <MessageSquare size={10} />
              <span className="truncate max-w-[140px]">{item.notes}</span>
            </button>
          ) : null}
        </div>
        <button type="button" className="board-drag-handle" aria-label={`Drag ${item.title} to reorder`}><GripVertical size={17} /></button>
        <div className="board-item-actions">
          <button
            type="button"
            aria-label={item.notes ? "Edit note" : "Add note"}
            title={item.notes ? `Edit note: "${item.notes}"` : "Add personal note"}
            className={item.notes ? "active-note-button" : ""}
            onClick={(e) => { e.stopPropagation(); setNoteItem(item); }}
          >
            <MessageSquare size={13} />
          </button>
          <button type="button" aria-label={`Move ${item.title} up`} disabled={index === 0 || savingOrder} onClick={() => moveItem(item.id, -1)}><ArrowUp size={13} /></button>
          <button type="button" aria-label={`Move ${item.title} down`} disabled={index === orderedItems.length - 1 || savingOrder} onClick={() => moveItem(item.id, 1)}><ArrowDown size={13} /></button>
          <button type="button" aria-label={`Remove ${item.title} from ${board.name}`} onClick={() => { void api.removeFromMoodBoard(board.id, item.id).then(onRefresh); }}><Trash2 size={14} /></button>
        </div>
      </div>)}
    </div>}
    <ClientSpecSheetModal
      board={board}
      isOpen={showSpecSheet}
      onClose={() => setShowSpecSheet(false)}
    />
    <ItemNoteModal
      isOpen={Boolean(noteItem)}
      item={noteItem}
      boardName={board.name}
      onClose={() => setNoteItem(null)}
      onSave={async (notes) => {
        if (!noteItem) return;
        await api.updateMoodBoardItemNotes(board.id, noteItem.id, notes);
        onRefresh();
      }}
    />
  </section>;
}

function SavedPage({
  onActiveBoardChange,
  onOpenAI,
}: {
  onActiveBoardChange?: (b: MoodBoardDetail | null) => void;
  onOpenAI?: () => void;
}) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [boards, setBoards] = useState<MoodBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
  const [activeBoard, setActiveBoard] = useState<MoodBoardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [pickerItem, setPickerItem] = useState<TrendItem | null>(null);
  const [savedNoteItem, setSavedNoteItem] = useState<SavedItem | null>(null);
  const [taggingIds, setTaggingIds] = useState<number[]>([]);
  const autoTagStarted = useRef(0);

  const loadBoards = useCallback(async () => { setBoards(await api.moodBoards()); }, []);
  const loadBoard = useCallback(async (id: number | null) => {
    if (!id) {
      setActiveBoard(null);
      onActiveBoardChange?.(null);
      return;
    }
    setBoardLoading(true);
    try {
      const b = await api.moodBoard(id);
      setActiveBoard(b);
      onActiveBoardChange?.(b);
    } finally {
      setBoardLoading(false);
    }
  }, [onActiveBoardChange]);

  useEffect(() => {
    Promise.all([api.saved(), api.moodBoards()]).then(([saved, boardList]) => {
      setItems(saved);
      setBoards(boardList);
      if (boardList[0]) setActiveBoardId(boardList[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { void loadBoard(activeBoardId); }, [activeBoardId, loadBoard]);
  useEffect(() => {
    const remaining = 3 - autoTagStarted.current;
    if (remaining <= 0) return;
    const pending = items.filter(item => !item.style_tags?.length).slice(0, remaining);
    if (!pending.length) return;
    autoTagStarted.current += pending.length;
    setTaggingIds(current => Array.from(new Set([...current, ...pending.map(item => item.id)])));
    void Promise.all(pending.map(async item => {
      try {
        const updated = await api.suggestStyleTags(item.id);
        setItems(current => current.map(entry => entry.id === item.id ? { ...entry, style_tags: updated.style_tags, style_tags_source: updated.style_tags_source } : entry));
      } finally {
        setTaggingIds(current => current.filter(id => id !== item.id));
      }
    }));
  }, [items]);

  const remove = async (item: SavedItem) => { setItems(current => current.filter(entry => entry.id !== item.id)); await api.removeBookmark(item.bookmark_id).catch(() => api.removeItemBookmark(item.id)); if (activeBoardId) void loadBoard(activeBoardId); };
  const createBoard = (board: MoodBoard) => { setBoards(current => [board, ...current]); setActiveBoardId(board.id); setShowCreate(false); };
  const deleteBoard = async (board: MoodBoard) => { if (!window.confirm(`Delete ${board.name}?`)) return; await api.deleteMoodBoard(board.id); const next = boards.filter(entry => entry.id !== board.id); setBoards(next); setActiveBoardId(current => current === board.id ? (next[0]?.id || null) : current); };
  const refreshBoard = () => { void loadBoards(); if (activeBoardId) void loadBoard(activeBoardId); };

  return <>
    <PageHeading eyebrow="Your collection" title="Saved for later." description="Keep the pieces that made you pause, then shape them into a point of view." action={<button type="button" className="new-board-button" onClick={() => setShowCreate(value => !value)}><FolderPlus size={16} />New mood board</button>} />
    {showCreate && <CreateBoardForm onCreated={createBoard} onCancel={() => setShowCreate(false)} />}
    {loading ? <LoadingState label="Opening your collection" /> : <>
      <section className="boards-section"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" />Collections</p><h2>Shape the feeling.</h2></div><span className="section-note">{boards.length} {boards.length === 1 ? "board" : "boards"}</span></div>{boards.length === 0 ? <div className="boards-empty"><Layers3 size={22} /><div><strong>Your first mood board is waiting.</strong><p>Group saved trends by room, material, or the mood you want to create.</p></div><button type="button" className="text-button" onClick={() => setShowCreate(true)}>Create one <ChevronRight size={15} /></button></div> : <div className="boards-scroller">{boards.map(board => <MoodBoardCard key={board.id} board={board} active={activeBoardId === board.id} onSelect={() => setActiveBoardId(board.id)} onDelete={() => void deleteBoard(board)} />)}</div>}</section>
      {boardLoading ? <LoadingState label="Opening your mood board" /> : activeBoard && <BoardDetail board={activeBoard} onRefresh={refreshBoard} onOpenAI={onOpenAI} />}
      <section className="saved-items-section"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" />All saved finds</p><h2>Everything worth keeping.</h2></div><span className="section-note">{items.length} {items.length === 1 ? "find" : "finds"}</span></div>{items.length === 0 ? <div className="empty-state saved-empty"><div className="empty-icon"><Bookmark size={22} /></div><h2>A little room to fill</h2><p>Save a material from the feed and it will appear here for your next project.</p><Link className="text-button" to="/">Explore the feed <ChevronRight size={15} /></Link></div> : <div className="saved-grid">{items.map(item => <div key={item.id} className="saved-row"><TrendCard item={item} compact showTags tagging={taggingIds.includes(item.id)} onToggleBookmark={() => void remove(item)} onOpenBoards={setPickerItem} /><div className="flex items-center justify-between px-1"><button type="button" className="note-action-label" onClick={() => setSavedNoteItem(item)}>{item.notes ? `Note: “${item.notes.slice(0, 16)}${item.notes.length > 16 ? "…" : ""}”` : "+ Add note"}</button><button type="button" className="remove-label" onClick={() => void remove(item)}>Remove from saved</button></div></div>)}</div>}</section>
    </>}
    {pickerItem && <MoodBoardPicker item={pickerItem} onClose={() => { setPickerItem(null); void loadBoards(); if (activeBoardId) void loadBoard(activeBoardId); }} />}
    <ItemNoteModal
      isOpen={Boolean(savedNoteItem)}
      item={savedNoteItem}
      boardName="Saved Finds"
      onClose={() => setSavedNoteItem(null)}
      onSave={async (notes) => {
        if (!savedNoteItem) return;
        await api.updateBookmarkNotes(savedNoteItem.id, notes);
        setItems(current => current.map(e => e.id === savedNoteItem.id ? { ...e, notes } : e));
      }}
    />
  </>;
}

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<TrendItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [relatedItems, setRelatedItems] = useState<TrendItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [pickerRelatedItem, setPickerRelatedItem] = useState<TrendItem | null>(null);

  const fetchItem = useCallback(async (itemId: string, isRetry = false) => {
    if (isRetry) {
      setRetrying(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await api.item(itemId);
      setItem(result);
      setRelatedLoading(true);
      void api.relatedItems(itemId, 4)
        .then(rel => setRelatedItems(rel))
        .catch(() => setRelatedItems([]))
        .finally(() => setRelatedLoading(false));
    } catch (err) {
      setItem(null);
      const msg = err instanceof Error ? err.message : "Unable to load discovery";
      setError(msg);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No discovery specified");
      return;
    }
    void fetchItem(id);
  }, [id, fetchItem]);

  if (loading && !retrying) return <LoadingState label="Opening the discovery" />;

  if (error || (!loading && !item)) {
    const isNotFound = error?.toLowerCase().includes("not found") || error?.toLowerCase().includes("404");
    return (
      <div className="detail-page">
        <button type="button" className="back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={16} />
          Back to the feed
        </button>
        <div className="detail-error-state">
          <div className="empty-icon">
            <SunMedium size={26} />
          </div>
          <h2>{isNotFound ? "Discovery not found" : "Something went quiet"}</h2>
          <p>
            {isNotFound
              ? "We couldn't locate this piece in the Trendly edit. It may have moved or was replaced in today's curation."
              : error || "We ran into an unexpected issue while loading this piece. Let's try fetching it again."}
          </p>
          <div className="detail-error-actions">
            <button
              type="button"
              className="action-button primary-action"
              onClick={() => id && void fetchItem(id, true)}
              disabled={retrying}
            >
              <RefreshCw size={14} className={retrying ? "spin" : ""} />
              <span>{retrying ? "Reconnecting..." : "Try again"}</span>
            </button>
            <button
              type="button"
              className="action-button secondary-action"
              onClick={() => navigate("/")}
            >
              <ArrowLeft size={14} />
              <span>Return to feed</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = item!;
  const saved = Boolean(currentItem.bookmarked);
  const toggle = async () => {
    setItem(current => current ? { ...current, bookmarked: saved ? 0 : 1 } : current);
    try {
      if (saved) await api.removeItemBookmark(currentItem.id);
      else {
        await api.save(currentItem.id);
        void api.suggestStyleTags(currentItem.id).then(updated => setItem(updated)).catch(() => undefined);
      }
    } catch {
      setItem(current => current ? { ...current, bookmarked: saved ? 1 : 0 } : current);
    }
  };

  return (
    <div className="detail-page">
      <button type="button" className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back to the edit
      </button>
      <div className="detail-layout">
        <div className="detail-image-wrap">
          <SkeletonImage
            src={currentItem.image_url}
            alt={currentItem.title}
            className="detail-image"
            wrapperClassName="detail-image-frame"
          />
          {isNewToday(currentItem.created_at) && <span className="new-badge detail-badge">New today</span>}
        </div>
        <div className="detail-copy">
          <p className="eyebrow"><span className="eyebrow-line" />{currentItem.category}</p>
          <h1>{currentItem.title}</h1>
          <p className="detail-description">{currentItem.description}</p>
          {currentItem.style_tags?.length ? (
            <div className="detail-style-tags">
              <span><Sparkles size={13} />AI style cues</span>
              <div>
                {currentItem.style_tags.map(tag => (
                  <Link to={`/?tag=${encodeURIComponent(tag)}`} className="style-tag hover:opacity-80 transition-opacity" key={tag}>
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          <div className="detail-meta">
            <span>Added {formatFullDate(currentItem.created_at)}</span>
            <span className="meta-dot" />
            <span>Trendly edit</span>
          </div>
          <div className="detail-actions">
            <button type="button" className={`save-button ${saved ? "saved" : ""}`} onClick={toggle}>
              {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              {saved ? "Saved to your collection" : "Save this discovery"}
            </button>
            <ShareMenu resourceType="item" resourceId={currentItem.id} title={currentItem.title} />
          </div>
          <button type="button" className="add-board-link" onClick={() => setPickerOpen(true)}>
            <Layers3 size={16} />
            Add to a mood board
          </button>
          {currentItem.source_url && (
            <a
              className={`source-link ${currentItem.source_url.includes("pinterest.com") ? "pinterest-source-link" : ""}`}
              href={currentItem.source_url}
              target="_blank"
              rel="noreferrer"
            >
              {currentItem.source_url.includes("pinterest.com") ? (
                <>Explore trending pins on Pinterest <ChevronRight size={15} /></>
              ) : (
                <>Explore the wider reference <ChevronRight size={15} /></>
              )}
            </a>
          )}
        </div>
      </div>

      {/* Related Interior Design Trends Section */}
      <section className="detail-related-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" />Continue exploring</p>
            <h2>Related interior design trends.</h2>
          </div>
          <span className="section-note">
            Curated discoveries in {currentItem.category} & complementary styles
          </span>
        </div>
        {relatedLoading ? (
          <div className="related-loading">
            <LoaderCircle className="spin" size={20} />
            <span>Finding related design directions...</span>
          </div>
        ) : relatedItems.length > 0 ? (
          <div className="feed-grid related-grid">
            {relatedItems.map((relItem, index) => (
              <div className={`feed-item feed-item-${index % 3}`} key={relItem.id}>
                <TrendCard
                  item={relItem}
                  showTags
                  onToggleBookmark={async () => {
                    const isBkm = Boolean(relItem.bookmarked);
                    setRelatedItems(prev =>
                      prev.map(p => p.id === relItem.id ? { ...p, bookmarked: isBkm ? 0 : 1 } : p)
                    );
                    try {
                      if (isBkm) await api.removeItemBookmark(relItem.id);
                      else await api.save(relItem.id);
                    } catch {
                      setRelatedItems(prev =>
                        prev.map(p => p.id === relItem.id ? { ...p, bookmarked: isBkm ? 1 : 0 } : p)
                      );
                    }
                  }}
                  onOpenBoards={setPickerRelatedItem}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="related-empty">
            <p>Explore more discoveries across other categories in the daily feed.</p>
            <Link to="/" className="text-button">Browse daily feed <ChevronRight size={14} /></Link>
          </div>
        )}
      </section>

      {pickerOpen && <MoodBoardPicker item={currentItem} onClose={() => setPickerOpen(false)} />}
      {pickerRelatedItem && <MoodBoardPicker item={pickerRelatedItem} onClose={() => setPickerRelatedItem(null)} />}
    </div>
  );
}

function SharedPage() {
  const { token } = useParams();
  const [shared, setShared] = useState<SharedResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setShared(null);
    setError("");
    if (!token) {
      setLoading(false);
      return () => { cancelled = true; };
    }
    void api.shared(token)
      .then(result => { if (!cancelled) setShared(result); })
      .catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : "Unable to open this share"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);
  if (loading) return <LoadingState label="Opening shared inspiration" />;
  if (error || !shared) return <ErrorState message={error || "This share is no longer available."} onRetry={() => window.location.reload()} />;
  if (shared.share.resource_type === "item") {
    const item = shared.resource as TrendItem;
    return <div className="shared-page"><p className="shared-kicker"><Share2 size={14} />Shared from Trendly</p><div className="shared-item-layout"><SkeletonImage src={item.image_url} alt={item.title} className="shared-item-image" wrapperClassName="shared-item-image-frame" /><div className="shared-copy"><p className="eyebrow"><span className="eyebrow-line" />{item.category}</p><h1>{item.title}</h1><p>{item.description}</p><Link to={`/item/${item.id}`} className="save-button">Open in Trendly <ChevronRight size={16} /></Link></div></div></div>;
  }
  const board = shared.resource as MoodBoardDetail;
  return <div className="shared-page"><div className="shared-board-header"><div><p className="shared-kicker"><Share2 size={14} />Shared mood board</p><h1>{board.name}</h1>{board.description && <p>{board.description}</p>}<span className="shared-view-count"><Eye size={13} />{shared.share.view_count} {shared.share.view_count === 1 ? "view" : "views"}</span></div><Link to="/" className="brand-mark"> <span className="brand-dot" />trendly</Link></div>{board.items.length === 0 ? <div className="board-empty"><Grid2X2 size={22} /><p>This board is ready for its first discovery.</p></div> : <div className="shared-board-grid">{board.items.map(item => <TrendCard key={item.id} item={item} onToggleBookmark={() => undefined} />)}</div>}</div>;
}

function NotFoundPage() { return <div className="empty-state"><div className="empty-icon"><Store size={22} /></div><h2>That page moved on</h2><p>There is more to discover back in the daily edit.</p><Link className="text-button" to="/">Return to feed <ChevronRight size={15} /></Link></div>; }

export default function App() { return <BrowserRouter><AppShell /></BrowserRouter>; }
