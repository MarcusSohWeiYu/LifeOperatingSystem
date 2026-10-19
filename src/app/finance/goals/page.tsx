export const dynamic = "force-dynamic";

import { loadAll } from "@/lib/repos/index";
import { toCents } from "@/lib/finance/money";
import {
  monthsRemaining,
  requiredMonthlyCents,
  contributedThisMonthCents,
  goalHealth,
  progressPercent,
} from "@/lib/finance/goals";
import { GoalsClient } from "@/components/goals/goals-client";
import type { EnrichedGoal } from "@/components/goals/goals-client";
import type { ContributionRow } from "@/lib/sheets/schema";

export default async function GoalsPage() {
  const data = await loadAll();
  const today = new Date();

  const contribsByGoal: Record<string, ContributionRow[]> = {};
  for (const c of data.contributions) {
    (contribsByGoal[c.goalId] ??= []).push(c);
  }

  const goals: EnrichedGoal[] = data.goals.map((g) => {
    const contribs = contribsByGoal[g.id] ?? [];
    const targetCents = toCents(g.targetAmount);
    const savedCents = contribs.reduce((sum, c) => sum + toCents(c.amount), 0);
    const months = monthsRemaining(g.targetDate, today);
    const reqMonthly = requiredMonthlyCents(targetCents, savedCents, months);
    const thisMonth = contributedThisMonthCents(contribs, today);
    const health = goalHealth(
      targetCents,
      savedCents,
      reqMonthly,
      thisMonth,
      g.targetDate,
      today
    );
    const progress = progressPercent(savedCents, targetCents);

    return {
      ...g,
      targetCents,
      savedCents,
      contributionCount: contribs.length,
      months,
      requiredMonthly: reqMonthly,
      contributedThisMonth: thisMonth,
      health,
      progress,
    };
  });

  return <GoalsClient goals={goals} />;
}
