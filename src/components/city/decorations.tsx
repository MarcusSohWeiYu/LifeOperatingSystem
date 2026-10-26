"use client";
import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";

const TREE_POSITIONS: [number, number, number][] = [
  [-9.0, 0, -7.0],
  [-7.0, 0, -7.0],
  [-5.0, 0, -7.0],
  [-9.0, 0, 4.0],
  [-7.0, 0, 4.0],
  [-4.5, 0, 4.0],
  [-2.0, 0, 4.0],
  [0.5, 0, 4.0],
  [3.0, 0, 4.0],
  [5.5, 0, 4.0],
  [9.0, 0, 3.5],
  [9.0, 0, -5.0],
  [7.0, 0, -7.0],
  [9.0, 0, -1.5],
  [5.5, 0, -7.0],
];

const LAMP_POSITIONS: [number, number, number][] = [
  [-2.5, 0, 0.35],
  [1.5, 0, 0.35],
  [-2.5, 0, 1.25],
  [1.5, 0, 1.25],
  [3.8, 0, -3.5],
  [3.8, 0, 2.5],
];

// Car paths: each car moves along an axis between two bounds, wraps around
type CarDef = {
  startX: number;
  y: number;
  z: number;
  color: string;
  speed: number;
  halfRange: number;
  phase: number;
};

const CAR_DEFS: CarDef[] = [
  { startX: -5.0, y: 0.22, z: 0.5, color: "#6090e0", speed: 1.4, halfRange: 8, phase: 0 },
  { startX: 0.0, y: 0.22, z: 1.1, color: "#e06060", speed: -1.1, halfRange: 8, phase: 2.5 },
  { startX: 3.0, y: 0.22, z: 0.5, color: "#e0d060", speed: 1.8, halfRange: 8, phase: 5.0 },
];

// Person paths: each person walks along z-axis
type PersonDef = {
  x: number;
  startZ: number;
  y: number;
  color: string;
  speed: number;
  halfRange: number;
  phase: number;
};

const PERSON_DEFS: PersonDef[] = [
  { x: -3.0, startZ: -1.0, y: 0.22, color: "#e8b090", speed: 0.5, halfRange: 3, phase: 0 },
  { x: 1.0, startZ: -2.5, y: 0.22, color: "#90b8e8", speed: -0.4, halfRange: 3, phase: 1.5 },
  { x: -1.0, startZ: 0.0, y: 0.22, color: "#e890b0", speed: 0.6, halfRange: 2.5, phase: 3.0 },
  { x: 2.5, startZ: -3.5, y: 0.22, color: "#b0e890", speed: -0.35, halfRange: 2.5, phase: 4.5 },
];

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.055, 0.075, 0.44, 6]} />
        <meshStandardMaterial color="#8B6914" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.28, 8, 7]} />
        <meshStandardMaterial color="#5aaa5a" />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#4a9a4a" />
      </mesh>
    </group>
  );
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1.2, 6]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffaa" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function AnimatedCar({ def }: { def: CarDef }) {
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x += def.speed * delta;
    if (ref.current.position.x > def.halfRange) {
      ref.current.position.x = -def.halfRange;
    } else if (ref.current.position.x < -def.halfRange) {
      ref.current.position.x = def.halfRange;
    }
  });

  const dir = def.speed > 0 ? 0 : Math.PI;

  return (
    <group ref={ref} position={[def.startX, def.y, def.z]} rotation={[0, dir, 0]}>
      <RoundedBox args={[0.38, 0.16, 0.2]} radius={0.04} smoothness={2} position={[0, 0.08, 0]}>
        <meshStandardMaterial color={def.color} />
      </RoundedBox>
      <RoundedBox args={[0.22, 0.12, 0.18]} radius={0.03} smoothness={2} position={[0, 0.2, 0]}>
        <meshStandardMaterial color={def.color} transparent opacity={0.85} />
      </RoundedBox>
    </group>
  );
}

function AnimatedPerson({ def }: { def: PersonDef }) {
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.z += def.speed * delta;
    if (ref.current.position.z > def.halfRange) {
      ref.current.position.z = -def.halfRange;
    } else if (ref.current.position.z < -def.halfRange) {
      ref.current.position.z = def.halfRange;
    }
  });

  return (
    <group ref={ref} position={[def.x, def.y, def.startZ]}>
      {/* Body */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.28, 6]} />
        <meshStandardMaterial color={def.color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.33, 0]}>
        <sphereGeometry args={[0.075, 7, 6]} />
        <meshStandardMaterial color="#f0c8a0" />
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
      {LAMP_POSITIONS.map((pos, i) => (
        <StreetLamp key={i} position={pos} />
      ))}
      {CAR_DEFS.map((def, i) => (
        <AnimatedCar key={i} def={def} />
      ))}
      {PERSON_DEFS.map((def, i) => (
        <AnimatedPerson key={i} def={def} />
      ))}
    </group>
  );
}

export const Decorations = memo(DecorationsInner);
