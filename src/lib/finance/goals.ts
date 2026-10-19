import type { ContributionRow } from "@/lib/sheets/schema";
import { toCents } from "./money";

export type GoalHealth = "reached" | "overdue" | "on-track" | "behind";

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(y, m - 1, d);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Number of full calendar months remaining until the target date.
 * Formula: (targetYear − thisYear) × 12 + (targetMonth − thisMonth).
 * Returns 0 if target date is in the past (overdue).
 * Returns at least 1 if target date is today or in the future.
 */
export function monthsRemaining(targetDate: string, today: Date): number {
  const parts = targetDate.split("-");
  const targetYear = Number(parts[0]);
  const targetMonth = Number(parts[1]);
  const targetDay = Number(parts[2]);

  const todayStart = startOfDay(today);
  const targetStart = new Date(targetYear, targetMonth - 1, targetDay);

  if (targetStart < todayStart) {
    return 0;
  }

  const months =
    (targetYear - today.getFullYear()) * 12 +
    (targetMonth - (today.getMonth() + 1));

  return Math.max(1, months);
}

/**
 * Monthly saving required to reach the target.
 * Rounded up to the nearest cent.
 * Returns 0 if already reached or if months === 0 (overdue).
 */
export function requiredMonthlyCents(
  targetCents: number,
  savedCents: number,
  months: number
): number {
  if (savedCents >= targetCents || months === 0) return 0;
  return Math.ceil((targetCents - savedCents) / months);
}

/**
 * Sum of contribution amounts (in cents) for the same calendar month as `today`.
 */
export function contributedThisMonthCents(
  contributions: ContributionRow[],
  today: Date
): number {
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth() + 1;
  return contributions
    .filter((c) => {
      const dateParts = c.date.split("-");
      const y = Number(dateParts[0]);
      const m = Number(dateParts[1]);
      return y === thisYear && m === thisMonth;
    })
    .reduce((sum, c) => sum + toCents(c.amount), 0);
}

/**
 * Health status for a goal.
 * - reached:  saved >= target
 * - overdue:  target date is in the past and not reached
 * - on-track: contributions this calendar month >= required monthly saving
 * - behind:   otherwise
 */
export function goalHealth(
  targetCents: number,
  savedCents: number,
  requiredMonthly: number,
  contributionsThisMonth: number,
  targetDate: string,
  today: Date
): GoalHealth {
  if (savedCents >= targetCents) return "reached";

  const todayStart = startOfDay(today);
  const targetStart = parseLocalDate(targetDate);
  if (targetStart < todayStart) return "overdue";

  if (contributionsThisMonth >= requiredMonthly) return "on-track";
  return "behind";
}

/**
 * Progress toward a goal as a percentage (0–100).
 */
export function progressPercent(savedCents: number, targetCents: number): number {
  if (targetCents === 0) return 100;
  return Math.min(100, Math.round((savedCents / targetCents) * 100));
}

/**
 * The earliest calendar month the user could afford the goal given a fixed monthly saving.
 * Returns an ISO date string (YYYY-MM-DD, always 1st of month) or null if monthlySavings <= 0.
 * If already reached, returns today's date.
 */
export function earliestAffordableDate(
  targetCents: number,
  savedCents: number,
  monthlySavings: number,
  today: Date
): string | null {
  if (monthlySavings <= 0) return null;
  if (savedCents >= targetCents) {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const months = Math.ceil((targetCents - savedCents) / monthlySavings);
  const absMonth = today.getMonth() + months;
  const targetYear = today.getFullYear() + Math.floor(absMonth / 12);
  const targetMonth = (absMonth % 12) + 1;
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
}
