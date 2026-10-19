"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PencilIcon,
  Trash2Icon,
  PiggyBankIcon,
  PlaneIcon,
  ShoppingBagIcon,
  CircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSGD } from "@/lib/finance/money";
import { removeGoalWithContributions } from "@/actions/goals";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { GoalForm } from "./goal-form";
import { ContributionForm } from "./contribution-form";
import { GoalChart } from "./goal-chart";
import { ContributionsList } from "./contributions-list";
import type { EnrichedGoal } from "./goals-client";
import type { EnrichedContribution } from "./contributions-list";
import type { GoalHealth } from "@/lib/finance/goals";

type Props = {
  goal: EnrichedGoal;
  contributions: EnrichedContribution[];
};

function TypeIcon({ type }: { type: EnrichedGoal["type"] }) {
  switch (type) {
    case "trip":
      return <PlaneIcon className="size-5 text-muted-foreground" />;
    case "purchase":
      return <ShoppingBagIcon className="size-5 text-muted-foreground" />;
    case "other":
      return <CircleIcon className="size-5 text-muted-foreground" />;
  }
}

function HealthBadge({ health }: { health: GoalHealth }) {
  if (health === "overdue") {
    return <Badge variant="destructive">Overdue</Badge>;
  }
  const map: Record<Exclude<GoalHealth, "overdue">, { label: string; cls: string }> = {
    reached: {
      label: "Reached",
      cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
    },
    "on-track": {
      label: "On track",
      cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
    },
    behind: {
      label: "Behind",
      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
    },
  };
  const { label, cls } = map[health];
  return (
    <Badge variant="outline" className={cls}>
      {label}
    </Badge>
  );
}

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
] as const;

function formatTargetDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${MONTHS[Number(parts[1]) - 1]} ${Number(parts[2])}, ${parts[0]}`;
}

export function GoalDetailClient({ goal, contributions }: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showContribute, setShowContribute] = useState(false);

  const isActive = goal.status === "active";

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl">
      {/* Back link */}
      <Link
        href="/finance/goals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Goals
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon type={goal.type} />
            <h1 className="text-xl font-semibold break-words">{goal.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {goal.type}
            </Badge>
            {isActive ? (
              <HealthBadge health={goal.health} />
            ) : (
              <Badge variant="outline" className="capitalize">
                {goal.status}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Priority {goal.priority} · Due {formatTargetDate(goal.targetDate)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setShowEdit(true)}
            aria-label="Edit goal"
          >
            <PencilIcon />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setShowDelete(true)}
            aria-label="Delete goal"
          >
            <Trash2Icon className="text-destructive" />
          </Button>
        </div>
      </div>

      {/* Progress summary card */}
      <div className="space-y-3 rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Saved</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatSGD(goal.savedCents)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Target</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatSGD(goal.targetCents)}
            </p>
          </div>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${goal.progress}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {goal.progress}% complete
          {isActive && goal.months > 0 && (
            <> · {goal.months} month{goal.months !== 1 ? "s" : ""} remaining</>
          )}
          {isActive && goal.months === 0 && " · Overdue"}
        </p>

        {isActive && goal.requiredMonthly > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">
              Needs {formatSGD(goal.requiredMonthly)}/mo to reach your target
            </p>
            {goal.contributedThisMonth > 0 ? (
              <p className={`text-sm tabular-nums ${
                goal.contributedThisMonth >= goal.requiredMonthly
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}>
                {formatSGD(goal.contributedThisMonth)} saved this month
                {goal.contributedThisMonth < goal.requiredMonthly && (
                  <> · {formatSGD(goal.requiredMonthly - goal.contributedThisMonth)} short</>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing saved this month — fund via Budget
              </p>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {goal.notes && (
        <div>
          <p className="text-sm font-medium">Notes</p>
          <p className="mt-1 text-sm text-muted-foreground">{goal.notes}</p>
        </div>
      )}

      {/* Chart */}
      <div>
        <p className="mb-3 text-sm font-medium">Savings progress</p>
        <GoalChart
          contributions={contributions.map((c) => ({
            date: c.date,
            amount: c.amount,
          }))}
          targetCents={goal.targetCents}
          targetDate={goal.targetDate}
        />
      </div>

      {/* Contributions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">
            Contributions ({contributions.length})
          </p>
          {isActive && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowContribute(true)}
            >
              <PiggyBankIcon />
              Add
            </Button>
          )}
        </div>
        <ContributionsList contributions={contributions} goalId={goal.id} />
      </div>

      {/* Dialogs */}
      <GoalForm
        open={showEdit}
        onOpenChange={setShowEdit}
        goal={goal}
      />

      <ContributionForm
        open={showContribute}
        onOpenChange={setShowContribute}
        goalId={goal.id}
      />

      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        name={goal.name}
        description={
          goal.contributionCount > 0
            ? `This will also delete ${goal.contributionCount} contribution${goal.contributionCount !== 1 ? "s" : ""}. This cannot be undone.`
            : undefined
        }
        onDelete={async () => {
          const result = await removeGoalWithContributions(goal.id);
          if (result.ok) router.push("/finance/goals");
          return result;
        }}
        successMessage={`"${goal.name}" deleted`}
      />
    </div>
  );
}
