"use client";
import { useState, memo } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { CitySubscriptionShop } from "../city-types";
import { formatSGD } from "@/lib/finance/money";

const CATEGORY_COLORS: Record<string, string> = {
  entertainment: "#f0a0a0",
  food: "#f0d0a0",
  transport: "#a0d0f0",
  utilities: "#d0d0a0",
  health: "#a0f0a0",
  education: "#d0a0f0",
  streaming: "#f0b8d0",
  software: "#b8d0f0",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? "#d0c8d0";
}

type Props = {
  shop: CitySubscriptionShop;
  position: [number, number, number];
  onNavigate: (href: string) => void;
};

function SubscriptionShopInner({ shop, position, onNavigate }: Props) {
  const [hovered, setHovered] = useState(false);
  const color = categoryColor(shop.category);
  const bodyH = 0.55;
  const awningColor = shop.renewingSoon ? "#f08080" : color;

  return (
    <group position={position}>
      {/* Building body */}
      <mesh
        castShadow
        receiveShadow
        position={[0, bodyH / 2, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onNavigate("/finance/subscriptions"); }}
      >
        <boxGeometry args={[0.6, bodyH, 0.6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.25 : shop.renewingSoon ? 0.15 : 0}
        />
      </mesh>
      {/* Awning */}
      <mesh
        position={[0, bodyH * 0.7, 0.28]}
        rotation={[-Math.PI / 8, 0, 0]}
      >
        <boxGeometry args={[0.65, 0.04, 0.3]} />
        <meshStandardMaterial color={awningColor} />
      </mesh>
      {/* Flat roof */}
      <mesh position={[0, bodyH + 0.04, 0]}>
        <boxGeometry args={[0.65, 0.08, 0.65]} />
        <meshStandardMaterial color="#e8e0d8" />
      </mesh>
      {hovered && (
        <Html
          position={[0, bodyH + 0.9, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg" style={{ whiteSpace: "nowrap" }}>
            <p className="font-medium">{shop.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatSGD(shop.monthlyCents)}/mo
              {shop.renewingSoon && <span className="ml-1 text-red-500">· renewing soon</span>}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

export const SubscriptionShop = memo(SubscriptionShopInner);
