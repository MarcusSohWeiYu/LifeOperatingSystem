"use client";
import { useEffect, useTransition } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toCents, formatSGD } from "@/lib/finance/money";
import { monthsRemaining, requiredMonthlyCents } from "@/lib/finance/goals";
import { createGoal, updateGoal } from "@/actions/goals";
import type { EnrichedGoal } from "./goals-client";

const GOAL_TYPES = ["trip", "purchase", "other"] as const;

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(GOAL_TYPES),
  targetAmount: z.string().min(1, "Target amount is required"),
  targetDate: z.string().min(1, "Target date is required"),
  priority: z.string().min(1, "Priority is required"),
  notes: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: EnrichedGoal;
};

function toDefaultValues(goal?: EnrichedGoal): FormValues {
  if (!goal) {
    return {
      name: "",
      type: "trip",
      targetAmount: "",
      targetDate: "",
      priority: "1",
      notes: "",
    };
  }
  return {
    name: goal.name,
    type: goal.type,
    targetAmount: goal.targetAmount.toString(),
    targetDate: goal.targetDate,
    priority: goal.priority.toString(),
    notes: goal.notes,
  };
}

function LivePreview({
  targetAmount,
  targetDate,
  savedCents,
}: {
  targetAmount: string;
  targetDate: string;
  savedCents: number;
}) {
  const amount = parseFloat(targetAmount);
  const today = new Date();

  if (!targetDate || isNaN(amount) || amount <= 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Enter target amount and date to see monthly saving estimate.
      </p>
    );
  }

  const months = monthsRemaining(targetDate, today);
  const required = requiredMonthlyCents(toCents(amount), savedCents, months);

  if (months === 0) {
    return (
      <p className="text-xs text-destructive">Target date is in the past.</p>
    );
  }

  return (
    <p className="text-sm font-medium text-primary">
      Save {formatSGD(required)}/month ({months} month{months !== 1 ? "s" : ""}{" "}
      left)
    </p>
  );
}

export function GoalForm({ open, onOpenChange, goal }: Props) {
  const isEdit = !!goal;
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(goal),
  });

  const targetAmount = useWatch({ control: form.control, name: "targetAmount" });
  const targetDate = useWatch({ control: form.control, name: "targetDate" });

  useEffect(() => {
    if (open) form.reset(toDefaultValues(goal));
  }, [open, goal]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: FormValues) {
    const targetAmountNum = parseFloat(values.targetAmount);
    const priorityNum = parseInt(values.priority, 10);

    if (isNaN(targetAmountNum) || targetAmountNum <= 0) {
      form.setError("targetAmount", { message: "Must be a positive number" });
      return;
    }
    if (isNaN(priorityNum) || priorityNum < 1) {
      form.setError("priority", { message: "Must be a positive integer" });
      return;
    }

    startTransition(async () => {
      const payload = {
        name: values.name,
        type: values.type,
        targetAmount: targetAmountNum,
        targetDate: values.targetDate,
        priority: priorityNum,
        notes: values.notes,
        status: goal?.status ?? "active",
      };
      const result = isEdit
        ? await updateGoal(goal.id, payload)
        : await createGoal(payload);

      if (result.ok) {
        toast.success(isEdit ? "Goal updated" : "Goal added");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit goal" : "Add goal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Japan Trip"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val ?? "trip")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                {...form.register("priority")}
                aria-invalid={!!form.formState.errors.priority}
              />
              {form.formState.errors.priority && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetAmount">Target (SGD)</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...form.register("targetAmount")}
                aria-invalid={!!form.formState.errors.targetAmount}
              />
              {form.formState.errors.targetAmount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.targetAmount.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetDate">Target date</Label>
              <Input
                id="targetDate"
                type="date"
                {...form.register("targetDate")}
                aria-invalid={!!form.formState.errors.targetDate}
              />
              {form.formState.errors.targetDate && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.targetDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <LivePreview
              targetAmount={targetAmount}
              targetDate={targetDate}
              savedCents={goal?.savedCents ?? 0}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes"
              rows={2}
              {...form.register("notes")}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
