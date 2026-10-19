"use server";
import { contributionsRepo } from "@/lib/repos/contributions";
import { ContributionCreateSchema } from "@/lib/sheets/schema";
import { z } from "zod";

export type ActionResult = { ok: boolean; error?: string };

export async function createContribution(data: unknown): Promise<ActionResult> {
  try {
    const parsed = ContributionCreateSchema.parse(data);
    await contributionsRepo.create(parsed);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to add contribution" };
  }
}

const updateSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  note: z.string(),
});

export async function updateContribution(id: string, data: unknown): Promise<ActionResult> {
  try {
    const parsed = updateSchema.parse(data);
    await contributionsRepo.update(id, parsed);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update contribution" };
  }
}

export async function removeContribution(id: string): Promise<ActionResult> {
  try {
    await contributionsRepo.remove(id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete contribution" };
  }
}
