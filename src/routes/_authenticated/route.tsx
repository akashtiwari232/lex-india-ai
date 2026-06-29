import { useEffect } from "react";
import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { LexLogo } from "@/components/lex-logo";
import {
  Plus,
  MessageSquare,
  BookMarked,
  Trash2,
  LogOut,
  Library,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useThreads, createThread, deleteThread } from "@/lib/local-store";
import { useAuth, signOut } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="bg-parchment-paper flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <ChambersSidebar email={user.email ?? ""} />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function ChambersSidebar({ email }: { email: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const threads = useThreads();

  function newDraft() {
    navigate({ to: "/chat" });
  }
  function removeThread(id: string) {
    deleteThread(id);
    toast.success("Brief discarded.");
    if (pathname === `/chat/${id}`) navigate({ to: "/chat" });
  }
  async function handleSignOut() {
    await signOut();
    toast.success("Signed out.");
    navigate({ to: "/auth" });
  }

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border p-4">
        <Link to="/chat" className="block">
          <LexLogo />
        </Link>
      </div>

      <div className="space-y-2 p-3">
        <Button
          onClick={newDraft}
          className="w-full justify-start gap-2 border border-gold/40 bg-sidebar-accent text-sidebar-primary hover:bg-sidebar-accent/80"
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
          New Draft
        </Button>
        <Link
          to="/templates"
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition",
            pathname.startsWith("/templates")
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
          )}
        >
          <Library className="h-4 w-4" />
          Templates Library
        </Link>
      </div>

      <div className="px-4 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-primary/70">
        Briefs
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {threads.length === 0 && (
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60">
            No briefs yet. Begin a new draft.
          </div>
        )}
        {threads.map((t) => {
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
                  if (confirm("Discard this brief?")) removeThread(t.id);
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
          My Drafts &amp; PDFs
        </Link>

        <div className="mt-2 rounded-sm border border-sidebar-border bg-sidebar-accent/40 p-2">
          <div className="truncate text-[11px] text-sidebar-foreground/70">{email}</div>
          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-xs text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-primary"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
