import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { getSheetsClient } from "@/lib/sheets/client";
import { env } from "@/lib/env";
import { parseTabData } from "@/lib/sheets/table";
import {
  incomeDef,
  subscriptionDef,
  budgetDef,
  goalsDef,
  contributionDef,
  type IncomeRow,
  type SubscriptionRow,
  type BudgetRow,
  type GoalRow,
  type ContributionRow,
} from "@/lib/sheets/schema";

export type AllData = {
  income: IncomeRow[];
  subscriptions: SubscriptionRow[];
  budget: BudgetRow[];
  goals: GoalRow[];
  contributions: ContributionRow[];
  settings: Record<string, string>;
};

const ALL_TAGS = [
  "sheet:Income",
  "sheet:Subscriptions",
  "sheet:Budget",
  "sheet:Goals",
  "sheet:Contributions",
  "sheet:Settings",
];

function parseSettingsValues(
  values: unknown[][] | null | undefined
): Record<string, string> {
  if (!values || values.length < 2) return {};
  const out: Record<string, string> = {};
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row) continue;
    const k = row[0];
    const v = row[1];
    if (k != null && k !== "") {
      out[String(k)] = v != null ? String(v) : "";
    }
  }
  return out;
}

/**
 * Load all tabs in a single batchGet call — use this on the dashboard.
 * Cached per tab tag; revalidated whenever any tab changes.
 */
export const loadAll = unstable_cache(
  async (): Promise<AllData> => {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      ranges: [
        "Income!A:H",
        "Subscriptions!A:K",
        "Budget!A:H",
        "Goals!A:J",
        "Contributions!A:F",
        "Settings!A:B",
      ],
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const vr = res.data.valueRanges ?? [];

    return {
      income: parseTabData(
        (vr[0]?.values ?? []) as unknown[][],
        incomeDef
      ),
      subscriptions: parseTabData(
        (vr[1]?.values ?? []) as unknown[][],
        subscriptionDef
      ),
      budget: parseTabData(
        (vr[2]?.values ?? []) as unknown[][],
        budgetDef
      ),
      goals: parseTabData(
        (vr[3]?.values ?? []) as unknown[][],
        goalsDef
      ),
      contributions: parseTabData(
        (vr[4]?.values ?? []) as unknown[][],
        contributionDef
      ),
      settings: parseSettingsValues(
        (vr[5]?.values ?? []) as unknown[][]
      ),
    };
  },
  ["sheet:all"],
  { tags: ALL_TAGS }
);

/** Invalidate the cache for a single tab (and thus loadAll too). */
export function revalidateTab(tab: string): void {
  updateTag(`sheet:${tab}`);
}
