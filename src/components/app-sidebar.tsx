"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModuleSwitcher } from "@/components/module-switcher";
import { getActiveModule, modules } from "@/components/module-config";

export function AppSidebar() {
  const pathname = usePathname();
  const activeModule = getActiveModule(pathname) ?? modules[0]!;
  const dashboardHref = activeModule.navLinks[0]?.href ?? `/${activeModule.slug}`;

  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 border-r border-border bg-sidebar">
      <div className="flex items-center h-14 px-4 border-b border-border">
        <Link
          href="/"
          className="font-semibold text-sm tracking-tight text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors"
        >
          Life OS
        </Link>
      </div>

      <div className="px-2 pt-3 pb-1">
        <ModuleSwitcher />
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {activeModule.navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === dashboardHref
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <ThemeToggle />
      </div>
    </aside>
  );
}
