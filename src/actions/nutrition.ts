"use server";

import {
  searchFoods as fsSearchFoods,
  getFoodDetails as fsGetFoodDetails,
  lookupBarcode as fsLookupBarcode,
} from "@/lib/fatsecret";
import type { FoodSearchResult, FoodProduct } from "@/lib/fatsecret";

export type { FoodSearchResult, FoodProduct };

type SearchResult =
  | { ok: true; results: FoodSearchResult[] }
  | { ok: false; error: string };

type DetailResult =
  | { ok: true; food: FoodProduct }
  | { ok: false; error: string };

export async function searchFoods(query: string): Promise<SearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { ok: true, results: [] };
  try {
    const results = await fsSearchFoods(trimmed);
    console.log("[searchFoods] returning", results.length, "results");
    return { ok: true, results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Search failed";
    return { ok: false, error: msg };
  }
}

export async function getFoodDetails(foodId: string): Promise<DetailResult> {
  try {
    const food = await fsGetFoodDetails(foodId);
    if (!food) return { ok: false, error: "Food not found" };
    return { ok: true, food };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load food details";
    return { ok: false, error: msg };
  }
}

export async function lookupFoodBarcode(barcode: string): Promise<DetailResult> {
  try {
    const food = await fsLookupBarcode(barcode);
    if (!food) return { ok: false, error: "Product not found" };
    return { ok: true, food };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Barcode lookup failed";
    return { ok: false, error: msg };
  }
}
