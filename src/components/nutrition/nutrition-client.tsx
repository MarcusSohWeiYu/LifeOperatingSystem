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
import { StepCounter } from "./step-counter";
import { MEAL_ORDER, MEAL_LABELS } from "./types";
import type { DailyGoals, FoodEntry, MealType, NutritionState, SavedFood } from "./types";
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
    setState((s) => {
      const existing = s.logs[selectedDate];
      return {
        ...s,
        logs: {
          ...s.logs,
          [selectedDate]: { ...existing, date: selectedDate, entries: newEntries },
        },
      };
    });
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

  // ── Saved foods ────────────────────────────────────────────────────────────

  const savedFoods: SavedFood[] = state.savedFoods ?? [];

  const savedFoodKeys = new Set(
    savedFoods.map((f) => `${f.name}|${f.brand}|${f.servingSize}`),
  );

  function handleToggleSave(entry: FoodEntry) {
    const key = `${entry.name}|${entry.brand}|${entry.servingSize}`;
    if (savedFoodKeys.has(key)) {
      // Remove
      setState((s) => ({
        ...s,
        savedFoods: (s.savedFoods ?? []).filter(
          (f) => `${f.name}|${f.brand}|${f.servingSize}` !== key,
        ),
      }));
      toast.success(`${entry.name} removed from saved`);
    } else {
      // Add
      const saved: SavedFood = {
        id: crypto.randomUUID(),
        name: entry.name,
        brand: entry.brand,
        servingSize: entry.servingSize,
        servings: entry.servings,
        calories: entry.calories,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
        savedAt: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        savedFoods: [saved, ...(s.savedFoods ?? [])],
      }));
      toast.success(`${entry.name} saved`);
    }
  }

  function handleRemoveSaved(id: string) {
    setState((s) => ({
      ...s,
      savedFoods: (s.savedFoods ?? []).filter((f) => f.id !== id),
    }));
  }

  function handleUpdateSaved(food: SavedFood) {
    setState((s) => ({
      ...s,
      savedFoods: (s.savedFoods ?? []).map((f) => (f.id === food.id ? food : f)),
    }));
  }

  function handleDirectAddSaved(food: SavedFood) {
    if (dialog.type !== "add-food") return;
    const meal = dialog.meal;
    const entry: FoodEntry = {
      id: nextId(),
      meal,
      name: food.name,
      brand: food.brand,
      servingSize: food.servingSize,
      servings: food.servings,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
    };
    const updated = [...currentEntries(), entry];
    upsertEntries(updated);
    setDialog({ type: "none" });
    toast.success(`${food.name} added to ${MEAL_LABELS[meal]}`);
  }

  function handleSelectSaved(food: SavedFood) {
    if (dialog.type !== "add-food") return;
    const meal = dialog.meal;
    setDialog({
      type: "food-form",
      meal,
      prefill: {
        name: food.name,
        brand: food.brand,
        servingSize: food.servingSize,
        servings: food.servings,
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
      },
    });
  }

  // ── Copy previous day ──────────────────────────────────────────────────────

  function previousDayEntriesForMeal(meal: MealType): FoodEntry[] {
    const prevDate = shiftDate(selectedDate, -1);
    return (state.logs[prevDate]?.entries ?? []).filter((e) => e.meal === meal);
  }

  function handleCopyPreviousMeal(meal: MealType) {
    const prevEntries = previousDayEntriesForMeal(meal);
    if (prevEntries.length === 0) return;
    const copied = prevEntries.map((e) => ({
      ...e,
      id: `copy-${crypto.randomUUID().slice(0, 8)}`,
    }));
    upsertEntries([...currentEntries(), ...copied]);
    toast.success(`Copied ${copied.length} items from yesterday's ${MEAL_LABELS[meal]}`);
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

  // ── Steps ────────────────────────────────────────────────────────────────

  function handleStepsChange(steps: number) {
    setState((s) => {
      const log = s.logs[selectedDate] ?? { date: selectedDate, entries: [] };
      return {
        ...s,
        logs: { ...s.logs, [selectedDate]: { ...log, steps } },
      };
    });
  }

  const currentSteps = state.logs[selectedDate]?.steps ?? 0;

  // ── Date nav ─────────────────────────────────────────────────────────────

  function handleSelectDate(d: string) { setSelectedDate(d); }
  function handleToday() { setSelectedDate(todayDateStr()); }

  // ── Dialog helpers ────────────────────────────────────────────────────────

  const addFoodMeal = dialog.type === "add-food" ? dialog.meal : "breakfast";
  const foodFormMeal = dialog.type === "food-form" ? dialog.meal : "breakfast";
  const foodFormPrefill = dialog.type === "food-form" ? dialog.prefill : undefined;

  return (
    <div className="space-y-4">
      <DateNavigator
        date={selectedDate}
        logs={state.logs}
        goals={state.goals}
        onSelect={handleSelectDate}
        onToday={handleToday}
      />

      <DailySummary
        goals={state.goals}
        entries={currentEntries()}
        onEditGoals={() => setDialog({ type: "goals" })}
      />

      <StepCounter steps={currentSteps} onChange={handleStepsChange} />

      {MEAL_ORDER.map((meal) => (
        <MealSection
          key={meal}
          meal={meal}
          entries={entriesForMeal(meal)}
          savedFoodIds={savedFoodKeys}
          previousDayCount={meal !== "snacks" ? previousDayEntriesForMeal(meal).length : 0}
          onAdd={(m) => setDialog({ type: "add-food", meal: m })}
          onEdit={(entry) => setDialog({ type: "edit", entry })}
          onDelete={(entry) => setDialog({ type: "delete", entry })}
          onToggleSave={handleToggleSave}
          onCopyPrevious={() => handleCopyPreviousMeal(meal)}
        />
      ))}

      {/* Add food tabbed dialog */}
      <AddFoodDialog
        open={dialog.type === "add-food"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
        meal={addFoodMeal}
        savedFoods={savedFoods}
        onSelectProduct={handleSelectProduct}
        onSelectSaved={handleSelectSaved}
        onRemoveSaved={handleRemoveSaved}
        onDirectAddSaved={handleDirectAddSaved}
        onUpdateSaved={handleUpdateSaved}
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
