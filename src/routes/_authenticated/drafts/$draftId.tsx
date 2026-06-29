import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LegalMarkdown } from "@/components/legal-markdown";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Copy,
  Download,
  Trash2,
  History,
  FileText,
  Eye,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useDraft, deleteDraft, restoreVersion } from "@/lib/local-store";
import { downloadDraftPdf, draftPdfBlobUrl } from "@/lib/pdf-export";

export const Route = createFileRoute("/_authenticated/drafts/$draftId")({
  component: DraftDetail,
});

function DraftDetail() {
  const { draftId } = Route.useParams();
  const navigate = useNavigate();
  const d = useDraft(draftId);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const versions = useMemo(() => (d ? [...d.versions].reverse() : []), [d]);

  if (!d) {
    return <div className="p-10 text-sm text-muted-foreground">Draft not found.</div>;
  }

  async function copy() {
    await navigator.clipboard.writeText(d!.content);
    toast.success("Brief copied.");
  }

  function viewPdf() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const url = draftPdfBlobUrl({
      title: d!.title,
      docType: d!.doc_type,
      content: d!.content,
    });
    setPdfUrl(url);
  }

  function downloadPdf() {
    downloadDraftPdf({ title: d!.title, docType: d!.doc_type, content: d!.content });
  }

  function remove() {
    if (!confirm("Delete this saved draft?")) return;
    deleteDraft(d!.id);
    toast.success("Draft deleted.");
    navigate({ to: "/drafts" });
  }

  function restore(v: number) {
    restoreVersion(d!.id, v);
    toast.success(`Restored from v${v}.`);
  }

  return (
    <div className="bg-parchment-paper h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
        <Link
          to="/drafts"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Drafts
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {d.doc_type ?? "Brief"}
            </div>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              {d.title}
            </h1>
            <div className="mt-1 text-xs text-muted-foreground">
              Updated {new Date(d.updated_at).toLocaleString("en-IN")} · v{d.versions.length}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={viewPdf} className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> View PDF
            </Button>
            <Button size="sm" onClick={downloadPdf} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <History className="h-3.5 w-3.5" /> Versions ({d.versions.length})
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[360px] sm:w-[420px]">
                <SheetHeader>
                  <SheetTitle className="font-serif">Version History</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.version}
                      className="rounded-sm border border-border bg-card p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-serif text-sm font-semibold text-primary">
                            Version {v.version}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(v.created_at).toLocaleString("en-IN")}
                          </div>
                          {v.note && (
                            <div className="mt-0.5 text-[11px] italic text-muted-foreground">
                              {v.note}
                            </div>
                          )}
                        </div>
                        {v.version !== d.versions.length && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs"
                            onClick={() => restore(v.version)}
                          >
                            <RotateCcw className="h-3 w-3" /> Restore
                          </Button>
                        )}
                      </div>
                      <pre className="mt-2 max-h-32 overflow-hidden whitespace-pre-wrap text-[11px] text-muted-foreground">
                        {v.content.slice(0, 320)}
                        {v.content.length > 320 ? "…" : ""}
                      </pre>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="sm"
              onClick={remove}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>

        <div className="gold-divider mt-5" />

        {pdfUrl && (
          <div className="mt-6 overflow-hidden rounded-sm border border-border bg-card shadow-[var(--shadow-chambers)]">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> PDF Preview
              </div>
              <button
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={() => {
                  URL.revokeObjectURL(pdfUrl!);
                  setPdfUrl(null);
                }}
              >
                Close
              </button>
            </div>
            <iframe title="PDF preview" src={pdfUrl} className="h-[80vh] w-full bg-white" />
          </div>
        )}

        <div className="mt-6 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-chambers)] sm:p-8">
          <LegalMarkdown>{d.content}</LegalMarkdown>
        </div>
      </div>
    </div>
  );
}
