import { useRef } from "react";
import { Printer, X, Share2, Layers3, Check, Sparkles, ExternalLink } from "lucide-react";
import type { MoodBoardDetail } from "@/lib/api";
import SkeletonImage from "./SkeletonImage";

type ClientSpecSheetModalProps = {
  board: MoodBoardDetail;
  isOpen: boolean;
  onClose: () => void;
};

export default function ClientSpecSheetModal({ board, isOpen, onClose }: ClientSpecSheetModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const categories = Array.from(new Set(board.items.map(i => i.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl bg-[#fbf9f5] border border-[#e4ded5] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Control Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-white/70 print:hidden">
          <div className="flex items-center gap-2 text-stone-600 text-xs font-semibold uppercase tracking-wider">
            <Layers3 size={15} className="text-[#b9684f]" />
            Client Presentation Spec Sheet
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b9684f] hover:bg-[#96513d] text-white text-xs font-semibold shadow transition-all"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div ref={printAreaRef} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 print:p-0 print:overflow-visible">
          {/* Document Header */}
          <div className="border-b border-stone-300 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#b9684f] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                <span>trendly architectural curation</span>
                <span>•</span>
                <span>spec sheet</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 tracking-tight leading-none">
                {board.name}
              </h1>
              <p className="mt-3 text-stone-600 text-sm max-w-xl leading-relaxed">
                {board.description || "A considered palette of finishes, architectural materials, and tailored objects."}
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-stone-200 sm:pl-6 text-stone-500 text-xs space-y-1">
              <p><strong className="text-stone-800 font-semibold">Designer:</strong> Shilpi</p>
              <p><strong className="text-stone-800 font-semibold">Date:</strong> {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date())}</p>
              <p><strong className="text-stone-800 font-semibold">Items:</strong> {board.items.length} specified</p>
            </div>
          </div>

          {/* Palette Essence Bar */}
          <div className="bg-[#f0ebe3] rounded-2xl p-5 border border-stone-200">
            <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">
              Design DNA & Material Balance
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white text-stone-700 border border-stone-200 shadow-sm"
                >
                  {cat}
                </span>
              ))}
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#b9684f]/15 text-[#96513d] border border-[#b9684f]/25">
                Quiet Luxury
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#b9684f]/15 text-[#96513d] border border-[#b9684f]/25">
                Warm Minimalism
              </span>
            </div>
          </div>

          {/* Visual Board Gallery */}
          <div>
            <h2 className="font-serif text-2xl text-stone-900 mb-4">Visual Atmosphere</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {board.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden bg-stone-200 aspect-[4/3] border border-stone-200 shadow-sm"
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">
                      0{idx + 1} • {item.category}
                    </span>
                    <p className="font-serif text-sm tracking-tight truncate drop-shadow">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Architectural Specification Table */}
          <div className="pt-2">
            <h2 className="font-serif text-2xl text-stone-900 mb-4">Detailed Specifications</h2>
            <div className="overflow-x-auto rounded-2xl border border-stone-300 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-100/70 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 w-44">Material & Item</th>
                    <th className="py-3 px-4 w-32">Discipline</th>
                    <th className="py-3 px-4">Architectural Notes & Characteristics</th>
                    <th className="py-3 px-4 w-36">Style Cues</th>
                    <th className="py-3 px-4 w-28 print:hidden">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-700">
                  {board.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-medium text-stone-400">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-medium">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 leading-relaxed">
                        <p>{item.description}</p>
                        {item.notes && (
                          <div className="mt-2 p-2 rounded-lg bg-[#f7f2ea] border border-[#e6dcce] text-[#864330] text-[11px] leading-snug">
                            <strong className="font-semibold text-stone-800">Designer Note: </strong>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.style_tags?.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-0.5 rounded-full bg-stone-100 text-[10px] text-stone-600 border border-stone-200"
                            >
                              {tag}
                            </span>
                          )) || <span className="text-stone-400 italic">natural</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 print:hidden">
                        {item.source_url ? (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#b9684f] hover:underline font-medium"
                          >
                            Source <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-stone-400 italic">Bespoke</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Presentation Footer */}
          <div className="border-t border-stone-300 pt-6 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-2">
            <span>Prepared exclusively for client review by Shilpi • Trendly</span>
            <span>trendly.interior.design</span>
          </div>
        </div>
      </div>
    </div>
  );
}
