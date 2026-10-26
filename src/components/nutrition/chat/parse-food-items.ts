import { z } from "zod";
import type { AiFoodItem } from "./types";

const foodItemSchema = z.object({
  name: z.string(),
  brand: z.string(),
  servingSize: z.string(),
  servings: z.number(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
});

const foodItemsSchema = z.array(foodItemSchema);

export function parseFoodItems(text: string): AiFoodItem[] {
  const match = /```json\s*([\s\S]*?)```/.exec(text);
  if (!match?.[1]) return [];

  try {
    const parsed: unknown = JSON.parse(match[1]);
    const result = foodItemsSchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}
