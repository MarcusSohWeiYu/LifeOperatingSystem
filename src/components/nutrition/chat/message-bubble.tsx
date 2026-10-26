"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "cn";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { FoodItemCard } from "./food-item-card";
import type { ChatMessage } from "./types";
import type { MealType } from "../types";

type Props = {
  message: ChatMessage;
  onLogFood: (foodIndex: number, meal: MealType) => void;
  onEdit?: (newContent: string) => void;
};

function displayContent(message: ChatMessage): string {
  if (message.role === "assistant") {
    return message.content.replace(/```json[\s\S]*?```/g, "").trim();
  }
  // For user messages, strip the [Food: ...] prefix used for AI context
  const stripped = message.content.replace(/^\[Food: [^\]]+\]\n?/, "").trim();
  return stripped || "Tell me about this food";
}

export function MessageBubble({ message, onLogFood, onEdit }: Props) {
  const isUser = message.role === "user";
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      ta.selectionStart = ta.value.length;
      ta.selectionEnd = ta.value.length;
    }
  }, [editing]);

  function startEdit() {
    setEditValue(displayContent(message));
    setEditing(true);
  }

  function confirmEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== displayContent(message) && onEdit) {
      onEdit(trimmed);
    }
    setEditing(false);
  }

  const content = displayContent(message);

  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      {message.imageDataUrl && (
        /* eslint-disable-next-line @next/next/no-img-element -- base64 data URL, not optimizable */
        <img
          src={message.imageDataUrl}
          alt="Food photo"
          className="max-w-48 rounded-lg border"
        />
      )}

      {isUser && message.attachedFood && (
        <div className="max-w-[85%] rounded-xl border bg-primary/10 px-3 py-2 text-sm">
          <p className="font-medium">{message.attachedFood.name}</p>
          <p className="text-xs text-muted-foreground">
            {message.attachedFood.calories} cal · P {message.attachedFood.proteinG}g · C {message.attachedFood.carbsG}g · F {message.attachedFood.fatG}g
            {message.attachedFood.servingSize ? ` · ${message.attachedFood.servingSize}` : ""}
          </p>
        </div>
      )}

      {content && (
        <div className={cn("group relative max-w-[85%]", isUser && "flex items-start gap-1")}>
          {isUser && !editing && onEdit && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1.5"
              onClick={startEdit}
            >
              <PencilIcon className="h-3 w-3" />
            </Button>
          )}

          {editing ? (
            <div className="flex flex-col gap-1 w-full min-w-48">
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmEdit(); }
                  if (e.key === "Escape") setEditing(false);
                }}
                rows={2}
                className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ maxHeight: "120px", overflow: "auto" }}
              />
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="icon-xs" onClick={() => setEditing(false)}>
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={confirmEdit}>
                  <CheckIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : isUser ? (
            <div className="rounded-2xl bg-primary text-primary-foreground px-3.5 py-2 text-sm whitespace-pre-wrap">
              {content}
            </div>
          ) : (
            <div className="rounded-2xl bg-muted text-foreground px-3.5 py-2 text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {message.foodItems && message.foodItems.length > 0 && (
        <div className="w-full max-w-[85%] space-y-2">
          {message.foodItems.map((item, i) => (
            <FoodItemCard
              key={i}
              item={item}
              logged={message.loggedIndices?.includes(i) ?? false}
              onLog={(meal) => onLogFood(i, meal)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
