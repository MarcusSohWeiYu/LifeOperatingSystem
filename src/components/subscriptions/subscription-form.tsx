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
import { createSubscription, updateSubscription } from "@/actions/subscriptions";
import type { EnrichedSubscription } from "./subscriptions-client";

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
  category: z.string(),
  nextRenewal: z.string().min(1, "Next renewal date is required"),
  paymentMethod: z.string(),
  active: z.boolean(),
  notes: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: EnrichedSubscription;
  existingCategories: string[];
};

function toDefaultValues(sub?: EnrichedSubscription): FormValues {
  if (!sub) {
    return {
      name: "",
      amount: "",
      frequency: "monthly",
      category: "",
      nextRenewal: "",
      paymentMethod: "",
      active: true,
      notes: "",
    };
  }
  return {
    name: sub.name,
    amount: sub.amount.toString(),
    frequency: sub.frequency,
    category: sub.category,
    nextRenewal: sub.nextRenewalDateStr,
    paymentMethod: sub.paymentMethod,
    active: sub.active,
    notes: sub.notes,
  };
}

export function SubscriptionForm({
  open,
  onOpenChange,
  subscription,
  existingCategories,
}: Props) {
  const isEdit = !!subscription;
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(subscription),
  });

  // Reset form when dialog opens or subscription changes
  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(subscription));
    }
  }, [open, subscription]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: FormValues) {
    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount <= 0) {
      form.setError("amount", { message: "Amount must be a positive number" });
      return;
    }

    startTransition(async () => {
      const payload = { ...values, amount };
      const result = isEdit
        ? await updateSubscription(subscription.id, payload)
        : await createSubscription(payload);

      if (result.ok) {
        toast.success(isEdit ? "Subscription updated" : "Subscription added");
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
            {isEdit ? "Edit subscription" : "Add subscription"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Netflix"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Amount + Frequency */}
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

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              list="category-suggestions"
              placeholder="e.g. Entertainment"
              {...form.register("category")}
            />
            <datalist id="category-suggestions">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Next renewal */}
          <div className="space-y-1.5">
            <Label htmlFor="nextRenewal">Next renewal date</Label>
            <Input
              id="nextRenewal"
              type="date"
              {...form.register("nextRenewal")}
              aria-invalid={!!form.formState.errors.nextRenewal}
            />
            {form.formState.errors.nextRenewal && (
              <p className="text-xs text-destructive">
                {form.formState.errors.nextRenewal.message}
              </p>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <Input
              id="paymentMethod"
              placeholder="e.g. Visa ending 1234"
              {...form.register("paymentMethod")}
            />
          </div>

          {/* Active */}
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

          {/* Notes */}
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
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
