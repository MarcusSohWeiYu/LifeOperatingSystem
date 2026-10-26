"use client";

import { useState } from "react";
import { CheckIcon, MenuIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatSession } from "./types";

type Props = {
  session: ChatSession | undefined;
  onNewSession: () => void;
  onDeleteSession: () => void;
  onRenameSession: (title: string) => void;
  onToggleDrawer: () => void;
};

export function ChatHeader({ session, onNewSession, onDeleteSession, onRenameSession, onToggleDrawer }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  function startRename() {
    setEditValue(session?.title ?? "");
    setEditing(true);
  }

  function confirmRename() {
    const trimmed = editValue.trim();
    if (trimmed) onRenameSession(trimmed);
    setEditing(false);
  }

  return (
    <header className="flex items-center gap-2 border-b px-3 py-2">
      <Button variant="ghost" size="icon-sm" onClick={onToggleDrawer}>
        <MenuIcon className="h-4 w-4" />
      </Button>

      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmRename();
              if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 bg-transparent text-sm font-medium outline-none border-b border-primary"
          />
          <Button variant="ghost" size="icon-xs" onClick={confirmRename}>
            <CheckIcon className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => setEditing(false)}>
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="flex-1 flex items-center gap-1.5 min-w-0 group"
          onClick={startRename}
        >
          <h1 className="truncate text-sm font-medium">
            {session?.title ?? "AI Chat"}
          </h1>
          <PencilIcon className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

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
