import { format, addDays as dfnsAddDays, isToday as dfnsIsToday } from "date-fns";
import type { FoodEntry, DailyGoals, NutritionState } from "./types";

// ── Effective values (per-serving × servings) ──────────────────────────────

export function effectiveCalories(e: FoodEntry): number {
  return Math.round(e.calories * e.servings);
}

export function effectiveProteinG(e: FoodEntry): number {
  return Math.round(e.proteinG * e.servings * 10) / 10;
}

export function effectiveCarbsG(e: FoodEntry): number {
  return Math.round(e.carbsG * e.servings * 10) / 10;
}

export function effectiveFatG(e: FoodEntry): number {
  return Math.round(e.fatG * e.servings * 10) / 10;
}

// ── Totals for a list of entries ───────────────────────────────────────────

export function totalCalories(entries: FoodEntry[]): number {
  return entries.reduce((sum, e) => sum + effectiveCalories(e), 0);
}

export function totalProteinG(entries: FoodEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + effectiveProteinG(e), 0) * 10) / 10;
}

export function totalCarbsG(entries: FoodEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + effectiveCarbsG(e), 0) * 10) / 10;
}

export function totalFatG(entries: FoodEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + effectiveFatG(e), 0) * 10) / 10;
}

// ── Macro gram targets from calorie goal + percentage ─────────────────────

export function macroGramsTarget(calorieGoal: number, macroPct: number, calPerGram: number): number {
  return Math.round((calorieGoal * macroPct) / 100 / calPerGram);
}

export function proteinGramsTarget(goals: DailyGoals): number {
  return macroGramsTarget(goals.calories, goals.proteinPct, 4);
}

export function carbsGramsTarget(goals: DailyGoals): number {
  return macroGramsTarget(goals.calories, goals.carbsPct, 4);
}

export function fatGramsTarget(goals: DailyGoals): number {
  return macroGramsTarget(goals.calories, goals.fatPct, 9);
}

// ── Date helpers ───────────────────────────────────────────────────────────

export function todayDateStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return format(new Date(y!, m! - 1, d!), "EEEE, d MMM yyyy");
}

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const shifted = dfnsAddDays(new Date(y!, m! - 1, d!), days);
  return format(shifted, "yyyy-MM-dd");
}

export function isDateToday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  return dfnsIsToday(new Date(y!, m! - 1, d!));
}

// ── localStorage persistence ───────────────────────────────────────────────

const STORAGE_KEY = "nutrition-state";

export function loadNutritionState(): NutritionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NutritionState;
  } catch {
    return null;
  }
}

export function saveNutritionState(state: NutritionState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}
