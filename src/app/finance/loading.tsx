import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Headline */}
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-20 w-44 rounded-xl" />
          <Skeleton className="h-20 w-44 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Allocation strip */}
      <Skeleton className="h-24 rounded-xl" />
      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
      {/* Coming up */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
