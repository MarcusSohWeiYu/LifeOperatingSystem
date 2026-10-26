"use client";
import { useState, memo } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { CityBudgetBuilding } from "../city-types";
import { formatSGD } from "@/lib/finance/money";

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
  onNavigate: (href: string) => void;
};

function BudgetBuildingInner({ building, position, onNavigate }: Props) {
  const [hovered, setHovered] = useState(false);
  const color = TYPE_COLORS[building.type];
  const roofColor = TYPE_ROOF_COLORS[building.type];
  const h = clamp(building.plannedMonthlyCents / 120_000, 0.4, 2.8);

  return (
    <group position={position}>
      {/* Main body */}
      <mesh
        castShadow
        receiveShadow
        position={[0, h / 2, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onNavigate("/finance/budget"); }}
      >
        <boxGeometry args={[0.65, h, 0.65]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.25 : 0}
        />
      </mesh>
      {/* Slanted roof */}
      <mesh position={[0, h + 0.22, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.52, 0.44, 4]} />
        <meshStandardMaterial color={roofColor} />
      </mesh>
      {hovered && (
        <Html
          position={[0, h + 0.9, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg" style={{ whiteSpace: "nowrap" }}>
            <p className="font-medium">{building.category}</p>
            <p className="text-xs text-muted-foreground capitalize">{building.type} · {formatSGD(building.plannedMonthlyCents)}/mo</p>
          </div>
        </Html>
      )}
    </group>
  );
}

export const BudgetBuilding = memo(BudgetBuildingInner);
