"use client";
import { useTransition } from "react";
import Link from "next/link";
import {
  PencilIcon,
  Trash2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  PiggyBankIcon,
  CheckIcon,
  PlaneIcon,
  ShoppingBagIcon,
  CircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSGD } from "@/lib/finance/money";
import { swapGoalPriority, updateGoalStatus } from "@/actions/goals";
import type { EnrichedGoal } from "./goals-client";
import type { GoalHealth } from "@/lib/finance/goals";

type Props = {
  goal: EnrichedGoal;
  prevGoal?: { id: string; priority: number };
  nextGoal?: { id: string; priority: number };
  onEdit: () => void;
  onDelete: () => void;
  onContribute: () => void;
};

function TypeIcon({ type }: { type: EnrichedGoal["type"] }) {
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
  return `${MONTHS[Number(parts[1]) - 1]} ${parts[0]}`;
}

export function GoalCard({
  goal,
  prevGoal,
  nextGoal,
  onEdit,
  onDelete,
  onContribute,
}: Props) {
  const [movePending, startMoveTransition] = useTransition();
  const [completePending, startCompleteTransition] = useTransition();
  const isPending = movePending || completePending;
  const isActive = goal.status === "active";

  function handleMoveUp() {
    if (!prevGoal) return;
    startMoveTransition(async () => {
      const result = await swapGoalPriority(
        goal.id,
        goal.priority,
        prevGoal.id,
        prevGoal.priority
      );
      if (!result.ok) toast.error(result.error ?? "Failed to reorder");
    });
  }

  function handleMoveDown() {
    if (!nextGoal) return;
    startMoveTransition(async () => {
      const result = await swapGoalPriority(
        goal.id,
        goal.priority,
        nextGoal.id,
        nextGoal.priority
      );
      if (!result.ok) toast.error(result.error ?? "Failed to reorder");
    });
  }

  function handleMarkComplete() {
    startCompleteTransition(async () => {
      const result = await updateGoalStatus(goal.id, "completed");
      if (!result.ok) toast.error(result.error ?? "Failed to update");
      else toast.success(`"${goal.name}" marked as complete`);
    });
  }

  return (
    <article
      className={`space-y-3 rounded-xl border bg-card p-4 ring-1 ring-foreground/10 ${
        !isActive ? "opacity-70" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TypeIcon type={goal.type} />
          <h3 className="truncate font-semibold">{goal.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {goal.status !== "active" && (
            <Badge variant="secondary" className="capitalize">
              {goal.status}
            </Badge>
          )}
          {isActive && <HealthBadge health={goal.health} />}
        </div>
      </div>

      {/* Meta */}
      <p className="text-sm text-muted-foreground">
        {formatTargetDate(goal.targetDate)}
        {isActive && goal.months > 0 && (
          <> · {goal.months} month{goal.months !== 1 ? "s" : ""} left</>
        )}
        {isActive && goal.months === 0 && " · Overdue"}
        {" · "}Priority {goal.priority}
      </p>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Saved {formatSGD(goal.savedCents)}</span>
          <span>
            {goal.progress}% of {formatSGD(goal.targetCents)}
          </span>
        </div>
      </div>

      {/* Monthly saving needed + this month's contribution */}
      {isActive && goal.requiredMonthly > 0 && (
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-primary">
            Needs {formatSGD(goal.requiredMonthly)}/mo
          </p>
          {goal.contributedThisMonth > 0 ? (
            <p className={`text-xs tabular-nums ${
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
            <p className="text-xs text-muted-foreground">Nothing saved this month</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1 border-t pt-2">
        {/* Priority arrows */}
        {isActive && (
          <>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!prevGoal || isPending}
              onClick={handleMoveUp}
              aria-label="Move up in priority"
            >
              <ChevronUpIcon />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!nextGoal || isPending}
              onClick={handleMoveDown}
              aria-label="Move down in priority"
            >
              <ChevronDownIcon />
            </Button>
            <div className="mx-1 h-4 w-px bg-border" />
          </>
        )}

        {/* Contribute */}
        {isActive && goal.health !== "reached" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onContribute}
            disabled={isPending}
          >
            <PiggyBankIcon />
            Save
          </Button>
        )}

        {/* Mark complete */}
        {isActive && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleMarkComplete}
            disabled={isPending}
            aria-label="Mark as complete"
          >
            <CheckIcon />
          </Button>
        )}

        {/* Edit */}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onEdit}
          disabled={isPending}
          aria-label="Edit"
        >
          <PencilIcon />
        </Button>

        {/* Delete */}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onDelete}
          disabled={isPending}
          aria-label="Delete"
        >
          <Trash2Icon className="text-destructive" />
        </Button>

        {/* View detail */}
        <Link
          href={`/finance/goals/${goal.id}`}
          className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Details →
        </Link>
      </div>
    </article>
  );
}
