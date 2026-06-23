import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · LexIndia AI" },
      { name: "description", content: "Sign in to your LexIndia chambers." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back, Counsel.");
    navigate({ to: "/chat" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Chambers established. You may proceed.");
    navigate({ to: "/chat" });
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/chat",
    });
    if (result.error) {
      setLoading(false);
      toast.error(result.error.message || "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/chat" });
  }

  return (
    <div className="bg-parchment-paper grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center">
          <div className="inline-flex flex-col items-center">
            <span className="grid h-12 w-12 place-items-center rounded-sm border border-primary/30 bg-card font-serif text-2xl font-semibold text-primary">
              L
            </span>
            <div className="mt-2 font-serif text-2xl font-semibold tracking-tight">
              LexIndia AI
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Court · Chambers · Counsel
            </div>
          </div>
        </Link>

        <div className="rounded-sm border border-border bg-card p-7 shadow-[var(--shadow-chambers)]">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field label="Email" id="si-email" value={email} onChange={setEmail} type="email" />
                <Field
                  label="Password"
                  id="si-password"
                  value={password}
                  onChange={setPassword}
                  type="password"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Field label="Email" id="su-email" value={email} onChange={setEmail} type="email" />
                <Field
                  label="Password"
                  id="su-password"
                  value={password}
                  onChange={setPassword}
                  type="password"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating…" : "Create chambers"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-border bg-background hover:bg-accent"
            onClick={handleGoogle}
            disabled={loading}
          >
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={type === "password" ? "current-password" : "email"}
        className="bg-background"
      />
    </div>
  );
}
