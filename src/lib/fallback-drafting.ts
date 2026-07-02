import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
export { fallbackFollowups } from "@/lib/intake-fallbacks";

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getLovableServerKey(): string | undefined {
  return (
    process.env.LOVABLE_API_KEY ||
    process.env.LOVABLE_SERVER_KEY ||
    process.env.LOVABLE_AI_API_KEY ||
    process.env.AI_GATEWAY_API_KEY ||
    undefined
  );
}

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== "user") continue;
    const text = message.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim();
    if (text) return text;
  }
  return "";
}

function extractFromPrompt(prompt: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const marker = new RegExp(`-\\s*\\*\\*${escaped}:\\*\\*\\s*`, "i");
  const match = marker.exec(prompt);
  if (!match) return "";
  const start = match.index + match[0].length;
  const rest = prompt.slice(start);
  const next = rest.search(/\n(?:-\s*\*\*|###\s|---)/);
  return safeText(next >= 0 ? rest.slice(0, next) : rest);
}

function extractBullets(prompt: string): string[] {
  return prompt
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- **"))
    .map((line) => line.replace(/^-\s*/, ""));
}

function inferDocumentTitle(docType?: string | null, prompt?: string): string {
  return safeText(docType) || extractFromPrompt(prompt ?? "", "Document Type") || "Legal Draft";
}

export function fallbackDraftFromMessages(
  messages: UIMessage[],
  docCategory?: string | null,
  docType?: string | null,
): string {
  const prompt = lastUserText(messages);
  const title = inferDocumentTitle(docType, prompt).toUpperCase();
  const category = safeText(docCategory) || extractFromPrompt(prompt, "Category") || "Legal";
  const court = extractFromPrompt(prompt, "Court / Forum / Tribunal") || "[NAME OF THE COURT / FORUM]";
  const petitioner =
    extractFromPrompt(prompt, "Petitioner / Applicant / Plaintiff — Name") ||
    extractFromPrompt(prompt, "Petitioner / Applicant / Plaintiff - Name") ||
    "[PETITIONER / APPLICANT]";
  const respondent =
    extractFromPrompt(prompt, "Respondent / Defendant / Opposite Party — Name") ||
    extractFromPrompt(prompt, "Respondent / Defendant / Opposite Party - Name") ||
    "[RESPONDENT / OPPOSITE PARTY]";
  const facts = extractFromPrompt(prompt, "Statement of Facts (chronological)") || "[Set out material facts chronologically]";
  const grounds = extractFromPrompt(prompt, "Legal Grounds / Statutory Provisions Invoked") || "[Applicable statutory and legal grounds]";
  const relief = extractFromPrompt(prompt, "Relief / Prayer Sought") || "[Specific reliefs sought]";
  const interim = extractFromPrompt(prompt, "Interim Relief (if any)");
  const annexures = extractFromPrompt(prompt, "List of Annexures / Documents to be filed");
  const bullets = extractBullets(prompt);

  return `\`\`\`markdown
IN THE ${court.toUpperCase()}

${title}

IN THE MATTER OF:

${petitioner}
... Petitioner / Applicant

VERSUS

${respondent}
... Respondent / Opposite Party

MOST RESPECTFULLY SHOWETH:

1. That the present draft concerns a ${category} matter and is prepared on the basis of the instructions and particulars supplied by the client.

2. That the material facts, in brief and in chronological order, are as follows:
${facts}

3. That the relevant particulars supplied for drafting are:
${bullets.length ? bullets.map((item, index) => `   ${index + 1}. ${item}`).join("\n") : "   1. [Particulars to be inserted]"}

GROUNDS

A. Because the facts disclosed give rise to a valid cause of action maintainable before this Hon'ble Court / Forum.

B. Because the acts, omissions, orders or conduct complained of are contrary to law, equity, justice and the applicable statutory framework.

C. Because the following legal grounds and provisions are specifically invoked:
${grounds}

D. Because denial of the reliefs prayed for would cause grave prejudice, hardship and irreparable loss to the applicant / petitioner.

${interim ? `INTERIM RELIEF\n\nPending final disposal, it is prayed that this Hon'ble Court may be pleased to grant the following interim relief:\n${interim}\n` : ""}
PRAYER

In view of the facts and grounds stated hereinabove, it is most respectfully prayed that this Hon'ble Court / Forum may be pleased to:

a. ${relief}

b. Pass such further or other order(s) as this Hon'ble Court may deem fit and proper in the facts and circumstances of the case.

LIST OF ANNEXURES

${annexures || "Annexure A — [Relevant document]\nAnnexure B — [Relevant correspondence / order]"}

VERIFICATION

I, ${petitioner}, do hereby verify that the contents of the above draft are true and correct to my knowledge and belief, based on records and legal advice received, and that no material fact has been concealed therefrom.

Place: [●]
Date: [●]

DEPONENT / APPLICANT
\`\`\`

Statutory provisions and authorities: to be verified against the final facts, forum, limitation position, and applicable central / state legislation before filing.`;
}

export function fallbackChatResponse(
  messages: UIMessage[],
  docCategory?: string | null,
  docType?: string | null,
): Response {
  const text = fallbackDraftFromMessages(messages, docCategory, docType);
  const stream = createUIMessageStream<UIMessage>({
    originalMessages: messages,
    execute({ writer }) {
      const id = "fallback-draft";
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });
    },
  });
  return createUIMessageStreamResponse({ stream });
}