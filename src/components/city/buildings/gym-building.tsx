"use client";
import { useState, useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";

const COLOR = "#c878b8";
const ROOF_COLOR = "#a058a0";

type Props = {
  position: [number, number, number];
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinG: number;
  selected: boolean;
  onSelect: () => void;
};

function GymBuildingInner({ position, caloriesConsumed, caloriesTarget, proteinG, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);

  // Suppress unused-var warning — proteinG flows to stats card via onSelect
  void proteinG;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.7 + 1.2) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main gym body */}
      <RoundedBox
        args={[1.2, 1.8, 1.0]}
        radius={0.1}
        smoothness={3}
        position={[0, 0.9, 0]}
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

      {/* Flat roof with overhang */}
      <RoundedBox
        args={[1.35, 0.12, 1.12]}
        radius={0.05}
        smoothness={2}
        position={[0, 1.86, 0]}
      >
        <meshStandardMaterial color={ROOF_COLOR} />
      </RoundedBox>

      {/* Entrance door panel */}
      <RoundedBox
        args={[0.34, 0.6, 0.04]}
        radius={0.02}
        smoothness={2}
        position={[0, 0.4, 0.52]}
      >
        <meshStandardMaterial color="#f0e0f0" transparent opacity={0.6} />
      </RoundedBox>

      {/* Dumbbell decoration – left sphere */}
      <mesh position={[-0.28, 2.06, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      {/* Dumbbell decoration – bar */}
      <mesh position={[0, 2.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.56, 6]} />
        <meshStandardMaterial color="#aaaaaa" />
      </mesh>
      {/* Dumbbell decoration – right sphere */}
      <mesh position={[0.28, 2.06, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#888888" />
      </mesh>

      {/* Calorie progress strip on front face */}
      {caloriesTarget > 0 && (
        <mesh position={[0, 0.9 * Math.min(1, caloriesConsumed / caloriesTarget), 0.52]}>
          <boxGeometry args={[0.06, (caloriesConsumed / caloriesTarget) * 1.6, 0.01]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

export const GymBuilding = memo(GymBuildingInner);
