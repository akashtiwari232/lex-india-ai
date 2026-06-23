import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DOC_CATEGORIES } from "@/lib/legal-system-prompt";
import { Gavel } from "lucide-react";
import { createThread } from "@/lib/local-store";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();

  function startDraft(category: string, type: string) {
    const t = createThread({ doc_category: category, doc_type: type, title: type });
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  }

  function startFreeForm() {
    const t = createThread({});
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  }

  return (
    <div className="bg-parchment-paper h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
            <Gavel className="h-3.5 w-3.5 text-gold" />
            Begin a Draft
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-foreground">
            What shall we draft today, Counsel?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Free to use. No sign-in required. Select a document type or start a free-form session.
          </p>
          <div className="gold-divider mx-auto mt-6 max-w-md" />
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DOC_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="rounded-sm border border-border bg-card p-5 transition hover:border-gold/60 hover:shadow-[var(--shadow-chambers)]"
            >
              <h3 className="font-serif text-lg font-semibold text-primary">{cat.label}</h3>
              <div className="gold-divider mt-2 w-12" />
              <ul className="mt-3 space-y-1">
                {cat.types.map((t) => (
                  <li key={t}>
                    <button
                      onClick={() => startDraft(cat.label, t)}
                      className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-foreground/80 transition hover:bg-accent hover:text-primary"
                    >
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={startFreeForm}
            className="rounded-sm border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:border-gold/60"
          >
            Start a free-form drafting session
          </button>
        </div>
      </div>
    </div>
  );
}
