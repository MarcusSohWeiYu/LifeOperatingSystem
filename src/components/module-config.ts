import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  PiggyBank,
  Target,
  Calculator,
  Wallet,
  Dumbbell,
  Activity,
  UtensilsCrossed,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type ModuleConfig = {
  slug: string;
  label: string;
  icon: LucideIcon;
  description: string;
  navLinks: NavLink[];
};

export const modules: ModuleConfig[] = [
  {
    slug: "finance",
    label: "Finance",
    icon: Wallet,
    description: "Income, subscriptions, budget and goals.",
    navLinks: [
      { href: "/finance", label: "Dashboard", icon: LayoutDashboard },
      { href: "/finance/subscriptions", label: "Subscriptions", icon: CreditCard },
      { href: "/finance/income", label: "Income", icon: Banknote },
      { href: "/finance/budget", label: "Budget", icon: PiggyBank },
      { href: "/finance/goals", label: "Goals", icon: Target },
      { href: "/finance/planner", label: "Planner", icon: Calculator },
    ],
  },
  {
    slug: "fitness",
    label: "Fitness",
    icon: Dumbbell,
    description: "Workouts, nutrition and body stats.",
    navLinks: [
      { href: "/fitness", label: "Dashboard", icon: LayoutDashboard },
      { href: "/fitness/workouts", label: "Workouts", icon: Activity },
      { href: "/fitness/nutrition", label: "Nutrition", icon: UtensilsCrossed },
      { href: "/fitness/stats", label: "Stats", icon: BarChart3 },
    ],
  },
];

export function getActiveModule(pathname: string): ModuleConfig | undefined {
  return modules.find((m) => pathname === `/${m.slug}` || pathname.startsWith(`/${m.slug}/`));
}
