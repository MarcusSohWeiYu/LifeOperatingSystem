"use server";
import { goalsRepo } from "@/lib/repos/goals";
import { contributionsRepo } from "@/lib/repos/contributions";
import { GoalCreateSchema } from "@/lib/sheets/schema";

export type ActionResult = { ok: boolean; error?: string };

export async function createGoal(data: unknown): Promise<ActionResult> {
  try {
    const parsed = GoalCreateSchema.parse(data);
    await goalsRepo.create(parsed);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create goal" };
  }
}

export async function updateGoal(id: string, data: unknown): Promise<ActionResult> {
  try {
    const parsed = GoalCreateSchema.parse(data);
    await goalsRepo.update(id, parsed);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update goal" };
  }
}

export async function updateGoalStatus(
  id: string,
  status: "active" | "completed" | "cancelled"
): Promise<ActionResult> {
  try {
    await goalsRepo.update(id, { status });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update goal" };
  }
}

/** Swap priorities between two goals (for up/down reordering). */
export async function swapGoalPriority(
  id1: string,
  priority1: number,
  id2: string,
  priority2: number
): Promise<ActionResult> {
  try {
    await goalsRepo.update(id1, { priority: priority2 });
    await goalsRepo.update(id2, { priority: priority1 });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reorder goals" };
  }
}

/** Delete a goal and all its contributions. */
export async function removeGoalWithContributions(id: string): Promise<ActionResult> {
  try {
    const contributions = await contributionsRepo.listByGoal(id);
    for (const c of contributions) {
      await contributionsRepo.remove(c.id);
    }
    await goalsRepo.remove(id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete goal" };
  }
}
