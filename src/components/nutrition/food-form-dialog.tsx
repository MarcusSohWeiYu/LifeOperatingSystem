"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MEAL_LABELS } from "./types";
import type { FoodEntry, MealType } from "./types";

const formSchema = z.object({
  name: z.string(),
  brand: z.string(),
  servingSize: z.string(),
  servings: z.string().min(1, "Required"),
  calories: z.string().min(1, "Required"),
  proteinG: z.string(),
  carbsG: z.string(),
  fatG: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: MealType;
  entry?: FoodEntry;
  prefill?: Omit<FoodEntry, "id" | "meal">;
  onSave: (entry: Omit<FoodEntry, "id">, existingId?: string) => void;
};

function toDefaultValues(entry?: FoodEntry, prefill?: Omit<FoodEntry, "id" | "meal">): FormValues {
  if (entry) {
    return {
      name: entry.name,
      brand: entry.brand,
      servingSize: entry.servingSize,
      servings: String(entry.servings),
      calories: String(entry.calories),
      proteinG: String(entry.proteinG),
      carbsG: String(entry.carbsG),
      fatG: String(entry.fatG),
    };
  }
  if (prefill) {
    return {
      name: prefill.name,
      brand: prefill.brand,
      servingSize: prefill.servingSize,
      servings: String(prefill.servings),
      calories: String(prefill.calories),
      proteinG: String(prefill.proteinG),
      carbsG: String(prefill.carbsG),
      fatG: String(prefill.fatG),
    };
  }
  return {
    name: "",
    brand: "",
    servingSize: "1 serving",
    servings: "1",
    calories: "",
    proteinG: "0",
    carbsG: "0",
    fatG: "0",
  };
}

export function FoodFormDialog({ open, onOpenChange, meal, entry, prefill, onSave }: Props) {
  const isEdit = !!entry;
  const hasPrefill = !isEdit && !!prefill;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(entry, prefill),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) form.reset(toDefaultValues(entry, prefill)); }, [open]);

  function onSubmit(values: FormValues) {
    const calories = parseFloat(values.calories);
    if (isNaN(calories) || calories < 0) {
      form.setError("calories", { message: "Enter a valid number" });
      return;
    }
    const servings = parseFloat(values.servings);
    if (isNaN(servings) || servings <= 0) {
      form.setError("servings", { message: "Enter a valid number" });
      return;
    }
    const proteinG = parseFloat(values.proteinG) || 0;
    const carbsG = parseFloat(values.carbsG) || 0;
    const fatG = parseFloat(values.fatG) || 0;

    onSave(
      { meal, name: values.name, brand: values.brand, servingSize: values.servingSize, servings, calories, proteinG, carbsG, fatG },
      isEdit ? entry.id : undefined,
    );
    onOpenChange(false);
    toast.success(isEdit ? "Food updated" : "Food added");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit food" : hasPrefill ? "Confirm & add" : `Add to ${MEAL_LABELS[meal]}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Chicken Rice" {...form.register("name")} />
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="brand" placeholder="e.g. Pastamania" {...form.register("brand")} />
          </div>

          {/* Serving size + servings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="servingSize">Serving size</Label>
              <Input id="servingSize" placeholder="1 cup, 100g…" {...form.register("servingSize")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="servings">Servings</Label>
              <Input id="servings" inputMode="decimal" placeholder="1" {...form.register("servings")} />
              {form.formState.errors.servings && (
                <p className="text-xs text-destructive">{form.formState.errors.servings.message}</p>
              )}
            </div>
          </div>

          {/* Calories */}
          <div className="space-y-1.5">
            <Label htmlFor="calories">Calories (per serving)</Label>
            <Input id="calories" inputMode="decimal" placeholder="0" {...form.register("calories")} />
            {form.formState.errors.calories && (
              <p className="text-xs text-destructive">{form.formState.errors.calories.message}</p>
            )}
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proteinG" className="text-blue-500">Protein (g)</Label>
              <Input id="proteinG" inputMode="decimal" placeholder="0" {...form.register("proteinG")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="carbsG" className="text-amber-500">Carbs (g)</Label>
              <Input id="carbsG" inputMode="decimal" placeholder="0" {...form.register("carbsG")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fatG" className="text-rose-500">Fat (g)</Label>
              <Input id="fatG" inputMode="decimal" placeholder="0" {...form.register("fatG")} />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit">
              {isEdit ? "Save changes" : "Add food"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
