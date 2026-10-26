import { format, startOfWeek, addDays, isAfter } from "date-fns";
import type { BodyStats, DailyGoals, DailyLog } from "./types";
import { totalCalories, totalProteinG, totalCarbsG, totalFatG } from "./utils";

// ── BMR & TDEE ───────────────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin-St Jeor equation */
export function bmrCalories(stats: BodyStats): number {
  const base = 10 * stats.weightKg + 6.25 * stats.heightCm - 5 * stats.age;
  return Math.round(stats.gender === "male" ? base + 5 : base - 161);
}

/** Total daily energy expenditure (BMR × activity multiplier) */
export function tdeeCalories(stats: BodyStats): number {
  const multiplier = ACTIVITY_MULTIPLIER[stats.activityLevel] ?? 1.2;
  return Math.round(bmrCalories(stats) * multiplier);
}

/** Approximate calories burned from steps (0.04 cal per step per kg is a rough average) */
export function stepCalories(steps: number, weightKg: number): number {
  return Math.round(steps * 0.04 * (weightKg / 70));
}

// ── Deficit / Surplus ────────────────────────────────────────────────────────

export type DailyBalance = {
  date: string;
  intake: number;
  bmr: number;
  stepsBurned: number;
  tdee: number;
  deficit: number; // positive = deficit (losing weight), negative = surplus
};

export function dailyBalance(
  log: DailyLog | undefined,
  stats: BodyStats,
): DailyBalance {
  const intake = log ? totalCalories(log.entries) : 0;
  const bmr = bmrCalories(stats);
  const tdee = tdeeCalories(stats);
  const steps = log?.steps ?? 0;
  const burned = stepCalories(steps, stats.weightKg);
  const totalBurn = tdee + burned;

  return {
    date: log?.date ?? "",
    intake,
    bmr,
    stepsBurned: burned,
    tdee: totalBurn,
    deficit: totalBurn - intake,
  };
}

// ── Weekly stats ─────────────────────────────────────────────────────────────

export type WeeklyStats = {
  weekLabel: string;
  startDate: string;
  endDate: string;
  days: DailyBalance[];
  avgCalories: number;
  avgProteinG: number;
  avgCarbsG: number;
  avgFatG: number;
  avgDeficit: number;
  totalDeficit: number;
  adherenceRate: number; // 0-100
  daysLogged: number;
  estimatedWeightChangeKg: number; // negative = loss
};

/** Get the Monday-Sunday week containing `dateStr` */
function weekRange(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return { start, end };
}

export function computeWeeklyStats(
  centerDate: string,
  logs: Record<string, DailyLog>,
  goals: DailyGoals,
  stats: BodyStats | undefined,
): WeeklyStats {
  const { start, end } = weekRange(centerDate);
  const days: DailyBalance[] = [];
  const entries: { cal: number; protein: number; carbs: number; fat: number }[] = [];
  let daysLogged = 0;
  let daysOnTrack = 0;

  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    if (isAfter(d, today)) break; // don't count future days
    const dayStr = format(d, "yyyy-MM-dd");
    const log = logs[dayStr];

    if (stats) {
      days.push(dailyBalance(log, stats));
    }

    if (log && log.entries.length > 0) {
      daysLogged++;
      const cal = totalCalories(log.entries);
      entries.push({
        cal,
        protein: totalProteinG(log.entries),
        carbs: totalCarbsG(log.entries),
        fat: totalFatG(log.entries),
      });
      // On track = within ±10% of calorie goal
      if (goals.calories > 0) {
        const ratio = cal / goals.calories;
        if (ratio >= 0.9 && ratio <= 1.1) daysOnTrack++;
      }
    }
  }

  const pastDays = Math.min(7, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);

  const avgCalories = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.cal, 0) / entries.length)
    : 0;
  const avgProteinG = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.protein, 0) / entries.length * 10) / 10
    : 0;
  const avgCarbsG = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.carbs, 0) / entries.length * 10) / 10
    : 0;
  const avgFatG = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.fat, 0) / entries.length * 10) / 10
    : 0;

  const totalDeficit = days.reduce((s, d) => s + d.deficit, 0);
  const avgDeficit = days.length > 0 ? Math.round(totalDeficit / days.length) : 0;

  // 7700 cal ≈ 1 kg of body fat
  const estimatedWeightChangeKg = Math.round((-totalDeficit / 7700) * 100) / 100;

  return {
    weekLabel: `${format(start, "d MMM")} – ${format(end, "d MMM")}`,
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
    days,
    avgCalories,
    avgProteinG,
    avgCarbsG,
    avgFatG,
    avgDeficit,
    totalDeficit,
    adherenceRate: pastDays > 0 ? Math.round((daysOnTrack / pastDays) * 100) : 0,
    daysLogged,
    estimatedWeightChangeKg,
  };
}

// ── Multi-week trend data ────────────────────────────────────────────────────

export type DayTrendPoint = {
  date: string;
  dayLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goal: number;
  steps: number;
  deficit: number | null;
};

export function buildTrendData(
  centerDate: string,
  weeksBack: number,
  logs: Record<string, DailyLog>,
  goals: DailyGoals,
  stats: BodyStats | undefined,
): DayTrendPoint[] {
  const { start } = weekRange(centerDate);
  const trendStart = addDays(start, -7 * (weeksBack - 1));
  const today = new Date();
  const points: DayTrendPoint[] = [];

  const totalDays = 7 * weeksBack;
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(trendStart, i);
    if (isAfter(d, today)) break;
    const dayStr = format(d, "yyyy-MM-dd");
    const log = logs[dayStr];
    const hasData = log && log.entries.length > 0;

    let deficit: number | null = null;
    if (stats && hasData) {
      const bal = dailyBalance(log, stats);
      deficit = bal.deficit;
    }

    points.push({
      date: dayStr,
      dayLabel: format(d, "EEE d"),
      calories: hasData ? totalCalories(log.entries) : 0,
      proteinG: hasData ? totalProteinG(log.entries) : 0,
      carbsG: hasData ? totalCarbsG(log.entries) : 0,
      fatG: hasData ? totalFatG(log.entries) : 0,
      goal: goals.calories,
      steps: log?.steps ?? 0,
      deficit,
    });
  }

  return points;
}
