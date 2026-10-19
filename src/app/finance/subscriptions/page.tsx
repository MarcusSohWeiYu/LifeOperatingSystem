export const dynamic = "force-dynamic";

import { subscriptionsRepo } from "@/lib/repos/subscriptions";
import { settingsRepo } from "@/lib/repos/settings";
import { toCents } from "@/lib/finance/money";
import { toMonthlyCents } from "@/lib/finance/frequency";
import { nextRenewalDate, isRenewingSoon } from "@/lib/finance/renewals";
import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";
import type { EnrichedSubscription } from "@/components/subscriptions/subscriptions-client";

export default async function SubscriptionsPage() {
  const [subs, alertDays] = await Promise.all([
    subscriptionsRepo.list(),
    settingsRepo.getRenewalAlertDays(),
  ]);

  const today = new Date();

  const enriched: EnrichedSubscription[] = subs.map((sub) => {
    const next = nextRenewalDate(sub.nextRenewal, sub.frequency, today);
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    return {
      ...sub,
      monthlyCents: toMonthlyCents(toCents(sub.amount), sub.frequency),
      nextRenewalDateStr: nextStr,
      renewingSoon: sub.active && isRenewingSoon(next, today, alertDays),
    };
  });

  const categories = [
    ...new Set(subs.map((s) => s.category).filter(Boolean)),
  ].sort();

  return (
    <SubscriptionsClient
      subscriptions={enriched}
      alertDays={alertDays}
      existingCategories={categories}
    />
  );
}
