"use client";

import { cn } from "cn";
import { FoodItemCard } from "./food-item-card";
import type { ChatMessage } from "./types";
import type { MealType } from "../types";

type Props = {
  message: ChatMessage;
  onLogFood: (foodIndex: number, meal: MealType) => void;
};

export function MessageBubble({ message, onLogFood }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      {message.imageDataUrl && (
        <img
          src={message.imageDataUrl}
          alt="Food photo"
          className="max-w-48 rounded-lg border"
        />
      )}

      {message.content && (
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {/* Strip the JSON code block from display */}
          {isUser
            ? message.content
            : message.content.replace(/```json[\s\S]*?```/g, "").trim()}
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
