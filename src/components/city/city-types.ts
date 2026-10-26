export type GoalHealth = "reached" | "on-track" | "behind" | "overdue";
export type GoalType = "trip" | "purchase" | "other";
export type BudgetType = "needs" | "wants" | "savings";

export type CityIncomeBuilding = {
  id: string;
  name: string;
  monthlyCents: number;
  active: boolean;
};

export type CitySubscriptionShop = {
  id: string;
  name: string;
  monthlyCents: number;
  category: string;
  renewingSoon: boolean;
  active: boolean;
};

export type CityBudgetBuilding = {
  id: string;
  category: string;
  plannedMonthlyCents: number;
  type: BudgetType;
};

export type CityGoalSite = {
  id: string;
  name: string;
  type: GoalType;
  targetCents: number;
  savedCents: number;
  progress: number;        // 0-100
  health: GoalHealth;
  months: number;
  requiredMonthlyCents: number;
  priority: number;
};

export type CityAllocation = {
  totalIncomeCents: number;
  subscriptionsCents: number;
  needsCents: number;
  wantsCents: number;
  savingsCents: number;
  goalFundingCents: number;
  unallocatedCents: number;
  isOverAllocated: boolean;
};

export type CityFinanceData = {
  income: CityIncomeBuilding[];
  subscriptions: CitySubscriptionShop[];
  budget: CityBudgetBuilding[];
  goals: CityGoalSite[];
  allocation: CityAllocation;
};

export type CityData = {
  finance: CityFinanceData;
};

export type SelectedBuilding =
  | { kind: "income"; building: CityIncomeBuilding }
  | { kind: "subscription"; shop: CitySubscriptionShop }
  | { kind: "budget"; building: CityBudgetBuilding }
  | { kind: "goal"; site: CityGoalSite }
  | { kind: "gym"; calories: number; target: number; proteinG: number };
