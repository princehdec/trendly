import {
  CATEGORY_LIST,
  initializeDatabase,
  insertTrend,
  markPreviousItemsNotNew,
  type TrendItem,
} from "./db";
import { getImageForTrend } from "./unsplash-service";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const FALLBACK_TRENDS = [
  { title: "Aged lime plaster", description: "Soft, chalky plaster finishes are showing up in quiet layers, giving walls the depth of a historic surface with a fresh architectural edge.", category: "Wall Finishes" },
  { title: "Sculptural travertine", description: "Honest, porous stone is moving from occasional accent to everyday surface, especially in low tables and compact vanities.", category: "Furniture" },
  { title: "Smoked oak cabinetry", description: "A deeper oak stain is bringing warmth and a slightly moody note to kitchens without the visual weight of painted millwork.", category: "Hardware" },
  { title: "Opal globe lighting", description: "Milk glass globes are softening contemporary schemes with an even, flattering glow and a hint of 1970s optimism.", category: "Lighting" },
  { title: "Washed stripe upholstery", description: "Relaxed ticking stripes in flax and tobacco tones make tailored seating feel more collected and less formal.", category: "Fabrics & Textiles" },
  { title: "Moss green tile", description: "Earthy green glazes are giving bathrooms and backsplashes a grounded alternative to blue, especially alongside warm timber.", category: "Tiles" },
  { title: "Rounded edge details", description: "Softened corners on consoles, shelves, and joinery are adding a subtle sense of ease to otherwise crisp interiors.", category: "Decor & Accessories" },
  { title: "Clay-toned color stories", description: "Terracotta, cinnamon, and dusty rose are being layered as quiet accents that make pale rooms feel more dimensional.", category: "Paint & Color" },
  { title: "Japandi woven baskets", description: "Hand-woven seagrass and bamboo baskets merge Japanese minimalism with Scandinavian warmth for serene storage.", category: "Decor & Accessories" },
  { title: "Reeded glass dividers", description: "Fluted glass panels are offering soft visual separation in open-plan spaces while letting natural light flow.", category: "Wall Finishes" },
  { title: "Cane and rattan accents", description: "Natural cane panels on cabinet doors and headboards bring breathable texture and a relaxed tropical sensibility.", category: "Furniture" },
  { title: "Matte black fixtures", description: "Sleek matte black faucets and handles bring a graphic, grounding contrast to marble and light timber surfaces.", category: "Hardware" },
  { title: "Herringbone wood floors", description: "Classic herringbone patterns in pale ash and warm walnut are adding directional energy to transitional spaces.", category: "Flooring" },
  { title: "Oversized terracotta planters", description: "Large, unglazed clay vessels add earthy warmth and sculptural weight to living rooms and covered patios.", category: "Decor & Accessories" },
  { title: "Burnished copper pendants", description: "Warm copper light fixtures with a hand-burnished finish are adding an inviting metallic glow to dining areas.", category: "Lighting" },
  { title: "Raw linen bedding", description: "Unbleached, undyed linen in warm oat and flax tones creates a naturally textured, effortlessly elegant bedroom.", category: "Fabrics & Textiles" },
  { title: "Stone-look porcelain tile", description: "Large-format porcelain that mimics natural stone delivers luxury durability for high-traffic kitchens and baths.", category: "Tiles" },
  { title: "Sage green paint", description: "Muted sage and eucalyptus greens are replacing greys as the new universal neutral for living spaces.", category: "Paint & Color" },
  { title: "Wide plank oak flooring", description: "Extra-wide boards in wire-brushed white oak are lending rooms a sense of spaciousness and quiet luxury.", category: "Flooring" },
  { title: "Brushed brass knobs", description: "Warm brushed brass cabinet pulls add a jewellery-like finish that elevates minimal cabinetry without competing.", category: "Hardware" },
  { title: "Mushroom table lamps", description: "Curved, dome-shaded lamps in alabaster and murano glass are giving bedside and console lighting a sculptural softness.", category: "Lighting" },
  { title: "Boucle dining chairs", description: "Nubby boucle upholstery in cream and stone is turning simple dining chairs into inviting, tactile accents.", category: "Furniture" },
  { title: "Hand-glazed subway tile", description: "Irregular glazes and wavy edges transform standard subway tile into an artisanal, light-catching surface.", category: "Tiles" },
  { title: "Warm white paint", description: "Creamy warm whites with a touch of ochre or pink are replacing stark cool whites for a softer, more enveloping feel.", category: "Paint & Color" },
];

type SuggestedTrend = { title: string; description: string; category: string };

function parseSuggestedTrends(content: string): SuggestedTrend[] {
  const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as unknown;
  const list = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown[] })?.items;
  if (!Array.isArray(list)) throw new Error("OpenRouter returned no trend list");

  return list
    .map(item => {
      const value = item as Record<string, unknown>;
      const category = String(value.category || "").trim();
      return {
        title: String(value.title || "").trim(),
        description: String(value.description || "").trim(),
        category: CATEGORY_LIST.find(name => name.toLowerCase() === category.toLowerCase()) || category,
      };
    })
    .filter(item => item.title && item.description && CATEGORY_LIST.includes(item.category as (typeof CATEGORY_LIST)[number]))
    .slice(0, 5);
}

async function generateWithOpenRouter(): Promise<SuggestedTrend[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Trendly interior design trends",
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are the editorial trends researcher for a premium interior design magazine. Return only valid JSON.",
        },
        {
          role: "user",
          content: `It is ${day}. Identify 3 to 5 currently trending interior design materials, finishes, or products. Vary the categories from day to day. Prioritize specific, design-literate observations that would help an interior designer decide what to specify next. Categories must be one of: ${CATEGORY_LIST.join(", ")}. Each description should be one or two concise sentences explaining why it is trending. Return exactly this shape: {"items":[{"title":"...","description":"...","category":"..."}]}`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenRouter request failed (${response.status})`);
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned an empty response");
  return parseSuggestedTrends(content);
}

/** Truly random fallback — shuffles the pool and picks 4 unique trends each time. */
function fallbackTrends(): SuggestedTrend[] {
  const shuffled = [...FALLBACK_TRENDS].sort(() => Math.random() - 0.5);
  // Ensure variety: try to pick from different categories
  const selected: SuggestedTrend[] = [];
  const usedCategories = new Set<string>();
  for (const trend of shuffled) {
    if (selected.length >= 4) break;
    if (!usedCategories.has(trend.category)) {
      selected.push(trend);
      usedCategories.add(trend.category);
    }
  }
  // If we couldn't get 4 unique categories, fill remaining slots
  for (const trend of shuffled) {
    if (selected.length >= 4) break;
    if (!selected.includes(trend)) {
      selected.push(trend);
    }
  }
  return selected;
}

export async function refreshTrends(): Promise<{ items: TrendItem[]; source: "openrouter" | "fallback" }> {
  await initializeDatabase();
  let suggestions: SuggestedTrend[];
  let source: "openrouter" | "fallback" = "openrouter";
  try {
    suggestions = await generateWithOpenRouter();
    if (suggestions.length < 3) throw new Error("OpenRouter returned too few usable trends");
  } catch (error) {
    console.warn("[Trendly] Using fallback trends:", error instanceof Error ? error.message : error);
    suggestions = fallbackTrends();
    source = "fallback";
  }

  await markPreviousItemsNotNew();

  // Fetch images in parallel — Unsplash first, fallback to expanded pool
  const imageUrls = await Promise.all(
    suggestions.map((item, index) => getImageForTrend(item.title, item.category, index))
  );

  const ids = await Promise.all(suggestions.map((item, index) => insertTrend({
    ...item,
    image_url: imageUrls[index],
    source_url: `https://www.google.com/search?q=${encodeURIComponent(item.title + " interior design")}`,
  })));

  const items = (await import("./db")).listItems();
  const allItems = await items;
  return { items: allItems.filter(item => ids.includes(item.id)), source };
}
