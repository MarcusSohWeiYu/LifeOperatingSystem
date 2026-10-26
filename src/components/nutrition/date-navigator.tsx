"use client";

import { useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isDateToday } from "./utils";

type Props = {
  date: string;
  onSelect: (date: string) => void;
  onToday: () => void;
};

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

export function DateNavigator({ date, onSelect, onToday }: Props) {
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
              Today
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

          return (
            <button
              key={dayStr}
              type="button"
              onClick={() => onSelect(dayStr)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isDayToday
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
