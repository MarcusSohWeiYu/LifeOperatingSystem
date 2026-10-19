"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatSGD } from "@/lib/finance/money";

type Contribution = {
  date: string;
  amount: number;
};

type Props = {
  contributions: Contribution[];
  targetCents: number;
  targetDate: string;
};

function idealAtDate(
  firstDate: string,
  targetDate: string,
  targetCents: number,
  atDate: string
): number {
  const start = Date.parse(firstDate);
  const end = Date.parse(targetDate);
  const at = Date.parse(atDate);
  if (at <= start) return 0;
  if (at >= end) return targetCents;
  return Math.round(((at - start) / (end - start)) * targetCents);
}

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
] as const;

function shortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${MONTHS[Number(parts[1]) - 1]} '${parts[0]!.slice(2)}`;
}

function longDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${MONTHS[Number(parts[1]) - 1]} ${Number(parts[2])}, ${parts[0]}`;
}

export function GoalChart({ contributions, targetCents, targetDate }: Props) {
  if (contributions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No contributions yet — add your first to see progress here.
      </p>
    );
  }

  const sorted = [...contributions].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const firstDate = sorted[0]!.date;

  // Collect unique dates (contribution dates + target date)
  const dateSet = new Set<string>();
  for (const c of sorted) dateSet.add(c.date);
  dateSet.add(targetDate);
  const allDates = [...dateSet].sort();

  // Build cumulative actuals, filling forward
  const cumulativeByDate = new Map<string, number>();
  let running = 0;
  for (const c of sorted) {
    running += Math.round(c.amount * 100);
    cumulativeByDate.set(c.date, running);
  }

  const data: { date: string; actual: number; ideal: number }[] = [];
  let lastKnown = 0;
  for (const date of allDates) {
    const val = cumulativeByDate.get(date);
    if (val !== undefined) lastKnown = val;
    data.push({
      date,
      actual: lastKnown,
      ideal: idealAtDate(firstDate, targetDate, targetCents, date),
    });
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          tickFormatter={(v: number) => `$${Math.round(v / 100)}`}
          tick={{ fontSize: 11 }}
          width={52}
        />
        <Tooltip
          formatter={(value, name) => [
            formatSGD(Number(value)),
            name === "actual" ? "Saved" : "Ideal pace",
          ]}
          labelFormatter={(label) => longDate(String(label))}
        />
        <ReferenceLine
          y={targetCents}
          stroke="#22c55e"
          strokeDasharray="4 2"
          label={{
            value: "Target",
            fontSize: 10,
            fill: "#22c55e",
            position: "insideTopRight",
          }}
        />
        <Line
          type="stepAfter"
          dataKey="actual"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="actual"
          activeDot={{ r: 4 }}
        />
        <Line
          type="linear"
          dataKey="ideal"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          dot={false}
          name="ideal"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
