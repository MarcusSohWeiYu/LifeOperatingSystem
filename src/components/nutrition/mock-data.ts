import type { NutritionState } from "./types";
import { todayDateStr } from "./utils";

const TODAY = todayDateStr();

export function getDefaultNutritionState(): NutritionState {
  return {
    goals: {
      calories: 2000,
      proteinPct: 30,
      carbsPct: 40,
      fatPct: 30,
    },
    logs: {
      [TODAY]: {
        date: TODAY,
        entries: [
          {
            id: "mock-1",
            meal: "breakfast",
            name: "Greek Yogurt",
            brand: "Meiji",
            servingSize: "1 cup (200g)",
            servings: 1,
            calories: 130,
            proteinG: 15,
            carbsG: 10,
            fatG: 4,
          },
          {
            id: "mock-2",
            meal: "breakfast",
            name: "Granola",
            brand: "Sanitarium",
            servingSize: "50g",
            servings: 1,
            calories: 220,
            proteinG: 5,
            carbsG: 35,
            fatG: 8,
          },
          {
            id: "mock-3",
            meal: "lunch",
            name: "Chicken Rice",
            brand: "",
            servingSize: "1 plate",
            servings: 1,
            calories: 600,
            proteinG: 35,
            carbsG: 65,
            fatG: 18,
          },
          {
            id: "mock-4",
            meal: "dinner",
            name: "Grilled Salmon",
            brand: "",
            servingSize: "1 fillet (180g)",
            servings: 1,
            calories: 350,
            proteinG: 38,
            carbsG: 0,
            fatG: 22,
          },
          {
            id: "mock-5",
            meal: "dinner",
            name: "Stir-fried Vegetables",
            brand: "",
            servingSize: "1 serving",
            servings: 1,
            calories: 100,
            proteinG: 3,
            carbsG: 12,
            fatG: 5,
          },
          {
            id: "mock-6",
            meal: "snacks",
            name: "Apple",
            brand: "",
            servingSize: "1 medium",
            servings: 1,
            calories: 95,
            proteinG: 0.5,
            carbsG: 25,
            fatG: 0.3,
          },
        ],
      },
    },
  };
}
