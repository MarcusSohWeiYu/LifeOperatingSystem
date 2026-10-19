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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createBudget, updateBudget } from "@/actions/budget";
import type { BudgetItem } from "./budget-client";

const BUDGET_TYPES = ["needs", "wants", "savings"] as const;

const formSchema = z.object({
  category: z.string().min(1, "Category is required"),
  plannedMonthly: z.string().min(1, "Amount is required"),
  type: z.enum(BUDGET_TYPES),
  notes: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: BudgetItem;
  defaultType?: "needs" | "wants" | "savings";
};

function toDefaultValues(
  item?: BudgetItem,
  defaultType?: "needs" | "wants" | "savings"
): FormValues {
  if (!item) {
    return {
      category: "",
      plannedMonthly: "",
      type: defaultType ?? "needs",
      notes: "",
    };
  }
  return {
    category: item.category,
    plannedMonthly: item.plannedMonthly.toString(),
    type: item.type,
    notes: item.notes,
  };
}

export function BudgetForm({ open, onOpenChange, item, defaultType }: Props) {
  const isEdit = !!item;
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(item, defaultType),
  });

  useEffect(() => {
    if (open) form.reset(toDefaultValues(item, defaultType));
  }, [open, item, defaultType]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: FormValues) {
    const plannedMonthly = parseFloat(values.plannedMonthly);
    if (isNaN(plannedMonthly) || plannedMonthly < 0) {
      form.setError("plannedMonthly", {
        message: "Amount must be 0 or more",
      });
      return;
    }
    startTransition(async () => {
      const payload = { ...values, plannedMonthly };
      const result = isEdit
        ? await updateBudget(item.id, payload)
        : await createBudget(payload);

      if (result.ok) {
        toast.success(isEdit ? "Budget item updated" : "Budget item added");
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
            {isEdit ? "Edit budget item" : "Add budget item"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g. Groceries"
              {...form.register("category")}
              aria-invalid={!!form.formState.errors.category}
            />
            {form.formState.errors.category && (
              <p className="text-xs text-destructive">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plannedMonthly">Monthly budget (SGD)</Label>
              <Input
                id="plannedMonthly"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("plannedMonthly")}
                aria-invalid={!!form.formState.errors.plannedMonthly}
              />
              {form.formState.errors.plannedMonthly && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.plannedMonthly.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val ?? "needs")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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
                  : "Add budget item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
