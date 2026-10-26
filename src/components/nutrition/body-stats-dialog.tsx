"use client";

import { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ACTIVITY_LABELS } from "./types";
import type { ActivityLevel, BodyStats, Gender } from "./types";
import { bmrCalories, tdeeCalories } from "./stats-utils";

const formSchema = z.object({
  weightKg: z.string().min(1, "Required"),
  heightCm: z.string().min(1, "Required"),
  age: z.string().min(1, "Required"),
  gender: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: BodyStats | undefined;
  onSave: (stats: BodyStats) => void;
};

function toDefaults(stats: BodyStats | undefined): FormValues {
  return {
    weightKg: stats ? String(stats.weightKg) : "",
    heightCm: stats ? String(stats.heightCm) : "",
    age: stats ? String(stats.age) : "",
    gender: stats?.gender ?? "male",
    activityLevel: stats?.activityLevel ?? "moderate",
  };
}

export function BodyStatsDialog({ open, onOpenChange, stats, onSave }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaults(stats),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) form.reset(toDefaults(stats)); }, [open]);

  function onSubmit(values: FormValues) {
    const weightKg = parseFloat(values.weightKg);
    const heightCm = parseFloat(values.heightCm);
    const age = parseInt(values.age, 10);

    if (isNaN(weightKg) || weightKg <= 0) {
      form.setError("weightKg", { message: "Enter a valid weight" });
      return;
    }
    if (isNaN(heightCm) || heightCm <= 0) {
      form.setError("heightCm", { message: "Enter a valid height" });
      return;
    }
    if (isNaN(age) || age <= 0) {
      form.setError("age", { message: "Enter a valid age" });
      return;
    }

    const bodyStats: BodyStats = {
      weightKg,
      heightCm,
      age,
      gender: values.gender as Gender,
      activityLevel: values.activityLevel as ActivityLevel,
    };

    onSave(bodyStats);
    onOpenChange(false);
    toast.success("Body stats saved");
  }

  // Live preview of BMR/TDEE
  const [weightStr, heightStr, ageStr, genderVal, activityVal] = useWatch({
    control: form.control,
    name: ["weightKg", "heightCm", "age", "gender", "activityLevel"],
  });
  const weightVal = parseFloat(weightStr) || 0;
  const heightVal = parseFloat(heightStr) || 0;
  const ageVal = parseInt(ageStr, 10) || 0;

  const canPreview = weightVal > 0 && heightVal > 0 && ageVal > 0;
  const previewStats: BodyStats | null = canPreview
    ? { weightKg: weightVal, heightCm: heightVal, age: ageVal, gender: genderVal as Gender, activityLevel: activityVal as ActivityLevel }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Body Stats</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bs-weight">Weight (kg)</Label>
              <Input id="bs-weight" inputMode="decimal" placeholder="70" {...form.register("weightKg")} />
              {form.formState.errors.weightKg && (
                <p className="text-xs text-destructive">{form.formState.errors.weightKg.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-height">Height (cm)</Label>
              <Input id="bs-height" inputMode="decimal" placeholder="175" {...form.register("heightCm")} />
              {form.formState.errors.heightCm && (
                <p className="text-xs text-destructive">{form.formState.errors.heightCm.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bs-age">Age</Label>
              <Input id="bs-age" inputMode="numeric" placeholder="25" {...form.register("age")} />
              {form.formState.errors.age && (
                <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Controller
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Activity Level</Label>
            <Controller
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Live BMR/TDEE preview */}
          {previewStats && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">BMR (at rest)</span>
                <span className="font-medium tabular-nums">{bmrCalories(previewStats)} cal/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TDEE (with activity)</span>
                <span className="font-medium tabular-nums">{tdeeCalories(previewStats)} cal/day</span>
              </div>
            </div>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
