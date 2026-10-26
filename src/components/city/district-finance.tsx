"use client";
import { memo } from "react";
import { IncomeTower } from "./buildings/income-tower";
import { SubscriptionShop } from "./buildings/subscription-shop";
import { BudgetBuilding } from "./buildings/budget-building";
import { GoalSite } from "./buildings/goal-site";
import type { CityFinanceData, SelectedBuilding } from "./city-types";

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

type Props = {
  data: CityFinanceData;
  selectedId: string | null;
  onSelect: (id: string, pos: [number, number, number], building: SelectedBuilding) => void;
};

function FinanceDistrictInner({ data, selectedId, onSelect }: Props) {
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
      {incomeSlice.map((inc, i) => {
        const wx = INC_START_X + i * INC_SPACING;
        const h = Math.max(0.8, Math.min(4.5, inc.monthlyCents / 250_000));
        return (
          <IncomeTower
            key={inc.id}
            building={inc}
            position={[wx, 0.22, INC_Z]}
            phase={i * 0.8}
            selected={selectedId === inc.id}
            onSelect={() =>
              onSelect(inc.id, [wx, h + 0.22 + 0.8, INC_Z], { kind: "income", building: inc })
            }
          />
        );
      })}

      {/* Goal construction sites */}
      {goalsSlice.map((goal, i) => {
        const wx = GOAL_START_X + i * GOAL_SPACING;
        const totalH = Math.max(0.6, Math.min(4.0, goal.targetCents / 300_000));
        return (
          <GoalSite
            key={goal.id}
            site={goal}
            position={[wx, 0.22, GOAL_Z]}
            selected={selectedId === goal.id}
            onSelect={() =>
              onSelect(goal.id, [wx, totalH + 0.22 + 0.8, GOAL_Z], { kind: "goal", site: goal })
            }
          />
        );
      })}

      {/* Budget – needs */}
      {needsSlice.map((b, i) => {
        const wx = NEEDS_START_X + i * BUDGET_SPACING;
        const h = Math.max(0.4, Math.min(2.8, b.plannedMonthlyCents / 120_000));
        return (
          <BudgetBuilding
            key={b.id}
            building={b}
            position={[wx, 0.22, BUDGET_Z]}
            selected={selectedId === b.id}
            onSelect={() =>
              onSelect(b.id, [wx, h + 0.22 + 0.7, BUDGET_Z], { kind: "budget", building: b })
            }
          />
        );
      })}

      {/* Budget – wants */}
      {wantsSlice.map((b, i) => {
        const wx = WANTS_START_X + i * BUDGET_SPACING;
        const h = Math.max(0.4, Math.min(2.8, b.plannedMonthlyCents / 120_000));
        return (
          <BudgetBuilding
            key={b.id}
            building={b}
            position={[wx, 0.22, BUDGET_Z]}
            selected={selectedId === b.id}
            onSelect={() =>
              onSelect(b.id, [wx, h + 0.22 + 0.7, BUDGET_Z], { kind: "budget", building: b })
            }
          />
        );
      })}

      {/* Budget – savings */}
      {savingsSlice.map((b, i) => {
        const wx = SAVINGS_START_X + i * BUDGET_SPACING;
        const h = Math.max(0.4, Math.min(2.8, b.plannedMonthlyCents / 120_000));
        return (
          <BudgetBuilding
            key={b.id}
            building={b}
            position={[wx, 0.22, BUDGET_Z]}
            selected={selectedId === b.id}
            onSelect={() =>
              onSelect(b.id, [wx, h + 0.22 + 0.7, BUDGET_Z], { kind: "budget", building: b })
            }
          />
        );
      })}

      {/* Subscription shops – row 1 */}
      {subsRow1.map((sub, i) => {
        const wx = SUBS_START_X + i * SUBS_SPACING;
        return (
          <SubscriptionShop
            key={sub.id}
            shop={sub}
            position={[wx, 0.22, SUBS_Z1]}
            phase={i * 1.2}
            selected={selectedId === sub.id}
            onSelect={() =>
              onSelect(sub.id, [wx, 1.5, SUBS_Z1], { kind: "subscription", shop: sub })
            }
          />
        );
      })}

      {/* Subscription shops – row 2 */}
      {subsRow2.map((sub, i) => {
        const wx = SUBS_START_X + i * SUBS_SPACING;
        return (
          <SubscriptionShop
            key={sub.id}
            shop={sub}
            position={[wx, 0.22, SUBS_Z2]}
            phase={i * 1.2 + 0.6}
            selected={selectedId === sub.id}
            onSelect={() =>
              onSelect(sub.id, [wx, 1.5, SUBS_Z2], { kind: "subscription", shop: sub })
            }
          />
        );
      })}
    </group>
  );
}

export const FinanceDistrict = memo(FinanceDistrictInner);
