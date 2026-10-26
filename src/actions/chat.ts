"use server";

import { z } from "zod";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getOpenAIClient } from "@/lib/openai";

// ── Public types ────────────────────────────────────────────────────────────

export type AiFoodItem = {
  name: string;
  brand: string;
  servingSize: string;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type AnalyzeMessage = {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
};

type AnalyzeResult =
  | { ok: true; content: string; foodItems: AiFoodItem[] }
  | { ok: false; error: string };

// ── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a nutrition assistant. The user will send you photos of food or describe what they ate, and you estimate the macronutrients.

When you identify food items, ALWAYS include a JSON code block with the food items array. Use this exact format:

\`\`\`json
[
  {
    "name": "Chicken Rice",
    "brand": "",
    "servingSize": "1 plate",
    "servings": 1,
    "calories": 607,
    "proteinG": 30,
    "carbsG": 75,
    "fatG": 18
  }
]
\`\`\`

Rules:
- All values are per serving
- Use specific serving sizes (e.g. "1 plate", "1 bowl", "2 pieces") not vague ones
- For Singapore/Asian foods, use typical local portion sizes
- calories is in kcal, protein/carbs/fat in grams
- brand can be empty string if unknown
- servings should default to 1
- Round calories to nearest whole number, macros to 1 decimal place
- If you cannot identify the food or the image is unclear, say so — do not guess wildly
- You may answer follow-up nutrition questions without a JSON block`;

// ── Zod schema for parsing ──────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseFoodItems(text: string): AiFoodItem[] {
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

function buildOpenAIMessages(
  messages: AnalyzeMessage[],
): ChatCompletionMessageParam[] {
  // Cap to last 20 messages for cost control
  const recent = messages.slice(-20);

  return recent.map((msg): ChatCompletionMessageParam => {
    if (msg.role === "assistant") {
      return { role: "assistant", content: msg.content };
    }

    // User message — may include image
    if (msg.imageDataUrl) {
      return {
        role: "user",
        content: [
          ...(msg.content ? [{ type: "text" as const, text: msg.content }] : []),
          {
            type: "image_url" as const,
            image_url: { url: msg.imageDataUrl, detail: "low" as const },
          },
        ],
      };
    }

    return { role: "user", content: msg.content };
  });
}

// ── Server action ───────────────────────────────────────────────────────────

export async function analyzeFood(
  messages: AnalyzeMessage[],
): Promise<AnalyzeResult> {
  try {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...buildOpenAIMessages(messages),
      ],
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const foodItems = parseFoodItems(content);

    return { ok: true, content, foodItems };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI analysis failed";
    return { ok: false, error: msg };
  }
}
