"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FoodEntryRow } from "./food-entry-row";
import { MEAL_LABELS } from "./types";
import { totalCalories } from "./utils";
import type { FoodEntry, MealType } from "./types";

type Props = {
  meal: MealType;
  entries: FoodEntry[];
  onAdd: (meal: MealType) => void;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (entry: FoodEntry) => void;
};

export function MealSection({ meal, entries, onAdd, onEdit, onDelete }: Props) {
  const mealCals = totalCalories(entries);

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">{MEAL_LABELS[meal]}</h3>
        <span className="text-sm text-muted-foreground tabular-nums">
          {mealCals > 0 ? `${mealCals} cal` : "—"}
        </span>
      </div>

      {entries.length > 0 && (
        <>
          <Separator />
          <div className="px-2 py-1">
            {entries.map((entry) => (
              <FoodEntryRow
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </>
      )}

      {entries.length === 0 && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          No food logged yet
        </div>
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
