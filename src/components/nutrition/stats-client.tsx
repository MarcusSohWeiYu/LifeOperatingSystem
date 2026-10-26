"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import {
  FlameIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  ScaleIcon,
  Settings2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NutritionState, BodyStats } from "./types";
import { loadNutritionState, saveNutritionState, todayDateStr } from "./utils";
import { getDefaultNutritionState } from "./mock-data";
import { BodyStatsDialog } from "./body-stats-dialog";
import {
  computeWeeklyStats,
  buildTrendData,
  bmrCalories,
  tdeeCalories,
} from "./stats-utils";

export function StatsClient() {
  const [state, setState] = useState<NutritionState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = loadNutritionState();
        if (saved) return saved;
      } catch {}
    }
    return getDefaultNutritionState();
  });

  const [bodyStatsOpen, setBodyStatsOpen] = useState(false);

  useEffect(() => {
    saveNutritionState(state);
  }, [state]);

  function handleSaveBodyStats(stats: BodyStats) {
    setState((s) => ({ ...s, bodyStats: stats }));
  }

  const today = todayDateStr();
  const weekly = useMemo(
    () => computeWeeklyStats(today, state.logs, state.goals, state.bodyStats),
    [today, state.logs, state.goals, state.bodyStats],
  );

  const trendData = useMemo(
    () => buildTrendData(today, 4, state.logs, state.goals, state.bodyStats),
    [today, state.logs, state.goals, state.bodyStats],
  );

  const hasBodyStats = !!state.bodyStats;
  const tdee = hasBodyStats ? tdeeCalories(state.bodyStats!) : null;
  const bmr = hasBodyStats ? bmrCalories(state.bodyStats!) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Nutrition Stats</h1>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setBodyStatsOpen(true)}
        >
          <Settings2Icon className="h-3.5 w-3.5" />
          Body Stats
        </Button>
      </div>

      {/* Body stats prompt */}
      {!hasBodyStats && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center space-y-2">
          <ScaleIcon className="h-8 w-8 mx-auto text-primary/60" />
          <p className="text-sm font-medium">Set up your body stats</p>
          <p className="text-xs text-muted-foreground">
            Enter your weight, height, age and activity level to unlock deficit tracking and estimated weight change.
          </p>
          <Button size="sm" onClick={() => setBodyStatsOpen(true)}>
            Get Started
          </Button>
        </div>
      )}

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weekly Avg Calories */}
        <StatCard
          icon={FlameIcon}
          label="Avg Calories"
          value={weekly.avgCalories > 0 ? weekly.avgCalories.toLocaleString() : "—"}
          subtitle={`/ ${state.goals.calories.toLocaleString()} goal`}
          accent={
            weekly.avgCalories === 0 ? "muted"
              : weekly.avgCalories <= state.goals.calories ? "green"
              : weekly.avgCalories <= state.goals.calories * 1.1 ? "amber"
              : "red"
          }
        />

        {/* Adherence Rate */}
        <StatCard
          icon={TargetIcon}
          label="Adherence"
          value={`${weekly.adherenceRate}%`}
          subtitle={`${weekly.daysLogged} of 7 days logged`}
          accent={
            weekly.adherenceRate >= 80 ? "green"
              : weekly.adherenceRate >= 50 ? "amber"
              : "red"
          }
        />

        {/* Weekly Avg Deficit */}
        {hasBodyStats && (
          <StatCard
            icon={weekly.avgDeficit >= 0 ? TrendingDownIcon : TrendingUpIcon}
            label="Avg Deficit"
            value={weekly.avgDeficit !== 0 ? `${weekly.avgDeficit > 0 ? "-" : "+"}${Math.abs(weekly.avgDeficit)}` : "—"}
            subtitle="cal/day"
            accent={weekly.avgDeficit > 0 ? "green" : weekly.avgDeficit < -200 ? "red" : "amber"}
          />
        )}

        {/* Estimated Weight Change */}
        {hasBodyStats && (
          <StatCard
            icon={ScaleIcon}
            label="Est. Weight"
            value={
              weekly.estimatedWeightChangeKg !== 0
                ? `${weekly.estimatedWeightChangeKg > 0 ? "+" : ""}${weekly.estimatedWeightChangeKg} kg`
                : "—"
            }
            subtitle="this week"
            accent={
              weekly.estimatedWeightChangeKg < 0 ? "green"
                : weekly.estimatedWeightChangeKg > 0 ? "red"
                : "muted"
            }
          />
        )}
      </div>

      {/* TDEE / BMR info */}
      {hasBodyStats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">BMR (rest)</p>
            <p className="text-lg font-bold tabular-nums">{bmr?.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">cal</span></p>
          </div>
          <div className="rounded-xl border bg-card p-3 space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">TDEE (active)</p>
            <p className="text-lg font-bold tabular-nums">{tdee?.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">cal</span></p>
          </div>
        </div>
      )}

      {/* Weekly Macro Averages */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Weekly Macro Averages</h3>
        <div className="grid grid-cols-3 gap-3">
          <MacroAvgCard
            label="Protein"
            avg={weekly.avgProteinG}
            target={state.goals.calories > 0 ? Math.round((state.goals.calories * state.goals.proteinPct) / 100 / 4) : 0}
            color="text-blue-500"
            bgColor="bg-blue-500"
          />
          <MacroAvgCard
            label="Carbs"
            avg={weekly.avgCarbsG}
            target={state.goals.calories > 0 ? Math.round((state.goals.calories * state.goals.carbsPct) / 100 / 4) : 0}
            color="text-amber-500"
            bgColor="bg-amber-500"
          />
          <MacroAvgCard
            label="Fat"
            avg={weekly.avgFatG}
            target={state.goals.calories > 0 ? Math.round((state.goals.calories * state.goals.fatPct) / 100 / 9) : 0}
            color="text-rose-500"
            bgColor="bg-rose-500"
          />
        </div>
      </div>

      {/* Calorie Trend Chart (last 4 weeks) */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Calorie Trend (4 weeks)</h3>
        {trendData.length > 0 ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 9 }}
                  interval="preserveStartEnd"
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={40}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value, name) => {
                    if (name === "calories") return [`${value} cal`, "Intake"];
                    return [String(value), String(name)];
                  }}
                />
                <ReferenceLine
                  y={state.goals.calories}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="4 4"
                  label={{ value: "Goal", fontSize: 10, fill: "hsl(var(--primary))" }}
                />
                <Bar
                  dataKey="calories"
                  radius={[3, 3, 0, 0]}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">
            No data yet — start logging food to see trends.
          </p>
        )}
      </div>

      {/* Daily Deficit Breakdown (this week) */}
      {hasBodyStats && weekly.days.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Daily Deficit Breakdown</h3>
          <div className="space-y-2">
            {weekly.days.map((day) => {
              const isDeficit = day.deficit >= 0;
              return (
                <div key={day.date} className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-muted-foreground tabular-nums shrink-0">
                    {day.date.slice(5)}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden relative">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isDeficit ? "bg-emerald-500/70" : "bg-red-500/70",
                      )}
                      style={{
                        width: `${Math.min(100, (Math.abs(day.deficit) / (day.tdee || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className={cn(
                    "w-20 text-right tabular-nums font-medium shrink-0",
                    isDeficit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
                  )}>
                    {isDeficit ? "-" : "+"}{Math.abs(day.deficit)} cal
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BodyStatsDialog
        open={bodyStatsOpen}
        onOpenChange={setBodyStatsOpen}
        stats={state.bodyStats}
        onSave={handleSaveBodyStats}
      />
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle: string;
  accent: "green" | "amber" | "red" | "muted";
}) {
  const colors = {
    green: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    muted: "text-muted-foreground",
  };

  return (
    <div className="rounded-xl border bg-card p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5", colors[accent])} />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className={cn("text-xl font-bold tabular-nums", colors[accent])}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function MacroAvgCard({
  label,
  avg,
  target,
  color,
  bgColor,
}: {
  label: string;
  avg: number;
  target: number;
  color: string;
  bgColor: string;
}) {
  const pct = target > 0 ? Math.min(100, (avg / target) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <p className={cn("text-xs font-medium", color)}>{label}</p>
      <p className="text-sm font-bold tabular-nums">
        {avg > 0 ? `${avg}g` : "—"}
        <span className="text-[10px] font-normal text-muted-foreground"> / {target}g</span>
      </p>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", bgColor)}
          style={{ width: `${pct}%`, opacity: 0.7 }}
        />
      </div>
    </div>
  );
}
