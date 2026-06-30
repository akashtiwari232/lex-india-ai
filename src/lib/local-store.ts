import { useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export type DraftVersion = {
  version: number;
  content: string;
  created_at: string;
  note?: string;
};

export type LocalDraft = {
  id: string;
  thread_id: string | null;
  title: string;
  doc_type: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  versions: DraftVersion[];
};

let currentUserId: string | null = null;

function loadUser() {
  if (typeof window === "undefined") return;
  try {
    const u = window.localStorage.getItem("lexlaw.currentUser");
    currentUserId = u || null;
  } catch {
    currentUserId = null;
  }
}
loadUser();

if (typeof window !== "undefined") {
  // Keep currentUserId in sync with Supabase session.
  supabase.auth.getUser().then(({ data }) => {
    setCurrentUser(data.user?.id ?? null);
  });
  supabase.auth.onAuthStateChange((_e, session) => {
    setCurrentUser(session?.user?.id ?? null);
  });
}

export function setCurrentUser(userId: string | null) {
  if (currentUserId === userId) return;
  currentUserId = userId;
  if (typeof window !== "undefined") {
    if (userId) window.localStorage.setItem("lexlaw.currentUser", userId);
    else window.localStorage.removeItem("lexlaw.currentUser");
  }
  // Snapshot cache is keyed by namespaced key, but consumers read via
  // unchanged getters — clear so they re-resolve under the new namespace.
  if (typeof snapshotCache !== "undefined") snapshotCache.clear?.();
  notify();
}

function ns(key: string) {
  return `lexlaw.${currentUserId ?? "anon"}.${key}`;
}
const THREADS = "threads.v2";
const MESSAGES = "messages.v2";
const DRAFTS = "drafts.v2";

const subscribers = new Set<() => void>();
function subscribe(fn: () => void) {
  subscribers.add(fn);
  let unsubStorage = () => {};
  if (typeof window !== "undefined") {
    const onStorage = () => fn();
    window.addEventListener("storage", onStorage);
    unsubStorage = () => window.removeEventListener("storage", onStorage);
  }
  return () => {
    subscribers.delete(fn);
    unsubStorage();
  };
}
function notify() {
  subscribers.forEach((fn) => fn());
}

// Snapshot cache: keep stable references unless the underlying raw string changes.
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const fullKey = ns(key);
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(fullKey);
  } catch {
    return fallback;
  }
  const cached = snapshotCache.get(fullKey);
  if (cached && cached.raw === raw) return cached.value as T;
  let value: T = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  snapshotCache.set(fullKey, { raw, value });
  return value;
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const fullKey = ns(key);
  const raw = JSON.stringify(value);
  window.localStorage.setItem(fullKey, raw);
  snapshotCache.set(fullKey, { raw, value });
  notify();
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const EMPTY_THREADS: LocalThread[] = [];
const EMPTY_MESSAGES: LocalMessage[] = [];
const EMPTY_DRAFTS: LocalDraft[] = [];
const getThreadsSnapshot = () => read<LocalThread[]>(THREADS, EMPTY_THREADS);
const getMessagesSnapshot = () => read<LocalMessage[]>(MESSAGES, EMPTY_MESSAGES);
const getDraftsSnapshot = () => read<LocalDraft[]>(DRAFTS, EMPTY_DRAFTS);

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
  write(THREADS, [t, ...getThreadsSnapshot()]);
  return t;
}

export function updateThread(id: string, patch: Partial<Omit<LocalThread, "id" | "created_at">>) {
  write(
    THREADS,
    getThreadsSnapshot().map((t) =>
      t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t,
    ),
  );
}

export function deleteThread(id: string) {
  write(THREADS, getThreadsSnapshot().filter((t) => t.id !== id));
  write(MESSAGES, getMessagesSnapshot().filter((m) => m.thread_id !== id));
}

export function addMessage(msg: Omit<LocalMessage, "id" | "created_at">): LocalMessage {
  const m: LocalMessage = { ...msg, id: newId(), created_at: new Date().toISOString() };
  write(MESSAGES, [...getMessagesSnapshot(), m]);
  updateThread(msg.thread_id, {});
  return m;
}

export function saveDraft(input: {
  title: string;
  content: string;
  doc_type?: string | null;
  thread_id?: string | null;
}): LocalDraft {
  const now = new Date().toISOString();
  // If a draft already exists for this thread, append a version instead.
  const drafts = getDraftsSnapshot();
  if (input.thread_id) {
    const existing = drafts.find((d) => d.thread_id === input.thread_id);
    if (existing) {
      const nextVersion = existing.versions.length + 1;
      const updated: LocalDraft = {
        ...existing,
        title: input.title,
        content: input.content,
        updated_at: now,
        versions: [
          ...existing.versions,
          { version: nextVersion, content: input.content, created_at: now },
        ],
      };
      write(DRAFTS, drafts.map((d) => (d.id === existing.id ? updated : d)));
      return updated;
    }
  }
  const d: LocalDraft = {
    id: newId(),
    title: input.title,
    content: input.content,
    doc_type: input.doc_type ?? null,
    thread_id: input.thread_id ?? null,
    created_at: now,
    updated_at: now,
    versions: [{ version: 1, content: input.content, created_at: now }],
  };
  write(DRAFTS, [d, ...drafts]);
  return d;
}

export function restoreVersion(draftId: string, version: number) {
  const drafts = getDraftsSnapshot();
  const d = drafts.find((x) => x.id === draftId);
  if (!d) return;
  const v = d.versions.find((x) => x.version === version);
  if (!v) return;
  const now = new Date().toISOString();
  const nextVersion = d.versions.length + 1;
  const updated: LocalDraft = {
    ...d,
    content: v.content,
    updated_at: now,
    versions: [
      ...d.versions,
      { version: nextVersion, content: v.content, created_at: now, note: `Restored from v${version}` },
    ],
  };
  write(DRAFTS, drafts.map((x) => (x.id === draftId ? updated : x)));
}

export function deleteDraft(id: string) {
  write(DRAFTS, getDraftsSnapshot().filter((d) => d.id !== id));
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
