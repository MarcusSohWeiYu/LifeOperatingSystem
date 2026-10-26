"use client";
import { useState, memo } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";

const COLOR = "#c878b8";
const ROOF_COLOR = "#a058a0";

type Props = {
  position: [number, number, number];
  caloriesConsumed: number;
  caloriesTarget: number;
  onNavigate: (href: string) => void;
};

function GymBuildingInner({ position, caloriesConsumed, caloriesTarget, onNavigate }: Props) {
  const [hovered, setHovered] = useState(false);
  const progress = caloriesTarget > 0 ? Math.min(1, caloriesConsumed / caloriesTarget) : 0;
  const pct = Math.round(progress * 100);

  return (
    <group position={position}>
      {/* Main gym body */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.5, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onNavigate("/fitness/nutrition"); }}
      >
        <boxGeometry args={[1.1, 1.0, 0.9]} />
        <meshStandardMaterial
          color={COLOR}
          emissive={COLOR}
          emissiveIntensity={hovered ? 0.25 : 0}
        />
      </mesh>
      {/* Flat roof with slight overhang */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.2, 0.1, 1.0]} />
        <meshStandardMaterial color={ROOF_COLOR} />
      </mesh>
      {/* Side entrance */}
      <mesh position={[0, 0.25, 0.46]}>
        <boxGeometry args={[0.3, 0.5, 0.04]} />
        <meshStandardMaterial color="#f0e0f0" transparent opacity={0.6} />
      </mesh>

      {hovered && (
        <Html
          position={[0, 1.8, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg" style={{ whiteSpace: "nowrap" }}>
            <p className="font-medium">Fitness · Nutrition</p>
            {caloriesTarget > 0 ? (
              <p className="text-xs text-muted-foreground">
                {caloriesConsumed} / {caloriesTarget} kcal ({pct}%)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No nutrition data today</p>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export const GymBuilding = memo(GymBuildingInner);
