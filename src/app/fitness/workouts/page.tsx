import Link from "next/link";
import { ArrowLeftIcon, Activity } from "lucide-react";

export default function WorkoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/fitness"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          Fitness
        </Link>
      </div>
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Activity className="size-8 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">Workouts</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Log and plan your training sessions. Coming soon.
        </p>
      </div>
    </div>
  );
}
