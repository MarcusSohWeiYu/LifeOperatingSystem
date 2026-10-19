export const dynamic = "force-dynamic";

import { loadAll } from "@/lib/repos/index";
import { toCents } from "@/lib/finance/money";
import { buildAllocation } from "@/lib/finance/allocation";
import { BudgetClient } from "@/components/budget/budget-client";
import type { BudgetItem, GoalFundingEntry } from "@/components/budget/budget-client";
import type { AllocationData } from "@/components/allocation-strip";

export default async function BudgetPage() {
  const data = await loadAll();

  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth() + 1;

  // Build a goalId → goalName map
  const goalNameById = new Map(data.goals.map((g) => [g.id, g.name]));

  // This-month contributions to goals
  const thisMonthContribs = data.contributions.filter((c) => {
    const parts = c.date.split("-");
    return Number(parts[0]) === thisYear && Number(parts[1]) === thisMonth;
  });

  const goalFunding: GoalFundingEntry[] = thisMonthContribs.map((c) => ({
    contributionId: c.id,
    goalId: c.goalId,
    goalName: goalNameById.get(c.goalId) ?? c.goalId,
    amountCents: toCents(c.amount),
    date: c.date,
    note: c.note,
  }));

  const goalFundingCents = goalFunding.reduce((sum, e) => sum + e.amountCents, 0);

  const alloc = buildAllocation(
    data.income,
    data.subscriptions,
    data.budget,
    goalFundingCents
  );

  // Budget breakdown by type for allocation strip + 50/30/20 reference
  const needsCents = data.budget
    .filter((b) => b.type === "needs")
    .reduce((sum, b) => sum + toCents(b.plannedMonthly), 0);
  const wantsCents = data.budget
    .filter((b) => b.type === "wants")
    .reduce((sum, b) => sum + toCents(b.plannedMonthly), 0);
  const savingsCents = data.budget
    .filter((b) => b.type === "savings")
    .reduce((sum, b) => sum + toCents(b.plannedMonthly), 0);

  const allocation: AllocationData = {
    totalIncomeCents: alloc.totalIncomeCents,
    subscriptionsCents: alloc.subscriptionsCents,
    needsCents,
    wantsCents,
    savingsCents,
    goalFundingCents,
    unallocatedCents: alloc.unallocatedCents,
    isOverAllocated: alloc.isOverAllocated,
  };

  const budget: BudgetItem[] = data.budget.map((b) => ({
    ...b,
    goalName: b.goalId ? (goalNameById.get(b.goalId) ?? "") : "",
    planCents: toCents(b.plannedMonthly),
  }));

  // Active goals available to fund
  const availableGoals = data.goals
    .filter((g) => g.status === "active")
    .map((g) => ({ id: g.id, name: g.name }));

  return (
    <BudgetClient
      budget={budget}
      allocation={allocation}
      nwsSplit={{
        needsCents,
        wantsCents,
        savingsCents,
        totalIncomeCents: alloc.totalIncomeCents,
      }}
      availableGoals={availableGoals}
      goalFunding={goalFunding}
    />
  );
}
