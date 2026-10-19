"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDisplayDate, isDateToday } from "./utils";

type Props = {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function DateNavigator({ date, onPrev, onNext, onToday }: Props) {
  const isToday = isDateToday(date);

  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" size="icon-sm" onClick={onPrev} aria-label="Previous day">
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{formatDisplayDate(date)}</span>
        {!isToday && (
          <button
            onClick={onToday}
            className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground"
          >
            Today
          </button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onNext}
        disabled={isToday}
        aria-label="Next day"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
