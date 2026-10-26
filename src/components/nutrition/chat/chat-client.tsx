"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { parseFoodItems } from "./parse-food-items";
import { loadNutritionState, saveNutritionState, todayDateStr } from "../utils";
import { getDefaultNutritionState } from "../mock-data";
import { MEAL_LABELS } from "../types";
import type { MealType, FoodEntry, SavedFood } from "../types";
import type { AiFoodItem, AttachedFood, ChatMessage, ChatSessionStore } from "./types";
import {
  loadChatStore,
  saveChatStore,
  createSession,
  softDeleteSession,
  restoreSession,
  permanentlyDeleteSession,
  renameSession,
  updateSession,
  getActiveSession,
  activeSessions,
  deletedSessions,
} from "./chat-storage";
import { ChatHeader } from "./chat-header";
import { SessionDrawer } from "./session-drawer";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { FoodPickerDialog } from "./food-picker-dialog";

export function ChatClient() {
  const [store, setStore] = useState<ChatSessionStore>(() => {
    let loaded = loadChatStore();
    if (loaded.sessions.length === 0) {
      loaded = createSession(loaded, crypto.randomUUID());
    }
    return loaded;
  });
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const [stagedFood, setStagedFood] = useState<AttachedFood | null>(null);

  // Persist store on change
  useEffect(() => {
    saveChatStore(store);
  }, [store]);

  const session = getActiveSession(store);
  const messages = useMemo(() => session?.messages ?? [], [session?.messages]);

  // ── Session management ──────────────────────────────────────────────────

  function handleNewSession() {
    setStore((s) => createSession(s, crypto.randomUUID()));
  }

  function handleDeleteSession() {
    if (!store.activeSessionId) return;
    const next = softDeleteSession(store, store.activeSessionId);
    if (activeSessions(next).length === 0) {
      setStore(createSession(next, crypto.randomUUID()));
    } else {
      setStore(next);
    }
    toast.success("Chat moved to trash");
  }

  function handleSelectSession(id: string) {
    setStore((s) => ({ ...s, activeSessionId: id }));
  }

  function handleSoftDeleteFromDrawer(id: string) {
    let next = softDeleteSession(store, id);
    if (activeSessions(next).length === 0) {
      next = createSession(next, crypto.randomUUID());
    }
    setStore(next);
    toast.success("Chat moved to trash");
  }

  function handleRestoreSession(id: string) {
    setStore((s) => restoreSession(s, id));
    toast.success("Chat restored");
  }

  function handlePermanentlyDelete(id: string) {
    setStore((s) => permanentlyDeleteSession(s, id));
    toast.success("Chat permanently deleted");
  }

  function handleRenameSession(id: string, title: string) {
    setStore((s) => renameSession(s, id, title));
  }

  // ── Saved foods for picker ─────────────────────────────────────────────

  const savedFoods: SavedFood[] = useMemo(() => {
    if (!foodPickerOpen) return [];
    const state = loadNutritionState();
    return state?.savedFoods ?? [];
  }, [foodPickerOpen]);

  function handleFoodPicked(food: AttachedFood) {
    setStagedFood(food);
  }

  // ── Send message (streaming) ─────────────────────────────────────────

  const handleSend = useCallback(async (text: string, imageDataUrl?: string, attachedFood?: AttachedFood) => {
    if (!store.activeSessionId) return;
    const sessionId = store.activeSessionId;

    // Build content for the AI — embed food details if attached
    let aiContent = text;
    if (attachedFood) {
      const foodDesc = [
        attachedFood.name,
        attachedFood.brand ? `(${attachedFood.brand})` : "",
        `— ${attachedFood.calories} cal`,
        `P: ${attachedFood.proteinG}g`,
        `C: ${attachedFood.carbsG}g`,
        `F: ${attachedFood.fatG}g`,
        attachedFood.servingSize ? `per ${attachedFood.servingSize}` : "",
      ].filter(Boolean).join(" ");
      aiContent = text
        ? `[Food: ${foodDesc}]\n${text}`
        : `Tell me about this food: ${foodDesc}`;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: aiContent,
      imageDataUrl,
      attachedFood,
      timestamp: new Date().toISOString(),
    };

    // Clear staged food
    setStagedFood(null);

    const titleSource = text || attachedFood?.name || "Photo chat";

    setStore((s) =>
      updateSession(s, sessionId, (sess) => {
        const isFirst = sess.messages.length === 0;
        return {
          ...sess,
          messages: [...sess.messages, userMsg],
          title: isFirst ? titleSource.slice(0, 40) : sess.title,
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    setSending(true);

    // Build message history for the streaming API
    const historyMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
      imageDataUrl: m.imageDataUrl,
    }));

    const assistantId = crypto.randomUUID();

    // Add empty assistant message that we'll stream into
    setStore((s) =>
      updateSession(s, sessionId, (sess) => ({
        ...sess,
        messages: [...sess.messages, {
          id: assistantId,
          role: "assistant" as const,
          content: "",
          timestamp: new Date().toISOString(),
        }],
        updatedAt: new Date().toISOString(),
      })),
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "AI request failed" })) as { error?: string };
        toast.error(err.error ?? "AI request failed");
        // Remove the empty assistant message
        setStore((s) =>
          updateSession(s, sessionId, (sess) => ({
            ...sess,
            messages: sess.messages.filter((m) => m.id !== assistantId),
          })),
        );
        setSending(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        toast.error("Streaming not supported");
        setSending(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullContent += decoder.decode(value, { stream: true });
        const currentContent = fullContent;

        // Update the assistant message with streamed content
        setStore((s) =>
          updateSession(s, sessionId, (sess) => ({
            ...sess,
            messages: sess.messages.map((m) =>
              m.id === assistantId ? { ...m, content: currentContent } : m,
            ),
          })),
        );
      }

      // Final update: parse food items from complete response
      const foodItems = parseFoodItems(fullContent);
      setStore((s) =>
        updateSession(s, sessionId, (sess) => ({
          ...sess,
          messages: sess.messages.map((m) =>
            m.id === assistantId
              ? { ...m, content: fullContent, foodItems: foodItems.length > 0 ? foodItems : undefined }
              : m,
          ),
          updatedAt: new Date().toISOString(),
        })),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI request failed";
      toast.error(msg);
    }

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

  // ── Edit message ────────────────────────────────────────────────────

  function handleEditMessage(messageId: string, newContent: string) {
    if (!store.activeSessionId) return;
    setStore((s) =>
      updateSession(s, store.activeSessionId!, (sess) => ({
        ...sess,
        messages: sess.messages.map((m) => {
          if (m.id !== messageId) return m;
          return { ...m, content: newContent };
        }),
        updatedAt: new Date().toISOString(),
      })),
    );
    toast.success("Message updated");
  }

  return (
    <div className="relative flex h-screen md:h-screen flex-col bg-card overflow-hidden">
      <ChatHeader
        session={session}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={(title) => {
          if (store.activeSessionId) handleRenameSession(store.activeSessionId, title);
        }}
        onToggleDrawer={() => setDrawerOpen((o) => !o)}
      />

      <MessageList
        messages={messages}
        sending={sending}
        onLogFood={handleLogFood}
        onEditMessage={handleEditMessage}
      />

      <ChatInput
        disabled={sending || !store.activeSessionId}
        stagedFood={stagedFood}
        onSend={handleSend}
        onPickFood={() => setFoodPickerOpen(true)}
        onClearFood={() => setStagedFood(null)}
      />

      <FoodPickerDialog
        open={foodPickerOpen}
        onOpenChange={setFoodPickerOpen}
        savedFoods={savedFoods}
        onSelect={handleFoodPicked}
      />

      <SessionDrawer
        open={drawerOpen}
        activeSessions={activeSessions(store)}
        deletedSessions={deletedSessions(store)}
        activeSessionId={store.activeSessionId}
        onSelect={handleSelectSession}
        onNew={handleNewSession}
        onDelete={handleSoftDeleteFromDrawer}
        onRestore={handleRestoreSession}
        onPermanentlyDelete={handlePermanentlyDelete}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
