"use client";

import Link from "next/link";
import { ArrowLeftIcon, MenuIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatSession } from "./types";

type Props = {
  session: ChatSession | undefined;
  onNewSession: () => void;
  onDeleteSession: () => void;
  onToggleDrawer: () => void;
};

export function ChatHeader({ session, onNewSession, onDeleteSession, onToggleDrawer }: Props) {
  return (
    <header className="flex items-center gap-2 border-b px-3 py-2">
      <Link href="/fitness/nutrition">
        <Button variant="ghost" size="icon-sm">
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
      </Link>

      <Button variant="ghost" size="icon-sm" onClick={onToggleDrawer}>
        <MenuIcon className="h-4 w-4" />
      </Button>

      <h1 className="flex-1 truncate text-sm font-medium">
        {session?.title ?? "AI Chat"}
      </h1>

      <Button variant="ghost" size="icon-sm" onClick={onNewSession}>
        <PlusIcon className="h-4 w-4" />
      </Button>

      {session && (
        <Button variant="ghost" size="icon-sm" onClick={onDeleteSession}>
          <Trash2Icon className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </header>
  );
}
