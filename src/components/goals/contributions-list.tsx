"use client";
import { useState } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSGD } from "@/lib/finance/money";
import { removeContribution } from "@/actions/contributions";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ContributionForm } from "./contribution-form";

export type EnrichedContribution = {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
  amountCents: number;
};

type Props = {
  contributions: EnrichedContribution[];
  goalId: string;
};

type DialogState =
  | { type: "none" }
  | { type: "edit"; contribution: EnrichedContribution }
  | { type: "delete"; contribution: EnrichedContribution };

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
] as const;

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${MONTHS[Number(parts[1]) - 1]} ${Number(parts[2])}, ${parts[0]}`;
}

export function ContributionsList({ contributions, goalId }: Props) {
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  if (contributions.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No contributions recorded yet.
      </p>
    );
  }

  const sorted = [...contributions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <div>
      <div className="divide-y">
        {sorted.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium tabular-nums">
                {formatSGD(c.amountCents)}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {formatDate(c.date)}
                {c.note && ` · ${c.note}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Edit contribution"
                onClick={() => setDialog({ type: "edit", contribution: c })}
              >
                <PencilIcon />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Delete contribution"
                onClick={() => setDialog({ type: "delete", contribution: c })}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ContributionForm
        open={dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        goalId={goalId}
        contribution={
          dialog.type === "edit"
            ? {
                id: dialog.contribution.id,
                amount: dialog.contribution.amount,
                date: dialog.contribution.date,
                note: dialog.contribution.note,
              }
            : undefined
        }
      />

      {dialog.type === "delete" && (
        <DeleteConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          name={formatSGD(dialog.contribution.amountCents)}
          onDelete={() => removeContribution(dialog.contribution.id)}
          successMessage="Contribution deleted"
        />
      )}
    </div>
  );
}
