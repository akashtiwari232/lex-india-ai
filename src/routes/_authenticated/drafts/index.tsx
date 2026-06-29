import { createFileRoute, Link } from "@tanstack/react-router";
import { BookMarked, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDrafts } from "@/lib/local-store";
import { downloadDraftPdf } from "@/lib/pdf-export";

export const Route = createFileRoute("/_authenticated/drafts/")({
  component: DraftsList,
});

function DraftsList() {
  const drafts = useDrafts();

  return (
    <div className="bg-parchment-paper h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex items-center gap-3">
          <BookMarked className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-3xl font-semibold">My Drafts &amp; PDFs</h1>
        </div>
        <div className="gold-divider mt-3 w-32" />
        <p className="mt-3 text-sm text-muted-foreground">
          Every brief you save lives here. View or download as a court-formatted PDF, or open
          for full version history.
        </p>

        {drafts.length === 0 && (
          <div className="mt-12 rounded-sm border border-dashed border-border bg-card/50 p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              No drafts saved yet. Save any drafted brief from a chat to find it here.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="rounded-sm border border-border bg-card p-4 transition hover:border-gold/60 hover:shadow-[var(--shadow-chambers)] sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <Link
                  to="/drafts/$draftId"
                  params={{ draftId: d.id }}
                  className="block flex-1"
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {d.doc_type ?? "Brief"} · v{d.versions.length}
                  </div>
                  <div className="mt-1 font-serif text-lg font-semibold text-foreground">
                    {d.title}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Updated{" "}
                    {new Date(d.updated_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </Link>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() =>
                      downloadDraftPdf({
                        title: d.title,
                        docType: d.doc_type,
                        content: d.content,
                      })
                    }
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
