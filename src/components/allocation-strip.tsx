"use client";
import { cn } from "cn";
import { formatSGD } from "@/lib/finance/money";

export type AllocationData = {
  totalIncomeCents: number;
  subscriptionsCents: number;
  needsCents: number;
  wantsCents: number;
  savingsCents: number;
  goalFundingCents: number;
  unallocatedCents: number;
  isOverAllocated: boolean;
};

const SEGMENTS = [
  {
    key: "subscriptions" as const,
    label: "Subscriptions",
    colorClass: "bg-blue-400 dark:bg-blue-500",
    dotClass: "bg-blue-400 dark:bg-blue-500",
  },
  {
    key: "needs" as const,
    label: "Needs",
    colorClass: "bg-amber-400 dark:bg-amber-500",
    dotClass: "bg-amber-400 dark:bg-amber-500",
  },
  {
    key: "wants" as const,
    label: "Wants",
    colorClass: "bg-violet-400 dark:bg-violet-500",
    dotClass: "bg-violet-400 dark:bg-violet-500",
  },
  {
    key: "savings" as const,
    label: "Savings",
    colorClass: "bg-emerald-400 dark:bg-emerald-500",
    dotClass: "bg-emerald-400 dark:bg-emerald-500",
  },
  {
    key: "goalFunding" as const,
    label: "Goal Funding",
    colorClass: "bg-indigo-400 dark:bg-indigo-500",
    dotClass: "bg-indigo-400 dark:bg-indigo-500",
  },
] as const;

function centsByKey(
  data: AllocationData,
  key: (typeof SEGMENTS)[number]["key"]
): number {
  switch (key) {
    case "subscriptions":
      return data.subscriptionsCents;
    case "needs":
      return data.needsCents;
    case "wants":
      return data.wantsCents;
    case "savings":
      return data.savingsCents;
    case "goalFunding":
      return data.goalFundingCents;
  }
}

function pctStr(cents: number, total: number): string {
  if (total === 0) return "0%";
  return ((cents / total) * 100).toFixed(1) + "%";
}

export function AllocationStrip({ data }: { data: AllocationData }) {
  const total = data.totalIncomeCents;

  // Bar segments: spending + unallocated (or zero if over-allocated)
  const spendingSegments = SEGMENTS.map((s) => ({
    ...s,
    cents: centsByKey(data, s.key),
  })).filter((s) => s.cents > 0);

  const hasUnallocated = data.unallocatedCents > 0;

  // Unallocated message
  const unallocatedLabel =
    data.unallocatedCents === 0
      ? "Every dollar has a job"
      : data.isOverAllocated
        ? `Over-allocated by ${formatSGD(Math.abs(data.unallocatedCents))}`
        : `${formatSGD(data.unallocatedCents)} left to assign`;

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div
        className={cn(
          "flex h-5 w-full overflow-hidden rounded-full",
          data.isOverAllocated && "ring-2 ring-destructive"
        )}
      >
        {spendingSegments.map((seg) => (
          <div
            key={seg.key}
            className={seg.colorClass}
            style={{ flex: seg.cents }}
            title={`${seg.label}: ${formatSGD(seg.cents)}/mo (${pctStr(seg.cents, total)})`}
          />
        ))}
        {hasUnallocated && (
          <div
            className="bg-muted-foreground/20"
            style={{ flex: data.unallocatedCents }}
            title={`Unallocated: ${formatSGD(data.unallocatedCents)}`}
          />
        )}
      </div>

      {/* Unallocated status */}
      <p
        className={cn(
          "text-sm font-medium",
          data.unallocatedCents === 0
            ? "text-emerald-600 dark:text-emerald-400"
            : data.isOverAllocated
              ? "text-destructive"
              : "text-muted-foreground"
        )}
      >
        {unallocatedLabel}
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {spendingSegments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5 text-xs">
            <span className={cn("size-2.5 rounded-sm shrink-0", seg.dotClass)} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="tabular-nums font-medium">
              {formatSGD(seg.cents)}
            </span>
            <span className="text-muted-foreground">
              ({pctStr(seg.cents, total)})
            </span>
          </div>
        ))}
        {hasUnallocated && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="size-2.5 rounded-sm shrink-0 bg-muted-foreground/20" />
            <span className="text-muted-foreground">Unallocated</span>
            <span className="tabular-nums font-medium">
              {formatSGD(data.unallocatedCents)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
