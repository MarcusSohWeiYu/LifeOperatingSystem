"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { analyzeFood } from "@/actions/chat";
import { loadNutritionState, saveNutritionState, todayDateStr } from "../utils";
import { getDefaultNutritionState } from "../mock-data";
import { MEAL_LABELS } from "../types";
import type { MealType, FoodEntry } from "../types";
import type { AiFoodItem, ChatMessage, ChatSessionStore } from "./types";
import {
  loadChatStore,
  saveChatStore,
  createSession,
  deleteSession,
  updateSession,
  getActiveSession,
} from "./chat-storage";
import { ChatHeader } from "./chat-header";
import { SessionDrawer } from "./session-drawer";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

export function ChatClient() {
  const [store, setStore] = useState<ChatSessionStore>(() => {
    if (typeof window === "undefined") return { sessions: [], activeSessionId: null };
    let loaded = loadChatStore();
    if (loaded.sessions.length === 0) {
      loaded = createSession(loaded, crypto.randomUUID());
    }
    return loaded;
  });
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const idCounterRef = useRef(0);

  // Persist store on change
  useEffect(() => {
    saveChatStore(store);
  }, [store]);

  const session = getActiveSession(store);
  const messages = useMemo(() => session?.messages ?? [], [session?.messages]);

  function nextId(): string {
    idCounterRef.current += 1;
    return `chat-msg-${idCounterRef.current}`;
  }

  // ── Session management ──────────────────────────────────────────────────

  function handleNewSession() {
    setStore((s) => createSession(s, crypto.randomUUID()));
  }

  function handleDeleteSession() {
    if (!store.activeSessionId) return;
    const next = deleteSession(store, store.activeSessionId);
    // If all sessions deleted, create a new one
    if (next.sessions.length === 0) {
      setStore(createSession(next, crypto.randomUUID()));
    } else {
      setStore(next);
    }
  }

  function handleSelectSession(id: string) {
    setStore((s) => ({ ...s, activeSessionId: id }));
  }

  function handleDeleteSessionFromDrawer(id: string) {
    let next = deleteSession(store, id);
    if (next.sessions.length === 0) {
      next = createSession(next, crypto.randomUUID());
    }
    setStore(next);
  }

  // ── Send message ──────────────────────────────────────────────────────

  const handleSend = useCallback(async (text: string, imageDataUrl?: string) => {
    if (!store.activeSessionId) return;
    const sessionId = store.activeSessionId;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: text,
      imageDataUrl,
      timestamp: new Date().toISOString(),
    };

    // Add user message and auto-title on first message
    setStore((s) =>
      updateSession(s, sessionId, (sess) => {
        const isFirst = sess.messages.length === 0;
        return {
          ...sess,
          messages: [...sess.messages, userMsg],
          title: isFirst ? text.slice(0, 40) || "Photo chat" : sess.title,
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    setSending(true);

    // Build message history for the API
    const historyMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
      imageDataUrl: m.imageDataUrl,
    }));

    const result = await analyzeFood(historyMessages);

    if (!result.ok) {
      toast.error(result.error);
      setSending(false);
      return;
    }

    const assistantMsg: ChatMessage = {
      id: nextId(),
      role: "assistant",
      content: result.content,
      foodItems: result.foodItems.length > 0 ? result.foodItems : undefined,
      timestamp: new Date().toISOString(),
    };

    setStore((s) =>
      updateSession(s, sessionId, (sess) => ({
        ...sess,
        messages: [...sess.messages, assistantMsg],
        updatedAt: new Date().toISOString(),
      })),
    );

    setSending(false);
  }, [store.activeSessionId, messages]);

  // ── Log food ──────────────────────────────────────────────────────────

  function handleLogFood(messageId: string, foodIndex: number, meal: MealType) {
    // Find the food item in the message
    const msg = messages.find((m) => m.id === messageId);
    const item: AiFoodItem | undefined = msg?.foodItems?.[foodIndex];
    if (!item) return;

    // Load current nutrition state and add entry
    let nutritionState = loadNutritionState();
    if (!nutritionState) {
      nutritionState = getDefaultNutritionState();
    }

    const today = todayDateStr();
    const existingLog = nutritionState.logs[today];
    const existingEntries: FoodEntry[] = existingLog?.entries ?? [];

    const newEntry: FoodEntry = {
      id: `ai-${crypto.randomUUID().slice(0, 8)}`,
      meal,
      name: item.name,
      brand: item.brand,
      servingSize: item.servingSize,
      servings: item.servings,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
    };

    nutritionState = {
      ...nutritionState,
      logs: {
        ...nutritionState.logs,
        [today]: { date: today, entries: [...existingEntries, newEntry] },
      },
    };

    saveNutritionState(nutritionState);

    // Mark item as logged in chat store
    if (store.activeSessionId) {
      setStore((s) =>
        updateSession(s, store.activeSessionId!, (sess) => ({
          ...sess,
          messages: sess.messages.map((m) => {
            if (m.id !== messageId) return m;
            return {
              ...m,
              loggedIndices: [...(m.loggedIndices ?? []), foodIndex],
            };
          }),
        })),
      );
    }

    toast.success(`${item.name} logged to ${MEAL_LABELS[meal]}`);
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <ChatHeader
        session={session}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onToggleDrawer={() => setDrawerOpen((o) => !o)}
      />

      <MessageList
        messages={messages}
        sending={sending}
        onLogFood={handleLogFood}
      />

      <ChatInput
        disabled={sending || !store.activeSessionId}
        onSend={handleSend}
      />

      <SessionDrawer
        open={drawerOpen}
        sessions={store.sessions}
        activeSessionId={store.activeSessionId}
        onSelect={handleSelectSession}
        onNew={handleNewSession}
        onDelete={handleDeleteSessionFromDrawer}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
