"use server";

import { search, SafeSearchType } from "duck-duck-scrape";

export interface ImageResult {
    title: string;
    image: string;
    thumbnail: string;
    width: number;
    height: number;
    source: string;
    url: string;
}

export async function searchImages(query: string): Promise<ImageResult[]> {
    if (!query || query.trim().length === 0) {
        return [];
    }

    try {
        const searchResults = await search(query, {
            safeSearch: SafeSearchType.STRICT,
        });

        if (!searchResults.images) {
            return [];
        }

        // Map the results to our interface
        return searchResults.images.slice(0, 12).map((img) => ({
            title: img.title || "Image",
            image: img.url,
            thumbnail: img.thumbnail,
            width: img.width || 0,
            height: img.height || 0,
            source: img.source || "DuckDuckGo",
            url: img.url
        }));
    } catch (error) {
        console.error("Image search error:", error);
        return [];
    }
}
