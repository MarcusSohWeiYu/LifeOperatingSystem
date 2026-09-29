import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  PiggyBank,
  Target,
  Calculator,
} from "lucide-react";

export const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/income", label: "Income", icon: Banknote },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/planner", label: "Planner", icon: Calculator },
] as const;
