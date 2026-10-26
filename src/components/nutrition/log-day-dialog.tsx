"use client";

import { useState } from "react";
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
import { FootprintsIcon, DumbbellIcon, FlameIcon } from "lucide-react";
import { toast } from "sonner";
import type { DailyBalance } from "./stats-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  balance: DailyBalance;
  currentSteps: number;
  currentWorkoutCals: number;
  onSave: (steps: number, workoutCals: number) => void;
};

export function LogDayDialog({
  open,
  onOpenChange,
  date,
  balance,
  currentSteps,
  currentWorkoutCals,
  onSave,
}: Props) {
  const [stepsStr, setStepsStr] = useState(() =>
    currentSteps > 0 ? String(currentSteps) : "",
  );
  const [workoutStr, setWorkoutStr] = useState(() =>
    currentWorkoutCals > 0 ? String(currentWorkoutCals) : "",
  );

  function handleSave() {
    const steps = parseInt(stepsStr, 10);
    const workout = parseInt(workoutStr, 10);
    onSave(
      isNaN(steps) || steps < 0 ? 0 : steps,
      isNaN(workout) || workout < 0 ? 0 : workout,
    );
    onOpenChange(false);
    toast.success(`Logged activity for ${date.slice(5)}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Log Activity — {date.slice(5)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto calories */}
          <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2.5">
            <FlameIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Food intake (auto)</p>
              <p className="text-sm font-bold tabular-nums">{balance.intake.toLocaleString()} cal</p>
            </div>
          </div>

          {/* Steps input */}
          <div className="space-y-1.5">
            <Label htmlFor="log-steps" className="flex items-center gap-1.5">
              <FootprintsIcon className="h-3.5 w-3.5" />
              Steps
            </Label>
            <Input
              id="log-steps"
              inputMode="numeric"
              placeholder="0"
              value={stepsStr}
              onChange={(e) => setStepsStr(e.target.value)}
              className="text-base md:text-sm"
            />
            {stepsStr && !isNaN(parseInt(stepsStr, 10)) && parseInt(stepsStr, 10) > 0 && (
              <p className="text-[10px] text-muted-foreground">
                ≈ {balance.stepsBurned} cal burned from steps
              </p>
            )}
          </div>

          {/* Workout calories input */}
          <div className="space-y-1.5">
            <Label htmlFor="log-workout" className="flex items-center gap-1.5">
              <DumbbellIcon className="h-3.5 w-3.5" />
              Workout calories burned
            </Label>
            <Input
              id="log-workout"
              inputMode="numeric"
              placeholder="0"
              value={workoutStr}
              onChange={(e) => setWorkoutStr(e.target.value)}
              className="text-base md:text-sm"
            />
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
