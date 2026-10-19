import { Skeleton } from "@/components/ui/skeleton";

export default function NutritionLoading() {
  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>

      {/* Daily summary */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>

      {/* Meal sections */}
      {["Breakfast", "Lunch", "Dinner", "Snacks"].map((meal) => (
        <div key={meal} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
