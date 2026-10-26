"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { useSidebar } from "@/components/sidebar-context";
import { cn } from "@/lib/utils";

export default function FitnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <>
      <AppSidebar />
      <main className={cn("pb-16 md:pb-0 min-h-screen transition-[padding-left] duration-200", collapsed ? "md:pl-14" : "md:pl-56")}>
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {children}
        </div>
      </main>
      <MobileNav />
    </>
  );
}
