import { describe, it, expect } from "vitest";
import { nextRenewalDate, isRenewingSoon } from "./renewals";

// Helper to create a local midnight Date from a YYYY-MM-DD string
function d(dateStr: string): Date {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, day!);
}

describe("nextRenewalDate", () => {
  const today = d("2025-06-15");

  describe("date already today or in the future", () => {
    it("returns stored date if it is today", () => {
      const result = nextRenewalDate("2025-06-15", "monthly", today);
      expect(result).toEqual(d("2025-06-15"));
    });

    it("returns stored date if it is in the future", () => {
      const result = nextRenewalDate("2025-06-20", "monthly", today);
      expect(result).toEqual(d("2025-06-20"));
    });
  });

  describe("monthly frequency", () => {
    it("advances one month for a date one month ago", () => {
      const result = nextRenewalDate("2025-05-15", "monthly", today);
      expect(result).toEqual(d("2025-06-15"));
    });

    it("advances multiple months for a very old date", () => {
      const result = nextRenewalDate("2024-01-15", "monthly", today);
      expect(result).toEqual(d("2025-06-15"));
    });
  });

  describe("weekly frequency", () => {
    it("advances by 7-day increments", () => {
      // stored: 2025-06-08 (7 days ago), today: 2025-06-15
      const result = nextRenewalDate("2025-06-08", "weekly", today);
      expect(result).toEqual(d("2025-06-15"));
    });

    it("advances past stored when stored is a few days ago", () => {
      // stored: 2025-06-12 (3 days ago) → next is 2025-06-19
      const result = nextRenewalDate("2025-06-12", "weekly", today);
      expect(result).toEqual(d("2025-06-19"));
    });
  });

  describe("fortnightly frequency", () => {
    it("advances by 14-day increments", () => {
      // stored: 2025-06-01 (14 days ago) → next is 2025-06-15
      const result = nextRenewalDate("2025-06-01", "fortnightly", today);
      expect(result).toEqual(d("2025-06-15"));
    });
  });

  describe("quarterly frequency", () => {
    it("advances by 3-month increments", () => {
      // stored: 2025-03-15 (3 months ago) → next is 2025-06-15
      const result = nextRenewalDate("2025-03-15", "quarterly", today);
      expect(result).toEqual(d("2025-06-15"));
    });
  });

  describe("yearly frequency", () => {
    it("advances by 1-year increments", () => {
      // stored: 2024-06-15 (1 year ago) → next is 2025-06-15
      const result = nextRenewalDate("2024-06-15", "yearly", today);
      expect(result).toEqual(d("2025-06-15"));
    });

    it("advances multiple years for an old date", () => {
      const result = nextRenewalDate("2022-01-01", "yearly", today);
      expect(result).toEqual(d("2026-01-01"));
    });
  });
});

describe("isRenewingSoon", () => {
  const today = d("2025-06-15");
  const alertDays = 7;

  it("returns true when renewal is today", () => {
    expect(isRenewingSoon(d("2025-06-15"), today, alertDays)).toBe(true);
  });

  it("returns true when renewal is within alertDays", () => {
    expect(isRenewingSoon(d("2025-06-20"), today, alertDays)).toBe(true);
    expect(isRenewingSoon(d("2025-06-22"), today, alertDays)).toBe(true);
  });

  it("returns false when renewal is beyond alertDays", () => {
    expect(isRenewingSoon(d("2025-06-23"), today, alertDays)).toBe(false);
    expect(isRenewingSoon(d("2025-07-01"), today, alertDays)).toBe(false);
  });

  it("returns true on the exact boundary day", () => {
    // today June 15 + 7 days = June 22 → should be renewing soon
    expect(isRenewingSoon(d("2025-06-22"), today, alertDays)).toBe(true);
  });

  it("handles alertDays = 0 (only today)", () => {
    expect(isRenewingSoon(d("2025-06-15"), today, 0)).toBe(true);
    expect(isRenewingSoon(d("2025-06-16"), today, 0)).toBe(false);
  });
});
