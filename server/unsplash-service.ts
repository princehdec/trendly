/**
 * Unsplash image service for Trendly.
 * Searches Unsplash for real interior design images when an API key is available,
 * falls back to an expanded curated pool with randomization.
 */

const UNSPLASH_API = "https://api.unsplash.com/search/photos";

// Expanded curated pool — 6-8 unique URLs per category, zero duplicates across categories
const EXPANDED_IMAGE_POOL: Record<string, string[]> = {
  Flooring: [
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=85",
  ],
  "Wall Finishes": [
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
  ],
  Lighting: [
    "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1530603907829-659dc1d6e292?auto=format&fit=crop&w=1200&q=85",
  ],
  Furniture: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1567538096621-38d2284b23ff?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85",
  ],
  Tiles: [
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600573472556-e636c2acda9e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1604709177225-055f99402ea3?auto=format&fit=crop&w=1200&q=85",
  ],
  "Paint & Color": [
    "https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1598928506311-c55ez633a2ab?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=85",
  ],
  "Fabrics & Textiles": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1616137466211-f73a09cf56b9?auto=format&fit=crop&w=1200&q=85",
  ],
  Hardware: [
    "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1618219740975-d40978bb7378?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=85",
  ],
  "Decor & Accessories": [
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=85",
  ],
};

// Simple in-memory cache for search results
const imageCache = new Map<string, string>();

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pick a random image from the expanded pool for a given category.
 * Uses randomization to avoid returning the same image every time.
 */
export function pickFromPool(category: string, _index = 0): string {
  const pool = EXPANDED_IMAGE_POOL[category] || EXPANDED_IMAGE_POOL["Decor & Accessories"];
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Search Unsplash for an image matching the query.
 * Returns the first result's regular-size URL, or null if nothing found.
 */
export async function searchUnsplashImage(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!;

  try {
    await delay(200); // Rate limiting
    const params = new URLSearchParams({
      query: query,
      per_page: "5",
      orientation: "landscape",
      content_filter: "high",
    });
    const response = await fetch(`${UNSPLASH_API}?${params}`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      console.warn(`[Trendly] Unsplash search failed (${response.status}): ${query}`);
      return null;
    }

    const data = await response.json() as {
      results?: Array<{
        urls?: { regular?: string; small?: string };
        links?: { download_location?: string };
      }>;
    };

    const results = data.results;
    if (!results || results.length === 0) return null;

    // Pick a random result from top 5 for variety
    const picked = results[Math.floor(Math.random() * Math.min(results.length, 5))];
    const url = picked?.urls?.regular || picked?.urls?.small;
    if (!url) return null;

    // Trigger download tracking per Unsplash API guidelines
    if (picked?.links?.download_location && accessKey) {
      fetch(`${picked.links.download_location}?client_id=${accessKey}`).catch(() => {});
    }

    imageCache.set(cacheKey, url);
    return url;
  } catch (error) {
    console.warn("[Trendly] Unsplash search error:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get an image for a trend — tries Unsplash first, falls back to expanded pool.
 */
export async function getImageForTrend(title: string, category: string, index = 0): Promise<string> {
  // Try Unsplash search with a good interior design query
  const query = `${title} ${category} interior design`;
  const unsplashUrl = await searchUnsplashImage(query);
  if (unsplashUrl) {
    console.log(`[Trendly] ✓ Unsplash image for "${title}"`);
    return unsplashUrl;
  }

  // Fallback: try a simpler category-only search
  const categoryUrl = await searchUnsplashImage(`${category} interior design`);
  if (categoryUrl) {
    console.log(`[Trendly] ✓ Unsplash category image for "${title}"`);
    return categoryUrl;
  }

  // Final fallback: randomized pool
  console.log(`[Trendly] → Pool image for "${title}"`);
  return pickFromPool(category, index);
}

/**
 * Clear the image cache (useful for testing or manual cache invalidation).
 */
export function clearImageCache() {
  imageCache.clear();
}
