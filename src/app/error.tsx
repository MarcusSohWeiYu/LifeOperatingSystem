"use client";

export default function OverviewError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">Could not load Life OS.</p>
        <button
          onClick={reset}
          className="text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
