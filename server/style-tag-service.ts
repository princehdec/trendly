import { invokeLLM } from "./_core/llm";
import { getItem, saveStyleTags, type TrendItem } from "./db";

const MODEL = "gemini-3-flash-preview";

const FALLBACK_TAGS: Record<string, string[]> = {
  Flooring: ["warm minimalism", "natural materials", "quiet luxury"],
  "Wall Finishes": ["organic modern", "textural interiors", "Japandi"],
  Lighting: ["soft modernism", "sculptural forms", "1970s revival"],
  Furniture: ["quiet luxury", "rounded forms", "organic modern"],
  Tiles: ["handcrafted", "Mediterranean modern", "earthy palette"],
  "Paint & Color": ["tonal interiors", "color drenching", "warm minimalism"],
  "Fabrics & Textiles": ["tactile minimalism", "relaxed tailoring", "natural palette"],
  Hardware: ["collected interiors", "aged finishes", "quiet luxury"],
  "Decor & Accessories": ["organic modern", "tactile minimalism", "collected interiors"],
};

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map(tag => String(tag).trim().replace(/\s+/g, " "))
    .filter(tag => {
      const key = tag.toLowerCase();
      if (!tag || tag.length > 32 || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

function parseTags(content: string) {
  const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { tags?: unknown };
    return normalizeTags(parsed.tags);
  } catch {
    // Some vision providers occasionally truncate a JSON response after the
    // tag values. Recover only quoted values, never arbitrary prose.
    const recovered = Array.from(cleaned.matchAll(/[\"']([^\"'\n]{2,48})[\"']/g))
      .map(match => match[1])
      .filter(tag => tag.toLowerCase() !== "tags");
    return normalizeTags(recovered);
  }
}

async function generateTags(item: TrendItem) {
  const response = await invokeLLM({
    model: MODEL,
    // Gemini consumes part of its token budget while reasoning before emitting
    // the JSON object, so keep enough room for the visible response.
    maxTokens: 2048,
    messages: [
      {
        role: "system",
        content: "You are an interior design editor. Analyze the supplied room or design detail image as visual reference only. Suggest concise, recognizable interior design style tags that would help a designer organize a reference library. Do not describe people or infer sensitive traits. Return only the requested JSON.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Analyze this saved Trendly reference titled \"${item.title}\" in the ${item.category} category. Return 3 to 5 style tags. Prefer tags such as Japandi, organic modern, quiet luxury, maximalism, mid-century, Mediterranean modern, warm minimalism, tonal interiors, or tactile minimalism when visually appropriate.` },
          { type: "image_url", image_url: { url: item.image_url, detail: "low" } },
        ],
      },
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "interior_style_tags",
        strict: true,
        schema: {
          type: "object",
          properties: { tags: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 } },
          required: ["tags"],
          additionalProperties: false,
        },
      },
    },
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("The tagging model returned no text");
  const tags = parseTags(content);
  if (tags.length < 3) throw new Error("The tagging model returned too few tags");
  return tags;
}

export async function suggestStyleTags(itemId: number, force = false): Promise<TrendItem | null> {
  const item = await getItem(itemId);
  if (!item) return null;
  if (item.style_tags?.length && !force) return item;

  try {
    const tags = await generateTags(item);
    return saveStyleTags(itemId, tags, "ai", MODEL);
  } catch (error) {
    console.warn("[Trendly] Using curated style-tag fallback:", error instanceof Error ? error.message : error);
    return saveStyleTags(itemId, FALLBACK_TAGS[item.category] || ["considered interiors", "natural materials", "soft modernism"], "curated", null);
  }
}

export function curatedStyleTags(category: string) {
  return FALLBACK_TAGS[category] || ["considered interiors", "natural materials", "soft modernism"];
}
