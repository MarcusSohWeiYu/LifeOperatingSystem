export const dynamic = "force-dynamic";

import { loadAll } from "@/lib/repos/index";
import { toCents } from "@/lib/finance/money";
import { toMonthlyCents } from "@/lib/finance/frequency";
import { PlannerClient } from "@/components/planner/planner-client";
import type { PlanBaseline } from "@/components/planner/planner-client";

export default async function PlannerPage() {
  const data = await loadAll();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Sum contributions per goal (saved cents)
  const savedByGoal: Record<string, number> = {};
  for (const c of data.contributions) {
    savedByGoal[c.goalId] = (savedByGoal[c.goalId] ?? 0) + toCents(c.amount);
  }

  // Total monthly income from all active sources
  const incomeCents = data.income
    .filter((r) => r.active)
    .reduce(
      (sum, r) => sum + toMonthlyCents(toCents(r.amount), r.frequency),
      0
    );

  const baseline: PlanBaseline = {
    incomeCents,
    subscriptions: data.subscriptions.map((s) => ({
      id: s.id,
      name: s.name,
      monthlyCents: toMonthlyCents(toCents(s.amount), s.frequency),
      active: s.active,
    })),
    budget: data.budget.map((b) => ({
      id: b.id,
      category: b.category,
      monthlyCents: toCents(b.plannedMonthly),
      type: b.type,
      goalId: b.goalId,
    })),
    goals: data.goals
      .filter((g) => g.status === "active")
      .sort((a, b) =>
        a.priority !== b.priority
          ? a.priority - b.priority
          : a.targetDate.localeCompare(b.targetDate)
      )
      .map((g) => ({
        id: g.id,
        name: g.name,
        type: g.type,
        targetCents: toCents(g.targetAmount),
        targetDate: g.targetDate,
        savedCents: savedByGoal[g.id] ?? 0,
        priority: g.priority,
      })),
    today: todayStr,
  };

  return <PlannerClient baseline={baseline} />;
}
