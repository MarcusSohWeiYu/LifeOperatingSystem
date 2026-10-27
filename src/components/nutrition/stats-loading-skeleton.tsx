"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function StatsLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      {/* BMR / TDEE / BMI row */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>

      {/* Macro averages */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Weight chart */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-52 w-full rounded-lg" />
      </div>

      {/* Daily deficit */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-44" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 flex-1 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
