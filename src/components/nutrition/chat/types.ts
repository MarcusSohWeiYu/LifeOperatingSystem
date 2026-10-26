import type { AiFoodItem } from "@/actions/chat";

export type { AiFoodItem };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
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
