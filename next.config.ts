import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/subscriptions", destination: "/finance/subscriptions", permanent: true },
      { source: "/income", destination: "/finance/income", permanent: true },
      { source: "/budget", destination: "/finance/budget", permanent: true },
      { source: "/goals", destination: "/finance/goals", permanent: true },
      { source: "/goals/:id", destination: "/finance/goals/:id", permanent: true },
      { source: "/planner", destination: "/finance/planner", permanent: true },
    ];
  },
};

export default nextConfig;
