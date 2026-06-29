import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Library, FileText, Loader2 } from "lucide-react";
import { listTemplates, getTemplate } from "@/lib/templates.functions";
import { Button } from "@/components/ui/button";
import { createThread, addMessage, saveDraft } from "@/lib/local-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/templates")({
  component: TemplatesPage,
});

function TemplatesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => listTemplates(),
  });

  async function useTemplate(id: string) {
    const tpl = await getTemplate({ data: { id } });
    if (!tpl) return;
    const t = createThread({
      title: tpl.title,
      doc_category: tpl.category,
      doc_type: tpl.doc_type,
    });
    addMessage({
      thread_id: t.id,
      role: "assistant",
      content: `Template loaded: **${tpl.title}**\n\n\`\`\`\n${tpl.body}\n\`\`\`\n\nTell me the case-specific particulars (parties, dates, facts, prayer) and I will tailor this template into a court-ready draft.`,
    });
    saveDraft({
      title: tpl.title,
      content: tpl.body,
      doc_type: tpl.doc_type,
      thread_id: t.id,
    });
    toast.success("Template loaded into a new brief.");
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  }

  const byCategory = (data ?? []).reduce<Record<string, typeof data>>((acc, t) => {
    acc[t.category] = acc[t.category] ?? [];
    acc[t.category]!.push(t);
    return acc;
  }, {} as never);

  return (
    <div className="bg-parchment-paper h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <div className="flex items-center gap-3">
          <Library className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-3xl font-semibold">Templates Library</h1>
        </div>
        <div className="gold-divider mt-3 w-32" />
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Court-ready skeleton drafts curated by senior counsel. Pick one to seed a new brief,
          then customise it with your client's particulars in chambers.
        </p>

        {isLoading && (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading templates…
          </div>
        )}

        <div className="mt-8 space-y-8">
          {Object.entries(byCategory).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="font-serif text-lg font-semibold text-primary">{cat}</h2>
              <div className="gold-divider mt-1 w-12" />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {(items ?? []).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-sm border border-border bg-card p-4 transition hover:border-gold/60 hover:shadow-[var(--shadow-chambers)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {t.doc_type}
                        </div>
                        <h3 className="mt-1 font-serif text-base font-semibold text-foreground">
                          {t.title}
                        </h3>
                        {t.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                        )}
                      </div>
                      <FileText className="h-4 w-4 shrink-0 text-gold" />
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => useTemplate(t.id)}
                    >
                      Use this template
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
