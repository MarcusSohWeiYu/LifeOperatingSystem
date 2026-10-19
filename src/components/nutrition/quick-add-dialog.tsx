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
import type { MealType, FoodEntry } from "./types";

const formSchema = z.object({
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
  onSave: (entry: Omit<FoodEntry, "id">) => void;
};

export function QuickAddDialog({ open, onOpenChange, meal, onSave }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { calories: "", proteinG: "0", carbsG: "0", fatG: "0" },
  });

  useEffect(() => { if (open) form.reset({ calories: "", proteinG: "0", carbsG: "0", fatG: "0" }); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: FormValues) {
    const calories = parseFloat(values.calories);
    if (isNaN(calories) || calories < 0) {
      form.setError("calories", { message: "Enter a valid number" });
      return;
    }

    onSave({
      meal,
      name: "Quick Add",
      brand: "",
      servingSize: "1 serving",
      servings: 1,
      calories,
      proteinG: parseFloat(values.proteinG) || 0,
      carbsG: parseFloat(values.carbsG) || 0,
      fatG: parseFloat(values.fatG) || 0,
    });
    onOpenChange(false);
    toast.success("Food added");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Quick Add — {MEAL_LABELS[meal]}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qa-calories">Calories</Label>
            <Input
              id="qa-calories"
              inputMode="decimal"
              placeholder="0"
              autoFocus
              {...form.register("calories")}
            />
            {form.formState.errors.calories && (
              <p className="text-xs text-destructive">{form.formState.errors.calories.message}</p>
            )}
          </div>

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

          <DialogFooter showCloseButton>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
