import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getThread } from "@/lib/threads.functions";
import { saveDraft } from "@/lib/drafts.functions";
import { supabase } from "@/integrations/supabase/client";
import { LegalMarkdown } from "@/components/legal-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookmarkPlus, Send, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThread,
});

function ChatThread() {
  const { threadId } = Route.useParams();
  return <ChatView key={threadId} threadId={threadId} />;
}

function ChatView({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getThreadFn = useServerFn(getThread);
  const saveDraftFn = useServerFn(saveDraft);

  const threadQuery = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getThreadFn({ data: { id: threadId } }),
  });

  // Once thread is missing, redirect away
  useEffect(() => {
    if (threadQuery.data === null) navigate({ to: "/chat" });
  }, [threadQuery.data, navigate]);

  const initialMessages: UIMessage[] = (threadQuery.data?.messages ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text", text: m.content }],
  }));

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    fetch: async (url, init) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      // pass threadId and doc context via body augmentation
      const body = init?.body ? JSON.parse(init.body as string) : {};
      body.threadId = threadId;
      body.docCategory = threadQuery.data?.thread.doc_category ?? null;
      body.docType = threadQuery.data?.thread.doc_type ?? null;
      return fetch(url, { ...init, headers, body: JSON.stringify(body) });
    },
  });

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message),
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const [input, setInput] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    composerRef.current?.focus();
  }, [threadId, status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  async function handleSave(content: string, idx: number) {
    const title =
      threadQuery.data?.thread.doc_type ||
      threadQuery.data?.thread.title ||
      `Draft ${new Date().toLocaleDateString("en-IN")}`;
    await saveDraftFn({
      data: {
        title: `${title} — Draft ${idx + 1}`,
        content,
        doc_type: threadQuery.data?.thread.doc_type ?? null,
        thread_id: threadId,
      },
    });
    qc.invalidateQueries({ queryKey: ["drafts"] });
    toast.success("Saved to your drafts.");
  }

  const meta = threadQuery.data?.thread;

  return (
    <div className="bg-parchment-paper flex h-full flex-col">
      <header className="border-b border-border bg-card/60 px-6 py-3 backdrop-blur">
        <div className="mx-auto max-w-4xl">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {meta?.doc_category ?? "Chambers"}
          </div>
          <h1 className="font-serif text-xl font-semibold text-foreground">
            {meta?.doc_type || meta?.title || "New Brief"}
          </h1>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
          {messages.length === 0 && (
            <EmptyHint docType={meta?.doc_type ?? null} />
          )}
          {messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              onSave={(text) => handleSave(text, i)}
            />
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Counsel is consulting the statutes…
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card/60 px-6 py-4 backdrop-blur">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-3 rounded-sm border border-border bg-background p-2 focus-within:border-gold/60 focus-within:ring-1 focus-within:ring-gold/30">
            <Textarea
              ref={composerRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe the matter: parties, facts, court, relief sought…"
              className="min-h-[60px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              disabled={busy}
            />
            <Button onClick={handleSend} disabled={busy || !input.trim()} className="gap-1.5">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            LexIndia AI drafts under your supervision. Verify citations and procedural details before
            filing.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onSave,
}: {
  message: UIMessage;
  onSave: (text: string) => void;
}) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-sm rounded-tr-none border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-relaxed text-foreground">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-chambers)]">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <div className="font-serif text-xs uppercase tracking-[0.2em] text-primary">
          LexIndia AI · Drafted Brief
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs text-primary"
            onClick={() => onSave(text)}
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>
      <LegalMarkdown>{text}</LegalMarkdown>
    </div>
  );
}

function EmptyHint({ docType }: { docType: string | null }) {
  return (
    <div className="rounded-sm border border-dashed border-border bg-card/50 p-8 text-center">
      <div className="font-serif text-lg text-primary">
        {docType ? `Brief LexIndia for your ${docType}` : "Brief LexIndia AI"}
      </div>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
        Provide the parties, jurisdiction, key dates, cause of action and the relief sought.
        LexIndia AI will produce a court-ready draft with statutory citations and a proper prayer
        clause.
      </p>
    </div>
  );
}
