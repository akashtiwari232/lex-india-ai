import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { fallbackFollowups, getLovableServerKey } from "@/lib/fallback-drafting";

export const Route = createFileRoute("/api/intake-followup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          docCategory?: string | null;
          docType?: string | null;
          answers?: Record<string, string>;
        };

        const key = getLovableServerKey();
        if (!key) return Response.json({ followups: fallbackFollowups(body.docType) });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const ans = Object.entries(body.answers ?? {})
          .filter(([, v]) => v && v.trim())
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n");

        const result = await generateText({
          model,
          system: `You are a Senior Indian Advocate conducting client intake. Based on the document type and the facts already provided, generate up to 5 sharply targeted follow-up questions that would materially affect the drafting of this document (e.g. limitation period, jurisdictional choice, prior orders, statutory pre-conditions). Skip anything already answered. If no follow-ups are necessary, return an empty array.

Respond ONLY with a JSON array of objects: [{"name": "short_field_name", "label": "Human question", "type": "text" | "textarea" | "date" | "number"}]. No prose, no markdown fence.`,
          prompt: `Category: ${body.docCategory ?? "N/A"}\nDocument: ${body.docType ?? "N/A"}\n\nFacts so far:\n${ans || "(none)"}\n`,
        });

        let parsed: Array<{ name: string; label: string; type: string }> = [];
        try {
          const cleaned = result.text.replace(/```json|```/g, "").trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = fallbackFollowups(body.docType);
        }
        return Response.json({ followups: parsed.length ? parsed : fallbackFollowups(body.docType) });
      },
    },
  },
});
