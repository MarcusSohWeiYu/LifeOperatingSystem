import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { createSettingsHelper } from "@/lib/sheets/table";

const helper = createSettingsHelper();
const TAG = "sheet:Settings";

const DEFAULTS = {
  currency: "SGD",
  renewalAlertDays: "7",
} as const;

const getAllCached = unstable_cache(() => helper.getAll(), [TAG], {
  tags: [TAG],
});

export const settingsRepo = {
  getAll: (): Promise<Record<string, string>> => getAllCached(),

  async get(key: string): Promise<string> {
    const all = await getAllCached();
    return all[key] ?? DEFAULTS[key as keyof typeof DEFAULTS] ?? "";
  },

  async getCurrency(): Promise<string> {
    return (await settingsRepo.get("currency")) || "SGD";
  },

  async getRenewalAlertDays(): Promise<number> {
    const v = await settingsRepo.get("renewalAlertDays");
    return parseInt(v, 10) || 7;
  },

  async set(key: string, value: string): Promise<void> {
    await helper.setValue(key, value);
    updateTag(TAG);
  },
};
