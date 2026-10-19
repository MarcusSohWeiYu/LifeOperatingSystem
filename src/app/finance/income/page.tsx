export const dynamic = "force-dynamic";

import { incomeRepo } from "@/lib/repos/income";
import { toCents } from "@/lib/finance/money";
import { toMonthlyCents } from "@/lib/finance/frequency";
import { IncomeClient } from "@/components/income/income-client";
import type { EnrichedIncome } from "@/components/income/income-client";

export default async function IncomePage() {
  const rows = await incomeRepo.list();

  const enriched: EnrichedIncome[] = rows.map((row) => ({
    ...row,
    monthlyCents: toMonthlyCents(toCents(row.amount), row.frequency),
  }));

  return <IncomeClient income={enriched} />;
}
