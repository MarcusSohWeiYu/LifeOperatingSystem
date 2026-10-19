"use client";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { formatSGD } from "@/lib/finance/money";
import { toggleIncomeActive, removeIncome } from "@/actions/income";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { IncomeForm } from "./income-form";

export type EnrichedIncome = {
  id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "fortnightly" | "monthly" | "quarterly" | "yearly";
  active: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  monthlyCents: number;
};

type Props = {
  income: EnrichedIncome[];
};

type DialogState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; item: EnrichedIncome }
  | { type: "delete"; item: EnrichedIncome };

const FREQ_LABEL: Record<string, string> = {
  weekly: "/wk",
  fortnightly: "/fortnight",
  monthly: "/mo",
  quarterly: "/qtr",
  yearly: "/yr",
};

function IncomeActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await toggleIncomeActive(id, checked);
      if (!result.ok) toast.error(result.error ?? "Failed to update");
    });
  }

  return (
    <Switch
      checked={active}
      onCheckedChange={handleChange}
      disabled={pending}
      aria-label={active ? "Deactivate" : "Activate"}
    />
  );
}

export function IncomeClient({ income }: Props) {
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const totalMonthlyCents = useMemo(
    () =>
      income
        .filter((r) => r.active)
        .reduce((sum, r) => sum + r.monthlyCents, 0),
    [income]
  );

  if (income.length === 0) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Income</h1>
        </div>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No income sources yet.</p>
          <Button onClick={() => setDialog({ type: "add" })}>
            <PlusIcon />
            Add your first income source
          </Button>
        </div>
        <IncomeForm
          open={dialog.type === "add"}
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Income</h1>
        <Button size="sm" onClick={() => setDialog({ type: "add" })}>
          <PlusIcon />
          Add
        </Button>
      </div>

      {/* Summary card */}
      <div className="inline-block rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">Total monthly income</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {formatSGD(totalMonthlyCents)}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Monthly equivalent</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {income.map((row) => (
              <TableRow
                key={row.id}
                className={!row.active ? "opacity-50" : undefined}
              >
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatSGD(Math.round(row.amount * 100))}
                  <span className="text-muted-foreground">
                    {FREQ_LABEL[row.frequency]}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatSGD(row.monthlyCents)}/mo
                </TableCell>
                <TableCell className="text-center">
                  <IncomeActiveToggle id={row.id} active={row.active} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit"
                      onClick={() => setDialog({ type: "edit", item: row })}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      onClick={() => setDialog({ type: "delete", item: row })}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {income.map((row) => (
          <div
            key={row.id}
            className={`flex items-center justify-between gap-3 rounded-xl border bg-card p-3 ring-1 ring-foreground/10 ${!row.active ? "opacity-50" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{row.name}</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatSGD(Math.round(row.amount * 100))}
                {FREQ_LABEL[row.frequency]}
                {" · "}
                {formatSGD(row.monthlyCents)}/mo
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <IncomeActiveToggle id={row.id} active={row.active} />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit"
                onClick={() => setDialog({ type: "edit", item: row })}
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete"
                onClick={() => setDialog({ type: "delete", item: row })}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      <IncomeForm
        open={dialog.type === "add" || dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        income={dialog.type === "edit" ? dialog.item : undefined}
      />

      {dialog.type === "delete" && (
        <DeleteConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          name={dialog.item.name}
          onDelete={() => removeIncome(dialog.item.id)}
        />
      )}
    </div>
  );
}
