import { Bookmark, ArrowUpRight, Check, Layers3, LoaderCircle, Plus, Sparkles, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { isNewToday, type TrendItem } from "@/lib/api";
import SkeletonImage from "@/components/SkeletonImage";

const categoryClass: Record<string, string> = {
  Flooring: "cat-sand",
  "Wall Finishes": "cat-clay",
  Lighting: "cat-amber",
  Furniture: "cat-olive",
  Tiles: "cat-blue",
  "Paint & Color": "cat-rose",
  "Fabrics & Textiles": "cat-lavender",
  Hardware: "cat-steel",
  "Decor & Accessories": "cat-peach",
};

type TrendCardProps = {
  item: TrendItem;
  onToggleBookmark: (item: TrendItem) => void;
  onOpenBoards?: (item: TrendItem) => void;
  compact?: boolean;
  showTags?: boolean;
  tagging?: boolean;
};

export default function TrendCard({ item, onToggleBookmark, onOpenBoards, compact = false, showTags = false, tagging = false }: TrendCardProps) {
  const saved = Boolean(item.bookmarked);
  const isPinterest = Boolean(item.source_url?.includes("pinterest.com"));
  return (
    <article className={`trend-card group ${compact ? "trend-card-compact" : ""}`}>
      <Link to={`/item/${item.id}`} className="block overflow-hidden rounded-[22px]" aria-label={`Open ${item.title}`}>
        <div className="trend-image-wrap">
          <SkeletonImage src={item.image_url} alt={item.title} className="trend-image" loading="lazy" wrapperClassName="trend-image" />
          <div className="image-sheen" />
          {isNewToday(item.created_at) && <span className="new-badge">New today</span>}
          {isPinterest && (
            <span className="pinterest-pill" title="Trending on Pinterest">
              <Pin size={11} strokeWidth={2.4} /> Pinterest
            </span>
          )}
          <span className={`category-pill image-pill ${categoryClass[item.category] || "cat-sand"}`}>{item.category}</span>
          <span className="open-dot"><ArrowUpRight size={16} strokeWidth={1.8} /></span>
        </div>
      </Link>
      <div className="card-copy">
        <div className="flex items-start justify-between gap-4">
          <Link to={`/item/${item.id}`} className="min-w-0">
            <h3 className="card-title">{item.title}</h3>
          </Link>
          <div className="card-actions">
            {onOpenBoards && <button type="button" className="bookmark-button board-action" aria-label={`Add ${item.title} to a mood board`} onClick={() => onOpenBoards(item)}><Layers3 size={16} strokeWidth={1.8} /><Plus className="board-plus" size={9} strokeWidth={2.6} /></button>}
            <button
              type="button"
              className={`bookmark-button ${saved ? "is-saved" : ""}`}
              aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
              aria-pressed={saved}
              onClick={() => onToggleBookmark(item)}
            >
              {saved ? <Check size={17} strokeWidth={2.1} /> : <Bookmark size={17} strokeWidth={1.8} />}
            </button>
          </div>
        </div>
        <p className="card-description">{item.description}</p>
        {showTags && (tagging ? <div className="style-tags-loading"><LoaderCircle className="spin" size={13} />Suggesting style tags</div> : item.style_tags?.length ? <div className="style-tags" aria-label="AI suggested interior style tags"><span className="style-tags-label"><Sparkles size={12} />Style cues</span>{item.style_tags.map(tag => <Link to={`/?tag=${encodeURIComponent(tag)}`} className="style-tag hover:opacity-80 transition-opacity" key={tag}>{tag}</Link>)}</div> : null)}
      </div>
    </article>
  );
}
