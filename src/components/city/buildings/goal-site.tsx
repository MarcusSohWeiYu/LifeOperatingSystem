"use client";
import { useState, useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { CityGoalSite } from "../city-types";

const HEALTH_COLORS = {
  reached: "#6bc99a",
  "on-track": "#7abde8",
  behind: "#e8c97a",
  overdue: "#e87a7a",
} as const;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type Props = {
  site: CityGoalSite;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
};

function GoalSiteInner({ site, position, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);
  const craneRef = useRef<Group>(null);
  const color = HEALTH_COLORS[site.health];
  const totalH = clamp(site.targetCents / 300_000, 0.6, 4.0);
  const filledH = Math.max(0.08, (site.progress / 100) * totalH);
  const remainH = Math.max(0, totalH - filledH);
  const isStruggling = site.health === "behind" || site.health === "overdue";

  useFrame((state) => {
    if (craneRef.current && isStruggling) {
      craneRef.current.rotation.y = state.clock.elapsedTime * 0.4;
    }
  });

  const pointerHandlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(true);
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      setHovered(false);
      document.body.style.cursor = "auto";
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect();
    },
  };

  return (
    <group position={position}>
      {/* Filled / completed portion */}
      <RoundedBox
        args={[0.75, filledH, 0.75]}
        radius={0.08}
        smoothness={3}
        position={[0, filledH / 2, 0]}
        castShadow
        receiveShadow
        {...pointerHandlers}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.35 : hovered ? 0.15 : 0}
        />
      </RoundedBox>

      {/* Remaining ghost portion */}
      {remainH > 0.08 && (
        <RoundedBox
          args={[0.75, remainH, 0.75]}
          radius={0.08}
          smoothness={3}
          position={[0, filledH + remainH / 2, 0]}
          {...pointerHandlers}
        >
          <meshStandardMaterial color={color} transparent opacity={0.18} />
        </RoundedBox>
      )}

      {/* Crane for behind/overdue goals */}
      {isStruggling && (
        <group ref={craneRef} position={[0, totalH * 0.5, 0]}>
          <mesh position={[0.46, totalH * 0.3, 0.46]}>
            <cylinderGeometry args={[0.03, 0.035, totalH * 0.6, 5]} />
            <meshStandardMaterial color="#b0a090" />
          </mesh>
          <mesh position={[0.3, totalH * 0.6, 0.3]} rotation={[0, 0, -Math.PI / 5]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 5]} />
            <meshStandardMaterial color="#b0a090" />
          </mesh>
        </group>
      )}

      {/* Completion flag for reached goals */}
      {site.health === "reached" && (
        <group>
          <mesh position={[0, totalH + 0.35, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.7, 5]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
          <mesh position={[0.16, totalH + 0.6, 0]}>
            <boxGeometry args={[0.32, 0.16, 0.025]} />
            <meshStandardMaterial color="#6bc99a" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export const GoalSite = memo(GoalSiteInner);
