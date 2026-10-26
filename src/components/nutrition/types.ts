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
  steps?: number;
  workoutCalsBurned?: number;
};

export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"       // desk job, little exercise
  | "light"           // light exercise 1-3 days/week
  | "moderate"        // moderate exercise 3-5 days/week
  | "active"          // hard exercise 6-7 days/week
  | "very_active";    // very hard exercise, physical job

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job)",
  light: "Lightly active (1-3 days/wk)",
  moderate: "Moderately active (3-5 days/wk)",
  active: "Active (6-7 days/wk)",
  very_active: "Very active (athlete/physical job)",
};

export type BodyStats = {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
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

export type WeightEntry = {
  date: string;  // YYYY-MM-DD
  weightKg: number;
};

export type NutritionState = {
  goals: DailyGoals;
  logs: Record<string, DailyLog>;
  savedFoods?: SavedFood[];
  bodyStats?: BodyStats;
  weightLog?: WeightEntry[];
};
