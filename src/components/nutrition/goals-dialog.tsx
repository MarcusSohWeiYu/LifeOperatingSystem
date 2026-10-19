"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import type { DailyGoals } from "./types";

const formSchema = z
  .object({
    calories: z.string().min(1, "Required"),
    proteinPct: z.string().min(1, "Required"),
    carbsPct: z.string().min(1, "Required"),
    fatPct: z.string().min(1, "Required"),
  })
  .refine(
    (d) => {
      const sum =
        (parseFloat(d.proteinPct) || 0) +
        (parseFloat(d.carbsPct) || 0) +
        (parseFloat(d.fatPct) || 0);
      return Math.abs(sum - 100) < 0.5;
    },
    { message: "Macro percentages must add up to 100%", path: ["fatPct"] },
  );
type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: DailyGoals;
  onSave: (goals: DailyGoals) => void;
};

function toDefaultValues(goals: DailyGoals): FormValues {
  return {
    calories: String(goals.calories),
    proteinPct: String(goals.proteinPct),
    carbsPct: String(goals.carbsPct),
    fatPct: String(goals.fatPct),
  };
}

export function GoalsDialog({ open, onOpenChange, goals, onSave }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(goals),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) form.reset(toDefaultValues(goals)); }, [open]);

  const [proteinPct, carbsPct, fatPct] = useWatch({
    control: form.control,
    name: ["proteinPct", "carbsPct", "fatPct"],
  });

  const macroTotal =
    (parseFloat(proteinPct) || 0) +
    (parseFloat(carbsPct) || 0) +
    (parseFloat(fatPct) || 0);
  const macroOk = Math.abs(macroTotal - 100) < 0.5;

  function onSubmit(values: FormValues) {
    const calories = parseFloat(values.calories);
    if (isNaN(calories) || calories <= 0) {
      form.setError("calories", { message: "Enter a valid number" });
      return;
    }
    onSave({
      calories,
      proteinPct: parseFloat(values.proteinPct),
      carbsPct: parseFloat(values.carbsPct),
      fatPct: parseFloat(values.fatPct),
    });
    onOpenChange(false);
    toast.success("Goals updated");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Daily nutrition goals</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Calorie target */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-cal">Daily calorie target</Label>
            <Input
              id="goal-cal"
              inputMode="decimal"
              placeholder="2000"
              {...form.register("calories")}
            />
            {form.formState.errors.calories && (
              <p className="text-xs text-destructive">{form.formState.errors.calories.message}</p>
            )}
          </div>

          {/* Macro split */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Macro split</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="goal-protein" className="text-blue-500">Protein %</Label>
                <Input
                  id="goal-protein"
                  inputMode="decimal"
                  placeholder="30"
                  {...form.register("proteinPct")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-carbs" className="text-amber-500">Carbs %</Label>
                <Input
                  id="goal-carbs"
                  inputMode="decimal"
                  placeholder="40"
                  {...form.register("carbsPct")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-fat" className="text-rose-500">Fat %</Label>
                <Input
                  id="goal-fat"
                  inputMode="decimal"
                  placeholder="30"
                  {...form.register("fatPct")}
                />
              </div>
            </div>

            {/* Live total indicator */}
            <p className={cn("text-xs font-medium", macroOk ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
              Total: {macroTotal}%{macroOk ? " ✓" : " (must equal 100%)"}
            </p>

            {form.formState.errors.fatPct && (
              <p className="text-xs text-destructive">{form.formState.errors.fatPct.message}</p>
            )}
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit">Save goals</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
