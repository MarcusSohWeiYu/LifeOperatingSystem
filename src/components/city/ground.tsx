"use client";
import { memo } from "react";
import { RoundedBox } from "@react-three/drei";

// Lane dash dimensions
const DASH_W = 0.06;
const DASH_H = 0.005;
const DASH_L = 0.3;
const DASH_GAP = 0.45;

function HorizontalRoadDashes({ z, xFrom, xTo }: { z: number; xFrom: number; xTo: number }) {
  const dashes: number[] = [];
  for (let x = xFrom; x < xTo; x += DASH_L + DASH_GAP) {
    dashes.push(x + DASH_L / 2);
  }
  return (
    <>
      {dashes.map((cx, i) => (
        <mesh key={i} position={[cx, 0.22, z]}>
          <boxGeometry args={[DASH_L, DASH_H, DASH_W]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
}

function VerticalRoadDashes({ x, zFrom, zTo }: { x: number; zFrom: number; zTo: number }) {
  const dashes: number[] = [];
  for (let z = zFrom; z < zTo; z += DASH_L + DASH_GAP) {
    dashes.push(z + DASH_L / 2);
  }
  return (
    <>
      {dashes.map((cz, i) => (
        <mesh key={i} position={[x, 0.22, cz]}>
          <boxGeometry args={[DASH_W, DASH_H, DASH_L]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
}

function GroundInner() {
  return (
    <group>
      {/* Island base platform */}
      <RoundedBox
        args={[24, 0.4, 16]}
        radius={0.3}
        smoothness={4}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#d8e8d0" />
      </RoundedBox>

      {/* Grass area – finance side */}
      <RoundedBox
        args={[22, 0.05, 4]}
        radius={0.1}
        smoothness={2}
        position={[-1, 0.19, -6.5]}
      >
        <meshStandardMaterial color="#8ec87e" />
      </RoundedBox>

      {/* Grass area – between roads */}
      <RoundedBox
        args={[8, 0.05, 3]}
        radius={0.1}
        smoothness={2}
        position={[-5, 0.19, -0.5]}
      >
        <meshStandardMaterial color="#8ec87e" />
      </RoundedBox>

      {/* Grass area – fitness side */}
      <RoundedBox
        args={[6, 0.05, 10]}
        radius={0.1}
        smoothness={2}
        position={[8, 0.19, -2]}
      >
        <meshStandardMaterial color="#8ec87e" />
      </RoundedBox>

      {/* Horizontal road – between budget and goals rows */}
      <RoundedBox
        args={[24, 0.06, 0.85]}
        radius={0.04}
        smoothness={2}
        position={[0, 0.19, 0.8]}
      >
        <meshStandardMaterial color="#4a4a4a" />
      </RoundedBox>
      <HorizontalRoadDashes z={0.8} xFrom={-11} xTo={11} />

      {/* Vertical road – finance / fitness separator */}
      <RoundedBox
        args={[0.85, 0.06, 16]}
        radius={0.04}
        smoothness={2}
        position={[4.2, 0.19, 0]}
      >
        <meshStandardMaterial color="#4a4a4a" />
      </RoundedBox>
      <VerticalRoadDashes x={4.2} zFrom={-7} zTo={7} />

      {/* Sidewalk strips – horizontal road */}
      <mesh position={[0, 0.215, 0.8 - 0.5]}>
        <boxGeometry args={[24, 0.03, 0.12]} />
        <meshStandardMaterial color="#c0c0b8" />
      </mesh>
      <mesh position={[0, 0.215, 0.8 + 0.5]}>
        <boxGeometry args={[24, 0.03, 0.12]} />
        <meshStandardMaterial color="#c0c0b8" />
      </mesh>

      {/* Sidewalk strips – vertical road */}
      <mesh position={[4.2 - 0.5, 0.215, 0]}>
        <boxGeometry args={[0.12, 0.03, 16]} />
        <meshStandardMaterial color="#c0c0b8" />
      </mesh>
      <mesh position={[4.2 + 0.5, 0.215, 0]}>
        <boxGeometry args={[0.12, 0.03, 16]} />
        <meshStandardMaterial color="#c0c0b8" />
      </mesh>
    </group>
  );
}

export const Ground = memo(GroundInner);
