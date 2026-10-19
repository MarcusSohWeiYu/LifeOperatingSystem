import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      {/* Allocation strip */}
      <div className="space-y-3 rounded-xl border p-4">
        <Skeleton className="h-5 w-full rounded-full" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
      {/* Budget groups */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-6 w-20" />
          {Array.from({ length: 2 }).map((_, j) => (
            <Skeleton key={j} className="h-12 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
