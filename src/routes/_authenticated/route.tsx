import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listThreads, createThread, deleteThread } from "@/lib/threads.functions";
import { LexLogo } from "@/components/lex-logo";
import { Plus, MessageSquare, BookMarked, LogOut, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <ChambersSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function ChambersSidebar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const listThreadsFn = useServerFn(listThreads);
  const createThreadFn = useServerFn(createThread);
  const deleteThreadFn = useServerFn(deleteThread);

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: () => listThreadsFn(),
  });

  const createMut = useMutation({
    mutationFn: () => createThreadFn({ data: {} }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteThreadFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Brief discarded.");
      if (pathname.startsWith("/chat/")) navigate({ to: "/chat" });
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border p-4">
        <Link to="/chat" className="block">
          <LexLogo />
        </Link>
      </div>

      <div className="p-3">
        <Button
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending}
          className="w-full justify-start gap-2 border border-gold/40 bg-sidebar-accent text-sidebar-primary hover:bg-sidebar-accent/80"
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
          New Draft
        </Button>
      </div>

      <div className="px-4 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-primary/70">
        Briefs
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {threadsQuery.isLoading && (
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60">Loading…</div>
        )}
        {threadsQuery.data?.length === 0 && (
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60">
            No briefs yet. Begin a new draft.
          </div>
        )}
        {threadsQuery.data?.map((t) => {
          const active = pathname === `/chat/${t.id}`;
          return (
            <div
              key={t.id}
              className={cn(
                "group flex items-center gap-2 rounded-sm px-2.5 py-2 text-sm transition",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                className="flex flex-1 items-center gap-2 truncate"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{t.title}</span>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm("Discard this brief?")) delMut.mutate(t.id);
                }}
                className="opacity-0 transition hover:text-destructive group-hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Link
          to="/drafts"
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition",
            pathname.startsWith("/drafts")
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
          )}
        >
          <BookMarked className="h-4 w-4" />
          Saved Drafts
        </Link>
        <button
          onClick={signOut}
          className="mt-1 flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-sidebar-foreground/70 transition hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
