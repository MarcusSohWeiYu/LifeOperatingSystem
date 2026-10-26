"use client";

import { useEffect, useRef } from "react";
import { Loader2Icon } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage } from "./types";
import type { MealType } from "../types";

type Props = {
  messages: ChatMessage[];
  sending: boolean;
  onLogFood: (messageId: string, foodIndex: number, meal: MealType) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
};

export function MessageList({ messages, sending, onLogFood, onEditMessage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  if (messages.length === 0 && !sending) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm px-4">
        <p className="text-center">
          Send a photo of your food or describe what you ate to get macro estimates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onLogFood={(foodIndex, meal) => onLogFood(msg.id, foodIndex, meal)}
          onEdit={msg.role === "user" ? (newContent) => onEditMessage(msg.id, newContent) : undefined}
        />
      ))}

      {sending && (
        <div className="flex items-start">
          <div className="bg-muted rounded-2xl px-3.5 py-2">
            <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
