"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FoodEntry } from "./types";
import { effectiveCalories, effectiveCarbsG, effectiveFatG, effectiveProteinG } from "./utils";

type Props = {
  entry: FoodEntry;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (entry: FoodEntry) => void;
};

export function FoodEntryRow({ entry, onEdit, onDelete }: Props) {
  const cals = effectiveCalories(entry);
  const protein = effectiveProteinG(entry);
  const carbs = effectiveCarbsG(entry);
  const fat = effectiveFatG(entry);

  const displayName = entry.name || "Quick Add";
  const servingLabel = entry.servings !== 1
    ? `${entry.servings}× ${entry.servingSize}`
    : entry.servingSize;

  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50 group">
      {/* Name + serving */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {entry.brand ? `${entry.brand} · ` : ""}
          {servingLabel || "1 serving"}
        </p>
      </div>

      {/* Macros — hidden on mobile, shown on md+ */}
      <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
        <MacroChip label="P" value={protein} color="text-blue-500" />
        <MacroChip label="C" value={carbs} color="text-amber-500" />
        <MacroChip label="F" value={fat} color="text-rose-500" />
      </div>

      {/* Calories */}
      <span className={cn("w-14 text-right text-sm font-medium tabular-nums shrink-0")}>
        {cals} cal
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onEdit(entry)}
          aria-label={`Edit ${displayName}`}
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onDelete(entry)}
          aria-label={`Delete ${displayName}`}
        >
          <Trash2Icon className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function MacroChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span>
      <span className={cn("font-medium", color)}>{label}</span>{" "}
      {value}g
    </span>
  );
}
