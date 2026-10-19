import "server-only";

export type FoodSearchResult = {
  foodId: string;
  name: string;
  brand: string;
  calories: number;
  description: string;
};

export type FoodProduct = {
  name: string;
  brand: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

// ── OAuth token cache ─────────────────────────────────────────────────────────

type TokenCache = { accessToken: string; expiresAt: number } | null;
let cachedToken: TokenCache = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID ?? "";
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) {
    throw new Error("FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET are not configured.");
  }

  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials&scope=basic",
  });

  if (!res.ok) {
    throw new Error(`FatSecret token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    // Refresh 60 s before actual expiry
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };
  return cachedToken.accessToken;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_URL = "https://platform.fatsecret.com/rest/server.api";

async function fsGet(params: Record<string, string>): Promise<unknown> {
  const token = await getAccessToken();
  const url = new URL(BASE_URL);
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`FatSecret API error: ${res.status}`);
  return res.json();
}

function parseCaloriesFromDescription(desc: string): number {
  const m = /Calories:\s*(\d+)kcal/i.exec(desc);
  return m?.[1] ? parseInt(m[1], 10) : 0;
}

// FatSecret returns a single object when there's 1 result and an array for multiple
function asArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

// ── Public API ────────────────────────────────────────────────────────────────

type RawFoodItem = {
  food_id?: string;
  food_name?: string;
  brand_name?: string;
  food_description?: string;
};

type RawServing = {
  serving_description?: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
  calories?: string;
  protein?: string;
  carbohydrate?: string;
  fat?: string;
};

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const data = (await fsGet({ method: "foods.search", search_expression: query, max_results: "20" })) as {
    foods?: { food?: RawFoodItem | RawFoodItem[] };
    error?: { message: string };
  };

  console.log("[FatSecret raw]", JSON.stringify(data).slice(0, 600));
  if (data.error) return [];
  const items = asArray(data.foods?.food) as RawFoodItem[];
  return items
    .filter((f) => !!f.food_name)
    .map((f) => ({
      foodId: f.food_id ?? "",
      name: f.food_name ?? "",
      brand: f.brand_name ?? "",
      description: f.food_description ?? "",
      calories: parseCaloriesFromDescription(f.food_description ?? ""),
    }));
}

export async function getFoodDetails(foodId: string): Promise<FoodProduct | null> {
  const data = (await fsGet({ method: "food.get.v4", food_id: foodId })) as {
    food?: {
      food_name?: string;
      brand_name?: string;
      servings?: { serving?: RawServing | RawServing[] };
    };
    error?: { message: string };
  };

  if (data.error || !data.food) return null;

  const servings = asArray(data.food.servings?.serving) as RawServing[];
  const s = servings[0];
  if (!s) return null;

  const servingSize = s.serving_description
    ?? (s.metric_serving_amount && s.metric_serving_unit
      ? `${s.metric_serving_amount}${s.metric_serving_unit}`
      : "1 serving");

  return {
    name: data.food.food_name ?? "",
    brand: data.food.brand_name ?? "",
    servingSize,
    calories: Math.round(parseFloat(s.calories ?? "0")),
    proteinG: Math.round(parseFloat(s.protein ?? "0") * 10) / 10,
    carbsG: Math.round(parseFloat(s.carbohydrate ?? "0") * 10) / 10,
    fatG: Math.round(parseFloat(s.fat ?? "0") * 10) / 10,
  };
}

export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  const data = (await fsGet({ method: "food.find_id_for_barcode", barcode })) as {
    food_id?: { value?: string };
    error?: { message: string };
  };

  if (data.error || !data.food_id?.value) return null;
  return getFoodDetails(data.food_id.value);
}
