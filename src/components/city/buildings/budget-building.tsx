"use client";
import { useState, memo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { CityBudgetBuilding } from "../city-types";

const TYPE_COLORS = {
  needs: "#7ab0e0",
  wants: "#b07ae0",
  savings: "#6ac99a",
} as const;

const TYPE_ROOF_COLORS = {
  needs: "#5a90c8",
  wants: "#906ac8",
  savings: "#4ab088",
} as const;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type Props = {
  building: CityBudgetBuilding;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
};

function BudgetBuildingInner({ building, position, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);
  const color = TYPE_COLORS[building.type];
  const roofColor = TYPE_ROOF_COLORS[building.type];
  const h = clamp(building.plannedMonthlyCents / 30_000, 1.2, 5.0);

  return (
    <group position={position}>
      {/* Main body */}
      <RoundedBox
        args={[0.68, h, 0.68]}
        radius={0.08}
        smoothness={3}
        position={[0, h / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.35 : hovered ? 0.15 : 0}
        />
      </RoundedBox>

      {/* Flat roof slab */}
      <RoundedBox
        args={[0.78, 0.08, 0.78]}
        radius={0.04}
        smoothness={2}
        position={[0, h + 0.04, 0]}
      >
        <meshStandardMaterial color={roofColor} />
      </RoundedBox>

      {/* Rooftop AC unit */}
      <RoundedBox
        args={[0.22, 0.14, 0.18]}
        radius={0.03}
        smoothness={2}
        position={[0.15, h + 0.15, 0]}
      >
        <meshStandardMaterial color="#c8c0b8" />
      </RoundedBox>
    </group>
  );
}

export const BudgetBuilding = memo(BudgetBuildingInner);
