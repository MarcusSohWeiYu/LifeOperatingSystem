import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { createTable } from "@/lib/sheets/table";
import {
  subscriptionDef,
  type SubscriptionCreate,
  type SubscriptionRow,
} from "@/lib/sheets/schema";

const table = createTable(subscriptionDef);
const TAG = "sheet:Subscriptions";

const listCached = unstable_cache(() => table.list(), [TAG], { tags: [TAG] });

export const subscriptionsRepo = {
  list: (): Promise<SubscriptionRow[]> => listCached(),

  get: (id: string): Promise<SubscriptionRow | null> => table.get(id),

  async create(input: SubscriptionCreate): Promise<SubscriptionRow> {
    const row = await table.create(input);
    updateTag(TAG);
    return row;
  },

  async update(
    id: string,
    patch: Partial<SubscriptionRow>
  ): Promise<SubscriptionRow> {
    const row = await table.update(id, patch);
    updateTag(TAG);
    return row;
  },

  async remove(id: string): Promise<void> {
    await table.remove(id);
    updateTag(TAG);
  },
};
