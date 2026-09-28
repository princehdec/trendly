import { describe, it, expect } from "vitest";
import { pickFromPool, getImageForTrend, searchUnsplashImage } from "./unsplash-service";

describe("Unsplash & Image Fallback Service", () => {
  it("picks a valid image URL from the expanded pool for any valid category", () => {
    const url = pickFromPool("Lighting");
    expect(typeof url).toBe("string");
    expect(url).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });

  it("handles unknown categories gracefully by falling back to Decor & Accessories", () => {
    const url = pickFromPool("NonExistentCategory123");
    expect(typeof url).toBe("string");
    expect(url).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });

  it("returns fallback pool image when no Unsplash API key is set or when offline", async () => {
    // Without UNSPLASH_ACCESS_KEY, searchUnsplashImage returns null
    const result = await searchUnsplashImage("terrazzo flooring");
    // Depending on whether env key is set or not
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      expect(result).toBeNull();
    }

    // getImageForTrend must always return a valid image URL regardless of API key presence
    const imageUrl = await getImageForTrend("Warm Terrazzo", "Flooring", 0);
    expect(typeof imageUrl).toBe("string");
    expect(imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });
});
