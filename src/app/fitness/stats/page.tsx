"use client";

import dynamic from "next/dynamic";
import { StatsLoadingSkeleton } from "@/components/nutrition/stats-loading-skeleton";

const StatsClient = dynamic(
  () => import("@/components/nutrition/stats-client").then((m) => m.StatsClient),
  { ssr: false, loading: () => <StatsLoadingSkeleton /> },
);

export default function StatsPage() {
  return <StatsClient />;
}
