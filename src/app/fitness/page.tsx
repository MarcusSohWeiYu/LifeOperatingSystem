import Link from "next/link";
import { ArrowRightIcon, Activity, UtensilsCrossed, BarChart3 } from "lucide-react";

const sections = [
  {
    href: "/fitness/workouts",
    label: "Workouts",
    icon: Activity,
    description: "Log and plan your training sessions.",
  },
  {
    href: "/fitness/nutrition",
    label: "Nutrition",
    icon: UtensilsCrossed,
    description: "Track meals and daily macros.",
  },
  {
    href: "/fitness/stats",
    label: "Stats",
    icon: BarChart3,
    description: "Monitor body measurements and progress.",
  },
];

export default function FitnessDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Fitness</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This module is coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <span className="font-semibold">{s.label}</span>
                </div>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
