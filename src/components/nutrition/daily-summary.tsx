"use client";

import { Settings2Icon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DailyGoals, FoodEntry } from "./types";
import {
  totalCalories,
  totalProteinG,
  totalCarbsG,
  totalFatG,
  proteinGramsTarget,
  carbsGramsTarget,
  fatGramsTarget,
} from "./utils";

type Props = {
  goals: DailyGoals;
  entries: FoodEntry[];
  onEditGoals: () => void;
};

const MACRO_COLORS = {
  protein: "#3b82f6",
  carbs: "#f59e0b",
  fat: "#f43f5e",
};

export function DailySummary({ goals, entries, onEditGoals }: Props) {
  const consumed = totalCalories(entries);
  const remaining = goals.calories - consumed;
  const isOver = remaining < 0;

  const protein = totalProteinG(entries);
  const carbs = totalCarbsG(entries);
  const fat = totalFatG(entries);

  const proteinTarget = proteinGramsTarget(goals);
  const carbsTarget = carbsGramsTarget(goals);
  const fatTarget = fatGramsTarget(goals);

  const hasMacros = protein > 0 || carbs > 0 || fat > 0;
  const donutData = hasMacros
    ? [
        { name: "Protein", value: protein, color: MACRO_COLORS.protein },
        { name: "Carbs", value: carbs, color: MACRO_COLORS.carbs },
        { name: "Fat", value: fat, color: MACRO_COLORS.fat },
      ]
    : [{ name: "Empty", value: 1, color: "#e2e8f0" }];

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Daily Summary</h2>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onEditGoals}
          aria-label="Edit nutrition goals"
        >
          <Settings2Icon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Calorie headline + donut */}
      <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
        {/* 3-stat row */}
        <div className="grid grid-cols-3 gap-2">
          <CalorieStat label="Goal" value={goals.calories} />
          <CalorieStat label="Food" value={consumed} />
          <CalorieStat
            label="Remaining"
            value={Math.abs(remaining)}
            prefix={isOver ? "+" : undefined}
            isOver={isOver}
          />
        </div>

        {/* Donut */}
        <div className="relative w-20 h-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={26}
                outerRadius={36}
                dataKey="value"
                strokeWidth={0}
              >
                {donutData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              {hasMacros && (
                <Tooltip
                  formatter={(value, name) => [`${Number(value).toFixed(1)}g`, name]}
                  contentStyle={{ fontSize: 11 }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-semibold tabular-nums">{consumed}</span>
          </div>
        </div>
      </div>

      {/* Macro progress bars */}
      <div className="space-y-2.5">
        <MacroBar
          label="Protein"
          consumed={protein}
          target={proteinTarget}
          color="bg-blue-500"
          indicatorColor={MACRO_COLORS.protein}
        />
        <MacroBar
          label="Carbs"
          consumed={carbs}
          target={carbsTarget}
          color="bg-amber-500"
          indicatorColor={MACRO_COLORS.carbs}
        />
        <MacroBar
          label="Fat"
          consumed={fat}
          target={fatTarget}
          color="bg-rose-500"
          indicatorColor={MACRO_COLORS.fat}
        />
      </div>
    </div>
  );
}

function CalorieStat({
  label,
  value,
  prefix,
  isOver,
}: {
  label: string;
  value: number;
  prefix?: string;
  isOver?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={cn(
          "text-xl font-bold tabular-nums leading-tight",
          isOver && "text-destructive",
        )}
      >
        {prefix}{value.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function MacroBar({
  label,
  consumed,
  target,
  indicatorColor,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
  indicatorColor: string;
}) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const isOver = consumed > target;

  return (
    <Progress value={pct} className="gap-0">
      <div className="flex items-center justify-between mb-1">
        <ProgressLabel className="text-xs font-medium">{label}</ProgressLabel>
        <span className="ml-auto text-xs tabular-nums">
          <span className={cn(isOver && "text-destructive")}>{consumed}</span>
          <span className="text-muted-foreground">/{target}g</span>
        </span>
      </div>
      <ProgressTrack>
        <ProgressIndicator style={{ backgroundColor: indicatorColor }} />
      </ProgressTrack>
    </Progress>
  );
}
