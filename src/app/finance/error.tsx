"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function DashboardError({
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
        <p className="font-medium">Dashboard unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Could not reach Google Sheets. Run{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            npm run sheets:check
          </code>{" "}
          to diagnose the connection, or{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            npm run sheets:init
          </code>{" "}
          if the sheet is new.
        </p>
      </Alert>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
