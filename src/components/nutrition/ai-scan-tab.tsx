"use client";

import { SparklesIcon } from "lucide-react";

export function AiScanTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <SparklesIcon className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium">AI Meal Scan</p>
      <p className="text-xs text-muted-foreground mt-1">
        Take a photo of your meal and let AI estimate the nutrition.
      </p>
      <p className="text-xs text-muted-foreground mt-3">Coming soon</p>
    </div>
  );
}
