## LexIndia AI — Build Plan

A senior-advocate-grade legal drafting workspace for Indian law (Constitution, BNS, BNSS, BSA, CPC, Contract Act, Family, Corporate, IP, Labour, Cyber, Environmental, Tax, ADR, Consumer). Users pick a document type, chat with the AI, get a court-ready draft, and save it to a personal library.

### Visual direction — "Court Chambers"
Inspired by Indian high-court chambers: deep oxblood/burgundy `#5C1A1B`, warm parchment cream `#F5EDD8`, antique gold `#B5893A`, ink-black text `#1A1410`. Serif headings (Cormorant Garamond) paired with clean sans body (Inter). Subtle paper texture on surfaces, gold hairline dividers, monogram "L" seal in sidebar. No purple, no generic SaaS gradients.

### Scope (first version)
1. **Auth** — Lovable Cloud email/password + Google sign-in, `/auth` route.
2. **Workspace shell** — Collapsible sidebar (chambers branding, conversation threads list, "New Draft" button, "Saved Drafts" link, sign-out).
3. **Drafting chat** — Per-thread route `/chat/$threadId`. Document-type picker (categories: Litigation, Constitutional, Family, Corporate, Property, IP, Employment, Notices, Regulatory) refines the system prompt. Streaming AI responses rendered as markdown (drafts include court heading, cause title, facts, grounds, prayer, verification per spec). "Save as Draft" button on each assistant message.
4. **Saved Drafts library** — `/drafts` list + `/drafts/$id` detail view with copy / download as .txt.
5. **Landing page** — Brief marketing intro with sign-in CTA.

### Technical approach
- **Stack**: TanStack Start + Lovable Cloud (Supabase).
- **AI**: Lovable AI Gateway via `createServerFn` chat route at `src/routes/api/chat.ts` using `streamText` with `google/gemini-3-flash-preview`. System prompt embeds the full LexIndia legal expert persona + selected document type context.
- **Persistence**: Tables `threads(id, user_id, title, doc_category, doc_type, created_at)`, `messages(id, thread_id, user_id, role, content, created_at)`, `drafts(id, user_id, thread_id, title, doc_type, content, created_at)`. RLS scoped to `auth.uid()`.
- **Routes**:
  - `/` landing (public)
  - `/auth` (public)
  - `/_authenticated/chat` redirects to newest or new thread
  - `/_authenticated/chat/$threadId` drafting workspace
  - `/_authenticated/drafts` library
  - `/_authenticated/drafts/$draftId` detail
- **Server fns** (`src/lib/*.functions.ts`): `listThreads`, `createThread`, `getThread`, `getMessages`, `deleteThread`, `saveDraft`, `listDrafts`, `getDraft`, `deleteDraft`. Chat streaming uses route handler + `requireSupabaseAuth` equivalent via bearer; user message + assistant message persisted in `onFinish`.
- **Design tokens** in `src/styles.css` (oklch): `--background`, `--card` (parchment), `--primary` (oxblood), `--accent` (gold), `--foreground` (ink). Button variants: `chambers` (oxblood), `gold` (gold outline). Cormorant Garamond + Inter via `@fontsource`.

### Out of scope (this version)
- True legal RAG over judgments corpus (the system prompt encodes the knowledge boundaries; retrieval can be added later).
- Citation validation agent / multi-agent LangGraph workflow (single-prompt drafting first).
- PDF export (markdown copy / .txt download only — can add later).
