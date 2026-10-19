"use client";
import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createContribution } from "@/actions/contributions";
import type { GoalOption } from "./budget-client";

const formSchema = z.object({
  goalId: z.string().min(1, "Please select a goal"),
  amount: z.string().min(1, "Amount is required"),
  note: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: GoalOption[];
};

export function GoalFundingForm({ open, onOpenChange, goals }: Props) {
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { goalId: "", amount: "", note: "" },
  });

  useEffect(() => {
    if (open) form.reset({ goalId: "", amount: "", note: "" });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: FormValues) {
    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount <= 0) {
      form.setError("amount", { message: "Amount must be a positive number" });
      return;
    }

    startTransition(async () => {
      const result = await createContribution({
        goalId: values.goalId,
        amount,
        date: todayISO(),
        note: values.note,
      });

      if (result.ok) {
        toast.success("Goal funded this month");
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
          <DialogTitle>Fund a goal this month</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Goal</Label>
            <Controller
              name="goalId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => field.onChange(val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a goal…" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.goalId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.goalId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gf-amount">Amount this month (SGD)</Label>
            <Input
              id="gf-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...form.register("amount")}
              aria-invalid={!!form.formState.errors.amount}
            />
            {form.formState.errors.amount && (
              <p className="text-xs text-destructive">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gf-note">Note (optional)</Label>
            <Input
              id="gf-note"
              placeholder="e.g. September savings"
              {...form.register("note")}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
