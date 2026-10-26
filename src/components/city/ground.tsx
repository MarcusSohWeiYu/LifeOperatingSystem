"use client";
import { memo } from "react";

function GroundInner() {
  return (
    <group>
      {/* Grass base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[26, 18]} />
        <meshStandardMaterial color="#b0d4a8" />
      </mesh>
      {/* Horizontal road (between budget rows and goals) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.8]}>
        <planeGeometry args={[26, 0.7]} />
        <meshStandardMaterial color="#c8c8c4" />
      </mesh>
      {/* Vertical road (finance / fitness separator) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0, 0]}>
        <planeGeometry args={[0.7, 18]} />
        <meshStandardMaterial color="#c8c8c4" />
      </mesh>
    </group>
  );
}

export const Ground = memo(GroundInner);
