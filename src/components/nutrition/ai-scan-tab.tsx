"use client";

import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiScanTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4 gap-3">
      <SparklesIcon className="h-8 w-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">AI Meal Scan</p>
        <p className="text-xs text-muted-foreground mt-1">
          Take a photo of your meal and let AI estimate the nutrition.
        </p>
      </div>
      <Link href="/fitness/nutrition/chat">
        <Button variant="outline" size="sm" className="gap-1.5">
          Open AI Chat
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
