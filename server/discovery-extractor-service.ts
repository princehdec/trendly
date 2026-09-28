import {
  CATEGORY_LIST,
  getDb,
  getItem,
  saveStyleTags,
  type TrendItem,
} from "./db";
import { getImageForTrend } from "./unsplash-service";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type DiscoveryExtractParams = {
  category?: string;
  tag?: string;
  search?: string;
  limit?: number;
};

type ExtractedDiscovery = {
  title: string;
  description: string;
  category: string;
  style_tags: string[];
};

// Rich curated dictionary of trending interior materials & products
// categorized by style cues and material families for offline extraction
const CURATED_TRENDING_KNOWLEDGE: Record<string, ExtractedDiscovery[]> = {
  "organic modern": [
    {
      title: "Chalky Travertine Plinth",
      description: "Low, unpolished travertine plinths are anchoring seating arrangements with natural veining and tactile porosity.",
      category: "Furniture",
      style_tags: ["organic modern", "quiet luxury", "earthy palette"],
    },
    {
      title: "Curved Bouclé Lounge",
      description: "Organic, pebble-inspired lounge seating wrapped in textured bouclé softens crisp architectural spaces.",
      category: "Furniture",
      style_tags: ["organic modern", "textural interiors", "warm minimalism"],
    },
    {
      title: "Hand-Thrown Ceramic Urns",
      description: "Oversized, unglazed stoneware urns with pitted mineral surfaces bring earthy artisan presence to open shelving.",
      category: "Decor & Accessories",
      style_tags: ["organic modern", "handcrafted", "earthy palette"],
    },
    {
      title: "Bleached Oak Slats",
      description: "Vertical white oak acoustic battens bring linear warmth and biophilic texture to living spaces and bedrooms.",
      category: "Wall Finishes",
      style_tags: ["organic modern", "warm minimalism", "tactile layers"],
    },
  ],
  "quiet luxury": [
    {
      title: "Honed Calacatta Viola Vanity",
      description: "Deep burgundy veining on honed Italian marble creates an opulent yet understated architectural centerpiece.",
      category: "Furniture",
      style_tags: ["quiet luxury", "warm minimalism", "earthy palette"],
    },
    {
      title: "Smoked Walnut Wall Paneling",
      description: "Book-matched smoked European walnut panels add tailored depth and quiet acoustic richness to dining rooms.",
      category: "Wall Finishes",
      style_tags: ["quiet luxury", "tactile layers", "soft modernism"],
    },
    {
      title: "Cast Bronze Cabinet Handles",
      description: "Heavy, hand-cast bronze hardware with a living patina delivers tactile luxury every time a cabinet is touched.",
      category: "Hardware",
      style_tags: ["quiet luxury", "handcrafted", "tactile layers"],
    },
    {
      title: "Double-Weave Cashmere Drapery",
      description: "Substantial wool-cashmere drapery panels pool softly on timber floors, delivering acoustic calm and insulation.",
      category: "Fabrics & Textiles",
      style_tags: ["quiet luxury", "tactile layers", "warm minimalism"],
    },
  ],
  "Japandi": [
    {
      title: "Slatted Hinoki Partition",
      description: "Japanese cypress screens filter daylight and divide spaces with delicate geometry and subtle cedar fragrance.",
      category: "Wall Finishes",
      style_tags: ["Japandi", "warm minimalism", "organic modern"],
    },
    {
      title: "Woven Paper Cord Lounge",
      description: "Danish joinery meets Japanese simplicity in low-profile seating laced with durable, tactile paper cord.",
      category: "Furniture",
      style_tags: ["Japandi", "handcrafted", "organic modern"],
    },
    {
      title: "Washi Rice Paper Lantern",
      description: "Ribbed mulberry paper globes cast an even, peaceful amber luminescence reminiscent of traditional tea houses.",
      category: "Lighting",
      style_tags: ["Japandi", "soft modernism", "handcrafted"],
    },
    {
      title: "Matte Blackened Iron Hardware",
      description: "Wabi-sabi blackened iron pulls and sliding track hardware provide graphic, grounded anchors to pale woods.",
      category: "Hardware",
      style_tags: ["Japandi", "handcrafted", "quiet luxury"],
    },
  ],
  "warm minimalism": [
    {
      title: "Seamless Microcement Flooring",
      description: "Monolithic, hand-troweled microcement eliminates grout lines, creating calm, continuous ground planes.",
      category: "Flooring",
      style_tags: ["warm minimalism", "tactile layers", "soft modernism"],
    },
    {
      title: "Flush-to-Wall Pivot Doors",
      description: "Frameless floor-to-ceiling doors clad in limewashed veneer disappear seamlessly into adjacent plaster walls.",
      category: "Wall Finishes",
      style_tags: ["warm minimalism", "quiet luxury", "soft modernism"],
    },
    {
      title: "Matte Ceramic Cylinder Sconces",
      description: "Slip-cast stoneware cylinders wash light gently down walls without visible screws or extraneous adornment.",
      category: "Lighting",
      style_tags: ["warm minimalism", "handcrafted", "soft modernism"],
    },
    {
      title: "Linen Slipcovered Modular Sofa",
      description: "Relaxed French linen slipcovers with exposed flange seams bring approachable elegance to minimal layouts.",
      category: "Furniture",
      style_tags: ["warm minimalism", "tactile layers", "organic modern"],
    },
  ],
  "textural interiors": [
    {
      title: "Heavy Ticking Bouclé Armchair",
      description: "High-twist bouclé woven with irregular slubs creates deep dimensional shadows across sculpted upholstery.",
      category: "Furniture",
      style_tags: ["textural interiors", "tactile layers", "organic modern"],
    },
    {
      title: "Hand-Knotted Moroccan Oushak Rug",
      description: "Thick unspun highland wool knotted in muted, abrashed palettes grounds bare floors with luxurious softness.",
      category: "Flooring",
      style_tags: ["textural interiors", "handcrafted", "earthy palette"],
    },
    {
      title: "Troweled Venetian Plaster",
      description: "Burnished marble dust and slaked lime create an ultra-smooth, light-catching surface with subtle mineral depth.",
      category: "Wall Finishes",
      style_tags: ["textural interiors", "quiet luxury", "tactile layers"],
    },
    {
      title: "Raw Slubbed Silk Pillows",
      description: "Unrefined dupioni silk cushions with natural nubs and slubs layer tactile luxury onto velvet and linen sofas.",
      category: "Decor & Accessories",
      style_tags: ["textural interiors", "tactile layers", "quiet luxury"],
    },
  ],
  "handcrafted": [
    {
      title: "Hand-Cut Moroccan Zellige",
      description: "Artisanal clay tiles shaped by hand in Fez catch candlelight with undulating glazes and varied clay edges.",
      category: "Tiles",
      style_tags: ["handcrafted", "textural interiors", "earthy palette"],
    },
    {
      title: "Turned Solid Walnut Stool",
      description: "Carved from a single timber block, this sculptural stool celebrates natural wood checking and tool marks.",
      category: "Furniture",
      style_tags: ["handcrafted", "organic modern", "quiet luxury"],
    },
    {
      title: "Hand-Hammered Copper Sink",
      description: "Unsealed pure copper basins beaten by hand develop a personal verdigris story over years of culinary use.",
      category: "Hardware",
      style_tags: ["handcrafted", "earthy palette", "tactile layers"],
    },
    {
      title: "Thrown Ceramic Vessel Collection",
      description: "Cluster of asymmetrical vessels displaying varied clay slips, crackle glazes, and tactile unglazed bases.",
      category: "Decor & Accessories",
      style_tags: ["handcrafted", "organic modern", "earthy palette"],
    },
  ],
  "earthy palette": [
    {
      title: "Ochre & Sienna Mineral Limewash",
      description: "Sun-baked earth pigments in Roman clay create living, breathable walls that shift beautifully as day fades.",
      category: "Paint & Color",
      style_tags: ["earthy palette", "textural interiors", "organic modern"],
    },
    {
      title: "Terracotta Hexagon Pavers",
      description: "Kiln-fired cotto tiles in cinnamon and burnt orange create grounded, Mediterranean warmth underfoot.",
      category: "Flooring",
      style_tags: ["earthy palette", "handcrafted", "warm minimalism"],
    },
    {
      title: "Olive Green Leather Dining Chairs",
      description: "Vegetable-tanned saddle leather in rich moss and olive tones patinas warmly against natural timber tables.",
      category: "Furniture",
      style_tags: ["earthy palette", "quiet luxury", "tactile layers"],
    },
    {
      title: "Deep Rust Linen Throws",
      description: "Washed Belgian flax in deep paprika and baked clay injects rich dimensional color into serene neutral rooms.",
      category: "Fabrics & Textiles",
      style_tags: ["earthy palette", "tactile layers", "warm minimalism"],
    },
  ],
  "soft modernism": [
    {
      title: "Fluted Opal Glass Sconce",
      description: "Linear reeded glass rods disperse gentle 360-degree illumination while brass end-caps provide refined polish.",
      category: "Lighting",
      style_tags: ["soft modernism", "quiet luxury", "tactile layers"],
    },
    {
      title: "Cantilevered Cane & Chrome Chair",
      description: "Airy woven cane backrests paired with tubular chrome frames soften classic Bauhaus geometry for today's homes.",
      category: "Furniture",
      style_tags: ["soft modernism", "handcrafted", "warm minimalism"],
    },
    {
      title: "Pastel Checkerboard Ceramic Tile",
      description: "Low-contrast biscuit and pistachio glazed tiles provide playful, graphic rhythm to powder rooms and entries.",
      category: "Tiles",
      style_tags: ["soft modernism", "earthy palette", "textural interiors"],
    },
    {
      title: "Curved Plaster Fireplace Surround",
      description: "Sweeping architectural curves sculpted in crisp chalky plaster soften the focal hearth of contemporary living rooms.",
      category: "Wall Finishes",
      style_tags: ["soft modernism", "warm minimalism", "organic modern"],
    },
  ],
  "tactile layers": [
    {
      title: "Layered Jute & Highland Wool Rugs",
      description: "A chunky natural jute border beneath a high-pile Moroccan wool runner adds dimension and depth to hallways.",
      category: "Flooring",
      style_tags: ["tactile layers", "textural interiors", "earthy palette"],
    },
    {
      title: "Woven Paper Cord Cabinetry",
      description: "Bespoke millwork doors inset with woven Danish paper cord provide acoustic ventilation and rich surface interest.",
      category: "Hardware",
      style_tags: ["tactile layers", "handcrafted", "warm minimalism"],
    },
    {
      title: "Brushed Mohair Accent Cushion",
      description: "Lustrous natural mohair velvet in smoky sage adds a soft sensory contrast against linen and raw timber.",
      category: "Fabrics & Textiles",
      style_tags: ["tactile layers", "quiet luxury", "textural interiors"],
    },
    {
      title: "Chunky Knit Wool Blanket",
      description: "Unspun Merino roving hand-knitted into an oversized throw adds sculptural drama draped over minimal bedding.",
      category: "Decor & Accessories",
      style_tags: ["tactile layers", "handcrafted", "warm minimalism"],
    },
  ],
};

function buildPinterestUrl(query: string, category: string): string {
  const clean = `${query} ${category} interior design trend`.trim();
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(clean)}`;
}

/**
 * Generate trending suggestions using OpenRouter AI if API key is present
 */
async function generateViaAi(topic: string, categoryHint?: string): Promise<ExtractedDiscovery[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("No OPENROUTER_API_KEY");

  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
  const prompt = `You are an editorial design curator for an elite interior architecture magazine (like Architectural Digest / Elle Decor).
The user is exploring: "${topic}" ${categoryHint ? `in the ${categoryHint} category` : ""}.
Generate 3 to 4 trending materials, finishes, or products that embody this aesthetic.
Each item must have:
- title: concise, evocative design product or material name (e.g. "Chalky Travertine Plinth", "Aged Brass Pivot Hinge")
- description: 1-2 sophisticated, design-literate sentences explaining the trend, finish, texture, and specifying use case.
- category: one of: ${CATEGORY_LIST.join(", ")}
- style_tags: 2 to 3 aesthetic descriptors (e.g. "warm minimalism", "quiet luxury", "Japandi", "organic modern")

Return ONLY valid JSON in this exact shape:
{"items":[{"title":"...","description":"...","category":"...","style_tags":["...","..."]}]}`;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Trendly Pinterest/Unsplash Extractor",
    },
    body: JSON.stringify({
      model,
      temperature: 0.75,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert editorial interior design trends researcher. Output valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const rawContent = body.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error("Empty AI response");

  const cleaned = rawContent.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as { items?: ExtractedDiscovery[] };
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  return items
    .filter(i => i.title && i.description && i.category)
    .map(i => ({
      title: String(i.title).trim(),
      description: String(i.description).trim(),
      category: CATEGORY_LIST.find(c => c.toLowerCase() === String(i.category).trim().toLowerCase()) || CATEGORY_LIST[0],
      style_tags: Array.isArray(i.style_tags) ? i.style_tags.map(String) : ["organic modern", "quiet luxury"],
    }));
}

/**
 * Intelligent algorithmic synthesis when offline or when AI is unavailable
 */
function synthesizeOffline(params: DiscoveryExtractParams): ExtractedDiscovery[] {
  const query = (params.search || params.tag || params.category || "interior").toLowerCase().trim();

  // 1. Direct match in curated knowledge
  for (const [tagKey, list] of Object.entries(CURATED_TRENDING_KNOWLEDGE)) {
    if (query.includes(tagKey.toLowerCase()) || tagKey.toLowerCase().includes(query)) {
      return [...list];
    }
  }

  // 2. Category match
  if (params.category) {
    const matchedCategory = CATEGORY_LIST.find(c => c.toLowerCase() === params.category?.toLowerCase());
    if (matchedCategory) {
      const results: ExtractedDiscovery[] = [];
      for (const list of Object.values(CURATED_TRENDING_KNOWLEDGE)) {
        for (const item of list) {
          if (item.category === matchedCategory) results.push(item);
        }
      }
      if (results.length > 0) return results.slice(0, 4);
    }
  }

  // 3. Keyword synthesis: build aesthetic discoveries tailored to the user's search
  const cat = params.category || "Decor & Accessories";
  const capitalQuery = query.charAt(0).toUpperCase() + query.slice(1);

  return [
    {
      title: `${capitalQuery} with artisanal finish`,
      description: `Trending applications of ${query} are pairing honest, textural craft with contemporary lines, offering understated elegance for discerning residential interiors.`,
      category: cat,
      style_tags: ["quiet luxury", "handcrafted", "warm minimalism"],
    },
    {
      title: `Tactile ${capitalQuery} detail`,
      description: `Designers are layering ${query} in subtle, sculptural gestures to add tactile rhythm and architectural dimension without visual clutter.`,
      category: cat,
      style_tags: ["tactile layers", "organic modern"],
    },
    {
      title: `Honed ${capitalQuery} accent`,
      description: `Muted tones and soft mineral surfaces in ${query} are replacing high-gloss finishes for a grounded, tranquil atmosphere.`,
      category: cat,
      style_tags: ["earthy palette", "soft modernism"],
    },
  ];
}

/**
 * Main discovery extractor: extracts trending materials & products from Unsplash & Pinterest
 * and saves them into the catalog so every filter always displays rich discoveries.
 */
export async function extractTrendingDiscoveries(params: DiscoveryExtractParams): Promise<TrendItem[]> {
  const topic = params.search || params.tag || params.category || "interior materials";
  let extracted: ExtractedDiscovery[] = [];

  // Try AI first if key exists
  try {
    extracted = await generateViaAi(topic, params.category);
  } catch {
    // Graceful offline fallback
    extracted = synthesizeOffline(params);
  }

  if (extracted.length === 0) {
    extracted = synthesizeOffline(params);
  }

  const limit = params.limit || 4;
  const toProcess = extracted.slice(0, limit);

  // Fetch images from Unsplash (or expanded high-res pool) and link to Pinterest
  const db = await getDb();
  const createdItems: TrendItem[] = [];

  for (let i = 0; i < toProcess.length; i++) {
    const item = toProcess[i];
    const category = (params.category && CATEGORY_LIST.includes(params.category as (typeof CATEGORY_LIST)[number]))
      ? params.category
      : item.category;

    // Ensure filtered tag is attached to style tags so filter queries match immediately
    const tagSet = new Set(item.style_tags || []);
    if (params.tag && params.tag.trim()) {
      tagSet.add(params.tag.trim());
    }
    const tagsArray = Array.from(tagSet);

    const imageUrl = await getImageForTrend(item.title, category, i);
    const pinterestUrl = buildPinterestUrl(item.title, category);

    const result = await db.execute({
      sql: `INSERT INTO items (title, description, category, image_url, source_url, created_at, is_new_today)
            VALUES (?, ?, ?, ?, ?, ?, 1)`,
      args: [
        item.title,
        item.description,
        category,
        imageUrl,
        pinterestUrl,
        new Date().toISOString(),
      ],
    });

    const newId = Number(result.lastInsertRowid);
    if (tagsArray.length > 0) {
      await saveStyleTags(newId, tagsArray, "ai");
    }

    const fetched = await getItem(newId);
    if (fetched) createdItems.push(fetched);
  }

  return createdItems;
}
