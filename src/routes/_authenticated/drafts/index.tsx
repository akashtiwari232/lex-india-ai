import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDrafts } from "@/lib/drafts.functions";
import { BookMarked, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/drafts/")({
  component: DraftsList,
});

function DraftsList() {
  const listFn = useServerFn(listDrafts);
  const q = useQuery({ queryKey: ["drafts"], queryFn: () => listFn() });

  return (
    <div className="bg-parchment-paper h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-8 py-10">
        <div className="flex items-center gap-3">
          <BookMarked className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-3xl font-semibold">Saved Drafts</h1>
        </div>
        <div className="gold-divider mt-3 w-32" />

        {q.isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading vault…</p>}
        {q.data?.length === 0 && (
          <div className="mt-12 rounded-sm border border-dashed border-border bg-card/50 p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              No drafts saved yet. Save any drafted brief from a chat to find it here.
            </p>
          </div>
        )}
        <div className="mt-8 space-y-3">
          {q.data?.map((d) => (
            <Link
              key={d.id}
              to="/drafts/$draftId"
              params={{ draftId: d.id }}
              className="block rounded-sm border border-border bg-card p-5 transition hover:border-gold/60 hover:shadow-[var(--shadow-chambers)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {d.doc_type ?? "Brief"}
                  </div>
                  <div className="mt-1 font-serif text-lg font-semibold text-foreground">
                    {d.title}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
