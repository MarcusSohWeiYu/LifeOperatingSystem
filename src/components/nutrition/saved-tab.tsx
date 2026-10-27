"use client";

import { useState } from "react";
import { BookmarkIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { SavedFood } from "./types";

type Props = {
  savedFoods: SavedFood[];
  onSelect: (food: SavedFood) => void;
  onRemove: (id: string) => void;
  onDirectAdd: (food: SavedFood) => void;
  onUpdate: (food: SavedFood) => void;
};

export function SavedTab({ savedFoods, onSelect, onRemove, onDirectAdd, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

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
      {savedFoods.map((food) =>
        editingId === food.id ? (
          <EditRow
            key={food.id}
            food={food}
            onSave={(updated) => { onUpdate(updated); setEditingId(null); }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={food.id}
            className="rounded-lg px-2 py-2 hover:bg-muted/50 space-y-1"
          >
            {/* Main row */}
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{food.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {food.brand ? `${food.brand} · ` : ""}
                  {food.servingSize || "1 serving"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {food.calories} cal
              </span>
            </div>

            {/* Macro detail */}
            <p className="text-[10px] text-muted-foreground tabular-nums">
              P {food.proteinG}g · C {food.carbsG}g · F {food.fatG}g
            </p>

            {/* Action buttons — always visible */}
            <div className="flex items-center gap-1 pt-0.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs flex-1"
                onClick={() => onDirectAdd(food)}
              >
                <PlusIcon className="h-3 w-3" />
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs flex-1"
                onClick={() => onSelect(food)}
              >
                Adjust & Add
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditingId(food.id)}
                title="Edit"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => { onRemove(food.id); toast.success("Removed from saved"); }}
                title="Delete"
              >
                <Trash2Icon className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function EditRow({
  food,
  onSave,
  onCancel,
}: {
  food: SavedFood;
  onSave: (updated: SavedFood) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(food.name);
  const [brand, setBrand] = useState(food.brand);
  const [servingSize, setServingSize] = useState(food.servingSize);
  const [calories, setCalories] = useState(String(food.calories));
  const [proteinG, setProteinG] = useState(String(food.proteinG));
  const [carbsG, setCarbsG] = useState(String(food.carbsG));
  const [fatG, setFatG] = useState(String(food.fatG));

  function handleSave() {
    onSave({
      ...food,
      name: name.trim() || food.name,
      brand: brand.trim(),
      servingSize: servingSize.trim(),
      calories: parseFloat(calories) || food.calories,
      proteinG: parseFloat(proteinG) || 0,
      carbsG: parseFloat(carbsG) || 0,
      fatG: parseFloat(fatG) || 0,
    });
    toast.success("Saved food updated");
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1 col-span-2">
          <Label className="text-[10px]">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-base md:text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Brand</Label>
          <Input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="h-8 text-base md:text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Serving</Label>
          <Input
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            className="h-8 text-base md:text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Calories</Label>
          <Input
            inputMode="decimal"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="h-8 text-base md:text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Protein</Label>
          <Input
            inputMode="decimal"
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
            className="h-8 text-base md:text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Carbs</Label>
          <Input
            inputMode="decimal"
            value={carbsG}
            onChange={(e) => setCarbsG(e.target.value)}
            className="h-8 text-base md:text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Fat</Label>
          <Input
            inputMode="decimal"
            value={fatG}
            onChange={(e) => setFatG(e.target.value)}
            className="h-8 text-base md:text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" className="h-7 flex-1" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="outline" className="h-7 flex-1" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
