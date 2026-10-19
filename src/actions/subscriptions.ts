"use server";
import { subscriptionsRepo } from "@/lib/repos/subscriptions";
import { SubscriptionCreateSchema } from "@/lib/sheets/schema";

export type ActionResult = { ok: boolean; error?: string };

export async function createSubscription(data: unknown): Promise<ActionResult> {
  try {
    const parsed = SubscriptionCreateSchema.parse(data);
    await subscriptionsRepo.create(parsed);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create subscription",
    };
  }
}

export async function updateSubscription(
  id: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const parsed = SubscriptionCreateSchema.parse(data);
    await subscriptionsRepo.update(id, parsed);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update subscription",
    };
  }
}

export async function toggleSubscriptionActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  try {
    await subscriptionsRepo.update(id, { active });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update subscription",
    };
  }
}

export async function removeSubscription(id: string): Promise<ActionResult> {
  try {
    await subscriptionsRepo.remove(id);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete subscription",
    };
  }
}
