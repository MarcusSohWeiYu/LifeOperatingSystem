"use client";
import { useState, useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { CityIncomeBuilding } from "../city-types";

const COLOR = "#5a9be8";
const ROOF_COLOR = "#3a7bc8";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type Props = {
  building: CityIncomeBuilding;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
  phase?: number;
};

function IncomeTowerInner({ building, position, selected, onSelect, phase = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);
  const h = clamp(building.monthlyCents / 250_000, 0.8, 4.5);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8 + phase) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main body */}
      <RoundedBox
        args={[0.75, h, 0.75]}
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
          color={COLOR}
          emissive={COLOR}
          emissiveIntensity={selected ? 0.35 : hovered ? 0.15 : 0}
        />
      </RoundedBox>

      {/* Roof slab */}
      <RoundedBox
        args={[0.88, 0.1, 0.88]}
        radius={0.05}
        smoothness={2}
        position={[0, h + 0.05, 0]}
      >
        <meshStandardMaterial color={ROOF_COLOR} />
      </RoundedBox>

      {/* Rooftop antenna */}
      <mesh position={[0, h + 0.28, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 5]} />
        <meshStandardMaterial color={ROOF_COLOR} />
      </mesh>

      {/* Window rows */}
      {[0.3, 0.65, 1.0].filter((wy) => wy < h - 0.1).map((wy, i) => (
        <RoundedBox
          key={i}
          args={[0.18, 0.14, 0.02]}
          radius={0.02}
          smoothness={2}
          position={[0, wy, 0.385]}
        >
          <meshStandardMaterial color="#d0e8f8" emissive="#a0c8e8" emissiveIntensity={0.2} />
        </RoundedBox>
      ))}
    </group>
  );
}

export const IncomeTower = memo(IncomeTowerInner);
