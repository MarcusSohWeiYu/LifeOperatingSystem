"use client";
import { useEffect, useTransition } from "react";
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
import { createContribution, updateContribution } from "@/actions/contributions";

type ContributionSnapshot = {
  id: string;
  amount: number;
  date: string;
  note: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  contribution?: ContributionSnapshot;
};

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  note: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

function toDefaultValues(contribution?: ContributionSnapshot): FormValues {
  if (!contribution) {
    const today = new Date().toISOString().slice(0, 10);
    return { amount: "", date: today, note: "" };
  }
  return {
    amount: contribution.amount.toString(),
    date: contribution.date,
    note: contribution.note,
  };
}

export function ContributionForm({
  open,
  onOpenChange,
  goalId,
  contribution,
}: Props) {
  const isEdit = !!contribution;
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(contribution),
  });

  useEffect(() => {
    if (open) form.reset(toDefaultValues(contribution));
  }, [open, contribution]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: FormValues) {
    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount <= 0) {
      form.setError("amount", { message: "Must be a positive number" });
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateContribution(contribution.id, {
            amount,
            date: values.date,
            note: values.note,
          })
        : await createContribution({
            goalId,
            amount,
            date: values.date,
            note: values.note,
          });

      if (result.ok) {
        toast.success(isEdit ? "Contribution updated" : "Contribution added");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit contribution" : "Add contribution"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contrib-amount">Amount (SGD)</Label>
              <Input
                id="contrib-amount"
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
              <Label htmlFor="contrib-date">Date</Label>
              <Input
                id="contrib-date"
                type="date"
                {...form.register("date")}
                aria-invalid={!!form.formState.errors.date}
              />
              {form.formState.errors.date && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contrib-note">Note</Label>
            <Input
              id="contrib-note"
              placeholder="Optional note"
              {...form.register("note")}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
