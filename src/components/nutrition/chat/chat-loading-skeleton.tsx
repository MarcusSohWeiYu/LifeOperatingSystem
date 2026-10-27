"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ChatLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b px-3 py-2.5 flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-5 w-32" />
        <div className="ml-auto flex gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-16 w-56 rounded-2xl" />
        </div>
        <div className="flex gap-2 justify-end">
          <Skeleton className="h-10 w-44 rounded-2xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-24 w-64 rounded-2xl" />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t p-3 flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  );
}
