"use client";
import { useState } from "react";
import { PlusIcon, PencilIcon, Trash2Icon, TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatSGD } from "@/lib/finance/money";
import { removeBudget } from "@/actions/budget";
import { removeContribution } from "@/actions/contributions";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { AllocationStrip } from "@/components/allocation-strip";
import type { AllocationData } from "@/components/allocation-strip";
import { BudgetForm } from "./budget-form";
import { GoalFundingForm } from "./goal-funding-form";

export type BudgetItem = {
  id: string;
  category: string;
  plannedMonthly: number;
  type: "needs" | "wants" | "savings";
  notes: string;
  goalId: string;
  goalName: string;
  createdAt: string;
  updatedAt: string;
  planCents: number;
};

export type GoalOption = {
  id: string;
  name: string;
};

export type GoalFundingEntry = {
  contributionId: string;
  goalId: string;
  goalName: string;
  amountCents: number;
  date: string;
  note: string;
};

type NwsSplit = {
  needsCents: number;
  wantsCents: number;
  savingsCents: number;
  totalIncomeCents: number;
};

type Props = {
  budget: BudgetItem[];
  allocation: AllocationData;
  nwsSplit: NwsSplit;
  availableGoals: GoalOption[];
  goalFunding: GoalFundingEntry[];
};

type DialogState =
  | { type: "none" }
  | { type: "add"; defaultBudgetType?: "needs" | "wants" | "savings" }
  | { type: "edit"; item: BudgetItem }
  | { type: "delete"; item: BudgetItem }
  | { type: "fund-goal" }
  | { type: "delete-contribution"; entry: GoalFundingEntry };

const TYPE_LABELS = {
  needs: "Needs",
  wants: "Wants",
  savings: "Savings",
};

const TYPE_TARGETS = {
  needs: 50,
  wants: 30,
  savings: 20,
};

function pct(cents: number, total: number): string {
  if (total === 0) return "0%";
  return ((cents / total) * 100).toFixed(0) + "%";
}

export function BudgetClient({
  budget,
  allocation,
  nwsSplit,
  availableGoals,
  goalFunding,
}: Props) {
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const grouped: Record<"needs" | "wants" | "savings", BudgetItem[]> = {
    needs: budget.filter((b) => b.type === "needs"),
    wants: budget.filter((b) => b.type === "wants"),
    savings: budget.filter((b) => b.type === "savings"),
  };

  const goalFundingTotal = goalFunding.reduce(
    (sum, e) => sum + e.amountCents,
    0
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Budget</h1>
        <Button size="sm" onClick={() => setDialog({ type: "add" })}>
          <PlusIcon />
          Add
        </Button>
      </div>

      {/* Allocation strip */}
      {allocation.totalIncomeCents > 0 && (
        <div className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
          <p className="mb-3 text-sm font-medium">Monthly allocation</p>
          <AllocationStrip data={allocation} />
        </div>
      )}

      {/* 50/30/20 reference */}
      {nwsSplit.totalIncomeCents > 0 && (
        <div className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Needs / Wants / Savings split
          </p>
          <div className="space-y-2">
            {(["needs", "wants", "savings"] as const).map((type) => {
              const cents = nwsSplit[`${type}Cents` as keyof NwsSplit] as number;
              const actual = pct(cents, nwsSplit.totalIncomeCents);
              const target = TYPE_TARGETS[type];
              return (
                <div
                  key={type}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {TYPE_LABELS[type]}
                  </span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="font-medium">{actual}</span>
                    <span className="text-muted-foreground">
                      (target {target}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {budget.length === 0 && goalFunding.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">No budget categories yet.</p>
          <Button onClick={() => setDialog({ type: "add" })}>
            <PlusIcon />
            Add your first category
          </Button>
        </div>
      )}

      {/* Grouped regular budget items */}
      {(["needs", "wants", "savings"] as const).map((type) => {
        const items = grouped[type];
        if (items.length === 0) return null;

        const subtotalCents = items.reduce((sum, b) => sum + b.planCents, 0);

        return (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between py-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {TYPE_LABELS[type]}
              </h2>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatSGD(subtotalCents)}/mo
              </span>
            </div>
            <Separator />
            <div className="space-y-px">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-sm">{item.category}</span>
                    {item.notes && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {item.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="tabular-nums text-sm">
                      {formatSGD(item.planCents)}/mo
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit"
                      onClick={() => setDialog({ type: "edit", item })}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      onClick={() => setDialog({ type: "delete", item })}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground mt-1"
                onClick={() =>
                  setDialog({ type: "add", defaultBudgetType: type })
                }
              >
                <PlusIcon />
                Add {TYPE_LABELS[type].toLowerCase()} category
              </Button>
            </div>
          </div>
        );
      })}

      {/* Goal Funding section — this month's contributions */}
      <div className="space-y-1">
        <div className="flex items-center justify-between py-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Goal Funding (This Month)
          </h2>
          {goalFundingTotal > 0 && (
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatSGD(goalFundingTotal)}
            </span>
          )}
        </div>
        <Separator />
        <div className="space-y-px">
          {goalFunding.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              Nothing funded this month yet.
            </p>
          ) : (
            goalFunding.map((entry) => (
              <div
                key={entry.contributionId}
                className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-2 flex-1">
                  <TargetIcon className="size-3.5 shrink-0 text-indigo-500" />
                  <span className="font-medium text-sm truncate">
                    {entry.goalName}
                  </span>
                  {entry.note && (
                    <span className="text-xs text-muted-foreground truncate">
                      {entry.note}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="tabular-nums text-sm">
                    {formatSGD(entry.amountCents)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove"
                    onClick={() =>
                      setDialog({ type: "delete-contribution", entry })
                    }
                  >
                    <Trash2Icon className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
          {availableGoals.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground mt-1"
              onClick={() => setDialog({ type: "fund-goal" })}
            >
              <TargetIcon className="size-3.5" />
              Fund a goal this month
            </Button>
          )}
          {availableGoals.length === 0 && goalFunding.length === 0 && (
            <p className="px-2 pb-1 text-xs text-muted-foreground">
              Add goals first, then fund them here.
            </p>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <BudgetForm
        open={dialog.type === "add" || dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        item={dialog.type === "edit" ? dialog.item : undefined}
        defaultType={
          dialog.type === "add" ? dialog.defaultBudgetType : undefined
        }
      />

      <GoalFundingForm
        open={dialog.type === "fund-goal"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        goals={availableGoals}
      />

      {dialog.type === "delete" && (
        <DeleteConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          name={dialog.item.category}
          onDelete={() => removeBudget(dialog.item.id)}
        />
      )}

      {dialog.type === "delete-contribution" && (
        <DeleteConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          name={`${dialog.entry.goalName} — ${formatSGD(dialog.entry.amountCents)}`}
          onDelete={() => removeContribution(dialog.entry.contributionId)}
          successMessage="Contribution removed"
        />
      )}
    </div>
  );
}
