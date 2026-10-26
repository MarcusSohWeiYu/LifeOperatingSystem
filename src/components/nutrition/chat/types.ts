import type { AiFoodItem } from "@/actions/chat";

export type { AiFoodItem };

export type AttachedFood = {
  name: string;
  brand?: string;
  servingSize?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
  attachedFood?: AttachedFood;
  foodItems?: AiFoodItem[];
  loggedIndices?: number[];
  timestamp: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ChatSessionStore = {
  sessions: ChatSession[];
  activeSessionId: string | null;
};
