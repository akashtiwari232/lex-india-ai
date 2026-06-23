import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, Gavel, FileText, BookOpen, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LexIndia AI — Senior Advocate Drafting Agent" },
      {
        name: "description",
        content:
          "AI legal drafting for Indian courts: writs, plaints, bail, contracts, notices — with citations to BNS, BNSS, BSA, CPC and the Constitution.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="bg-parchment-paper min-h-screen text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-sm border border-primary/30 bg-card font-serif text-xl font-semibold text-primary">
            L
          </span>
          <div className="leading-tight">
            <div className="font-serif text-xl font-semibold tracking-tight">LexIndia AI</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Court · Chambers · Counsel
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            to="/drafts"
            className="rounded-sm px-4 py-2 text-foreground/80 transition hover:text-primary"
          >
            Saved Drafts
          </Link>
          <Link
            to="/chat"
            className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Enter Chambers
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <section className="grid items-center gap-12 md:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Indian Legal Drafting · Court Ready
            </div>
            <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              The Senior Advocate
              <br />
              <span className="text-primary">on your desk.</span>
            </h1>
            <div className="gold-divider my-6 w-40" />
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              LexIndia AI drafts writ petitions, plaints, bail applications, legal notices,
              contracts and tribunal pleadings — formatted for filing in Indian courts and
              grounded in the BNS, BNSS, BSA, CPC, the Constitution of India and contemporary
              jurisprudence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Gavel className="h-4 w-4" />
                Begin Drafting — Free
              </Link>
              <a
                href="#capabilities"
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:border-gold/60"
              >
                <BookOpen className="h-4 w-4" />
                See Capabilities
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-sm border border-border bg-card p-7 shadow-[var(--shadow-chambers)]">
              <div className="flex items-center justify-between border-b border-border pb-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span>In the High Court of Judicature</span>
                <span className="text-primary">W.P. (C) No. ____ / 2025</span>
              </div>
              <div className="prose-legal mt-4 text-sm">
                <h3 className="!mt-0">IN THE MATTER OF:</h3>
                <p>
                  <strong>Petitioner</strong> — A citizen aggrieved by infraction of
                  fundamental rights under Article 21 of the Constitution of India.
                </p>
                <p>
                  <strong>Versus</strong>
                </p>
                <p>
                  <strong>Union of India &amp; Ors.</strong> — Respondents.
                </p>
                <h3>PRAYER</h3>
                <p>
                  It is therefore most respectfully prayed that this Hon'ble Court may
                  graciously be pleased to issue an appropriate writ, order or direction in
                  the nature of <em>mandamus</em>…
                </p>
              </div>
              <div className="gold-divider mt-5" />
              <div className="mt-3 text-right font-serif text-xs italic text-muted-foreground">
                Drafted by LexIndia AI
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="mt-24">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-semibold text-foreground md:text-4xl">
              Practice areas covered
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Constitution · Criminal · Civil · Family · Corporate · Property · IP · Cyber ·
              Labour · Environmental · Tax · ADR · Consumer · Notices
            </p>
            <div className="gold-divider mx-auto mt-5 max-w-md" />
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-sm border border-border bg-card p-6 transition hover:border-gold/50 hover:shadow-[var(--shadow-chambers)]"
              >
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-24 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          LexIndia AI provides drafting assistance only. Outputs require advocate review prior
          to filing. Not a substitute for licensed legal counsel.
        </footer>
      </main>
    </div>
  );
}

const features = [
  {
    icon: FileText,
    title: "Court-Ready Format",
    body: "Cause title, jurisdiction, statement of facts, grounds, prayer, verification and annexures — produced in the form Indian courts expect.",
  },
  {
    icon: Scale,
    title: "Statute-Grounded",
    body: "Citations to BNS, BNSS, BSA, CPC, Constitution, Contract Act, Companies Act, IP and labour codes — with relevant section references.",
  },
  {
    icon: ShieldCheck,
    title: "Saved Drafts Vault",
    body: "Every brief is preserved in your private chambers. Revisit, refine and export — accessible only to you.",
  },
];
