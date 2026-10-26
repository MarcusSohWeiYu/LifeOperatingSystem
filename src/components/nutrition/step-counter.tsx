"use client";

import { useState, useRef, useCallback } from "react";
import { FootprintsIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";


type Props = {
  steps: number;
  onChange: (steps: number) => void;
};

export function StepCounter({ steps, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(() => {
    setEditValue(steps > 0 ? String(steps) : "");
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [steps]);

  const confirmEdit = useCallback(() => {
    const val = parseInt(editValue, 10);
    onChange(isNaN(val) || val < 0 ? 0 : val);
    setEditing(false);
  }, [editValue, onChange]);

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5">
      <FootprintsIcon className="h-4 w-4 text-muted-foreground shrink-0" />

      {editing ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="0"
            className="w-24 bg-transparent text-base md:text-sm font-medium outline-none border-b border-primary tabular-nums"
          />
          <Button variant="ghost" size="icon-xs" onClick={confirmEdit}>
            <CheckIcon className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => setEditing(false)}>
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="flex items-center gap-1.5 flex-1 min-w-0 group"
          onClick={startEdit}
        >
          <span className="text-sm font-medium tabular-nums">
            {steps > 0 ? steps.toLocaleString() : "—"}
          </span>
          <span className="text-xs text-muted-foreground">steps</span>
          <PencilIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-auto" />
        </button>
      )}
    </div>
  );
}
