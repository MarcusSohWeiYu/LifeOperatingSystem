"use server";
import { budgetRepo } from "@/lib/repos/budget";
import { BudgetCreateSchema } from "@/lib/sheets/schema";

export type ActionResult = { ok: boolean; error?: string };

export async function createBudget(data: unknown): Promise<ActionResult> {
  try {
    const parsed = BudgetCreateSchema.parse(data);
    await budgetRepo.create(parsed);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create budget item",
    };
  }
}

export async function updateBudget(
  id: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const parsed = BudgetCreateSchema.parse(data);
    await budgetRepo.update(id, parsed);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update budget item",
    };
  }
}

export async function removeBudget(id: string): Promise<ActionResult> {
  try {
    await budgetRepo.remove(id);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete budget item",
    };
  }
}
