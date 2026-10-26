"use client";
import { useState, memo } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { CityIncomeBuilding } from "../city-types";
import { formatSGD } from "@/lib/finance/money";

const COLOR = "#5a9be8";
const ROOF_COLOR = "#3a7bc8";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type Props = {
  building: CityIncomeBuilding;
  position: [number, number, number];
  onNavigate: (href: string) => void;
};

function IncomeTowerInner({ building, position, onNavigate }: Props) {
  const [hovered, setHovered] = useState(false);
  const h = clamp(building.monthlyCents / 250_000, 0.8, 4.5);

  return (
    <group position={position}>
      {/* Main body */}
      <mesh
        castShadow
        receiveShadow
        position={[0, h / 2, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onNavigate("/finance/income"); }}
      >
        <boxGeometry args={[0.75, h, 0.75]} />
        <meshStandardMaterial
          color={COLOR}
          emissive={COLOR}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      {/* Roof slab */}
      <mesh position={[0, h + 0.06, 0]}>
        <boxGeometry args={[0.85, 0.12, 0.85]} />
        <meshStandardMaterial color={ROOF_COLOR} />
      </mesh>
      {/* Rooftop detail */}
      <mesh position={[0, h + 0.25, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshStandardMaterial color={ROOF_COLOR} />
      </mesh>
      {hovered && (
        <Html
          position={[0, h + 1.1, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg" style={{ whiteSpace: "nowrap" }}>
            <p className="font-medium">{building.name}</p>
            <p className="text-xs text-muted-foreground">{formatSGD(building.monthlyCents)}/mo · income</p>
          </div>
        </Html>
      )}
    </group>
  );
}

export const IncomeTower = memo(IncomeTowerInner);
