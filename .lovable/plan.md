## LexLaw AI — Major Upgrade Plan

Rebrand and add: auth, PDF export, citation checks, version history, dynamic intake, templates library, per-user document history.

### 1. Rebrand: LexIndia AI → LexLaw AI
- Update `src/components/lex-logo.tsx`, landing page, system prompt header, sidebar, page titles, meta tags, `__root.tsx` head.
- Global find/replace of user-facing "LexIndia" → "LexLaw".

### 2. Authentication (JWT, signup-gated)
- Enable Lovable Cloud email/password + Google OAuth.
- New `/auth` route with **Sign Up** and **Sign In** tabs. Only signed-up users can sign in (default Supabase behavior).
- Restore `_authenticated/route.tsx` as a real auth gate (`ssr: false`, redirect to `/auth` if no session).
- Sidebar shows the logged-in user's email + Sign Out button.
- Landing "Begin Drafting" → routes to `/auth` if logged out, else `/chat`.

### 3. Server-backed user history (replaces localStorage)
- Re-enable Supabase tables `threads`, `messages`, `drafts` (already exist) with RLS scoped to `auth.uid()`.
- Add `draft_versions` table for version history (draft_id, version_no, content, created_at).
- Add `templates` table (seeded, public read) for the templates library.
- Replace `local-store.ts` calls with server functions (`*.functions.ts`) using `requireSupabaseAuth`.
- Restore bearer token middleware in `src/start.ts`.

### 4. Dynamic Intake Questions
- Upgrade `intake-schema.ts`: each doc type defines an initial set of fields; after submission, an AI "Intake Agent" server fn analyzes answers and returns follow-up questions (JSON) tailored to the case (e.g., bail → ask about prior convictions if accused has any).
- Intake page becomes multi-step: base form → AI-generated follow-ups → final brief assembly.

### 5. Document Templates Library
- New `/templates` route: grid of pre-built templates by category (Bail, Writ, Divorce Petition, Sale Deed, NDA, Sec 138 Notice, etc.).
- Click a template → pre-fills intake form → drafts via AI.
- Seeded via migration into `templates` table.

### 6. Citation Validation
- New server fn `validateCitations`: extracts citations (regex for "AIR YYYY SC NNN", "(YYYY) N SCC NNN", section refs to BNS/BNSS/BSA/CPC/IPC/Constitution Articles) from a draft and runs them through the AI with a strict verifier prompt to flag suspicious/likely-hallucinated citations.
- Chat draft view shows a "Verify Citations" button → renders a panel with each citation marked ✓ verified / ⚠ uncertain / ✗ likely incorrect with notes.

### 7. Version History
- Every time the AI produces a new draft in a thread, also insert a row into `draft_versions` (linked to the saved draft).
- "Save" action creates v1; subsequent edits/regenerations bump version.
- Draft detail page (`/drafts/$draftId`) gets a Versions sidebar to view/restore any version.

### 8. PDF Export + Viewer
- Install `@react-pdf/renderer` (Worker-compatible, pure JS).
- New component `LegalPdfDocument` renders the draft with proper court formatting (serif, headings, cause title, prayer, verification block, page numbers, footer).
- "View PDF" opens in-app modal with embedded PDF preview (`<PDFViewer>` on client only).
- "Download PDF" triggers `pdf().toBlob()` save.
- Available on each AI response in chat AND on saved drafts page.
- "My PDFs" page lists all saved drafts and lets the user re-view/download.

### Technical Notes
- Stack: TanStack Start, Supabase (Lovable Cloud), Lovable AI Gateway (`google/gemini-3-flash-preview`).
- All schema changes via one migration (tables + RLS + GRANT + seed templates).
- `_authenticated/route.tsx` becomes the real gate; chat/intake/drafts/templates all move under it.
- `chat.ts` API: add `requireSupabaseAuth` middleware — drafting only for signed-in users.
- `local-store.ts` removed; all data flows through server fns + TanStack Query.

### Deliverable order
1. Migration + auth wiring
2. Rebrand + auth UI
3. Server fns replacing local-store
4. PDF export
5. Templates library
6. Dynamic intake (AI follow-ups)
7. Citation checks
8. Version history UI
