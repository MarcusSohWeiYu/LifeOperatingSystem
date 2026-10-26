"use client";

import { useState, useEffect } from "react";
import { Settings2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [showConsumed, setShowConsumed] = useState(false);

  // Trigger mount animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const protein = totalProteinG(entries);
  const carbs = totalCarbsG(entries);
  const fat = totalFatG(entries);

  const proteinTarget = proteinGramsTarget(goals);
  const carbsTarget = carbsGramsTarget(goals);
  const fatTarget = fatGramsTarget(goals);

  // Ring geometry
  const ringRadius = 54;
  const ringStroke = 11;
  const ringCenter = ringRadius + ringStroke / 2;
  const ringSize = ringCenter * 2;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = goals.calories > 0 ? Math.min(consumed / goals.calories, 1.5) : 0;
  const arcLength = mounted ? circumference * Math.min(progress, 1) : 0;

  // Ring color: green → amber → red based on budget usage
  const ringColor = progress <= 0.75 ? "#22c55e" : progress <= 1 ? "#f59e0b" : "#ef4444";

  return (
    <div className="rounded-xl border bg-card p-4 space-y-5 ring-1 ring-primary/10 bg-gradient-to-b from-primary/[0.04] to-transparent">
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

      {/* Calorie ring — hero */}
      <div className="flex flex-col items-center gap-2.5">
        <button
          type="button"
          className="relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
          style={{ width: ringSize, height: ringSize }}
          onClick={() => setShowConsumed((v) => !v)}
          aria-label="Toggle remaining and consumed calories"
        >
          <svg
            width={ringSize}
            height={ringSize}
            className="block -rotate-90"
          >
            {/* Background track */}
            <circle
              cx={ringCenter}
              cy={ringCenter}
              r={ringRadius}
              fill="none"
              className="stroke-muted"
              strokeWidth={ringStroke}
            />
            {/* Progress arc */}
            <circle
              cx={ringCenter}
              cy={ringCenter}
              r={ringRadius}
              fill="none"
              stroke={ringColor}
              strokeWidth={ringStroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - arcLength}
              style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1), stroke 400ms ease" }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className={cn(
                "text-2xl font-bold tabular-nums leading-none transition-colors duration-300",
                isOver && !showConsumed && "text-destructive",
              )}
            >
              {showConsumed
                ? consumed.toLocaleString()
                : `${isOver ? "+" : ""}${Math.abs(remaining).toLocaleString()}`
              }
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
              {showConsumed ? "eaten" : isOver ? "over" : "remaining"}
            </span>
          </div>
        </button>

        {/* Eaten / Goal subtitle */}
        <p className="text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">{consumed.toLocaleString()}</span>
          {" eaten  /  "}
          <span className="font-medium text-foreground">{goals.calories.toLocaleString()}</span>
          {" goal"}
        </p>
      </div>

      {/* Macro progress bars */}
      <div className="space-y-3">
        <MacroBar
          label="Protein"
          consumed={protein}
          target={proteinTarget}
          color={MACRO_COLORS.protein}
          mounted={mounted}
          delay={0}
        />
        <MacroBar
          label="Carbs"
          consumed={carbs}
          target={carbsTarget}
          color={MACRO_COLORS.carbs}
          mounted={mounted}
          delay={80}
        />
        <MacroBar
          label="Fat"
          consumed={fat}
          target={fatTarget}
          color={MACRO_COLORS.fat}
          mounted={mounted}
          delay={160}
        />
      </div>
    </div>
  );
}

function MacroBar({
  label,
  consumed,
  target,
  color,
  mounted,
  delay,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
  mounted: boolean;
  delay: number;
}) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const isOver = consumed > target;
  const diff = Math.abs(Math.round((consumed - target) * 10) / 10);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-xs tabular-nums">
          <span className={cn("font-medium", isOver && "text-destructive")}>
            {consumed}
          </span>
          <span className="text-muted-foreground"> / {target}g</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: mounted ? `${pct}%` : "0%",
            backgroundColor: color,
            transition: `width 600ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
          }}
        />
      </div>
      <p className={cn(
        "text-[10px] tabular-nums",
        isOver ? "text-destructive/70" : "text-muted-foreground",
      )}>
        {target > 0 && consumed > 0
          ? isOver
            ? `${diff}g over`
            : consumed >= target
              ? "Goal reached"
              : `${diff}g left`
          : null
        }
      </p>
    </div>
  );
}
