import { describe, it, expect } from "vitest";
import type {
  IncomeRow,
  SubscriptionRow,
  BudgetRow,
} from "@/lib/sheets/schema";
import { buildAllocation } from "./allocation";

function makeIncome(overrides: Partial<IncomeRow> = {}): IncomeRow {
  return {
    id: "i1",
    name: "Salary",
    amount: 5000,
    frequency: "monthly",
    active: true,
    notes: "",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function makeSub(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: "s1",
    name: "Netflix",
    amount: 10,
    frequency: "monthly",
    category: "entertainment",
    nextRenewal: "2025-07-01",
    paymentMethod: "card",
    active: true,
    notes: "",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function makeBudget(overrides: Partial<BudgetRow> = {}): BudgetRow {
  return {
    id: "b1",
    category: "Groceries",
    plannedMonthly: 500,
    type: "needs",
    notes: "",
    goalId: "",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("buildAllocation", () => {
  describe("basic allocation", () => {
    it("computes totals correctly", () => {
      const result = buildAllocation(
        [makeIncome({ amount: 5000 })],
        [makeSub({ amount: 10 })],
        [makeBudget({ plannedMonthly: 500 })]
      );
      expect(result.totalIncomeCents).toBe(500000);
      expect(result.subscriptionsCents).toBe(1000);
      expect(result.budgetCents).toBe(50000);
      expect(result.goalFundingCents).toBe(0);
      // 500000 - 1000 - 50000 = 449000
      expect(result.unallocatedCents).toBe(449000);
      expect(result.isOverAllocated).toBe(false);
    });

    it("goals do not affect allocation", () => {
      // No goals param — goals never auto-affect allocation
      const result = buildAllocation(
        [makeIncome({ amount: 5000 })],
        [],
        []
      );
      expect(result.totalIncomeCents).toBe(500000);
      expect(result.goalFundingCents).toBe(0);
      expect(result.unallocatedCents).toBe(500000);
    });

    it("all budget rows count as budgetCents regardless of goalId", () => {
      const result = buildAllocation(
        [makeIncome({ amount: 5000 })],
        [],
        [
          makeBudget({ id: "b1", plannedMonthly: 500, goalId: "" }),
          makeBudget({ id: "b2", plannedMonthly: 200, goalId: "goal-1" }),
        ]
      );
      expect(result.budgetCents).toBe(70000); // both rows included
      expect(result.goalFundingCents).toBe(0);
      expect(result.unallocatedCents).toBe(500000 - 70000);
    });
  });

  describe("goal funding cents parameter", () => {
    it("subtracts goalFundingCents from unallocated", () => {
      const result = buildAllocation(
        [makeIncome({ amount: 5000 })],
        [],
        [makeBudget({ plannedMonthly: 500 })],
        20000 // e.g. $200 contributed to goals this month
      );
      expect(result.budgetCents).toBe(50000);
      expect(result.goalFundingCents).toBe(20000);
      expect(result.unallocatedCents).toBe(500000 - 50000 - 20000);
    });

    it("multiple goal contributions sum correctly", () => {
      const result = buildAllocation(
        [makeIncome({ amount: 5000 })],
        [],
        [],
        50000 // $500 total contributions this month
      );
      expect(result.goalFundingCents).toBe(50000);
      expect(result.unallocatedCents).toBe(450000);
    });
  });

  describe("inactive income and subscriptions", () => {
    it("excludes inactive income", () => {
      const result = buildAllocation(
        [
          makeIncome({ id: "i1", amount: 5000, active: true }),
          makeIncome({ id: "i2", amount: 1000, active: false }),
        ],
        [],
        []
      );
      expect(result.totalIncomeCents).toBe(500000);
    });

    it("excludes inactive subscriptions", () => {
      const result = buildAllocation(
        [makeIncome({ amount: 5000 })],
        [
          makeSub({ id: "s1", amount: 10, active: true }),
          makeSub({ id: "s2", amount: 20, active: false }),
        ],
        []
      );
      expect(result.subscriptionsCents).toBe(1000);
    });
  });

  describe("over-allocated scenario", () => {
    it("marks isOverAllocated when spending exceeds income", () => {
      const result = buildAllocation(
        [makeIncome({ amount: 1000 })],
        [makeSub({ amount: 200 })],
        [makeBudget({ plannedMonthly: 900 })]
      );
      expect(result.isOverAllocated).toBe(true);
      expect(result.unallocatedCents).toBeLessThan(0);
    });

    it("marks isOverAllocated when goal funding tips the balance", () => {
      const result = buildAllocation(
        [makeIncome({ amount: 1000 })],
        [],
        [makeBudget({ plannedMonthly: 800 })],
        30000 // $300 goal contributions
      );
      // 100000 - 80000 - 30000 = -10000
      expect(result.isOverAllocated).toBe(true);
      expect(result.unallocatedCents).toBe(-10000);
    });
  });

  describe("non-monthly frequencies", () => {
    it("normalises weekly income to monthly", () => {
      // $1000/week → $1000 * 52/12 = ~$4333.33 → 433333 cents
      const result = buildAllocation(
        [makeIncome({ amount: 1000, frequency: "weekly" })],
        [],
        []
      );
      expect(result.totalIncomeCents).toBe(433333);
    });

    it("normalises yearly subscription to monthly", () => {
      // $120/year → $10/month = 1000 cents
      const result = buildAllocation(
        [makeIncome({ amount: 5000 })],
        [makeSub({ amount: 120, frequency: "yearly" })],
        []
      );
      expect(result.subscriptionsCents).toBe(1000);
    });
  });
});
