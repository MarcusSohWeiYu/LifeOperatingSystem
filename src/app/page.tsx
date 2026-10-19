import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { modules } from "@/components/module-config";

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold tracking-tight">Life OS</h1>
        <ThemeToggle />
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Your modules</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a module to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.slug}
                href={`/${m.slug}`}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <span className="font-semibold">{m.label}</span>
                  </div>
                  <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-sm text-muted-foreground">{m.description}</p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
