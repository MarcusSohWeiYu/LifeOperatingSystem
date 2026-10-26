"use client";
import { memo } from "react";
import { RoundedBox } from "@react-three/drei";

// Lane dash constants
const DASH_W = 0.07;
const DASH_L = 0.4;
const DASH_GAP = 0.5;

function HorizontalDashes({ z, xFrom, xTo, y }: { z: number; xFrom: number; xTo: number; y: number }) {
  const dashes: number[] = [];
  for (let x = xFrom; x < xTo; x += DASH_L + DASH_GAP) {
    dashes.push(x + DASH_L / 2);
  }
  return (
    <>
      {dashes.map((cx, i) => (
        <mesh key={i} position={[cx, y + 0.004, z]}>
          <boxGeometry args={[DASH_L, 0.005, DASH_W]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
}

function VerticalDashes({ x, zFrom, zTo, y }: { x: number; zFrom: number; zTo: number; y: number }) {
  const dashes: number[] = [];
  for (let z = zFrom; z < zTo; z += DASH_L + DASH_GAP) {
    dashes.push(z + DASH_L / 2);
  }
  return (
    <>
      {dashes.map((cz, i) => (
        <mesh key={i} position={[x, y + 0.004, cz]}>
          <boxGeometry args={[DASH_W, 0.005, DASH_L]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
}

// Ground surface y (top of platform)
const SURF = 0.20;
// Road sits 0.02 above surface
const ROAD_Y = SURF + 0.01;
const ROAD_H = 0.04;

function GroundInner() {
  return (
    <group>
      {/* Island platform body */}
      <RoundedBox
        args={[22, 0.4, 15]}
        radius={0.25}
        smoothness={4}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#c4d8b8" />
      </RoundedBox>

      {/* Horizontal road – between budget rows and subs rows */}
      <mesh position={[0, ROAD_Y, 0.8]}>
        <boxGeometry args={[22, ROAD_H, 0.95]} />
        <meshStandardMaterial color="#3a3c3e" />
      </mesh>
      <HorizontalDashes z={0.8} xFrom={-10} xTo={10} y={ROAD_Y + ROAD_H / 2} />

      {/* Vertical road – finance / fitness separator */}
      <mesh position={[4.2, ROAD_Y, 0]}>
        <boxGeometry args={[0.95, ROAD_H, 15]} />
        <meshStandardMaterial color="#3a3c3e" />
      </mesh>
      <VerticalDashes x={4.2} zFrom={-7} zTo={7} y={ROAD_Y + ROAD_H / 2} />

      {/* Sidewalk strips – horizontal road edges */}
      <mesh position={[0, ROAD_Y, 0.8 - 0.55]}>
        <boxGeometry args={[22, ROAD_H + 0.01, 0.14]} />
        <meshStandardMaterial color="#b8b4a8" />
      </mesh>
      <mesh position={[0, ROAD_Y, 0.8 + 0.55]}>
        <boxGeometry args={[22, ROAD_H + 0.01, 0.14]} />
        <meshStandardMaterial color="#b8b4a8" />
      </mesh>

      {/* Sidewalk strips – vertical road edges */}
      <mesh position={[4.2 - 0.55, ROAD_Y, 0]}>
        <boxGeometry args={[0.14, ROAD_H + 0.01, 15]} />
        <meshStandardMaterial color="#b8b4a8" />
      </mesh>
      <mesh position={[4.2 + 0.55, ROAD_Y, 0]}>
        <boxGeometry args={[0.14, ROAD_H + 0.01, 15]} />
        <meshStandardMaterial color="#b8b4a8" />
      </mesh>

      {/* Grass patches */}
      <mesh position={[-2, SURF + 0.005, -5.5]}>
        <boxGeometry args={[20, 0.01, 3.5]} />
        <meshStandardMaterial color="#8ec87e" />
      </mesh>
      <mesh position={[7.5, SURF + 0.005, -1.5]}>
        <boxGeometry args={[5.5, 0.01, 9]} />
        <meshStandardMaterial color="#8ec87e" />
      </mesh>
    </group>
  );
}

export const Ground = memo(GroundInner);
