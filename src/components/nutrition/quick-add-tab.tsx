"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FoodEntry, MealType } from "./types";

const formSchema = z.object({
  name: z.string(),
  calories: z.string().min(1, "Required"),
  proteinG: z.string(),
  carbsG: z.string(),
  fatG: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  meal: MealType;
  onSave: (entry: Omit<FoodEntry, "id">) => void;
  onClose: () => void;
};

export function QuickAddTab({ meal, onSave, onClose }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", calories: "", proteinG: "0", carbsG: "0", fatG: "0" },
  });

  // Reset when meal changes (dialog is reused across meals)
  useEffect(() => { form.reset({ name: "", calories: "", proteinG: "0", carbsG: "0", fatG: "0" }); }, [meal]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: FormValues) {
    const calories = parseFloat(values.calories);
    if (isNaN(calories) || calories < 0) {
      form.setError("calories", { message: "Enter a valid number" });
      return;
    }
    onSave({
      meal,
      name: values.name.trim() || "Quick Add",
      brand: "",
      servingSize: "1 serving",
      servings: 1,
      calories,
      proteinG: parseFloat(values.proteinG) || 0,
      carbsG: parseFloat(values.carbsG) || 0,
      fatG: parseFloat(values.fatG) || 0,
    });
    onClose();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="qa-name">Name <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          id="qa-name"
          placeholder="e.g. Chicken Rice"
          autoFocus
          {...form.register("name")}
        />
      </div>

      {/* Calories */}
      <div className="space-y-1.5">
        <Label htmlFor="qa-calories">Calories</Label>
        <Input
          id="qa-calories"
          inputMode="decimal"
          placeholder="0"
          {...form.register("calories")}
        />
        {form.formState.errors.calories && (
          <p className="text-xs text-destructive">{form.formState.errors.calories.message}</p>
        )}
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="qa-protein" className="text-blue-500">Protein (g)</Label>
          <Input id="qa-protein" inputMode="decimal" placeholder="0" {...form.register("proteinG")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qa-carbs" className="text-amber-500">Carbs (g)</Label>
          <Input id="qa-carbs" inputMode="decimal" placeholder="0" {...form.register("carbsG")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qa-fat" className="text-rose-500">Fat (g)</Label>
          <Input id="qa-fat" inputMode="decimal" placeholder="0" {...form.register("fatG")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">Add</Button>
      </div>
    </form>
  );
}
