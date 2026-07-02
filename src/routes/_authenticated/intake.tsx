import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Gavel, ScrollText, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildIntakePrompt, getIntakeSchema, type IntakeField } from "@/lib/intake-schema";
import { createThread } from "@/lib/local-store";
import { fallbackFollowups } from "@/lib/intake-fallbacks";

const searchSchema = z.object({
  category: z.string().optional(),
  type: z.string().optional(),
});

type Followup = { name: string; label: string; type: string };

export const Route = createFileRoute("/_authenticated/intake")({
  validateSearch: (s) => searchSchema.parse(s),
  component: IntakePage,
});

function IntakePage() {
  const { category, type } = Route.useSearch();
  const navigate = useNavigate();
  const docCategory = category ?? null;
  const docType = type ?? null;

  const sections = useMemo(() => getIntakeSchema(docType), [docType]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"base" | "followup">("base");
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  function set(name: string, v: string) {
    setValues((p) => ({ ...p, [name]: v }));
  }

  function validateBase(): boolean {
    const missing: string[] = [];
    for (const s of sections) {
      for (const f of s.fields) {
        if (f.required && !(values[f.name] ?? "").trim()) missing.push(f.label);
      }
    }
    if (missing.length) {
      toast.error(`Please fill: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`);
      return false;
    }
    return true;
  }

  async function fetchFollowups() {
    if (!validateBase()) return;
    setLoadingAI(true);
    try {
      const res = await fetch("/api/intake-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docCategory, docType, answers: values }),
      });
      if (!res.ok) throw new Error("Using built-in follow-up questions.");
      const data = (await res.json()) as { followups: Followup[] };
      if (data.followups?.length) {
        setFollowups(data.followups);
        setStep("followup");
      } else {
        toast.info("No further questions needed — generating draft.");
        finalize();
      }
    } catch (e) {
      setFollowups(fallbackFollowups(docType));
      setStep("followup");
      toast.info(e instanceof Error ? e.message : "Using built-in follow-up questions.");
    } finally {
      setLoadingAI(false);
    }
  }

  function finalize() {
    const prompt = buildIntakePrompt(docCategory, docType, values);
    const thread = createThread({
      title: docType || "New Draft",
      doc_category: docCategory,
      doc_type: docType,
    });
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`lexlaw.pending.${thread.id}`, prompt);
    }
    navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
  }

  return (
    <div className="bg-parchment-paper h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12">
        <button
          onClick={() => (step === "followup" ? setStep("base") : navigate({ to: "/chat" }))}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />{" "}
          {step === "followup" ? "Back to base intake" : "Back to document picker"}
        </button>

        <div className="rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-chambers)] sm:p-8">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-gold/40 bg-background text-gold">
              <ScrollText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {docCategory ?? "Free-form Brief"} · Step {step === "base" ? "1 of 2" : "2 of 2"}
              </div>
              <h1 className="truncate font-serif text-2xl font-semibold text-primary sm:text-3xl">
                {docType ?? "Drafting Intake"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {step === "base"
                  ? "Provide the particulars below. LexLaw AI will then ask targeted follow-ups tailored to your matter before drafting."
                  : "Counsel needs a few more specifics to draft sharply. Required fields are marked with *."}
              </p>
            </div>
          </div>

          <div className="gold-divider mt-6" />

          {step === "base" ? (
            <form
              className="mt-6 space-y-8"
              onSubmit={(e) => {
                e.preventDefault();
                fetchFollowups();
              }}
            >
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <div className="gold-divider mt-1 w-12" />
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {section.fields.map((f) => (
                      <FieldRow
                        key={f.name}
                        field={f}
                        value={values[f.name] ?? ""}
                        onChange={(v) => set(f.name, v)}
                      />
                    ))}
                  </div>
                </section>
              ))}

              <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Next: LexLaw AI generates intelligent follow-up questions specific to your case.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (validateBase()) finalize();
                    }}
                    disabled={loadingAI}
                  >
                    Skip &amp; Draft
                  </Button>
                  <Button type="submit" disabled={loadingAI} className="gap-2">
                    {loadingAI ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Get AI Follow-ups
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form
              className="mt-6 space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                finalize();
              }}
            >
              <section>
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  Tailored Follow-ups
                </h2>
                <div className="gold-divider mt-1 w-12" />
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {followups.map((f) => (
                    <FieldRow
                      key={f.name}
                      field={{
                        name: f.name,
                        label: f.label,
                        type: (f.type as IntakeField["type"]) ?? "text",
                      }}
                      value={values[f.name] ?? ""}
                      onChange={(v) => set(f.name, v)}
                    />
                  ))}
                </div>
              </section>
              <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end">
                <Button type="submit" className="gap-2">
                  <Gavel className="h-4 w-4" /> Generate Draft
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: IntakeField;
  value: string;
  onChange: (v: string) => void;
}) {
  const span = field.span === 2 || field.type === "textarea" ? "md:col-span-2" : "";
  return (
    <div className={`flex flex-col gap-1.5 ${span}`}>
      <Label htmlFor={field.name} className="text-sm">
        {field.label}
        {field.required && <span className="ml-0.5 text-primary">*</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          id={field.name}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[90px] bg-background"
        />
      ) : field.type === "select" ? (
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger id={field.name} className="bg-background">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={field.name}
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-background"
        />
      )}
      {field.help && <p className="text-[11px] text-muted-foreground">{field.help}</p>}
    </div>
  );
}
