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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createIncome, updateIncome } from "@/actions/income";
import type { EnrichedIncome } from "./income-client";

const FREQUENCIES = [
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required"),
  frequency: z.enum(FREQUENCIES),
  active: z.boolean(),
  notes: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: EnrichedIncome;
};

function toDefaultValues(income?: EnrichedIncome): FormValues {
  if (!income) {
    return {
      name: "",
      amount: "",
      frequency: "monthly",
      active: true,
      notes: "",
    };
  }
  return {
    name: income.name,
    amount: income.amount.toString(),
    frequency: income.frequency,
    active: income.active,
    notes: income.notes,
  };
}

export function IncomeForm({ open, onOpenChange, income }: Props) {
  const isEdit = !!income;
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(income),
  });

  useEffect(() => {
    if (open) form.reset(toDefaultValues(income));
  }, [open, income]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: FormValues) {
    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount <= 0) {
      form.setError("amount", { message: "Amount must be a positive number" });
      return;
    }
    startTransition(async () => {
      const payload = { ...values, amount };
      const result = isEdit
        ? await updateIncome(income.id, payload)
        : await createIncome(payload);

      if (result.ok) {
        toast.success(isEdit ? "Income updated" : "Income source added");
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
          <DialogTitle>
            {isEdit ? "Edit income source" : "Add income source"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Salary"
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
              <Label htmlFor="amount">Amount (SGD)</Label>
              <Input
                id="amount"
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
              <Label>Frequency</Label>
              <Controller
                name="frequency"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val ?? "monthly")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Controller
              name="active"
              control={form.control}
              render={({ field }) => (
                <Switch
                  id="active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="active" className="cursor-pointer">
              Active
            </Label>
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
              {pending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Add income source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
