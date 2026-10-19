"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { removeSubscription } from "@/actions/subscriptions";
import type { EnrichedSubscription } from "./subscriptions-client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: EnrichedSubscription;
};

export function DeleteConfirm({ open, onOpenChange, subscription }: Props) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await removeSubscription(subscription.id);
      if (result.ok) {
        toast.success(`"${subscription.name}" deleted`);
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete subscription</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">{subscription.name}</strong>?
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
