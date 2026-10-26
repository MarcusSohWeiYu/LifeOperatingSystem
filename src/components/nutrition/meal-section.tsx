"use client";

import { CopyIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FoodEntryRow } from "./food-entry-row";
import { MEAL_LABELS } from "./types";
import { totalCalories, totalProteinG, totalCarbsG, totalFatG } from "./utils";
import type { FoodEntry, MealType } from "./types";

type Props = {
  meal: MealType;
  entries: FoodEntry[];
  savedFoodIds: Set<string>;
  previousDayCount: number;
  onAdd: (meal: MealType) => void;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (entry: FoodEntry) => void;
  onToggleSave: (entry: FoodEntry) => void;
  onCopyPrevious: () => void;
};

export function MealSection({ meal, entries, savedFoodIds, previousDayCount, onAdd, onEdit, onDelete, onToggleSave, onCopyPrevious }: Props) {
  const mealCals = totalCalories(entries);
  const mealProtein = totalProteinG(entries);
  const mealCarbs = totalCarbsG(entries);
  const mealFat = totalFatG(entries);
  const hasEntries = entries.length > 0;

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">{MEAL_LABELS[meal]}</h3>
        {hasEntries ? (
          <div className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
            <span><span className="font-medium text-blue-500">P</span> {mealProtein}g</span>
            <span><span className="font-medium text-amber-500">C</span> {mealCarbs}g</span>
            <span><span className="font-medium text-rose-500">F</span> {mealFat}g</span>
            <span className="text-sm font-medium text-foreground">{mealCals} cal</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{"\u2014"}</span>
        )}
      </div>

      {hasEntries && (
        <>
          <Separator />
          <div className="px-2 py-1">
            {entries.map((entry) => (
              <FoodEntryRow
                key={entry.id}
                entry={entry}
                saved={savedFoodIds.has(`${entry.name}|${entry.brand}|${entry.servingSize}`)}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </>
      )}

      {!hasEntries && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          No food logged yet
        </div>
      )}

      {!hasEntries && previousDayCount > 0 && (
        <>
          <Separator />
          <button
            type="button"
            onClick={onCopyPrevious}
            className="flex items-center gap-1.5 px-4 py-2 w-full text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <CopyIcon className="h-3 w-3" />
            Copy yesterday&apos;s {MEAL_LABELS[meal].toLowerCase()} ({previousDayCount} item{previousDayCount !== 1 ? "s" : ""})
          </button>
        </>
      )}

      <Separator />

      {/* Add button */}
      <div className="flex gap-2 px-3 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => onAdd(meal)}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Food
        </Button>
      </div>
    </div>
  );
}
