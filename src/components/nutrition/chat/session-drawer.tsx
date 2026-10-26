"use client";

import { MessageSquareIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { ChatSession } from "./types";

type Props = {
  open: boolean;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function SessionDrawer({
  open,
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: Props) {
  // Sort by most recently updated
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r shadow-lg transition-transform duration-200 ease-out flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">Chat Sessions</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-3 py-2">
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => { onNew(); onClose(); }}>
            <PlusIcon className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sorted.map((session) => (
            <div
              key={session.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted transition-colors",
                session.id === activeSessionId && "bg-muted",
              )}
              onClick={() => { onSelect(session.id); onClose(); }}
            >
              <MessageSquareIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{session.title}</p>
                <p className="text-xs text-muted-foreground">
                  {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {sorted.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No sessions yet
            </p>
          )}
        </div>
      </div>
    </>
  );
}
