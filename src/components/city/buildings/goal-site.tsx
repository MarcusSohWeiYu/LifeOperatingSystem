"use client";
import { useState, memo } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { CityGoalSite } from "../city-types";
import { formatSGD } from "@/lib/finance/money";

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
  onNavigate: (href: string) => void;
};

function GoalSiteInner({ site, position, onNavigate }: Props) {
  const [hovered, setHovered] = useState(false);
  const color = HEALTH_COLORS[site.health];
  const totalH = clamp(site.targetCents / 300_000, 0.6, 4.0);
  const filledH = Math.max(0.05, (site.progress / 100) * totalH);
  const remainH = Math.max(0, totalH - filledH);
  const isStrugglingHealth = site.health === "behind" || site.health === "overdue";

  return (
    <group position={position}>
      {/* Filled / completed portion */}
      <mesh
        castShadow
        receiveShadow
        position={[0, filledH / 2, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onNavigate(`/finance/goals/${site.id}`); }}
      >
        <boxGeometry args={[0.75, filledH, 0.75]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Remaining ghost portion */}
      {remainH > 0.08 && (
        <mesh position={[0, filledH + remainH / 2, 0]}>
          <boxGeometry args={[0.75, remainH, 0.75]} />
          <meshStandardMaterial color={color} transparent opacity={0.18} />
        </mesh>
      )}

      {/* Scaffold pole for behind/overdue goals */}
      {isStrugglingHealth && (
        <group>
          <mesh position={[0.46, totalH * 0.65, 0.46]}>
            <cylinderGeometry args={[0.03, 0.03, totalH * 1.1, 5]} />
            <meshStandardMaterial color="#b0a090" />
          </mesh>
          {/* Crane arm */}
          <mesh
            position={[0.25, totalH * 1.15, 0.25]}
            rotation={[0, Math.PI / 4, -Math.PI / 6]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.55, 5]} />
            <meshStandardMaterial color="#b0a090" />
          </mesh>
        </group>
      )}

      {/* Completion flag for reached goals */}
      {site.health === "reached" && (
        <group>
          <mesh position={[0, totalH + 0.35, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.7, 5]} />
            <meshStandardMaterial color="#888" />
          </mesh>
          <mesh position={[0.16, totalH + 0.6, 0]}>
            <boxGeometry args={[0.32, 0.16, 0.025]} />
            <meshStandardMaterial color="#6bc99a" />
          </mesh>
        </group>
      )}

      {hovered && (
        <Html
          position={[0, totalH + 1.0, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg" style={{ whiteSpace: "nowrap" }}>
            <p className="font-medium">{site.name}</p>
            <p className="text-xs text-muted-foreground">
              {site.progress}% · {formatSGD(site.savedCents)} / {formatSGD(site.targetCents)}
            </p>
            {site.months > 0 && (
              <p className="text-xs text-muted-foreground">{site.months} months left</p>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export const GoalSite = memo(GoalSiteInner);
