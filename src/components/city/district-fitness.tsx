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

// Fitness district origin ≈ x=5.5 in scene coords
const GYM_POS: [number, number, number] = [6.0, 0, -2.5];
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
};

function CalorieRing({ caloriesConsumed, caloriesTarget }: CalorieRingProps) {
  const progress = caloriesTarget > 0
    ? Math.min(1, caloriesConsumed / caloriesTarget)
    : 0;
  const arc = progress * Math.PI * 2;

  return (
    <group position={RING_POS}>
      {/* Background ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <torusGeometry args={[0.5, 0.07, 8, 32]} />
        <meshStandardMaterial color="#aaaaaa" transparent opacity={0.3} />
      </mesh>
      {/* Filled arc */}
      {arc > 0.05 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <torusGeometry args={[0.5, 0.07, 8, 32, arc]} />
          <meshStandardMaterial color="#c078b8" />
        </mesh>
      )}
      {/* Center label platform */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.04, 16]} />
        <meshStandardMaterial color="#e8d0e8" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function FitnessDistrictInner({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [fitnessData] = useState<FitnessData>(loadFitnessData);

  return (
    <group>
      <GymBuilding
        position={GYM_POS}
        caloriesConsumed={fitnessData.caloriesConsumed}
        caloriesTarget={fitnessData.caloriesTarget}
        onNavigate={onNavigate}
      />
      <CalorieRing
        caloriesConsumed={fitnessData.caloriesConsumed}
        caloriesTarget={fitnessData.caloriesTarget}
      />
    </group>
  );
}

export const FitnessDistrict = memo(FitnessDistrictInner);
