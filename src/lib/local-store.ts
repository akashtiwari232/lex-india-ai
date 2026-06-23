import { useCallback, useSyncExternalStore } from "react";

export type LocalThread = {
  id: string;
  title: string;
  doc_category: string | null;
  doc_type: string | null;
  created_at: string;
  updated_at: string;
};

export type LocalMessage = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type LocalDraft = {
  id: string;
  thread_id: string | null;
  title: string;
  doc_type: string | null;
  content: string;
  created_at: string;
};

const THREADS_KEY = "lexindia.threads.v1";
const MESSAGES_KEY = "lexindia.messages.v1";
const DRAFTS_KEY = "lexindia.drafts.v1";

const subscribers = new Set<() => void>();
function subscribe(fn: () => void) {
  subscribers.add(fn);
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THREADS_KEY || e.key === MESSAGES_KEY || e.key === DRAFTS_KEY) fn();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      subscribers.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => subscribers.delete(fn);
}
function notify() {
  subscribers.forEach((fn) => fn());
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  notify();
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getThreadsSnapshot(): LocalThread[] {
  return read<LocalThread[]>(THREADS_KEY, []);
}
function getMessagesSnapshot(): LocalMessage[] {
  return read<LocalMessage[]>(MESSAGES_KEY, []);
}
function getDraftsSnapshot(): LocalDraft[] {
  return read<LocalDraft[]>(DRAFTS_KEY, []);
}

export function useThreads(): LocalThread[] {
  return useSyncExternalStore(subscribe, getThreadsSnapshot, () => [] as LocalThread[]);
}
export function useDrafts(): LocalDraft[] {
  return useSyncExternalStore(subscribe, getDraftsSnapshot, () => [] as LocalDraft[]);
}
export function useThread(id: string): LocalThread | null {
  const threads = useThreads();
  return threads.find((t) => t.id === id) ?? null;
}
export function useThreadMessages(threadId: string): LocalMessage[] {
  const all = useSyncExternalStore(subscribe, getMessagesSnapshot, () => [] as LocalMessage[]);
  return all.filter((m) => m.thread_id === threadId);
}
export function useDraft(id: string): LocalDraft | null {
  const drafts = useDrafts();
  return drafts.find((d) => d.id === id) ?? null;
}

export function createThread(input: {
  title?: string;
  doc_category?: string | null;
  doc_type?: string | null;
}): LocalThread {
  const now = new Date().toISOString();
  const t: LocalThread = {
    id: newId(),
    title: input.title || "New Draft",
    doc_category: input.doc_category ?? null,
    doc_type: input.doc_type ?? null,
    created_at: now,
    updated_at: now,
  };
  const all = getThreadsSnapshot();
  write(THREADS_KEY, [t, ...all]);
  return t;
}

export function updateThread(id: string, patch: Partial<Omit<LocalThread, "id" | "created_at">>) {
  const all = getThreadsSnapshot();
  const next = all.map((t) =>
    t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t,
  );
  write(THREADS_KEY, next);
}

export function deleteThread(id: string) {
  write(
    THREADS_KEY,
    getThreadsSnapshot().filter((t) => t.id !== id),
  );
  write(
    MESSAGES_KEY,
    getMessagesSnapshot().filter((m) => m.thread_id !== id),
  );
}

export function addMessage(msg: Omit<LocalMessage, "id" | "created_at">): LocalMessage {
  const m: LocalMessage = { ...msg, id: newId(), created_at: new Date().toISOString() };
  write(MESSAGES_KEY, [...getMessagesSnapshot(), m]);
  updateThread(msg.thread_id, {});
  return m;
}

export function saveDraft(input: {
  title: string;
  content: string;
  doc_type?: string | null;
  thread_id?: string | null;
}): LocalDraft {
  const d: LocalDraft = {
    id: newId(),
    title: input.title,
    content: input.content,
    doc_type: input.doc_type ?? null,
    thread_id: input.thread_id ?? null,
    created_at: new Date().toISOString(),
  };
  write(DRAFTS_KEY, [d, ...getDraftsSnapshot()]);
  return d;
}

export function deleteDraft(id: string) {
  write(
    DRAFTS_KEY,
    getDraftsSnapshot().filter((d) => d.id !== id),
  );
}

export function useStoreActions() {
  return {
    createThread: useCallback(createThread, []),
    updateThread: useCallback(updateThread, []),
    deleteThread: useCallback(deleteThread, []),
    addMessage: useCallback(addMessage, []),
    saveDraft: useCallback(saveDraft, []),
    deleteDraft: useCallback(deleteDraft, []),
  };
}
