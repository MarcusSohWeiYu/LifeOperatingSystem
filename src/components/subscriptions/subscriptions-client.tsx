"use client";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { toggleSubscriptionActive } from "@/actions/subscriptions";
import { SubscriptionForm } from "./subscription-form";
import { DeleteConfirm } from "./delete-confirm";

export type EnrichedSubscription = {
  id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "fortnightly" | "monthly" | "quarterly" | "yearly";
  category: string;
  nextRenewal: string;
  paymentMethod: string;
  active: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  monthlyCents: number;
  nextRenewalDateStr: string;
  renewingSoon: boolean;
};

type Props = {
  subscriptions: EnrichedSubscription[];
  alertDays: number;
  existingCategories: string[];
};

type DialogState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; sub: EnrichedSubscription }
  | { type: "delete"; sub: EnrichedSubscription };

const FREQ_LABEL: Record<string, string> = {
  weekly: "/wk",
  fortnightly: "/fortnight",
  monthly: "/mo",
  quarterly: "/qtr",
  yearly: "/yr",
};

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ActiveToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await toggleSubscriptionActive(id, checked);
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

export function SubscriptionsClient({
  subscriptions,
  existingCategories,
}: Props) {
  const [sortBy, setSortBy] = useState<"renewal" | "monthly">("renewal");
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const sorted = useMemo(() => {
    const active = subscriptions.filter((s) => s.active);
    const inactive = subscriptions.filter((s) => !s.active);

    const sortFn = (a: EnrichedSubscription, b: EnrichedSubscription) =>
      sortBy === "renewal"
        ? a.nextRenewalDateStr.localeCompare(b.nextRenewalDateStr)
        : b.monthlyCents - a.monthlyCents;

    return [...active.sort(sortFn), ...inactive.sort(sortFn)];
  }, [subscriptions, sortBy]);

  // Summary stats
  const totalMonthlyCents = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + s.monthlyCents, 0);
  const countActive = subscriptions.filter((s) => s.active).length;
  const countRenewing = subscriptions.filter((s) => s.renewingSoon).length;

  if (subscriptions.length === 0) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Subscriptions</h1>
        </div>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No subscriptions yet.</p>
          <Button onClick={() => setDialog({ type: "add" })}>
            <PlusIcon />
            Add your first subscription
          </Button>
        </div>
        <SubscriptionForm
          open={dialog.type === "add"}
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          existingCategories={existingCategories}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Subscriptions</h1>
        <Button size="sm" onClick={() => setDialog({ type: "add" })}>
          <PlusIcon />
          Add
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Monthly total</CardDescription>
            <CardTitle className="text-lg tabular-nums">
              {formatSGD(totalMonthlyCents)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Annual total</CardDescription>
            <CardTitle className="text-lg tabular-nums">
              {formatSGD(totalMonthlyCents * 12)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-lg">{countActive}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Renewing soon</CardDescription>
            <CardTitle className="text-lg">
              {countRenewing > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">
                  {countRenewing}
                </span>
              ) : (
                countRenewing
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <Button
          variant={sortBy === "renewal" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setSortBy("renewal")}
        >
          Next renewal
        </Button>
        <Button
          variant={sortBy === "monthly" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setSortBy("monthly")}
        >
          Monthly cost
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead>Next renewal</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((sub) => (
              <TableRow
                key={sub.id}
                className={!sub.active ? "opacity-50" : undefined}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sub.name}</span>
                    {sub.renewingSoon && (
                      <Badge variant="secondary" className="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-0">
                        Soon
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sub.category || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatSGD(Math.round(sub.amount * 100))}
                  <span className="text-muted-foreground">
                    {FREQ_LABEL[sub.frequency]}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatSGD(sub.monthlyCents)}/mo
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(sub.nextRenewalDateStr)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sub.paymentMethod || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <ActiveToggle id={sub.id} active={sub.active} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit"
                      onClick={() => setDialog({ type: "edit", sub })}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      onClick={() => setDialog({ type: "delete", sub })}
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
        {sorted.map((sub) => (
          <Card key={sub.id} className={!sub.active ? "opacity-50" : undefined}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{sub.name}</span>
                    {sub.renewingSoon && (
                      <Badge variant="secondary" className="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-0">
                        Renewing soon
                      </Badge>
                    )}
                  </div>
                  {sub.category && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.category}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="tabular-nums font-medium">
                      {formatSGD(Math.round(sub.amount * 100))}
                      {FREQ_LABEL[sub.frequency]}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatSGD(sub.monthlyCents)}/mo
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Renews {formatDate(sub.nextRenewalDateStr)}
                    {sub.paymentMethod ? ` · ${sub.paymentMethod}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ActiveToggle id={sub.id} active={sub.active} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit"
                    onClick={() => setDialog({ type: "edit", sub })}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    onClick={() => setDialog({ type: "delete", sub })}
                  >
                    <Trash2Icon className="text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      <SubscriptionForm
        open={dialog.type === "add" || dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        subscription={dialog.type === "edit" ? dialog.sub : undefined}
        existingCategories={existingCategories}
      />

      {dialog.type === "delete" && (
        <DeleteConfirm
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          subscription={dialog.sub}
        />
      )}
    </div>
  );
}
