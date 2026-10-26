import type { ChatSession, ChatSessionStore } from "./types";

const STORAGE_KEY = "ai-chat-sessions";

const EMPTY_STORE: ChatSessionStore = {
  sessions: [],
  activeSessionId: null,
};

export function loadChatStore(): ChatSessionStore {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as ChatSessionStore;
    if (!Array.isArray(parsed.sessions)) return EMPTY_STORE;
    return parsed;
  } catch {
    return EMPTY_STORE;
  }
}

export function saveChatStore(store: ChatSessionStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createSession(store: ChatSessionStore, id: string): ChatSessionStore {
  const now = new Date().toISOString();
  const session: ChatSession = {
    id,
    title: "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  return {
    sessions: [session, ...store.sessions],
    activeSessionId: id,
  };
}

export function deleteSession(store: ChatSessionStore, sessionId: string): ChatSessionStore {
  const sessions = store.sessions.filter((s) => s.id !== sessionId);
  const activeSessionId =
    store.activeSessionId === sessionId
      ? (sessions[0]?.id ?? null)
      : store.activeSessionId;
  return { sessions, activeSessionId };
}

export function updateSession(
  store: ChatSessionStore,
  sessionId: string,
  updater: (session: ChatSession) => ChatSession,
): ChatSessionStore {
  return {
    ...store,
    sessions: store.sessions.map((s) =>
      s.id === sessionId ? updater(s) : s,
    ),
  };
}

export function getActiveSession(store: ChatSessionStore): ChatSession | undefined {
  if (!store.activeSessionId) return undefined;
  return store.sessions.find((s) => s.id === store.activeSessionId);
}
