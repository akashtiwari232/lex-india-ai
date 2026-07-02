import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, generateText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildSystemPrompt } from "@/lib/legal-system-prompt";
import {
  chatTextResponse,
  fallbackChatResponse,
  fallbackDraftFromMessages,
  getLovableServerKey,
} from "@/lib/fallback-drafting";

type Body = {
  messages?: UIMessage[];
  docCategory?: string | null;
  docType?: string | null;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const { messages, docCategory, docType } = body;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }

        const LOVABLE_API_KEY = getLovableServerKey();
        if (!LOVABLE_API_KEY) {
          return fallbackChatResponse(messages, docCategory, docType);
        }

        const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
        const model = gateway("google/gemini-3-flash-preview");

        try {
          const result = await generateText({
            model,
            system: buildSystemPrompt(docCategory, docType),
            messages: await convertToModelMessages(messages),
          });

          return chatTextResponse(messages, result.text);
        } catch {
          return chatTextResponse(messages, fallbackDraftFromMessages(messages, docCategory, docType));
        }
      },
    },
  },
});
