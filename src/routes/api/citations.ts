import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const CITATION_PATTERNS: RegExp[] = [
  /\bAIR\s+\d{4}\s+SC\s+\d+/g,
  /\(\d{4}\)\s*\d+\s*SCC\s*\d+/g,
  /\b\d{4}\s+SCC\s+OnLine\s+[A-Z]+\s+\d+/g,
  /\bSection\s+\d+[A-Z]?(?:\s*\([^)]+\))?\s+(?:of\s+the\s+)?(?:BNS|BNSS|BSA|CPC|CrPC|IPC|HMA|NI\s+Act|Companies\s+Act|Contract\s+Act|TPA|IT\s+Act)/gi,
  /\bArticle\s+\d+[A-Z]?\s+of\s+the\s+Constitution/gi,
  /\bOrder\s+[IVX]+\s+Rule\s+\d+\s+CPC/gi,
];

function extractCitations(text: string): string[] {
  const found = new Set<string>();
  for (const re of CITATION_PATTERNS) {
    const matches = text.match(re);
    if (matches) matches.forEach((m) => found.add(m.trim()));
  }
  return Array.from(found);
}

export const Route = createFileRoute("/api/citations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { content } = (await request.json()) as { content?: string };
        if (!content) return new Response("content required", { status: 400 });

        const citations = extractCitations(content);
        if (citations.length === 0) {
          return Response.json({ citations: [] });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("missing api key", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = await generateText({
          model,
          system: `You are an Indian-law citation verifier. For each citation provided, judge whether it appears to be a genuine, well-formed reference to actual Indian law (statute, section, or reported judgment) or whether it looks fabricated/hallucinated. Be conservative: mark "uncertain" unless you are confident.

Respond ONLY with a JSON array of objects: [{"citation": string, "status": "verified" | "uncertain" | "likely_incorrect", "note": string}]. No prose, no markdown fence.`,
          prompt: `Citations to evaluate:\n${citations.map((c, i) => `${i + 1}. ${c}`).join("\n")}`,
        });

        let parsed: Array<{ citation: string; status: string; note: string }> = [];
        try {
          const cleaned = result.text.replace(/```json|```/g, "").trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = citations.map((c) => ({
            citation: c,
            status: "uncertain",
            note: "Could not parse verifier response.",
          }));
        }
        return Response.json({ citations: parsed });
      },
    },
  },
});
