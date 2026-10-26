"use client";

import { useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isDateToday, totalCalories } from "./utils";
import type { DailyLog, DailyGoals } from "./types";

type Props = {
  date: string;
  logs: Record<string, DailyLog>;
  goals: DailyGoals;
  onSelect: (date: string) => void;
  onToday: () => void;
};

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/** Returns a ring color based on how much calories exceeded the goal.
 *  - no data or on track → green
 *  - exceeded by ≤15% → amber
 *  - exceeded by >15% → red
 */
function dayStatus(
  dayStr: string,
  logs: Record<string, DailyLog>,
  goals: DailyGoals,
): "none" | "green" | "amber" | "red" {
  const log = logs[dayStr];
  if (!log || log.entries.length === 0) return "none";

  const consumed = totalCalories(log.entries);
  const target = goals.calories;
  if (target <= 0) return "none";

  const ratio = consumed / target;
  if (ratio <= 1) return "green";
  if (ratio <= 1.15) return "amber";
  return "red";
}

const STATUS_RING: Record<string, string> = {
  none: "",
  green: "ring-2 ring-emerald-500/60",
  amber: "ring-2 ring-amber-500/60",
  red: "ring-2 ring-red-500/60",
};

export function DateNavigator({ date, logs, goals, onSelect, onToday }: Props) {
  const selected = parseDate(date);
  const isToday = isDateToday(date);

  // Build the week (Mon–Sun) containing the selected date
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selected, { weekStartsOn: 1 }); // Monday
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [selected]);

  function handlePrevWeek() {
    onSelect(format(addDays(selected, -7), "yyyy-MM-dd"));
  }

  function handleNextWeek() {
    onSelect(format(addDays(selected, 7), "yyyy-MM-dd"));
  }

  // Month + year header
  const monthLabel = format(selected, "MMMM yyyy");

  return (
    <div className="space-y-2">
      {/* Month header + nav arrows */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={handlePrevWeek} aria-label="Previous week">
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{monthLabel}</span>
          {!isToday && (
            <button
              onClick={onToday}
              className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground"
            >
              Back to today
            </button>
          )}
        </div>

        <Button variant="ghost" size="icon-sm" onClick={handleNextWeek} aria-label="Next week">
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selected);
          const isDayToday = isSameDay(day, new Date());
          const status = dayStatus(dayStr, logs, goals);

          return (
            <button
              key={dayStr}
              type="button"
              onClick={() => onSelect(dayStr)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isDayToday
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                // Status ring (only when not selected — selected has its own bg)
                !isSelected && STATUS_RING[status],
              )}
            >
              <span className="text-[10px] font-medium uppercase leading-none">
                {format(day, "EEE")}
              </span>
              <span className={cn(
                "text-sm font-semibold leading-none tabular-nums",
                isSelected && "text-primary-foreground",
              )}>
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
