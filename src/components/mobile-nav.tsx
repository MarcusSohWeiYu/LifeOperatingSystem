"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-background z-10">
      <div className="flex items-center justify-around h-16 px-2">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
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
          <ThemeToggle />
          <span className="text-xs text-muted-foreground">Theme</span>
        </div>
      </div>
    </nav>
  );
}
