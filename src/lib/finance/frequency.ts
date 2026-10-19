import type { Frequency } from "@/lib/sheets/schema";

/**
 * Convert an amount in cents with the given frequency to a monthly equivalent in cents.
 * weekly ×52/12, fortnightly ×26/12, monthly ×1, quarterly ÷3, yearly ÷12. Round to cents.
 */
export function toMonthlyCents(amountCents: number, frequency: Frequency): number {
  switch (frequency) {
    case "weekly":
      return Math.round((amountCents * 52) / 12);
    case "fortnightly":
      return Math.round((amountCents * 26) / 12);
    case "monthly":
      return amountCents;
    case "quarterly":
      return Math.round(amountCents / 3);
    case "yearly":
      return Math.round(amountCents / 12);
  }
}
