import { describe, it, expect } from "vitest";
import type { ContributionRow } from "@/lib/sheets/schema";
import {
  monthsRemaining,
  requiredMonthlyCents,
  contributedThisMonthCents,
  goalHealth,
  progressPercent,
  earliestAffordableDate,
} from "./goals";

function d(dateStr: string): Date {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, day!);
}

function makeContribution(
  overrides: Partial<ContributionRow> = {}
): ContributionRow {
  return {
    id: "c1",
    goalId: "g1",
    amount: 0,
    date: "2025-01-15",
    note: "",
    createdAt: "2025-01-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("monthsRemaining", () => {
  const today = d("2025-06-15");

  it("returns correct months for a future date in the same year", () => {
    expect(monthsRemaining("2025-12-01", today)).toBe(6);
    expect(monthsRemaining("2025-07-01", today)).toBe(1);
  });

  it("returns correct months across years", () => {
    // (2026 - 2025) * 12 + (1 - 6) = 12 - 5 = 7
    expect(monthsRemaining("2026-01-15", today)).toBe(7);
    // (2027 - 2025) * 12 + (6 - 6) = 24
    expect(monthsRemaining("2027-06-01", today)).toBe(24);
  });

  it("returns 1 when target is the current month but later in the month", () => {
    // same month, later day → formula = 0, but target is not past → min 1
    expect(monthsRemaining("2025-06-30", today)).toBe(1);
  });

  it("returns 1 when target is today", () => {
    expect(monthsRemaining("2025-06-15", today)).toBe(1);
  });

  it("returns 1 when target is tomorrow", () => {
    expect(monthsRemaining("2025-06-16", today)).toBe(1);
  });

  it("returns 0 when target date is in the past (overdue)", () => {
    expect(monthsRemaining("2025-06-14", today)).toBe(0);
    expect(monthsRemaining("2025-05-01", today)).toBe(0);
    expect(monthsRemaining("2024-01-01", today)).toBe(0);
  });

  it("returns 0 for a date exactly at start of previous month", () => {
    expect(monthsRemaining("2025-05-15", today)).toBe(0);
  });
});

describe("requiredMonthlyCents", () => {
  it("divides remaining by months and rounds up", () => {
    // (5000 - 0) / 5 = 1000 exactly
    expect(requiredMonthlyCents(5000, 0, 5)).toBe(1000);
    // (1001 - 0) / 5 = 200.2 → ceil → 201
    expect(requiredMonthlyCents(1001, 0, 5)).toBe(201);
    // (1000 - 1) / 3 = 333 → ceil → 333
    expect(requiredMonthlyCents(1000, 1, 3)).toBe(333);
    // (1000 - 2) / 3 = 332.67 → ceil → 333
    expect(requiredMonthlyCents(1000, 2, 3)).toBe(333);
    // (1000 - 3) / 3 = 332.33 → ceil → 333
    expect(requiredMonthlyCents(1000, 3, 3)).toBe(333);
    // (1000 - 4) / 3 = 332.0 → ceil → 332
    expect(requiredMonthlyCents(1000, 4, 3)).toBe(332);
  });

  it("returns 0 when already reached (saved >= target)", () => {
    expect(requiredMonthlyCents(1000, 1000, 5)).toBe(0);
    expect(requiredMonthlyCents(1000, 1500, 5)).toBe(0);
  });

  it("returns 0 when months === 0 (overdue)", () => {
    expect(requiredMonthlyCents(5000, 1000, 0)).toBe(0);
  });
});

describe("contributedThisMonthCents", () => {
  const today = d("2025-06-15");

  it("sums contributions in the current month", () => {
    const contributions = [
      makeContribution({ amount: 100, date: "2025-06-01" }),
      makeContribution({ amount: 50, date: "2025-06-10" }),
    ];
    expect(contributedThisMonthCents(contributions, today)).toBe(15000);
  });

  it("excludes contributions from other months", () => {
    const contributions = [
      makeContribution({ amount: 100, date: "2025-05-01" }),
      makeContribution({ amount: 100, date: "2025-07-01" }),
      makeContribution({ amount: 50, date: "2024-06-15" }),
    ];
    expect(contributedThisMonthCents(contributions, today)).toBe(0);
  });

  it("returns 0 for empty contributions", () => {
    expect(contributedThisMonthCents([], today)).toBe(0);
  });

  it("handles mixed months", () => {
    const contributions = [
      makeContribution({ amount: 200, date: "2025-06-05" }),
      makeContribution({ amount: 100, date: "2025-05-30" }),
      makeContribution({ amount: 75, date: "2025-06-14" }),
    ];
    // 200 + 75 = 275 dollars = 27500 cents
    expect(contributedThisMonthCents(contributions, today)).toBe(27500);
  });
});

describe("goalHealth", () => {
  const today = d("2025-06-15");

  it("returns 'reached' when saved >= target", () => {
    expect(goalHealth(10000, 10000, 500, 0, "2025-12-01", today)).toBe(
      "reached"
    );
    expect(goalHealth(10000, 12000, 500, 0, "2025-12-01", today)).toBe(
      "reached"
    );
  });

  it("returns 'overdue' when target is in the past and not reached", () => {
    expect(goalHealth(10000, 5000, 0, 0, "2025-06-01", today)).toBe("overdue");
    expect(goalHealth(10000, 0, 0, 0, "2024-01-01", today)).toBe("overdue");
  });

  it("returns 'on-track' when contributions this month >= required", () => {
    expect(goalHealth(10000, 5000, 500, 500, "2025-12-01", today)).toBe(
      "on-track"
    );
    expect(goalHealth(10000, 5000, 500, 600, "2025-12-01", today)).toBe(
      "on-track"
    );
  });

  it("returns 'behind' when contributions this month < required", () => {
    expect(goalHealth(10000, 5000, 500, 400, "2025-12-01", today)).toBe(
      "behind"
    );
    expect(goalHealth(10000, 5000, 500, 0, "2025-12-01", today)).toBe("behind");
  });

  it("reached takes priority over overdue", () => {
    // saved >= target even though date is past
    expect(goalHealth(10000, 10000, 0, 0, "2025-01-01", today)).toBe("reached");
  });
});

describe("progressPercent", () => {
  it("returns 0 when nothing saved", () => {
    expect(progressPercent(0, 10000)).toBe(0);
  });

  it("returns 50 at half-way", () => {
    expect(progressPercent(5000, 10000)).toBe(50);
  });

  it("returns 100 when fully saved", () => {
    expect(progressPercent(10000, 10000)).toBe(100);
  });

  it("caps at 100 when over-saved", () => {
    expect(progressPercent(12000, 10000)).toBe(100);
  });

  it("returns 100 when target is 0", () => {
    expect(progressPercent(0, 0)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    // 1 / 3 = 33.33 → 33
    expect(progressPercent(1, 3)).toBe(33);
    // 2 / 3 = 66.67 → 67
    expect(progressPercent(2, 3)).toBe(67);
  });
});

describe("earliestAffordableDate", () => {
  const today = d("2025-06-15");

  it("returns null when monthlySavings is 0", () => {
    expect(earliestAffordableDate(10000, 0, 0, today)).toBeNull();
  });

  it("returns null when monthlySavings is negative", () => {
    expect(earliestAffordableDate(10000, 0, -100, today)).toBeNull();
  });

  it("returns today when already reached", () => {
    expect(earliestAffordableDate(10000, 10000, 500, today)).toBe("2025-06-15");
    expect(earliestAffordableDate(10000, 12000, 500, today)).toBe("2025-06-15");
  });

  it("returns 1st of correct month for exact division", () => {
    // need 10000 cents, saving 2000/mo → 5 months from June = November
    // getMonth() for June = 5, 5 + 5 = 10, floor(10/12) = 0 year, (10 % 12) + 1 = 11 = Nov
    expect(earliestAffordableDate(10000, 0, 2000, today)).toBe("2025-11-01");
  });

  it("rounds up months when not exact", () => {
    // need 10001 cents, saving 2000/mo → ceil(10001/2000) = 6 months → Dec
    expect(earliestAffordableDate(10001, 0, 2000, today)).toBe("2025-12-01");
  });

  it("handles year rollover", () => {
    // need 100000 cents, saving 5000/mo → 20 months from June 2025
    // getMonth() = 5, 5 + 20 = 25, floor(25/12) = 2 years → 2027, (25 % 12) + 1 = 2 = Feb
    expect(earliestAffordableDate(100000, 0, 5000, today)).toBe("2027-02-01");
  });

  it("accounts for amount already saved", () => {
    // need 10000, saved 4000 → remaining 6000, saving 3000/mo → 2 months → Aug
    expect(earliestAffordableDate(10000, 4000, 3000, today)).toBe("2025-08-01");
  });
});
