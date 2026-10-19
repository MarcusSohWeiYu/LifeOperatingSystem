"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { DateNavigator } from "./date-navigator";
import { DailySummary } from "./daily-summary";
import { MealSection } from "./meal-section";
import { FoodFormDialog } from "./food-form-dialog";
import { AddFoodDialog } from "./add-food-dialog";
import { GoalsDialog } from "./goals-dialog";
import { MEAL_ORDER } from "./types";
import type { DailyGoals, FoodEntry, MealType, NutritionState } from "./types";
import { getDefaultNutritionState } from "./mock-data";
import { todayDateStr, shiftDate, loadNutritionState, saveNutritionState } from "./utils";
import { lookupFoodBarcode } from "@/actions/nutrition";
import type { FoodProduct } from "@/actions/nutrition";

type DialogState =
  | { type: "none" }
  | { type: "add-food"; meal: MealType }
  | { type: "food-form"; meal: MealType; prefill?: Omit<FoodEntry, "id" | "meal"> }
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
  const [scanLookupPending, setScanLookupPending] = useState(false);
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

  // ── Add food handlers ─────────────────────────────────────────────────────

  function handleSelectProduct(product: FoodProduct) {
    if (dialog.type !== "add-food") return;
    const meal = dialog.meal;
    setDialog({
      type: "food-form",
      meal,
      prefill: {
        name: product.name,
        brand: product.brand,
        servingSize: product.servingSize,
        servings: 1,
        calories: product.calories,
        proteinG: product.proteinG,
        carbsG: product.carbsG,
        fatG: product.fatG,
      },
    });
  }

  function handleQuickAddSave(entry: Omit<FoodEntry, "id">) {
    handleSaveFood(entry);
    setDialog({ type: "none" });
    toast.success("Food added");
  }

  async function handleBarcodeDetected(barcode: string) {
    if (dialog.type !== "add-food") return;
    const meal = dialog.meal;
    setScanLookupPending(true);
    const result = await lookupFoodBarcode(barcode);
    setScanLookupPending(false);
    if (!result.ok) {
      toast.error(result.error === "Product not found" ? "Product not found — enter details manually" : result.error);
      setDialog({ type: "food-form", meal });
      return;
    }
    const product = result.food;
    setDialog({
      type: "food-form",
      meal,
      prefill: {
        name: product.name,
        brand: product.brand,
        servingSize: product.servingSize,
        servings: 1,
        calories: product.calories,
        proteinG: product.proteinG,
        carbsG: product.carbsG,
        fatG: product.fatG,
      },
    });
  }

  // ── Date nav ─────────────────────────────────────────────────────────────

  function handlePrev() { setSelectedDate((d) => shiftDate(d, -1)); }
  function handleNext() { setSelectedDate((d) => shiftDate(d, 1)); }
  function handleToday() { setSelectedDate(todayDateStr()); }

  // ── Dialog helpers ────────────────────────────────────────────────────────

  const addFoodMeal = dialog.type === "add-food" ? dialog.meal : "breakfast";
  const foodFormMeal = dialog.type === "food-form" ? dialog.meal : "breakfast";
  const foodFormPrefill = dialog.type === "food-form" ? dialog.prefill : undefined;

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
          onAdd={(m) => setDialog({ type: "add-food", meal: m })}
          onEdit={(entry) => setDialog({ type: "edit", entry })}
          onDelete={(entry) => setDialog({ type: "delete", entry })}
        />
      ))}

      {/* Add food tabbed dialog */}
      <AddFoodDialog
        open={dialog.type === "add-food"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        meal={addFoodMeal}
        onSelectProduct={handleSelectProduct}
        onQuickAddSave={handleQuickAddSave}
        scanLoading={scanLookupPending}
        onBarcodeDetected={handleBarcodeDetected}
      />

      {/* Food form (from search / barcode result) */}
      <FoodFormDialog
        open={dialog.type === "food-form"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        meal={foodFormMeal}
        prefill={foodFormPrefill}
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
