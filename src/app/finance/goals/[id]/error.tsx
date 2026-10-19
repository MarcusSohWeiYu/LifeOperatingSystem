"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ArrowLeftIcon } from "lucide-react";

export default function GoalDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <Alert className="max-w-lg">
        <p className="font-medium">Unable to load this goal</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Could not reach Google Sheets. Run{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            npm run sheets:check
          </code>{" "}
          to diagnose the connection.
        </p>
      </Alert>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/finance/goals"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Goals
        </Link>
      </div>
    </div>
  );
}
