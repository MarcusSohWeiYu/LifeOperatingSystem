"use client";

import dynamic from "next/dynamic";

const StatsClient = dynamic(
  () => import("@/components/nutrition/stats-client").then((m) => m.StatsClient),
  { ssr: false },
);

export default function StatsPage() {
  return <StatsClient />;
}
