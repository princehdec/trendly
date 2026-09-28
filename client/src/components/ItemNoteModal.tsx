import { useState, useEffect, type FormEvent } from "react";
import { MessageSquare, X, Check, Trash2, Sparkles, LoaderCircle } from "lucide-react";
import type { TrendItem } from "@/lib/api";
import SkeletonImage from "./SkeletonImage";

type ItemNoteModalProps = {
  isOpen: boolean;
  item: TrendItem | null;
  boardName?: string;
  onSave: (notes: string | null) => Promise<void>;
  onClose: () => void;
};

const NOTE_PRESETS = [
  "Client preferred",
  "Primary material choice",
  "Accent piece for living room",
  "Review sample in natural light",
  "Pending contractor confirmation",
];

export default function ItemNoteModal({
  isOpen,
  item,
  boardName,
  onSave,
  onClose,
}: ItemNoteModalProps) {
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setNoteText(item.notes || "");
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(noteText.trim() ? noteText.trim() : null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await onSave(null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#fbf9f5] border border-[#e4ded5] shadow-2xl overflow-hidden p-6 sm:p-7"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="flex items-center gap-1.5 text-[#b9684f] text-[10px] font-bold uppercase tracking-wider mb-1">
              <MessageSquare size={13} />
              <span>{boardName ? `${boardName} • Note` : "Item Note"}</span>
            </p>
            <h2 className="font-serif text-2xl text-stone-900 tracking-tight">
              Personal Note & Comments
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
            aria-label="Close note dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Item context banner */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-100/80 border border-stone-200/70 mb-5">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-200">
            <SkeletonImage
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {item.category}
            </span>
            <p className="font-serif text-stone-900 font-normal text-sm truncate">
              {item.title}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="item-note-textarea"
              className="block text-xs font-semibold text-stone-700 mb-1.5"
            >
              Your Note or Application Spec
            </label>
            <textarea
              id="item-note-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Specified in satin bronze for master bath; check with vendor on lead times..."
              rows={4}
              autoFocus
              className="w-full rounded-2xl border border-stone-300 bg-white p-3.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#b9684f]/20 focus:border-[#b9684f] transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Quick presets */}
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setNoteText((prev) =>
                      prev ? `${prev}. ${preset}` : preset
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-stone-200/60 hover:bg-[#b9684f]/10 hover:text-[#96513d] text-[11px] text-stone-600 border border-stone-200 transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-200/80">
            {item.notes ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-700 font-medium transition-colors"
              >
                <Trash2 size={13} />
                <span>Remove note</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200/50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#b9684f] hover:bg-[#96513d] text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save Note</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
