"use client";
import { useSyncExternalStore, useCallback } from "react";
import dynamic from "next/dynamic";
import { LayoutDashboardIcon, BoxIcon } from "lucide-react";
import type { CityData } from "./city-types";

const CityScene = dynamic(
  () => import("./city-scene").then((m) => ({ default: m.CityScene })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] w-full items-center justify-center rounded-xl border bg-muted">
        <p className="text-sm text-muted-foreground">Loading 3D city…</p>
      </div>
    ),
  }
);

type ViewMode = "2d" | "3d";
const STORAGE_KEY = "dashboard-view";
const CHANGE_EVENT = "dashboard-view-change";

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

function getSnapshot(): ViewMode {
  return localStorage.getItem(STORAGE_KEY) === "3d" ? "3d" : "2d";
}

function getServerSnapshot(): ViewMode {
  return "2d";
}

type Props = {
  cityData: CityData;
  children: React.ReactNode;
};

export function DashboardViewToggle({ cityData, children }: Props) {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((mode: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header row with title and toggle */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">This month&apos;s plan</h1>
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted p-0.5">
          <button
            onClick={() => toggle("2d")}
            aria-label="2D view"
            className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors ${
              view === "2d"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboardIcon className="size-4" />
          </button>
          <button
            onClick={() => toggle("3d")}
            aria-label="3D city view"
            className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors ${
              view === "3d"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BoxIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "3d" ? (
        <CityScene data={cityData} />
      ) : (
        <div className="space-y-6">{children}</div>
      )}
    </div>
  );
}
