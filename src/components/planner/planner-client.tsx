"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FlaskConicalIcon,
  PlusIcon,
  Trash2Icon,
  PlaneIcon,
  ShoppingBagIcon,
  CircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatSGD, fromCents, toCents } from "@/lib/finance/money";
import {
  monthsRemaining,
  requiredMonthlyCents,
} from "@/lib/finance/goals";

// ── Types ──────────────────────────────────────────────────────────────────

export type PlanBaseline = {
  incomeCents: number;
  subscriptions: {
    id: string;
    name: string;
    monthlyCents: number;
    active: boolean;
  }[];
  budget: {
    id: string;
    category: string;
    monthlyCents: number;
    type: "needs" | "wants" | "savings";
    goalId: string;
  }[];
  goals: {
    id: string;
    name: string;
    type: "trip" | "purchase" | "other";
    targetCents: number;
    targetDate: string;
    savedCents: number;
    priority: number;
  }[];
  today: string; // YYYY-MM-DD
};

type PlanGoal = {
  id: string;
  name: string;
  type: "trip" | "purchase" | "other";
  targetCents: number;
  targetDate: string;
  savedCents: number;
  priority: number;
  isHypothetical: boolean;
};

type Scenario = {
  incomeCents: number;
  subActive: Record<string, boolean>;
  budgetCents: Record<string, number>;
  goals: PlanGoal[];
};

type AllocResult = {
  incomeCents: number;
  subscriptionsCents: number;
  budgetCents: number;
  unallocatedCents: number;
  isOverAllocated: boolean;
  totalGoalRequiredCents: number; // informational only
};

// ── Pure helpers ───────────────────────────────────────────────────────────

const STORAGE_KEY = "planner-scenario";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
] as const;

function fmtMonthYear(dateStr: string): string {
  const parts = dateStr.split("-");
  const y = parts[0] ?? "";
  const m = Number(parts[1] ?? "0");
  return `${MONTHS[m - 1] ?? "?"} ${y}`;
}

function initScenario(baseline: PlanBaseline): Scenario {
  return {
    incomeCents: baseline.incomeCents,
    subActive: {},
    budgetCents: {},
    goals: baseline.goals.map((g) => ({ ...g, isHypothetical: false })),
  };
}

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
}

function computeAlloc(
  scenario: Scenario,
  baseline: PlanBaseline,
  today: Date
): AllocResult {
  const incomeCents = scenario.incomeCents;

  const subscriptionsCents = baseline.subscriptions.reduce((sum, s) => {
    const active = scenario.subActive[s.id] ?? s.active;
    return active ? sum + s.monthlyCents : sum;
  }, 0);

  const budgetCents = baseline.budget.reduce((sum, b) => {
    const mc = scenario.budgetCents[b.id] ?? b.monthlyCents;
    return sum + mc;
  }, 0);

  // Goals are informational — total required monthly for reference
  const totalGoalRequiredCents = scenario.goals.reduce((sum, g) => {
    const months = monthsRemaining(g.targetDate, today);
    return sum + requiredMonthlyCents(g.targetCents, g.savedCents, months);
  }, 0);

  const unallocatedCents = incomeCents - subscriptionsCents - budgetCents;

  return {
    incomeCents,
    subscriptionsCents,
    budgetCents,
    unallocatedCents,
    isOverAllocated: unallocatedCents < 0,
    totalGoalRequiredCents,
  };
}

// ── Goal type icon ─────────────────────────────────────────────────────────

function GoalTypeIcon({ type }: { type: PlanGoal["type"] }) {
  switch (type) {
    case "trip":
      return <PlaneIcon className="size-3.5 shrink-0 text-muted-foreground" />;
    case "purchase":
      return (
        <ShoppingBagIcon className="size-3.5 shrink-0 text-muted-foreground" />
      );
    case "other":
      return <CircleIcon className="size-3.5 shrink-0 text-muted-foreground" />;
  }
}

// ── Add hypothetical goal dialog ───────────────────────────────────────────

const addGoalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["trip", "purchase", "other"]),
  targetAmount: z.string().min(1, "Target is required"),
  targetDate: z.string().min(1, "Date is required"),
});
type AddGoalValues = z.infer<typeof addGoalSchema>;

function AddGoalDialog({
  open,
  onOpenChange,
  onAdd,
  nextPriority,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (goal: Omit<PlanGoal, "id">) => void;
  nextPriority: number;
}) {
  const form = useForm<AddGoalValues>({
    resolver: zodResolver(addGoalSchema),
    defaultValues: { name: "", type: "trip", targetAmount: "", targetDate: "" },
  });

  useEffect(() => {
    if (open)
      form.reset({ name: "", type: "trip", targetAmount: "", targetDate: "" });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: AddGoalValues) {
    const amount = parseFloat(values.targetAmount);
    if (isNaN(amount) || amount <= 0) {
      form.setError("targetAmount", { message: "Must be a positive number" });
      return;
    }
    onAdd({
      name: values.name,
      type: values.type,
      targetCents: toCents(amount),
      targetDate: values.targetDate,
      savedCents: 0,
      priority: nextPriority,
      isHypothetical: true,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add hypothetical goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hg-name">Name</Label>
            <Input
              id="hg-name"
              placeholder="e.g. Japan trip"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hg-type">Type</Label>
              <select
                id="hg-type"
                {...form.register("type")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                <option value="trip">Trip</option>
                <option value="purchase">Purchase</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hg-amount">Target (SGD)</Label>
              <Input
                id="hg-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...form.register("targetAmount")}
                aria-invalid={!!form.formState.errors.targetAmount}
              />
              {form.formState.errors.targetAmount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.targetAmount.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hg-date">Target date</Label>
            <Input
              id="hg-date"
              type="date"
              {...form.register("targetDate")}
              aria-invalid={!!form.formState.errors.targetDate}
            />
            {form.formState.errors.targetDate && (
              <p className="text-xs text-destructive">
                {form.formState.errors.targetDate.message}
              </p>
            )}
          </div>
          <DialogFooter showCloseButton>
            <Button type="submit">Add goal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Alloc comparison row ───────────────────────────────────────────────────

function AllocRow({
  label,
  before,
  after,
}: {
  label: string;
  before: number;
  after: number;
}) {
  const changed = before !== after;
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 tabular-nums">
        {changed && (
          <span className="text-xs text-muted-foreground/50 line-through decoration-muted-foreground/40">
            {formatSGD(before)}
          </span>
        )}
        <span>{formatSGD(after)}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function PlannerClient({ baseline }: { baseline: PlanBaseline }) {
  const todayDate = useMemo(() => parseLocalDate(baseline.today), [baseline.today]);

  const [scenario, setScenario] = useState<Scenario>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored) as Scenario;
      } catch {}
    }
    return initScenario(baseline);
  });

  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const hypIdCounter = useRef(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
  }, [scenario]);

  const baselineAlloc = useMemo(
    () => computeAlloc(initScenario(baseline), baseline, todayDate),
    [baseline, todayDate]
  );
  const scenarioAlloc = useMemo(
    () => computeAlloc(scenario, baseline, todayDate),
    [scenario, baseline, todayDate]
  );

  function handleSubToggle(id: string, checked: boolean) {
    setScenario((s) => ({
      ...s,
      subActive: { ...s.subActive, [id]: checked },
    }));
  }

  function handleBudgetChange(id: string, val: string) {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) {
      setScenario((s) => ({
        ...s,
        budgetCents: { ...s.budgetCents, [id]: toCents(n) },
      }));
    }
  }

  function handleAddGoal(goal: Omit<PlanGoal, "id">) {
    hypIdCounter.current += 1;
    const id = `hyp-${hypIdCounter.current}`;
    setScenario((s) => ({ ...s, goals: [...s.goals, { ...goal, id }] }));
  }

  function handleRemoveGoal(id: string) {
    setScenario((s) => ({
      ...s,
      goals: s.goals.filter((g) => g.id !== id),
    }));
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setScenario(initScenario(baseline));
  }

  const isDirty =
    scenario.incomeCents !== baseline.incomeCents ||
    Object.keys(scenario.subActive).length > 0 ||
    Object.keys(scenario.budgetCents).length > 0 ||
    scenario.goals.some((g) => g.isHypothetical);

  const nextPriority =
    scenario.goals.length > 0
      ? Math.max(...scenario.goals.map((g) => g.priority)) + 1
      : 1;

  const unallocColor =
    scenarioAlloc.unallocatedCents === 0
      ? "text-emerald-600 dark:text-emerald-400"
      : scenarioAlloc.isOverAllocated
      ? "text-destructive"
      : "";

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Sandbox banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex items-center gap-2">
          <FlaskConicalIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Sandbox — adjustments here are never saved to the sheet
          </p>
        </div>
        {isDirty && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset to real data
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* ── Left: Controls ── */}
        <div className="space-y-8">
          {/* Income */}
          <section className="space-y-3">
            <h2 className="font-medium">Income</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="plan-income"
                  className="w-40 shrink-0 text-sm text-muted-foreground"
                >
                  Monthly income (SGD)
                </Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="plan-income"
                    type="number"
                    min="0"
                    step="100"
                    className="w-32"
                    value={fromCents(scenario.incomeCents)}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n) && n >= 0) {
                        setScenario((s) => ({ ...s, incomeCents: toCents(n) }));
                      }
                    }}
                  />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(baseline.incomeCents * 2, 1_000_000)}
                step={1000}
                value={scenario.incomeCents}
                onChange={(e) =>
                  setScenario((s) => ({
                    ...s,
                    incomeCents: Number(e.target.value),
                  }))
                }
                className="w-full accent-primary"
                aria-label="Monthly income slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>{formatSGD(baseline.incomeCents)} (current)</span>
                <span>{formatSGD(baseline.incomeCents * 2)}</span>
              </div>
            </div>
          </section>

          {/* Subscriptions */}
          {baseline.subscriptions.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-medium">Subscriptions</h2>
              <div className="divide-y rounded-xl border">
                {baseline.subscriptions.map((s) => {
                  const active = scenario.subActive[s.id] ?? s.active;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <Switch
                          size="sm"
                          checked={active}
                          onCheckedChange={(checked) =>
                            handleSubToggle(s.id, checked)
                          }
                        />
                        <span
                          className={`text-sm ${
                            active
                              ? ""
                              : "text-muted-foreground line-through decoration-muted-foreground/50"
                          }`}
                        >
                          {s.name}
                        </span>
                      </div>
                      <span className="shrink-0 tabular-nums text-sm text-muted-foreground">
                        {formatSGD(s.monthlyCents)}/mo
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Budget */}
          {baseline.budget.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-medium">Budget</h2>
              <div className="divide-y rounded-xl border">
                {baseline.budget.map((b) => {
                  const cents = scenario.budgetCents[b.id] ?? b.monthlyCents;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{b.category}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {b.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="10"
                          className="w-24 text-right"
                          value={fromCents(cents)}
                          onChange={(e) => handleBudgetChange(b.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Goals (informational) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium">Goals</h2>
                <p className="text-xs text-muted-foreground">
                  Informational — add goal funding in the Budget section above
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddGoalOpen(true)}
                className="gap-1.5"
              >
                <PlusIcon className="size-3.5" />
                Add hypothetical
              </Button>
            </div>

            {scenario.goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active goals.
              </p>
            ) : (
              <div className="divide-y rounded-xl border">
                {scenario.goals.map((g) => {
                  const months = monthsRemaining(g.targetDate, todayDate);
                  const req = requiredMonthlyCents(
                    g.targetCents,
                    g.savedCents,
                    months
                  );
                  return (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 px-3 py-2.5 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <GoalTypeIcon type={g.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">
                            {g.name}
                          </p>
                          {g.isHypothetical && (
                            <span className="shrink-0 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-400">
                              hypothetical
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatSGD(g.targetCents)} by{" "}
                          {fmtMonthYear(g.targetDate)}
                          {req > 0 && ` · needs ${formatSGD(req)}/mo`}
                        </p>
                      </div>
                      {g.isHypothetical && (
                        <button
                          onClick={() => handleRemoveGoal(g.id)}
                          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Remove ${g.name}`}
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Right: Results ── */}
        <div className="space-y-4">
          {/* Allocation summary */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium">Allocation</h2>
            <div className="space-y-0.5">
              <AllocRow
                label="Income"
                before={baselineAlloc.incomeCents}
                after={scenarioAlloc.incomeCents}
              />
              <AllocRow
                label="Subscriptions"
                before={baselineAlloc.subscriptionsCents}
                after={scenarioAlloc.subscriptionsCents}
              />
              <AllocRow
                label="Budget (incl. goal funding)"
                before={baselineAlloc.budgetCents}
                after={scenarioAlloc.budgetCents}
              />
              <div className="my-2 border-t" />
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="font-medium">Unallocated</span>
                <div className="flex items-center gap-2 tabular-nums">
                  {baselineAlloc.unallocatedCents !==
                    scenarioAlloc.unallocatedCents && (
                    <span className="text-xs text-muted-foreground/50 line-through">
                      {baselineAlloc.isOverAllocated && "−"}
                      {formatSGD(Math.abs(baselineAlloc.unallocatedCents))}
                    </span>
                  )}
                  <span className={`font-semibold ${unallocColor}`}>
                    {scenarioAlloc.isOverAllocated && "−"}
                    {formatSGD(Math.abs(scenarioAlloc.unallocatedCents))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Goal requirements (informational) */}
          {scenario.goals.length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <h2 className="mb-1 text-sm font-medium">Goal requirements</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Informational — goals no longer auto-affect your budget
              </p>
              <div className="space-y-2">
                {scenario.goals.map((g) => {
                  const months = monthsRemaining(g.targetDate, todayDate);
                  const req = requiredMonthlyCents(
                    g.targetCents,
                    g.savedCents,
                    months
                  );
                  return (
                    <div key={g.id} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <GoalTypeIcon type={g.type} />
                        <span className="truncate text-sm">{g.name}</span>
                        {g.isHypothetical && (
                          <span className="shrink-0 rounded-full bg-violet-500/15 px-1 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-400">
                            hyp
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {req > 0 ? `${formatSGD(req)}/mo` : "reached"}
                      </span>
                    </div>
                  );
                })}
                <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
                  <span className="text-muted-foreground">Total needed</span>
                  <span className="tabular-nums font-medium">
                    {formatSGD(scenarioAlloc.totalGoalRequiredCents)}/mo
                  </span>
                </div>
                {scenarioAlloc.unallocatedCents > 0 && (
                  <p className={`text-xs ${
                    scenarioAlloc.unallocatedCents >= scenarioAlloc.totalGoalRequiredCents
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}>
                    {scenarioAlloc.unallocatedCents >= scenarioAlloc.totalGoalRequiredCents
                      ? `You have enough unallocated (${formatSGD(scenarioAlloc.unallocatedCents)}) to cover all goals`
                      : `You have ${formatSGD(scenarioAlloc.unallocatedCents)} unallocated — short by ${formatSGD(scenarioAlloc.totalGoalRequiredCents - scenarioAlloc.unallocatedCents)}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {scenario.goals.length === 0 && (
            <div className="rounded-xl border bg-card p-4">
              <p className="text-center text-sm text-muted-foreground">
                No active goals in this scenario.
              </p>
            </div>
          )}
        </div>
      </div>

      <AddGoalDialog
        open={addGoalOpen}
        onOpenChange={setAddGoalOpen}
        onAdd={handleAddGoal}
        nextPriority={nextPriority}
      />
    </div>
  );
}
