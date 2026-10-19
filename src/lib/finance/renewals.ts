import type { Frequency } from "@/lib/sheets/schema";

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

function advanceByFrequency(date: Date, frequency: Frequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "fortnightly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

/**
 * Roll the stored nextRenewal date forward by frequency until it is today or later.
 * Returns the effective next renewal date.
 */
export function nextRenewalDate(
  stored: string,
  frequency: Frequency,
  today: Date
): Date {
  let current = parseLocalDate(stored);
  const todayStart = startOfDay(today);
  while (current < todayStart) {
    current = advanceByFrequency(current, frequency);
  }
  return current;
}

/**
 * Returns true if the renewal date is within alertDays calendar days of today (inclusive).
 */
export function isRenewingSoon(
  date: Date,
  today: Date,
  alertDays: number
): boolean {
  const todayStart = startOfDay(today);
  const alertMs = alertDays * 24 * 60 * 60 * 1000;
  return date.getTime() - todayStart.getTime() <= alertMs;
}
