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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the item being deleted, shown in the confirmation message. */
  name: string;
  /** Server action to call on confirm. */
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  successMessage?: string;
  /** Overrides the default description text entirely. */
  description?: string;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  name,
  onDelete,
  successMessage,
  description,
}: Props) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await onDelete();
      if (result.ok) {
        toast.success(successMessage ?? `"${name}" deleted`);
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
          <DialogTitle>Delete item</DialogTitle>
          <DialogDescription>
            {description ?? (
              <>
                Are you sure you want to delete{" "}
                <strong className="text-foreground">{name}</strong>? This cannot
                be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" disabled={pending} onClick={handleDelete}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
