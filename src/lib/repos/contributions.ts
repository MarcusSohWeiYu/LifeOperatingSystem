import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { createTable } from "@/lib/sheets/table";
import {
  contributionDef,
  type ContributionCreate,
  type ContributionRow,
} from "@/lib/sheets/schema";

const table = createTable(contributionDef);
const TAG = "sheet:Contributions";

const listCached = unstable_cache(() => table.list(), [TAG], { tags: [TAG] });

export const contributionsRepo = {
  list: (): Promise<ContributionRow[]> => listCached(),

  listByGoal: async (goalId: string): Promise<ContributionRow[]> => {
    const rows = await listCached();
    return rows.filter((r) => r.goalId === goalId);
  },

  get: (id: string): Promise<ContributionRow | null> => table.get(id),

  async update(
    id: string,
    patch: Partial<ContributionRow>
  ): Promise<ContributionRow> {
    const row = await table.update(id, patch);
    updateTag(TAG);
    return row;
  },

  async create(input: ContributionCreate): Promise<ContributionRow> {
    const row = await table.create(input);
    updateTag(TAG);
    return row;
  },

  async remove(id: string): Promise<void> {
    await table.remove(id);
    updateTag(TAG);
  },
};
