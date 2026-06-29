export function LexLogo() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-sm border border-primary/30 bg-card font-serif text-lg font-semibold text-primary">
        L
      </span>
      <div className="leading-tight">
        <div className="font-serif text-base font-semibold tracking-tight text-sidebar-primary">
          LexLaw AI
        </div>
        <div className="text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
          Senior Advocate · Chambers
        </div>
      </div>
    </div>
  );
}
