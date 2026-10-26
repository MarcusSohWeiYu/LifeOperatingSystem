"use client";
import { memo } from "react";

const TREE_POSITIONS: [number, number, number][] = [
  [-8.5, 0, -6.5],
  [-6.5, 0, -6.5],
  [-4.5, 0, -6.5],
  [-8.5, 0, 3.5],
  [-6.5, 0, 3.5],
  [-4.0, 0, 3.5],
  [-1.5, 0, 3.5],
  [1.0, 0, 3.5],
  [3.5, 0, 3.5],
  [5.0, 0, 2.5],
  [8.5, 0, 2.5],
  [8.5, 0, -4.5],
];

const CAR_DEFS: { pos: [number, number, number]; color: string; rot: number }[] = [
  { pos: [-3.5, 0.08, 0.8], color: "#6090e0", rot: 0 },
  { pos: [0.5, 0.08, 0.8], color: "#e06060", rot: 0 },
  { pos: [3.0, 0.08, 0.8], color: "#e0d060", rot: 0 },
  { pos: [4.0, 0.08, -2.5], color: "#60c090", rot: Math.PI / 2 },
];

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 0.36, 6]} />
        <meshStandardMaterial color="#8B6914" />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 0.58, 0]}>
        <coneGeometry args={[0.28, 0.52, 7]} />
        <meshStandardMaterial color="#5a9a5a" />
      </mesh>
    </group>
  );
}

function Car({ pos, color, rot }: { pos: [number, number, number]; color: string; rot: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Body */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.35, 0.14, 0.18]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.16]} />
        <meshStandardMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function DecorationsInner() {
  return (
    <group>
      {TREE_POSITIONS.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}
      {CAR_DEFS.map((car, i) => (
        <Car key={i} pos={car.pos} color={car.color} rot={car.rot} />
      ))}
    </group>
  );
}

export const Decorations = memo(DecorationsInner);
