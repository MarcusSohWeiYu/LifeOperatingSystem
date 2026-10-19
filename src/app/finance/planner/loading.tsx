import { Skeleton } from "@/components/ui/skeleton";

export default function PlannerLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Banner */}
      <Skeleton className="h-12 rounded-xl" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left: controls */}
        <div className="space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
        {/* Right: results */}
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
