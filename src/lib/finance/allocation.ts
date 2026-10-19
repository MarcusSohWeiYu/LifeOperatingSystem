import type {
  IncomeRow,
  SubscriptionRow,
  BudgetRow,
} from "@/lib/sheets/schema";
import { toCents } from "./money";
import { toMonthlyCents } from "./frequency";

export type AllocationResult = {
  totalIncomeCents: number;
  subscriptionsCents: number;
  budgetCents: number;
  goalFundingCents: number;
  unallocatedCents: number;
  isOverAllocated: boolean;
};

/**
 * Build a full allocation breakdown.
 *
 * unallocated = monthly income − active subscriptions − budget − goalFundingCents
 *
 * Goals do NOT automatically affect allocation.
 * Pass goalFundingCents explicitly (e.g., sum of this-month contributions to goals).
 * All budget rows count equally as budgetCents regardless of goalId.
 */
export function buildAllocation(
  income: IncomeRow[],
  subscriptions: SubscriptionRow[],
  budget: BudgetRow[],
  goalFundingCents = 0
): AllocationResult {
  const totalIncomeCents = income
    .filter((r) => r.active)
    .reduce(
      (sum, r) => sum + toMonthlyCents(toCents(r.amount), r.frequency),
      0
    );

  const subscriptionsCents = subscriptions
    .filter((r) => r.active)
    .reduce(
      (sum, r) => sum + toMonthlyCents(toCents(r.amount), r.frequency),
      0
    );

  const budgetCents = budget.reduce(
    (sum, b) => sum + toCents(b.plannedMonthly),
    0
  );

  const unallocatedCents =
    totalIncomeCents - subscriptionsCents - budgetCents - goalFundingCents;

  return {
    totalIncomeCents,
    subscriptionsCents,
    budgetCents,
    goalFundingCents,
    unallocatedCents,
    isOverAllocated: unallocatedCents < 0,
  };
}
