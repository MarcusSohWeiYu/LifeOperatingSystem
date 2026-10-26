export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

export const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];

export type FoodEntry = {
  id: string;
  meal: MealType;
  name: string;
  brand: string;
  servingSize: string;
  servings: number;
  calories: number;  // kcal per serving
  proteinG: number;  // grams per serving
  carbsG: number;
  fatG: number;
};

export type DailyGoals = {
  calories: number;
  proteinPct: number;  // must sum to 100 with carbsPct + fatPct
  carbsPct: number;
  fatPct: number;
};

export type DailyLog = {
  date: string;  // YYYY-MM-DD
  entries: FoodEntry[];
};

export type SavedFood = {
  id: string;
  name: string;
  brand: string;
  servingSize: string;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  savedAt: string;
};

export type NutritionState = {
  goals: DailyGoals;
  logs: Record<string, DailyLog>;
  savedFoods?: SavedFood[];
};
