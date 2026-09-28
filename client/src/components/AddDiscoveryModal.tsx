import { useState, type FormEvent } from "react";
import { Plus, X, Sparkles, Image, Compass, Tag, Link as LinkIcon, Check } from "lucide-react";
import { api, type TrendItem } from "@/lib/api";

const CATEGORY_OPTIONS = [
  "Flooring",
  "Wall Finishes",
  "Lighting",
  "Furniture",
  "Tiles",
  "Paint & Color",
  "Fabrics & Textiles",
  "Hardware",
  "Decor & Accessories",
];

const CURATED_IMAGE_PRESETS: Record<string, string[]> = {
  Flooring: [
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=900&q=85",
  ],
  "Wall Finishes": [
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=85",
  ],
  Lighting: [
    "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
  ],
  Furniture: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85",
  ],
  Tiles: [
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=85",
  ],
  "Paint & Color": [
    "https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=85",
  ],
  "Fabrics & Textiles": [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=85",
  ],
  Hardware: [
    "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=85",
  ],
  "Decor & Accessories": [
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=900&q=85",
  ],
};

type AddDiscoveryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: TrendItem) => void;
};

export default function AddDiscoveryModal({ isOpen, onClose, onCreated }: AddDiscoveryModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Wall Finishes");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [styleTagsInput, setStyleTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const presets = CURATED_IMAGE_PRESETS[category] || [];
  const selectedImage = imageUrl.trim() || presets[0] || "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please provide a title and specification description.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const parsedTags = styleTagsInput
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

      const newItem = await api.createItem({
        title: title.trim(),
        category,
        description: description.trim(),
        image_url: selectedImage,
        source_url: sourceUrl.trim() || undefined,
        style_tags: parsedTags.length ? parsedTags : undefined,
      });

      onCreated(newItem);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save discovery");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#fdfbf7] border border-[#e4ded5] shadow-2xl p-6 sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            Curator Addition
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">
            Add Bespoke Discovery
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Specify a physical sample, showroom finding, or bespoke architectural material.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Material or Item Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Hand-Raked Roman Travertine Plinth"
              className="w-full px-4 py-2.5 rounded-xl border border-[#ded6cc] bg-white text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#b9684f]/40"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  setImageUrl("");
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-[#ded6cc] bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#b9684f]/40"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Style Tags (comma-separated)
              </label>
              <input
                type="text"
                value={styleTagsInput}
                onChange={e => setStyleTagsInput(e.target.value)}
                placeholder="quiet luxury, Japandi, tactile"
                className="w-full px-4 py-2.5 rounded-xl border border-[#ded6cc] bg-white text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#b9684f]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Architectural Specification / Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the texture, finish, undertones, and recommended room application..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#ded6cc] bg-white text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#b9684f]/40 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Image Reference URL (or select preset below)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#ded6cc] bg-white text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#b9684f]/40"
              />
            </div>

            {presets.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[11px] text-stone-500">Curated Presets:</span>
                <div className="flex gap-2">
                  {presets.map((preset, idx) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setImageUrl(preset)}
                      className={`relative w-12 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === preset
                          ? "border-[#b9684f] ring-2 ring-[#b9684f]/30 scale-105"
                          : "border-stone-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                      {selectedImage === preset && (
                        <div className="absolute inset-0 bg-[#b9684f]/20 flex items-center justify-center">
                          <Check size={12} className="text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Vendor / Reference Link (optional)
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://vendor-catalog.com/spec-sheet"
              className="w-full px-4 py-2.5 rounded-xl border border-[#ded6cc] bg-white text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#b9684f]/40"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-stone-600 text-sm font-medium hover:bg-stone-200/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !description.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#b9684f] hover:bg-[#96513d] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {saving ? "Adding discovery..." : "Save to Catalog"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
