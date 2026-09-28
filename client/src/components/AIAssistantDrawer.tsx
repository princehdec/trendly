import { useState } from "react";
import { Sparkles, X, Bot, Layers3, MessageSquare } from "lucide-react";
import { AIChatBox, type Message } from "./AIChatBox";
import { api, type MoodBoard, type MoodBoardDetail } from "@/lib/api";

type AIAssistantDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  activeBoard?: MoodBoardDetail | MoodBoard | null;
};

export default function AIAssistantDrawer({ isOpen, onClose, activeBoard }: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Good day, Shilpi. I am your architectural and interior design co-pilot. ${
        activeBoard
          ? `I have your **${activeBoard.name}** collection in view.`
          : "Ask me about material pairings, lighting layering, finish specs, or curated tonal palettes."
      }`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const { response } = await api.askAssistant(
        nextMessages,
        activeBoard ? { boardId: activeBoard.id } : undefined
      );

      setMessages(current => [
        ...current,
        { role: "assistant", content: response },
      ]);
    } catch (err) {
      setMessages(current => [
        ...current,
        {
          role: "assistant",
          content: "I apologize, my consultation connection had a momentary pause. Let me refocus on your inquiry.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = activeBoard
    ? [
        `What finishes and metals pair best with my "${activeBoard.name}" board?`,
        "Suggest a cohesive paint & tonal color story for this collection",
        "Write client presentation talking points for these materials",
        "What architectural lighting layers would best highlight these textures?",
      ]
    : [
        "Suggest a warm minimalist color story with hex codes and LRVs",
        "What hardware finishes pair best with aged lime plaster and smoked oak?",
        "How should I layer 2700K ambient, task, and accent lighting?",
        "Explain color drenching techniques for a tranquil primary suite",
      ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/30 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg h-full bg-[#fcfaf6] border-l border-[#e4ded5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200/80 bg-white/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#b9684f]/15 text-[#96513d] flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg text-stone-900 leading-none">
                  Design Co-Pilot
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#b9684f]/10 text-[#96513d]">
                  AI Curated
                </span>
              </div>
              <p className="text-stone-500 text-xs mt-0.5">
                {activeBoard ? `Context: ${activeBoard.name}` : "Architectural & material consultation"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
            aria-label="Close assistant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Board Context Pill if available */}
        {activeBoard && (
          <div className="px-5 py-2.5 bg-[#f3eee7] border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <Layers3 size={13} className="text-[#b9684f]" />
              <span>Active Mood Board attached</span>
            </div>
            <span className="font-semibold text-stone-800">{activeBoard.name}</span>
          </div>
        )}

        {/* Chat Component */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            height="100%"
            placeholder="Ask about materials, lighting, finishes, or palettes..."
            suggestedPrompts={suggestedPrompts}
            emptyStateMessage="Consult your AI design co-pilot on materials, finishes, and palettes."
            className="h-full border-0 shadow-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}
