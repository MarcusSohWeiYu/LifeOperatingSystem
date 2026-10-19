import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { createTable } from "@/lib/sheets/table";
import { incomeDef, type IncomeCreate, type IncomeRow } from "@/lib/sheets/schema";

const table = createTable(incomeDef);
const TAG = "sheet:Income";

const listCached = unstable_cache(() => table.list(), [TAG], { tags: [TAG] });

export const incomeRepo = {
  list: (): Promise<IncomeRow[]> => listCached(),

  get: (id: string): Promise<IncomeRow | null> => table.get(id),

  async create(input: IncomeCreate): Promise<IncomeRow> {
    const row = await table.create(input);
    updateTag(TAG);
    return row;
  },

  async update(id: string, patch: Partial<IncomeRow>): Promise<IncomeRow> {
    const row = await table.update(id, patch);
    updateTag(TAG);
    return row;
  },

  async remove(id: string): Promise<void> {
    await table.remove(id);
    updateTag(TAG);
  },
};
