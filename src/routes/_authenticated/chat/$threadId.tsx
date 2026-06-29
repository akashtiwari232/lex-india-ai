import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { LegalMarkdown } from "@/components/legal-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BookmarkPlus,
  Send,
  Loader2,
  Copy,
  Check,
  Download,
  Eye,
  ShieldCheck,
  AlertTriangle,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { toast } from "sonner";
import {
  useThread,
  useThreadMessages,
  addMessage,
  updateThread,
  saveDraft,
} from "@/lib/local-store";
import { downloadDraftPdf, draftPdfBlobUrl } from "@/lib/pdf-export";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThread,
});

function ChatThread() {
  const { threadId } = Route.useParams();
  return <ChatView key={threadId} threadId={threadId} />;
}

function ChatView({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const thread = useThread(threadId);
  const storedMessages = useThreadMessages(threadId);

  useEffect(() => {
    if (!thread) navigate({ to: "/chat" });
  }, [thread, navigate]);

  const initialMessages: UIMessage[] = useMemo(
    () =>
      storedMessages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threadId],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (url, init) => {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          body.docCategory = thread?.doc_category ?? null;
          body.docType = thread?.doc_type ?? null;
          return fetch(url, { ...init, body: JSON.stringify(body) });
        },
      }),
    [thread?.doc_category, thread?.doc_type],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message),
    onFinish: ({ message }) => {
      const text = message.parts
        .map((p) => (p.type === "text" ? p.text : ""))
        .join("")
        .trim();
      if (text) addMessage({ thread_id: threadId, role: "assistant", content: text });
    },
  });

  const [input, setInput] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => composerRef.current?.focus(), [threadId, status]);

  useEffect(() => {
    if (typeof window === "undefined" || !thread || storedMessages.length > 0) return;
    const key = `lexlaw.pending.${threadId}`;
    const pending = sessionStorage.getItem(key);
    if (!pending) return;
    sessionStorage.removeItem(key);
    addMessage({ thread_id: threadId, role: "user", content: pending });
    updateThread(threadId, { title: thread.doc_type || thread.title });
    void sendMessage({ text: pending });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, thread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    addMessage({ thread_id: threadId, role: "user", content: text });
    if (thread && (thread.title === "New Draft" || !thread.title)) {
      updateThread(threadId, { title: text.slice(0, 80) });
    }
    await sendMessage({ text });
  }

  function handleSave(content: string, idx: number) {
    const title = thread?.doc_type || thread?.title || `Draft ${new Date().toLocaleDateString("en-IN")}`;
    saveDraft({
      title: `${title}${idx > 0 ? ` — pt ${idx + 1}` : ""}`,
      content,
      doc_type: thread?.doc_type ?? null,
      thread_id: threadId,
    });
    toast.success("Saved (new version recorded).");
  }

  return (
    <div className="bg-parchment-paper flex h-full flex-col">
      <header className="border-b border-border bg-card/60 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {thread?.doc_category ?? "Chambers"}
          </div>
          <h1 className="font-serif text-xl font-semibold text-foreground">
            {thread?.doc_type || thread?.title || "New Brief"}
          </h1>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          {messages.length === 0 && <EmptyHint docType={thread?.doc_type ?? null} />}
          {messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              title={thread?.doc_type ?? thread?.title ?? "Brief"}
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

      <div className="border-t border-border bg-card/60 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded-sm border border-border bg-background p-2 focus-within:border-gold/60 focus-within:ring-1 focus-within:ring-gold/30 sm:gap-3">
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
              className="min-h-[56px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              disabled={busy}
            />
            <Button onClick={handleSend} disabled={busy || !input.trim()} className="gap-1.5">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            LexLaw AI drafts under your supervision. Verify citations and procedural details
            before filing.
          </p>
        </div>
      </div>
    </div>
  );
}

type Citation = { citation: string; status: string; note: string };

function MessageBubble({
  message,
  title,
  onSave,
}: {
  message: UIMessage;
  title: string;
  onSave: (text: string) => void;
}) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[] | null>(null);
  const [verifying, setVerifying] = useState(false);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-sm rounded-tr-none border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-relaxed text-foreground">
          {text}
        </div>
      </div>
    );
  }

  function viewPdf() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(draftPdfBlobUrl({ title, content: text }));
  }

  async function verify() {
    setVerifying(true);
    try {
      const res = await fetch("/api/citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error("Citation check failed");
      const data = (await res.json()) as { citations: Citation[] };
      setCitations(data.citations);
      if (data.citations.length === 0) toast.info("No citations detected in this draft.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="rounded-sm border border-border bg-card p-4 shadow-[var(--shadow-chambers)] sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="font-serif text-xs uppercase tracking-[0.2em] text-primary">
          LexLaw AI · Drafted Brief
        </div>
        <div className="flex flex-wrap items-center gap-1">
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
            className="h-7 gap-1 px-2 text-xs"
            onClick={viewPdf}
          >
            <Eye className="h-3.5 w-3.5" /> View PDF
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => downloadDraftPdf({ title, content: text })}
          >
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            onClick={verify}
            disabled={verifying}
          >
            {verifying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            Verify citations
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs text-primary"
            onClick={() => onSave(text)}
          >
            <BookmarkPlus className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>

      {pdfUrl && (
        <div className="mb-4 overflow-hidden rounded-sm border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5 text-xs">
            <span className="uppercase tracking-widest text-muted-foreground">PDF Preview</span>
            <button
              className="text-muted-foreground hover:text-primary"
              onClick={() => {
                URL.revokeObjectURL(pdfUrl!);
                setPdfUrl(null);
              }}
            >
              Close
            </button>
          </div>
          <iframe title="PDF preview" src={pdfUrl} className="h-[60vh] w-full bg-white" />
        </div>
      )}

      {citations && citations.length > 0 && (
        <div className="mb-4 rounded-sm border border-gold/40 bg-gold/5 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Citation Audit
          </div>
          <ul className="space-y-1.5 text-sm">
            {citations.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                {c.status === "verified" ? (
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                ) : c.status === "likely_incorrect" ? (
                  <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                <div>
                  <div className="font-medium">{c.citation}</div>
                  <div className="text-xs text-muted-foreground">{c.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <LegalMarkdown>{text}</LegalMarkdown>
    </div>
  );
}

function EmptyHint({ docType }: { docType: string | null }) {
  return (
    <div className="rounded-sm border border-dashed border-border bg-card/50 p-8 text-center">
      <div className="font-serif text-lg text-primary">
        {docType ? `Brief LexLaw AI for your ${docType}` : "Brief LexLaw AI"}
      </div>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
        Provide the parties, jurisdiction, key dates, cause of action and the relief sought.
        LexLaw AI will produce a court-ready draft with statutory citations and a proper prayer
        clause.
      </p>
    </div>
  );
}
