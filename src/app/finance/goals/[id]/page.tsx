export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { loadAll } from "@/lib/repos/index";
import { toCents } from "@/lib/finance/money";
import {
  monthsRemaining,
  requiredMonthlyCents,
  contributedThisMonthCents,
  goalHealth,
  progressPercent,
} from "@/lib/finance/goals";
import { GoalDetailClient } from "@/components/goals/goal-detail-client";
import type { EnrichedGoal } from "@/components/goals/goals-client";
import type { EnrichedContribution } from "@/components/goals/contributions-list";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadAll();
  const today = new Date();

  const goalRow = data.goals.find((g) => g.id === id);
  if (!goalRow) notFound();

  const contribs = data.contributions.filter((c) => c.goalId === id);
  const targetCents = toCents(goalRow.targetAmount);
  const savedCents = contribs.reduce((sum, c) => sum + toCents(c.amount), 0);
  const months = monthsRemaining(goalRow.targetDate, today);
  const reqMonthly = requiredMonthlyCents(targetCents, savedCents, months);
  const thisMonth = contributedThisMonthCents(contribs, today);
  const health = goalHealth(
    targetCents,
    savedCents,
    reqMonthly,
    thisMonth,
    goalRow.targetDate,
    today
  );
  const progress = progressPercent(savedCents, targetCents);

  const goal: EnrichedGoal = {
    ...goalRow,
    targetCents,
    savedCents,
    contributionCount: contribs.length,
    months,
    requiredMonthly: reqMonthly,
    contributedThisMonth: thisMonth,
    health,
    progress,
  };

  const enrichedContributions: EnrichedContribution[] = contribs.map((c) => ({
    ...c,
    amountCents: toCents(c.amount),
  }));

  return <GoalDetailClient goal={goal} contributions={enrichedContributions} />;
}
