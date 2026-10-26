"use client";
import { useState, memo } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { IncomeTower } from "./buildings/income-tower";
import { SubscriptionShop } from "./buildings/subscription-shop";
import { BudgetBuilding } from "./buildings/budget-building";
import { GoalSite } from "./buildings/goal-site";
import type { CityFinanceData } from "./city-types";
import { formatSGD } from "@/lib/finance/money";

// Layout constants (absolute scene coords)
const INC_Z = -5.5;
const GOAL_Z = -3.8;
const BUDGET_Z = -2.0;
const SUBS_Z1 = 1.6;
const SUBS_Z2 = 2.9;

const INC_START_X = -7.0;
const INC_SPACING = 1.5;

const GOAL_START_X = -7.0;
const GOAL_SPACING = 1.7;

const NEEDS_START_X = -7.0;
const WANTS_START_X = -3.2;
const SAVINGS_START_X = 0.5;
const BUDGET_SPACING = 1.2;

const SUBS_START_X = -7.0;
const SUBS_SPACING = 1.15;

type AllocIndicatorProps = {
  unallocatedCents: number;
  isOverAllocated: boolean;
};

function AllocIndicator({ unallocatedCents, isOverAllocated }: AllocIndicatorProps) {
  const [hovered, setHovered] = useState(false);
  if (unallocatedCents === 0) return null;

  const color = isOverAllocated ? "#e87a7a" : "#6bc99a";
  const label = isOverAllocated
    ? `Over-allocated by ${formatSGD(Math.abs(unallocatedCents))}`
    : `${formatSGD(unallocatedCents)} unallocated`;

  return (
    <group position={[2.2, 0, BUDGET_Z]}>
      <mesh
        position={[0, 0.04, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.9, 0.08, 0.9]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.4 : 0.15}
          transparent
          opacity={0.85}
        />
      </mesh>
      {hovered && (
        <Html
          position={[0, 0.7, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg" style={{ whiteSpace: "nowrap" }}>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

type Props = {
  data: CityFinanceData;
  onNavigate: (href: string) => void;
};

function FinanceDistrictInner({ data, onNavigate }: Props) {
  const incomeSlice = data.income.filter((i) => i.active).slice(0, 4);
  const goalsSlice = data.goals.slice(0, 5);
  const needsSlice = data.budget.filter((b) => b.type === "needs").slice(0, 3);
  const wantsSlice = data.budget.filter((b) => b.type === "wants").slice(0, 3);
  const savingsSlice = data.budget.filter((b) => b.type === "savings").slice(0, 3);
  const subsSlice = data.subscriptions.filter((s) => s.active).slice(0, 8);
  const subsRow1 = subsSlice.slice(0, 4);
  const subsRow2 = subsSlice.slice(4);

  return (
    <group>
      {/* Income towers */}
      {incomeSlice.map((inc, i) => (
        <IncomeTower
          key={inc.id}
          building={inc}
          position={[INC_START_X + i * INC_SPACING, 0, INC_Z]}
          onNavigate={onNavigate}
        />
      ))}

      {/* Goal construction sites */}
      {goalsSlice.map((goal, i) => (
        <GoalSite
          key={goal.id}
          site={goal}
          position={[GOAL_START_X + i * GOAL_SPACING, 0, GOAL_Z]}
          onNavigate={onNavigate}
        />
      ))}

      {/* Budget – needs */}
      {needsSlice.map((b, i) => (
        <BudgetBuilding
          key={b.id}
          building={b}
          position={[NEEDS_START_X + i * BUDGET_SPACING, 0, BUDGET_Z]}
          onNavigate={onNavigate}
        />
      ))}

      {/* Budget – wants */}
      {wantsSlice.map((b, i) => (
        <BudgetBuilding
          key={b.id}
          building={b}
          position={[WANTS_START_X + i * BUDGET_SPACING, 0, BUDGET_Z]}
          onNavigate={onNavigate}
        />
      ))}

      {/* Budget – savings */}
      {savingsSlice.map((b, i) => (
        <BudgetBuilding
          key={b.id}
          building={b}
          position={[SAVINGS_START_X + i * BUDGET_SPACING, 0, BUDGET_Z]}
          onNavigate={onNavigate}
        />
      ))}

      {/* Allocation indicator (unallocated / over-allocated lot) */}
      <AllocIndicator
        unallocatedCents={data.allocation.unallocatedCents}
        isOverAllocated={data.allocation.isOverAllocated}
      />

      {/* Subscription shops – row 1 */}
      {subsRow1.map((sub, i) => (
        <SubscriptionShop
          key={sub.id}
          shop={sub}
          position={[SUBS_START_X + i * SUBS_SPACING, 0, SUBS_Z1]}
          onNavigate={onNavigate}
        />
      ))}

      {/* Subscription shops – row 2 */}
      {subsRow2.map((sub, i) => (
        <SubscriptionShop
          key={sub.id}
          shop={sub}
          position={[SUBS_START_X + i * SUBS_SPACING, 0, SUBS_Z2]}
          onNavigate={onNavigate}
        />
      ))}
    </group>
  );
}

export const FinanceDistrict = memo(FinanceDistrictInner);
