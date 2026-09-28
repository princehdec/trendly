import { describe, it, expect } from "vitest";
import { extractTrendingDiscoveries } from "./discovery-extractor-service";
import { listItems, listItemsPage } from "./db";

describe("Trending Discovery Extractor (Unsplash & Pinterest)", () => {
  it("extracts trending discoveries for a style tag and attaches Pinterest references and Unsplash images", async () => {
    const results = await extractTrendingDiscoveries({ tag: "organic modern", limit: 2 });
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThanOrEqual(1);

    const first = results[0];
    expect(first.title).toBeTruthy();
    expect(first.description).toBeTruthy();
    expect(first.category).toBeTruthy();
    expect(first.image_url).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(first.source_url).toContain("pinterest.com");
  });

  it("extracts trending discoveries when searching for a bespoke material or keyword", async () => {
    const results = await extractTrendingDiscoveries({ search: "Moroccan Zellige", category: "Tiles", limit: 2 });
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThanOrEqual(1);

    const first = results[0];
    expect(first.image_url).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(first.source_url).toContain("pinterest.com");
  });

  it("ensures listItemsPage automatically populates trending items instead of returning 0 items for a new tag", async () => {
    const uniqueTag = `custom-style-${Date.now()}`;
    const page = await listItemsPage({ tag: uniqueTag }, 4, 0);

    // It should never be 0 because auto-extraction curates items on demand!
    expect(page.items).toBeInstanceOf(Array);
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.total).toBeGreaterThan(0);
    expect(page.items[0].source_url).toContain("pinterest.com");
  });
});
