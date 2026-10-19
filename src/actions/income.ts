"use server";
import { incomeRepo } from "@/lib/repos/income";
import { IncomeCreateSchema } from "@/lib/sheets/schema";

export type ActionResult = { ok: boolean; error?: string };

export async function createIncome(data: unknown): Promise<ActionResult> {
  try {
    const parsed = IncomeCreateSchema.parse(data);
    await incomeRepo.create(parsed);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create income",
    };
  }
}

export async function updateIncome(
  id: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const parsed = IncomeCreateSchema.parse(data);
    await incomeRepo.update(id, parsed);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update income",
    };
  }
}

export async function toggleIncomeActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  try {
    await incomeRepo.update(id, { active });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update income",
    };
  }
}

export async function removeIncome(id: string): Promise<ActionResult> {
  try {
    await incomeRepo.remove(id);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete income",
    };
  }
}
