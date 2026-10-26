"use client";
import { useState, useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { MeshStandardMaterial } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { CitySubscriptionShop } from "../city-types";

const CATEGORY_COLORS: Record<string, string> = {
  entertainment: "#f0a0a0",
  food: "#f0d0a0",
  transport: "#a0d0f0",
  utilities: "#d0d0a0",
  health: "#a0f0a0",
  education: "#d0a0f0",
  streaming: "#f0b0c8",
  software: "#b8d0f0",
  music: "#c8b0f0",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? "#d0c8d0";
}

type Props = {
  shop: CitySubscriptionShop;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
  phase?: number;
};

function SubscriptionShopInner({ shop, position, selected, onSelect, phase = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<MeshStandardMaterial>(null);
  const color = categoryColor(shop.category);
  const bodyH = 1.1;

  useFrame((state) => {
    if (shop.renewingSoon && matRef.current && !selected && !hovered) {
      matRef.current.emissiveIntensity =
        0.1 + Math.abs(Math.sin(state.clock.elapsedTime * 1.8 + phase)) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Building body */}
      <RoundedBox
        args={[0.6, bodyH, 0.6]}
        radius={0.07}
        smoothness={3}
        position={[0, bodyH / 2, 0]}
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
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.35 : hovered ? 0.15 : shop.renewingSoon ? 0.1 : 0}
        />
      </RoundedBox>

      {/* Awning */}
      <RoundedBox
        args={[0.68, 0.05, 0.28]}
        radius={0.02}
        smoothness={2}
        position={[0, bodyH * 0.75, 0.3]}
        rotation={[-Math.PI / 10, 0, 0]}
      >
        <meshStandardMaterial color={shop.renewingSoon ? "#f07070" : color} />
      </RoundedBox>

      {/* Flat roof */}
      <RoundedBox
        args={[0.68, 0.08, 0.68]}
        radius={0.04}
        smoothness={2}
        position={[0, bodyH + 0.04, 0]}
      >
        <meshStandardMaterial color="#e8e0d8" />
      </RoundedBox>
    </group>
  );
}

export const SubscriptionShop = memo(SubscriptionShopInner);
