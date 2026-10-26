"use client";

import { BookmarkIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SavedFood } from "./types";

type Props = {
  savedFoods: SavedFood[];
  onSelect: (food: SavedFood) => void;
  onRemove: (id: string) => void;
};

export function SavedTab({ savedFoods, onSelect, onRemove }: Props) {
  if (savedFoods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookmarkIcon className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">No saved foods</p>
        <p className="text-xs text-muted-foreground mt-1">
          Bookmark foods from your log to save them here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 pt-2 max-h-80 overflow-y-auto">
      {savedFoods.map((food) => (
        <div
          key={food.id}
          className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50 cursor-pointer group"
          onClick={() => onSelect(food)}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{food.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {food.brand ? `${food.brand} · ` : ""}
              {food.servingSize || "1 serving"}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
            <span>{food.calories} cal</span>
          </div>

          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onRemove(food.id); }}
            aria-label={`Remove ${food.name} from saved`}
          >
            <Trash2Icon className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
