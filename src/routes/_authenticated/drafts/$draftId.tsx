import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDraft, deleteDraft } from "@/lib/drafts.functions";
import { LegalMarkdown } from "@/components/legal-markdown";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/drafts/$draftId")({
  component: DraftDetail,
});

function DraftDetail() {
  const { draftId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getDraft);
  const delFn = useServerFn(deleteDraft);

  const q = useQuery({
    queryKey: ["draft", draftId],
    queryFn: () => getFn({ data: { id: draftId } }),
  });

  if (q.isLoading) {
    return (
      <div className="p-10 text-sm text-muted-foreground">Loading brief…</div>
    );
  }
  if (!q.data) {
    return (
      <div className="p-10 text-sm text-muted-foreground">Draft not found.</div>
    );
  }

  const d = q.data;

  async function copy() {
    await navigator.clipboard.writeText(d.content);
    toast.success("Brief copied.");
  }

  function download() {
    const blob = new Blob([d.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.title.replace(/[^a-z0-9-_]+/gi, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function remove() {
    if (!confirm("Delete this saved draft?")) return;
    await delFn({ data: { id: d.id } });
    qc.invalidateQueries({ queryKey: ["drafts"] });
    toast.success("Draft deleted.");
    navigate({ to: "/drafts" });
  }

  return (
    <div className="bg-parchment-paper h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-8 py-8">
        <Link
          to="/drafts"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Vault
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {d.doc_type ?? "Brief"}
            </div>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-foreground">{d.title}</h1>
            <div className="mt-1 text-xs text-muted-foreground">
              Saved {new Date(d.created_at).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={download} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
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

        <div className="mt-6 rounded-sm border border-border bg-card p-8 shadow-[var(--shadow-chambers)]">
          <LegalMarkdown>{d.content}</LegalMarkdown>
        </div>
      </div>
    </div>
  );
}
