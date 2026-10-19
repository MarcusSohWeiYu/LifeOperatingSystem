import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { createTable } from "@/lib/sheets/table";
import {
  budgetDef,
  type BudgetCreate,
  type BudgetRow,
} from "@/lib/sheets/schema";

const table = createTable(budgetDef);
const TAG = "sheet:Budget";

const listCached = unstable_cache(() => table.list(), [TAG], { tags: [TAG] });

export const budgetRepo = {
  list: (): Promise<BudgetRow[]> => listCached(),

  get: (id: string): Promise<BudgetRow | null> => table.get(id),

  async create(input: BudgetCreate): Promise<BudgetRow> {
    const row = await table.create(input);
    updateTag(TAG);
    return row;
  },

  async update(id: string, patch: Partial<BudgetRow>): Promise<BudgetRow> {
    const row = await table.update(id, patch);
    updateTag(TAG);
    return row;
  },

  async remove(id: string): Promise<void> {
    await table.remove(id);
    updateTag(TAG);
  },
};
