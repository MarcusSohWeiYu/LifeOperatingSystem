import { Skeleton } from "@/components/ui/skeleton";

export default function NutritionLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-16" />
      <div className="flex flex-col items-center gap-4 py-24">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
    </div>
  );
}
