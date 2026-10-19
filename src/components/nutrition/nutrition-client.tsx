"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { DateNavigator } from "./date-navigator";
import { DailySummary } from "./daily-summary";
import { MealSection } from "./meal-section";
import { FoodFormDialog } from "./food-form-dialog";
import { QuickAddDialog } from "./quick-add-dialog";
import { GoalsDialog } from "./goals-dialog";
import { MEAL_ORDER } from "./types";
import type { DailyGoals, FoodEntry, MealType, NutritionState } from "./types";
import { getDefaultNutritionState } from "./mock-data";
import { todayDateStr, shiftDate, loadNutritionState, saveNutritionState } from "./utils";

type DialogState =
  | { type: "none" }
  | { type: "add"; meal: MealType }
  | { type: "quick-add"; meal: MealType }
  | { type: "edit"; entry: FoodEntry }
  | { type: "delete"; entry: FoodEntry }
  | { type: "goals" };

export function NutritionClient() {
  const [state, setState] = useState<NutritionState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = loadNutritionState();
        if (saved) return saved;
      } catch {}
    }
    return getDefaultNutritionState();
  });

  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const idCounterRef = useRef(0);

  useEffect(() => {
    saveNutritionState(state);
  }, [state]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function currentEntries(): FoodEntry[] {
    return state.logs[selectedDate]?.entries ?? [];
  }

  function entriesForMeal(meal: MealType): FoodEntry[] {
    return currentEntries().filter((e) => e.meal === meal);
  }

  function upsertEntries(newEntries: FoodEntry[]) {
    setState((s) => ({
      ...s,
      logs: {
        ...s.logs,
        [selectedDate]: { date: selectedDate, entries: newEntries },
      },
    }));
  }

  function nextId(): string {
    idCounterRef.current += 1;
    return `food-${idCounterRef.current}`;
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  function handleSaveFood(data: Omit<FoodEntry, "id">, existingId?: string) {
    const entry: FoodEntry = { id: existingId ?? nextId(), ...data };
    const existing = currentEntries();
    const idx = existing.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      const updated = [...existing];
      updated[idx] = entry;
      upsertEntries(updated);
    } else {
      upsertEntries([...existing, entry]);
    }
  }

  async function handleDeleteFood(entry: FoodEntry): Promise<{ ok: boolean }> {
    upsertEntries(currentEntries().filter((e) => e.id !== entry.id));
    toast.success("Food removed");
    return { ok: true };
  }

  function handleUpdateGoals(goals: DailyGoals) {
    setState((s) => ({ ...s, goals }));
  }

  // ── Date nav ─────────────────────────────────────────────────────────────

  function handlePrev() { setSelectedDate((d) => shiftDate(d, -1)); }
  function handleNext() { setSelectedDate((d) => shiftDate(d, 1)); }
  function handleToday() { setSelectedDate(todayDateStr()); }

  // ── Dialog helpers ────────────────────────────────────────────────────────

  const addMeal = dialog.type === "add" ? dialog.meal : "breakfast";
  const quickAddMeal = dialog.type === "quick-add" ? dialog.meal : "breakfast";

  return (
    <div className="space-y-4">
      <DateNavigator
        date={selectedDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      <DailySummary
        goals={state.goals}
        entries={currentEntries()}
        onEditGoals={() => setDialog({ type: "goals" })}
      />

      {MEAL_ORDER.map((meal) => (
        <MealSection
          key={meal}
          meal={meal}
          entries={entriesForMeal(meal)}
          onAdd={(m) => setDialog({ type: "add", meal: m })}
          onQuickAdd={(m) => setDialog({ type: "quick-add", meal: m })}
          onEdit={(entry) => setDialog({ type: "edit", entry })}
          onDelete={(entry) => setDialog({ type: "delete", entry })}
        />
      ))}

      {/* Add dialog */}
      <FoodFormDialog
        open={dialog.type === "add"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        meal={addMeal}
        onSave={handleSaveFood}
      />

      {/* Edit dialog */}
      <FoodFormDialog
        open={dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        meal={dialog.type === "edit" ? dialog.entry.meal : "breakfast"}
        entry={dialog.type === "edit" ? dialog.entry : undefined}
        onSave={handleSaveFood}
      />

      {/* Quick add */}
      <QuickAddDialog
        open={dialog.type === "quick-add"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        meal={quickAddMeal}
        onSave={handleSaveFood}
      />

      {/* Delete */}
      {dialog.type === "delete" && (
        <DeleteConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          name={dialog.entry.name || "Quick Add"}
          onDelete={() => handleDeleteFood(dialog.entry)}
        />
      )}

      {/* Goals */}
      <GoalsDialog
        open={dialog.type === "goals"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        goals={state.goals}
        onSave={handleUpdateGoals}
      />
    </div>
  );
}
