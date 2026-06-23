import { cn } from "@/lib/utils";

export function LexLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-sm border border-gold/60 bg-sidebar-accent font-serif text-lg font-semibold text-gold shadow-inner">
        L
      </span>
      <div className="leading-tight">
        <div className="font-serif text-lg font-semibold tracking-tight">LexIndia AI</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-gold/80">
          Court · Chambers · Counsel
        </div>
      </div>
    </div>
  );
}
