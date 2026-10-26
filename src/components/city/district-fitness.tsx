"use client";
import { useState, memo } from "react";
import { GymBuilding } from "./buildings/gym-building";
import {
  loadNutritionState,
  totalCalories,
  totalProteinG,
  todayDateStr,
} from "@/components/nutrition/utils";
import type { FoodEntry } from "@/components/nutrition/types";
import type { SelectedBuilding } from "./city-types";

// Fitness district origin ≈ x=5.5 in scene coords
const GYM_POS: [number, number, number] = [6.0, 0.22, -2.5];
const RING_POS: [number, number, number] = [6.0, 0, -0.5];

type FitnessData = {
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinG: number;
};

function loadFitnessData(): FitnessData {
  const state = loadNutritionState();
  if (!state) return { caloriesConsumed: 0, caloriesTarget: 2000, proteinG: 0 };
  const today = todayDateStr();
  const log = state.logs[today];
  const entries: FoodEntry[] = log?.entries ?? [];
  return {
    caloriesConsumed: totalCalories(entries),
    caloriesTarget: state.goals.calories,
    proteinG: totalProteinG(entries),
  };
}

type CalorieRingProps = {
  caloriesConsumed: number;
  caloriesTarget: number;
  selected: boolean;
  onSelect: () => void;
};

function CalorieRing({ caloriesConsumed, caloriesTarget, selected, onSelect }: CalorieRingProps) {
  const progress = caloriesTarget > 0
    ? Math.min(1, caloriesConsumed / caloriesTarget)
    : 0;
  const arc = progress * Math.PI * 2;

  return (
    <group position={RING_POS}>
      {/* Background ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 0]}>
        <torusGeometry args={[0.5, 0.07, 8, 32]} />
        <meshStandardMaterial color="#aaaaaa" transparent opacity={0.3} />
      </mesh>
      {/* Filled arc */}
      {arc > 0.05 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.23, 0]}>
          <torusGeometry args={[0.5, 0.07, 8, 32, arc]} />
          <meshStandardMaterial
            color="#c078b8"
            emissive="#c078b8"
            emissiveIntensity={selected ? 0.4 : 0.1}
          />
        </mesh>
      )}
      {/* Center platform – clickable */}
      <mesh
        position={[0, 0.22, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <cylinderGeometry args={[0.35, 0.35, 0.04, 16]} />
        <meshStandardMaterial color="#e8d0e8" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

type Props = {
  selectedId: string | null;
  onSelect: (id: string, pos: [number, number, number], building: SelectedBuilding) => void;
};

const GYM_ID = "gym";

function FitnessDistrictInner({ selectedId, onSelect }: Props) {
  const [fitnessData] = useState<FitnessData>(loadFitnessData);

  return (
    <group>
      <GymBuilding
        position={GYM_POS}
        caloriesConsumed={fitnessData.caloriesConsumed}
        caloriesTarget={fitnessData.caloriesTarget}
        proteinG={fitnessData.proteinG}
        selected={selectedId === GYM_ID}
        onSelect={() =>
          onSelect(GYM_ID, [GYM_POS[0], GYM_POS[1] + 2.8, GYM_POS[2]], {
            kind: "gym",
            calories: fitnessData.caloriesConsumed,
            target: fitnessData.caloriesTarget,
            proteinG: fitnessData.proteinG,
          })
        }
      />
      <CalorieRing
        caloriesConsumed={fitnessData.caloriesConsumed}
        caloriesTarget={fitnessData.caloriesTarget}
        selected={selectedId === "ring"}
        onSelect={() =>
          onSelect("ring", [RING_POS[0], RING_POS[1] + 1.2, RING_POS[2]], {
            kind: "gym",
            calories: fitnessData.caloriesConsumed,
            target: fitnessData.caloriesTarget,
            proteinG: fitnessData.proteinG,
          })
        }
      />
    </group>
  );
}

export const FitnessDistrict = memo(FitnessDistrictInner);
