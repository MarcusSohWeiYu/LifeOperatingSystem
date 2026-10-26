"use client";

import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEAL_LABELS, MEAL_ORDER } from "../types";
import type { MealType } from "../types";
import type { AiFoodItem } from "./types";

type Props = {
  item: AiFoodItem;
  logged: boolean;
  onLog: (meal: MealType) => void;
};

export function FoodItemCard({ item, logged, onLog }: Props) {
  return (
    <div className="rounded-lg border bg-card p-3 text-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{item.name}</p>
          {item.brand && (
            <p className="text-xs text-muted-foreground">{item.brand}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {item.servingSize} &middot; {item.servings} serving{item.servings !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-right font-semibold tabular-nums">
          {item.calories} kcal
        </span>
      </div>

      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>P {item.proteinG}g</span>
        <span>C {item.carbsG}g</span>
        <span>F {item.fatG}g</span>
      </div>

      {logged ? (
        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckIcon className="h-3.5 w-3.5" />
          Logged
        </div>
      ) : (
        <div className="flex gap-1.5 flex-wrap">
          {MEAL_ORDER.map((meal) => (
            <Button
              key={meal}
              variant="outline"
              size="xs"
              onClick={() => onLog(meal)}
            >
              {MEAL_LABELS[meal]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
