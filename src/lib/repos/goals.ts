import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { createTable } from "@/lib/sheets/table";
import {
  goalsDef,
  type GoalCreate,
  type GoalRow,
} from "@/lib/sheets/schema";

const table = createTable(goalsDef);
const TAG = "sheet:Goals";

const listCached = unstable_cache(() => table.list(), [TAG], { tags: [TAG] });

export const goalsRepo = {
  list: (): Promise<GoalRow[]> => listCached(),

  get: (id: string): Promise<GoalRow | null> => table.get(id),

  async create(input: GoalCreate): Promise<GoalRow> {
    const row = await table.create(input);
    updateTag(TAG);
    return row;
  },

  async update(id: string, patch: Partial<GoalRow>): Promise<GoalRow> {
    const row = await table.update(id, patch);
    updateTag(TAG);
    return row;
  },

  async remove(id: string): Promise<void> {
    await table.remove(id);
    updateTag(TAG);
  },
};
