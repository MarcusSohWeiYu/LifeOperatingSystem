import type { ChatSession, ChatSessionStore } from "./types";

const STORAGE_KEY = "ai-chat-sessions";
const DELETED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
    // Purge sessions deleted more than 30 days ago
    const now = Date.now();
    const sessions = parsed.sessions.filter((s) => {
      if (!s.deletedAt) return true;
      return now - new Date(s.deletedAt).getTime() < DELETED_RETENTION_MS;
    });
    return { ...parsed, sessions };
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

export function softDeleteSession(store: ChatSessionStore, sessionId: string): ChatSessionStore {
  const sessions = store.sessions.map((s) =>
    s.id === sessionId ? { ...s, deletedAt: new Date().toISOString() } : s,
  );
  const activeSessions = sessions.filter((s) => !s.deletedAt);
  const activeSessionId =
    store.activeSessionId === sessionId
      ? (activeSessions[0]?.id ?? null)
      : store.activeSessionId;
  return { sessions, activeSessionId };
}

export function restoreSession(store: ChatSessionStore, sessionId: string): ChatSessionStore {
  return {
    ...store,
    sessions: store.sessions.map((s) =>
      s.id === sessionId ? { ...s, deletedAt: undefined } : s,
    ),
  };
}

export function permanentlyDeleteSession(store: ChatSessionStore, sessionId: string): ChatSessionStore {
  return {
    ...store,
    sessions: store.sessions.filter((s) => s.id !== sessionId),
  };
}

export function renameSession(store: ChatSessionStore, sessionId: string, title: string): ChatSessionStore {
  return {
    ...store,
    sessions: store.sessions.map((s) =>
      s.id === sessionId ? { ...s, title } : s,
    ),
  };
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
  return store.sessions.find((s) => s.id === store.activeSessionId && !s.deletedAt);
}

export function activeSessions(store: ChatSessionStore): ChatSession[] {
  return store.sessions.filter((s) => !s.deletedAt);
}

export function deletedSessions(store: ChatSessionStore): ChatSession[] {
  return store.sessions.filter((s) => !!s.deletedAt);
}
