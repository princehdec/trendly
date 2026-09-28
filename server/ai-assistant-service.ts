import { invokeLLM, type Message } from "./_core/llm";
import { getMoodBoard, listItems, type MoodBoardDetail, type TrendItem } from "./db";

export type AssistantContext = {
  boardId?: number;
  category?: string;
  itemId?: number;
};

export type AssistantRequest = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  context?: AssistantContext;
};

const SYSTEM_PROMPT = `You are Trendly AI — an elite interior design co-pilot crafted specifically for Shilpi, a high-end interior designer and architect.
Your tone is refined, editorial, tactile, and tranquil. You appreciate natural materials, quiet luxury, Japandi sensibilities, warm minimalism, artisanal craftsmanship, lime washes, tactile textiles, and architectural lighting (2700K).
When Shilpi asks for design advice, material pairings, palette suggestions, or client presentation phrasing:
- Be specific with materials (e.g., "honed travertine", "smoked quarter-sawn oak", "slaked lime plaster", "unlacquered living brass", "slubby Belgian flax linen").
- Provide subtle, cohesive color palettes (with evocative names like Chalk, Ochre, Raw Umber, Dried Sage, Tobacco, Bleached Bone) and hex suggestions.
- If a mood board is provided in context, directly reference the pieces and suggest complementary finishes or missing layers (e.g. textural balance, ambient lighting).
- Keep responses organized with clean markdown headers and bullet points.`;

/**
 * Curated interior design fallback intelligence for offline or unconfigured environments.
 */
function generateFallbackResponse(
  userQuery: string,
  board?: MoodBoardDetail | null,
  contextItems?: TrendItem[]
): string {
  const query = userQuery.toLowerCase();

  // Mood board context specific advice
  if (board && board.items.length > 0) {
    const itemNames = board.items.map(i => `**${i.title}** (${i.category})`).join(", ");
    return `### Design Analysis: ${board.name}

Your collection currently features ${itemNames}.

#### 1. Material Harmony & Balance
The composition establishes a grounded, tactile atmosphere. To elevate this further:
- **Contrast Note**: Balance the porous and matte finishes with one intentional reflective surface — consider **unlacquered aged brass** or **smoked bronze hardware**.
- **Tactile Softness**: Introduce heavy Belgian washed linen (in shade *Oatmeal* or *Flax*) to soften the architectural planes.

#### 2. Recommended Palette
- **Primary Ground**: Chalk Plaster (\`#ECE7DF\`) — soft, light-reflective base.
- **Secondary Tone**: Warm Travertine (\`#D5C7B2\`) — earthy architectural anchor.
- **Deep Contrast**: Smoked Umber (\`#3E342B\`) — subtle grounded accent for millwork or hardware.
- **Accent**: Dried Sage (\`#8B917E\`) or Terracotta Clay (\`#B9684F\`).

#### 3. Client Spec Sheet Notes
*"A tranquil dialogue between raw mineral surfaces and tailored craftsmanship. Designed to patina gracefully over time with zero harsh synthetic sheen."*`;
  }

  // Palette inquiries
  if (query.includes("palette") || query.includes("color") || query.includes("paint") || query.includes("drenching")) {
    return `### Curated Editorial Palette: Warm Minimalist Sanctuary

Here is an architectural tonal scheme engineered for calming, light-filled spaces:

#### Color Story
1. **Slaked Lime** (\`#F4F1EA\` / LRV 84): A luminous, chalky white with gentle yellow-gray undertones. Ideal for continuous walls and ceilings to eliminate harsh contrasts.
2. **Raw Linen** (\`#DFD7C7\` / LRV 68): Warm, tactile midtone for drapery, upholstered headboards, and wool rugs.
3. **Muted Terracotta** (\`#B9684F\` / LRV 34): Shilpi's signature clay accent — use for unglazed earthenware, accent cushions, or powder room millwork.
4. **Smoked Umber** (\`#3C3631\` / LRV 12): An organic alternative to black, perfect for slim steel door profiles and hardware.

#### Styling Advice
- **Color Drenching**: Carry the wall color across skirtings and architraves in an eggshell or dead-flat finish to make the ceiling feel loftier.
- **Light Temperature**: Pair exclusively with **2700K warm incandescent or high-CRI LED sources** to preserve the warmth of natural pigments.`;
  }

  // Kitchen / Hardware inquiries
  if (query.includes("kitchen") || query.includes("hardware") || query.includes("cabinet")) {
    return `### Millwork & Finish Specification: Quiet Kitchen

For an understated, timeless kitchen composition:

#### 1. Cabinetry & Joinery
- **Face Material**: Quarter-sawn smoked European oak with a matte polyurethane or low-VOC natural hardwax oil finish.
- **Profile**: Inset flush cabinetry with 3mm reveal and integrated edge pulls or discreet brass finger grips.

#### 2. Countertops & Splashbacks
- **Stone**: 30mm Taj Mahal Quartzite or Honed Navona Travertine with sealed micro-pores.
- **Edge Detail**: Soft pencil round (3mm) rather than sharp miters to give the stone an honest, pillowed softness.

#### 3. Fixtures & Metals
- **Hardware Finish**: Living unlacquered brass or blackened iron. Avoid high-gloss chrome or cold brushings.
- **Tapware**: Concealed wall-mounted mixer with a sculptural gooseneck spout.`;
  }

  // Lighting inquiries
  if (query.includes("light") || query.includes("lamp") || query.includes("glow")) {
    return `### Architectural Lighting Strategy: Soft Modernism

Lighting should be felt before it is seen. Avoid symmetrical grid downlights in favor of layered atmospheric pools:

#### 1. The Three Essential Layers
- **Low Ambient Pools (Eye Level)**: Portable alabaster or paper lantern table lamps positioned on credenzas and low plinths.
- **Vertical Surface Washing**: Concealed 2700K micro-cove uplighting to skim plaster or textured brick walls, emphasizing surface texture.
- **Sculptural Accent**: A singular mouth-blown opal milk glass pendant or washi paper mobile suspended low over the dining surface.

#### 2. Technical Recommendation
- **Color Temperature**: 2700K (Warm White) throughout residential living zones; 2400K for bedside reading and dining accents.
- **Color Rendering**: Minimum **CRI 95+ (R9 > 80)** so that timber stains, stone veining, and textiles render with true depth.`;
  }

  // Default holistic styling advice
  return `### Interior Design Consultation & Material Insights

Focusing on tactile depth, balanced proportions, and natural materials:

#### Key Principles for Shilpi's Current Specification
1. **Texture Over Pattern**: When keeping colors quiet, increase textural variety. Pair smooth micro-cement floors with bouclé seating, open-pore travertine, and slubby linen drapery.
2. **Honest Joinery**: Let timber and stone express their end grain and natural fissures. Avoid high-gloss lacquers that create artificial glare.
3. **Curated Negative Space**: Leave intentional pauses in shelving and wall runs. A single substantial artisanal vessel commands more presence than a cluttered vignette.

*Tip: You can attach any active Mood Board to our conversation, and I will tailor material recommendations and client spec notes specifically to its contents.*`;
}

export async function askAssistant(request: AssistantRequest): Promise<string> {
  let boardDetail: MoodBoardDetail | null = null;
  if (request.context?.boardId) {
    try {
      boardDetail = await getMoodBoard(request.context.boardId);
    } catch {
      boardDetail = null;
    }
  }

  const lastUserMessage = [...request.messages].reverse().find(m => m.role === "user")?.content || "";

  // Attempt live LLM invocation if API key is present
  if (process.env.OPENAI_API_KEY || process.env.FORGE_API_KEY) {
    try {
      let contextualSystem = SYSTEM_PROMPT;
      if (boardDetail) {
        contextualSystem += `\n\nActive Mood Board: "${boardDetail.name}".\nDescription: "${boardDetail.description || "N/A"}".\nItems in board: ${boardDetail.items.map(i => `${i.title} (${i.category}: ${i.description})`).join("; ")}`;
      }

      const formattedMessages: Message[] = [
        { role: "system", content: contextualSystem },
        ...request.messages.map(m => ({
          role: m.role as Message["role"],
          content: m.content,
        })),
      ];

      const result = await invokeLLM({
        messages: formattedMessages,
        maxTokens: 1500,
      });

      const choice = result.choices?.[0]?.message?.content;
      if (typeof choice === "string" && choice.trim().length > 0) {
        return choice.trim();
      }
    } catch (error) {
      console.warn("[Trendly Assistant] LLM invocation fell back to design rule engine:", error);
    }
  }

  // Graceful fallback to curated interior design engine
  return generateFallbackResponse(lastUserMessage, boardDetail);
}
