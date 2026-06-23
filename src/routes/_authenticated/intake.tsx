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
import { ArrowLeft, Gavel, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { buildIntakePrompt, getIntakeSchema, type IntakeField } from "@/lib/intake-schema";
import { createThread } from "@/lib/local-store";

const searchSchema = z.object({
  category: z.string().optional(),
  type: z.string().optional(),
});

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

  function set(name: string, v: string) {
    setValues((prev) => ({ ...prev, [name]: v }));
  }

  function handleGenerate() {
    // Validate required
    const missing: string[] = [];
    for (const s of sections) {
      for (const f of s.fields) {
        if (f.required && !(values[f.name] ?? "").trim()) missing.push(f.label);
      }
    }
    if (missing.length) {
      toast.error(`Please fill: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`);
      return;
    }
    const prompt = buildIntakePrompt(docCategory, docType, values);
    const thread = createThread({
      title: docType || "New Draft",
      doc_category: docCategory,
      doc_type: docType,
    });
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`lexindia.pending.${thread.id}`, prompt);
    }
    navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
  }

  return (
    <div className="bg-parchment-paper h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <button
          onClick={() => navigate({ to: "/chat" })}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to document picker
        </button>

        <div className="rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-chambers)] sm:p-8">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-gold/40 bg-background text-gold">
              <ScrollText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {docCategory ?? "Free-form Brief"}
              </div>
              <h1 className="truncate font-serif text-2xl font-semibold text-primary sm:text-3xl">
                {docType ?? "Drafting Intake"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Provide the particulars below. Required fields are marked with{" "}
                <span className="text-primary">*</span>. Leave anything you don't know blank —
                LexIndia AI will mark gaps with placeholders.
              </p>
            </div>
          </div>

          <div className="gold-divider mt-6" />

          <form
            className="mt-6 space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
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
                On submission, LexIndia AI will draft the document and open it in your chambers
                where you can refine, copy, save or download it.
              </p>
              <Button type="submit" className="gap-2">
                <Gavel className="h-4 w-4" />
                Generate Draft
              </Button>
            </div>
          </form>
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
