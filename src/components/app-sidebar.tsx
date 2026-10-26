"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModuleSwitcher } from "@/components/module-switcher";
import { getActiveModule, modules } from "@/components/module-config";
import { useSidebar } from "@/components/sidebar-context";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const activeModule = getActiveModule(pathname) ?? modules[0]!;
  const dashboardHref = activeModule.navLinks[0]?.href ?? `/${activeModule.slug}`;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed inset-y-0 left-0 bg-sidebar transition-[width] duration-200 ease-out z-20",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex items-center h-14 px-3 justify-between">
        {!collapsed && (
          <Link
            href="/"
            className="font-semibold text-sm tracking-tight text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors"
          >
            Life OS
          </Link>
        )}
        <Button variant="ghost" size="icon-sm" onClick={toggle} className="text-sidebar-foreground shrink-0">
          {collapsed
            ? <PanelLeftOpenIcon className="h-4 w-4" />
            : <PanelLeftCloseIcon className="h-4 w-4" />
          }
        </Button>
      </div>

      {!collapsed && (
        <div className="px-2 pb-1">
          <ModuleSwitcher />
        </div>
      )}

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
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className={cn("px-3 py-3", collapsed && "px-1.5")}>
        <ThemeToggle />
      </div>
    </aside>
  );
}
