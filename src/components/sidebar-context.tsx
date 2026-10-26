"use client";

import { createContext, useContext, useState, useCallback } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return (
    <SidebarContext value={{ collapsed, toggle }}>
      {children}
    </SidebarContext>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
