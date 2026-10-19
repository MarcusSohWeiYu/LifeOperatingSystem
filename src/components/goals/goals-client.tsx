"use client";
import { useState, useMemo } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSGD } from "@/lib/finance/money";
import { removeGoalWithContributions } from "@/actions/goals";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { GoalForm } from "./goal-form";
import { ContributionForm } from "./contribution-form";
import { GoalCard } from "./goal-card";
import type { GoalHealth } from "@/lib/finance/goals";

export type EnrichedGoal = {
  id: string;
  name: string;
  type: "trip" | "purchase" | "other";
  targetAmount: number;
  targetDate: string;
  priority: number;
  status: "active" | "completed" | "cancelled";
  notes: string;
  createdAt: string;
  updatedAt: string;
  targetCents: number;
  savedCents: number;
  contributionCount: number;
  months: number;
  requiredMonthly: number;
  contributedThisMonth: number;
  health: GoalHealth;
  progress: number;
};

type Props = { goals: EnrichedGoal[] };

type StatusFilter = "all" | "active" | "completed" | "cancelled";
type TypeFilter = "all" | "trip" | "purchase" | "other";

type DialogState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; goal: EnrichedGoal }
  | { type: "delete"; goal: EnrichedGoal }
  | { type: "contribute"; goalId: string };

const STATUS_FILTERS: StatusFilter[] = ["all", "active", "completed", "cancelled"];
const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "trip", label: "Trips" },
  { value: "purchase", label: "Purchases" },
  { value: "other", label: "Other" },
];

export function GoalsClient({ goals }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const activeGoalsByPriority = useMemo(
    () =>
      goals
        .filter((g) => g.status === "active")
        .sort((a, b) => a.priority - b.priority),
    [goals]
  );

  const filtered = useMemo(() => {
    const byStatus =
      statusFilter === "all"
        ? goals
        : goals.filter((g) => g.status === statusFilter);
    const byType =
      typeFilter === "all"
        ? byStatus
        : byStatus.filter((g) => g.type === typeFilter);
    return [...byType].sort((a, b) => {
      // Active goals first, sorted by priority
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      if (a.status === "active" && b.status === "active")
        return a.priority - b.priority;
      // Others: most recent target date first
      return b.targetDate.localeCompare(a.targetDate);
    });
  }, [goals, statusFilter, typeFilter]);

  const totalRequiredMonthly = useMemo(
    () =>
      goals
        .filter((g) => g.status === "active" && g.health !== "reached")
        .reduce((sum, g) => sum + g.requiredMonthly, 0),
    [goals]
  );

  const hasGoals = goals.length > 0;
  const activeCount = goals.filter((g) => g.status === "active").length;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Goals</h1>
        <Button size="sm" onClick={() => setDialog({ type: "add" })}>
          <PlusIcon />
          Add
        </Button>
      </div>

      {/* Summary */}
      {hasGoals && activeCount > 0 && (
        <div className="inline-block rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Total monthly saving needed
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatSGD(totalRequiredMonthly)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activeCount} active goal{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Filters */}
      {hasGoals && (
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg bg-muted p-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg bg-muted p-1">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  typeFilter === f.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!hasGoals ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No goals yet.</p>
          <Button onClick={() => setDialog({ type: "add" })}>
            <PlusIcon />
            Add your first goal
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">
            No goals match the current filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((goal) => {
            const activeIdx = activeGoalsByPriority.findIndex(
              (g) => g.id === goal.id
            );
            const prevGoal =
              activeIdx > 0
                ? activeGoalsByPriority[activeIdx - 1]
                : undefined;
            const nextGoal =
              activeIdx >= 0 &&
              activeIdx < activeGoalsByPriority.length - 1
                ? activeGoalsByPriority[activeIdx + 1]
                : undefined;
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                prevGoal={
                  prevGoal
                    ? { id: prevGoal.id, priority: prevGoal.priority }
                    : undefined
                }
                nextGoal={
                  nextGoal
                    ? { id: nextGoal.id, priority: nextGoal.priority }
                    : undefined
                }
                onEdit={() => setDialog({ type: "edit", goal })}
                onDelete={() => setDialog({ type: "delete", goal })}
                onContribute={() =>
                  setDialog({ type: "contribute", goalId: goal.id })
                }
              />
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <GoalForm
        open={dialog.type === "add" || dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        goal={dialog.type === "edit" ? dialog.goal : undefined}
      />

      {dialog.type === "contribute" && (
        <ContributionForm
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          goalId={dialog.goalId}
        />
      )}

      {dialog.type === "delete" && (
        <DeleteConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          name={dialog.goal.name}
          description={
            dialog.goal.contributionCount > 0
              ? `This will also delete ${dialog.goal.contributionCount} contribution${dialog.goal.contributionCount !== 1 ? "s" : ""}. This cannot be undone.`
              : undefined
          }
          onDelete={() => removeGoalWithContributions(dialog.goal.id)}
          successMessage={`"${dialog.goal.name}" and its contributions deleted`}
        />
      )}
    </div>
  );
}
