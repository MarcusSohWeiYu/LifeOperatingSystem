"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ModuleSwitcher } from "@/components/module-switcher";
import { getActiveModule, modules } from "@/components/module-config";

export function MobileNav() {
  const pathname = usePathname();
  const activeModule = getActiveModule(pathname) ?? modules[0]!;
  const dashboardHref = activeModule.navLinks[0]?.href ?? `/${activeModule.slug}`;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-background z-10">
      <div className="flex items-center justify-around h-16 px-2">
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
                "flex flex-col items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <div className="flex flex-col items-center gap-1 px-2 py-1">
          <ModuleSwitcher compact />
          <span className="text-xs text-muted-foreground">Switch</span>
        </div>
      </div>
    </nav>
  );
}
