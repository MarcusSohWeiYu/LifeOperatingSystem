"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, MessageSquareIcon, PlusIcon, RotateCcwIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { ChatSession } from "./types";

type Props = {
  open: boolean;
  activeSessions: ChatSession[];
  deletedSessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
  onClose: () => void;
};

function sortByUpdated(sessions: ChatSession[]): ChatSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function daysUntilPurge(deletedAt: string): number {
  const ms = 30 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(deletedAt).getTime());
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function SessionDrawer({
  open,
  activeSessions: active,
  deletedSessions: deleted,
  activeSessionId,
  onSelect,
  onNew,
  onDelete,
  onRestore,
  onPermanentlyDelete,
  onClose,
}: Props) {
  const [trashOpen, setTrashOpen] = useState(false);
  const sortedActive = sortByUpdated(active);
  const sortedDeleted = sortByUpdated(deleted);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="absolute inset-0 z-40 bg-black/40 rounded-xl"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 z-50 w-72 bg-background border-r shadow-lg transition-transform duration-200 ease-out flex flex-col rounded-l-xl",
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
          {/* Active sessions */}
          {sortedActive.map((session) => (
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

          {sortedActive.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No sessions yet
            </p>
          )}

          {/* Deleted sessions (trash) */}
          {sortedDeleted.length > 0 && (
            <div className="border-t mt-2 pt-1">
              <button
                type="button"
                onClick={() => setTrashOpen((v) => !v)}
                className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                {trashOpen
                  ? <ChevronDownIcon className="h-3 w-3" />
                  : <ChevronRightIcon className="h-3 w-3" />
                }
                <Trash2Icon className="h-3 w-3" />
                Recently Deleted ({sortedDeleted.length})
              </button>

              {trashOpen && sortedDeleted.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-2 px-3 py-2 opacity-60"
                >
                  <MessageSquareIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{session.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {session.deletedAt ? `${daysUntilPurge(session.deletedAt)}d left` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestore(session.id)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Restore"
                  >
                    <RotateCcwIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPermanentlyDelete(session.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
