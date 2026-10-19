"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { modules, getActiveModule } from "@/components/module-config";

type Props = {
  /** Compact: icon-only trigger (for mobile nav). Default: icon + label + chevron. */
  compact?: boolean;
};

export function ModuleSwitcher({ compact = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();

  const active = getActiveModule(pathname);
  const Icon = active?.icon ?? modules[0]!.icon;
  const label = active?.label ?? "Modules";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switch module"
        className={
          compact
            ? "inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        }
      >
        <Icon className="size-4 shrink-0" />
        {!compact && (
          <>
            <span className="flex-1 text-left">{label}</span>
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={compact ? "center" : "start"} className="w-44">
        {modules.map((m) => {
          const MIcon = m.icon;
          const isActive = active?.slug === m.slug;
          return (
            <DropdownMenuItem
              key={m.slug}
              onClick={() => router.push(`/${m.slug}`)}
              className={isActive ? "font-medium" : ""}
            >
              <MIcon className="mr-2 size-4" />
              {m.label}
            </DropdownMenuItem>
          );
        })}

        {/* Theme toggle — shown in mobile compact mode only */}
        {compact && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 size-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 size-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
