import { Skeleton } from "@/components/ui/skeleton";

export default function AiChatLoading() {
  return (
    <div className="flex h-dvh flex-col">
      <div className="border-b px-3 py-2">
        <Skeleton className="h-7 w-32" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <Skeleton className="h-10 w-64 rounded-2xl ml-auto" />
        <Skeleton className="h-10 w-56 rounded-2xl" />
      </div>
      <div className="border-t p-3">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
