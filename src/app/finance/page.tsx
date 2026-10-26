export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  PlaneIcon,
  ShoppingBagIcon,
  CircleIcon,
  RefreshCwIcon,
  FlagIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { loadAll } from "@/lib/repos/index";
import { toCents, formatSGD } from "@/lib/finance/money";
import { toMonthlyCents } from "@/lib/finance/frequency";
import { nextRenewalDate, isRenewingSoon } from "@/lib/finance/renewals";
import {
  monthsRemaining,
  requiredMonthlyCents,
  contributedThisMonthCents,
  goalHealth,
  progressPercent,
} from "@/lib/finance/goals";
import { buildAllocation } from "@/lib/finance/allocation";
import { AllocationStrip } from "@/components/allocation-strip";
import type { AllocationData } from "@/components/allocation-strip";
import type { GoalHealth } from "@/lib/finance/goals";
import type { ContributionRow } from "@/lib/sheets/schema";

// ── Types ────────────────────────────────────────────────────────────────

type AllocSummary = {
  totalIncomeCents: number;
  subscriptionsCents: number;
  goalFundingCents: number;
  unallocatedCents: number;
  isOverAllocated: boolean;
};

type DashGoal = {
  id: string;
  name: string;
  type: "trip" | "purchase" | "other";
  targetDate: string;
  targetCents: number;
  savedCents: number;
  months: number;
  requiredMonthly: number;
  health: GoalHealth;
  progress: number;
  priority: number;
};

type TimelineItem = {
  id: string;
  date: Date;
  label: string;
  sub: string;
  kind: "renewal" | "goal-deadline";
  href: string;
  isHighlighted: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Sun","Mon","Tue","Wed","Thu","Fri","Sat",
] as const;
const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
] as const;

function parseLocalDate(s: string): Date {
  const parts = s.split("-");
  const y = Number(parts[0] ?? "0");
  const m = Number(parts[1] ?? "0");
  const d = Number(parts[2] ?? "1");
  return new Date(y, m - 1, d);
}

function fmtDate(date: Date): string {
  const dayName = DAY_NAMES[date.getDay()] ?? "";
  const monthName = MONTH_NAMES[date.getMonth()] ?? "";
  return `${dayName}, ${monthName} ${date.getDate()}`;
}

function headlineText(alloc: AllocSummary): string {
  if (alloc.unallocatedCents === 0) return "Every dollar has a job.";
  if (!alloc.isOverAllocated)
    return `${formatSGD(alloc.unallocatedCents)} left to assign.`;
  return `Over-allocated by ${formatSGD(Math.abs(alloc.unallocatedCents))}.`;
}

// ── Sub-components (server-side, no hooks) ──────────────────────────────

function HealthBadge({ health }: { health: GoalHealth }) {
  const map: Record<GoalHealth, { label: string; cls: string }> = {
    reached: {
      label: "Reached",
      cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    },
    "on-track": {
      label: "On track",
      cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    },
    behind: {
      label: "Behind",
      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    },
    overdue: { label: "Overdue", cls: "bg-destructive/10 text-destructive" },
  };
  const { label, cls } = map[health];
  return (
    <span
      className={`inline-flex items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function GoalTypeIcon({ type }: { type: DashGoal["type"] }) {
  switch (type) {
    case "trip":
      return <PlaneIcon className="size-4 shrink-0 text-muted-foreground" />;
    case "purchase":
      return (
        <ShoppingBagIcon className="size-4 shrink-0 text-muted-foreground" />
      );
    case "other":
      return <CircleIcon className="size-4 shrink-0 text-muted-foreground" />;
  }
}

function DashGoalCard({ goal }: { goal: DashGoal }) {
  return (
    <Link
      href={`/finance/goals/${goal.id}`}
      className="block space-y-2 rounded-xl border bg-card p-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <GoalTypeIcon type={goal.type} />
          <p className="truncate font-medium">{goal.name}</p>
        </div>
        <HealthBadge health={goal.health} />
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${goal.progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{goal.progress}% saved</span>
        <span className="flex items-center gap-2">
          {goal.requiredMonthly > 0 && (
            <span className="font-medium text-primary">
              Save {formatSGD(goal.requiredMonthly)}/mo
            </span>
          )}
          {goal.months > 0 && <span>{goal.months}mo left</span>}
        </span>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await loadAll();

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[Dashboard] Single loadAll() batchGet —",
      `income: ${data.income.length},`,
      `subs: ${data.subscriptions.length},`,
      `budget: ${data.budget.length},`,
      `goals: ${data.goals.length},`,
      `contributions: ${data.contributions.length}`
    );
  }

  const today = new Date();
  const alertDays =
    parseInt(data.settings["renewalAlertDays"] ?? "7", 10) || 7;

  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth() + 1;

  // Group contributions by goal
  const contribsByGoal: Record<string, ContributionRow[]> = {};
  for (const c of data.contributions) {
    (contribsByGoal[c.goalId] ??= []).push(c);
  }

  // This-month contributions per goal (cents)
  const goalFundedThisMonth = new Map<string, number>();
  for (const c of data.contributions) {
    const parts = c.date.split("-");
    if (Number(parts[0]) === thisYear && Number(parts[1]) === thisMonth) {
      goalFundedThisMonth.set(
        c.goalId,
        (goalFundedThisMonth.get(c.goalId) ?? 0) + toCents(c.amount)
      );
    }
  }
  const totalGoalFundingCents = Array.from(goalFundedThisMonth.values()).reduce(
    (sum, v) => sum + v,
    0
  );

  // Allocation
  const alloc = buildAllocation(
    data.income,
    data.subscriptions,
    data.budget,
    totalGoalFundingCents
  );

  // Budget breakdown for AllocationStrip
  const needsCents = data.budget
    .filter((b) => b.type === "needs")
    .reduce((s, b) => s + toCents(b.plannedMonthly), 0);
  const wantsCents = data.budget
    .filter((b) => b.type === "wants")
    .reduce((s, b) => s + toCents(b.plannedMonthly), 0);
  const savingsCents = data.budget
    .filter((b) => b.type === "savings")
    .reduce((s, b) => s + toCents(b.plannedMonthly), 0);

  const allocationData: AllocationData = {
    totalIncomeCents: alloc.totalIncomeCents,
    subscriptionsCents: alloc.subscriptionsCents,
    needsCents,
    wantsCents,
    savingsCents,
    goalFundingCents: totalGoalFundingCents,
    unallocatedCents: alloc.unallocatedCents,
    isOverAllocated: alloc.isOverAllocated,
  };

  // Enriched active goals sorted by priority
  const activeGoals: DashGoal[] = data.goals
    .filter((g) => g.status === "active")
    .sort((a, b) =>
      a.priority !== b.priority
        ? a.priority - b.priority
        : a.targetDate.localeCompare(b.targetDate)
    )
    .map((g) => {
      const contribs = contribsByGoal[g.id] ?? [];
      const targetCents = toCents(g.targetAmount);
      const savedCents = contribs.reduce(
        (s, c) => s + toCents(c.amount),
        0
      );
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
        id: g.id,
        name: g.name,
        type: g.type,
        targetDate: g.targetDate,
        targetCents,
        savedCents,
        months,
        requiredMonthly: reqMonthly,
        health,
        progress,
        priority: g.priority,
      };
    });

  const top3Goals = activeGoals.slice(0, 3);
  const hiddenWarnings = activeGoals
    .filter(
      (g) =>
        (g.health === "behind" || g.health === "overdue") &&
        !top3Goals.some((t) => t.id === g.id)
    );

  // Next 5 subscription renewals
  const next5Renewals = data.subscriptions
    .filter((s) => s.active)
    .map((s) => {
      const date = nextRenewalDate(s.nextRenewal, s.frequency, today);
      return {
        id: s.id,
        name: s.name,
        date,
        monthlyCents: toMonthlyCents(toCents(s.amount), s.frequency),
        renewingSoon: isRenewingSoon(date, today, alertDays),
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  // Coming up — events in the next 90 days
  const deadline90 = new Date(today);
  deadline90.setDate(deadline90.getDate() + 90);

  const timelineItems: TimelineItem[] = [];

  for (const s of data.subscriptions.filter((s) => s.active)) {
    const date = nextRenewalDate(s.nextRenewal, s.frequency, today);
    if (date <= deadline90) {
      timelineItems.push({
        id: `renewal-${s.id}`,
        date,
        label: s.name,
        sub: `${formatSGD(toMonthlyCents(toCents(s.amount), s.frequency))}/mo · renewal`,
        kind: "renewal",
        href: "/finance/subscriptions",
        isHighlighted: isRenewingSoon(date, today, alertDays),
      });
    }
  }

  for (const ag of activeGoals) {
    const date = parseLocalDate(ag.targetDate);
    if (date <= deadline90) {
      timelineItems.push({
        id: `goal-${ag.id}`,
        date,
        label: ag.name,
        sub: "goal target date",
        kind: "goal-deadline",
        href: `/finance/goals/${ag.id}`,
        isHighlighted: ag.health === "behind" || ag.health === "overdue",
      });
    }
  }

  timelineItems.sort((a, b) => a.date.getTime() - b.date.getTime());

  const allocSummary: AllocSummary = alloc;
  const headline = headlineText(allocSummary);
  const unallocatedColor =
    alloc.unallocatedCents === 0
      ? "text-emerald-600 dark:text-emerald-400"
      : alloc.isOverAllocated
      ? "text-destructive"
      : "";

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 1. Headline */}
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">This month&apos;s plan</h1>

        <div className="flex flex-wrap gap-3">
          <div className="inline-block rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Monthly income</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatSGD(alloc.totalIncomeCents)}
            </p>
          </div>
          <div className="inline-block rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Unallocated</p>
            <p
              className={`mt-1 text-2xl font-semibold tabular-nums ${unallocatedColor}`}
            >
              {alloc.isOverAllocated && "−"}
              {formatSGD(Math.abs(alloc.unallocatedCents))}
            </p>
          </div>
        </div>

        <p className={`text-sm font-medium ${unallocatedColor || "text-muted-foreground"}`}>
          {headline}
        </p>
      </section>

      {/* 2. Allocation strip */}
      <AllocationStrip data={allocationData} />

      {/* 3. Goals + Subscriptions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Goals */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Active goals</h2>
            <Link
              href="/finance/goals"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </div>

          {activeGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active goals.{" "}
              <Link href="/finance/goals" className="underline underline-offset-2">
                Add one →
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {top3Goals.map((goal) => (
                <DashGoalCard key={goal.id} goal={goal} />
              ))}
              {hiddenWarnings.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangleIcon className="size-3.5 shrink-0" />
                  {hiddenWarnings.length} more goal
                  {hiddenWarnings.length !== 1 ? "s" : ""} need attention.{" "}
                  <Link
                    href="/finance/goals"
                    className="underline underline-offset-2"
                  >
                    View all
                  </Link>
                </p>
              )}
            </div>
          )}
        </section>

        {/* Subscriptions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Subscriptions</h2>
            <Link
              href="/finance/subscriptions"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </div>

          <div className="inline-block rounded-xl border bg-card p-3 ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">Monthly total</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">
              {formatSGD(alloc.subscriptionsCents)}
            </p>
          </div>

          {next5Renewals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active subscriptions.
            </p>
          ) : (
            <div className="divide-y rounded-xl border">
              {next5Renewals.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <RefreshCwIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      {r.renewingSoon && (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="pl-5 text-xs text-muted-foreground">
                      {fmtDate(r.date)}
                    </p>
                  </div>
                  <p className="shrink-0 tabular-nums text-sm">
                    {formatSGD(r.monthlyCents)}/mo
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 4. Goal funding summary (this month) */}
      {activeGoals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Goal funding this month</h2>
            <Link
              href="/finance/budget"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Fund in Budget →
            </Link>
          </div>
          <div className="divide-y rounded-xl border">
            {activeGoals.map((goal) => {
              const funded = goalFundedThisMonth.get(goal.id) ?? 0;
              return (
                <Link
                  key={goal.id}
                  href={`/finance/goals/${goal.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30 first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <GoalTypeIcon type={goal.type} />
                    <p className="truncate text-sm font-medium">{goal.name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {funded > 0 ? (
                      <>
                        <p className="text-sm tabular-nums text-indigo-600 dark:text-indigo-400">
                          {formatSGD(funded)} saved
                        </p>
                        {goal.requiredMonthly > 0 && (
                          <p className={`text-xs tabular-nums ${
                            funded >= goal.requiredMonthly
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}>
                            {funded >= goal.requiredMonthly
                              ? "on track"
                              : `needs ${formatSGD(goal.requiredMonthly)}/mo`}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {goal.requiredMonthly > 0
                          ? `needs ${formatSGD(goal.requiredMonthly)}/mo · not funded`
                          : "not funded"}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Coming up (next 90 days) */}
      {timelineItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium">Coming up (next 90 days)</h2>
          <div className="divide-y rounded-xl border">
            {timelineItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {item.kind === "renewal" ? (
                    <RefreshCwIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <FlagIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-medium ${
                        item.isHighlighted
                          ? "text-amber-700 dark:text-amber-400"
                          : ""
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
                <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {fmtDate(item.date)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
