import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ScreenProps = {
  /** Used for testing hooks and analytics; never shown. */
  label: string;
  gap?: "sm" | "md" | "lg";
  /** Tighter side padding for the Pick a stub screen. */
  compact?: boolean;
  className?: string;
  children: ReactNode;
};

const GAP_CLASS = { sm: "gap-3", md: "gap-3.5", lg: "gap-[22px]" } as const;

/**
 * One in-phone screen. Fills the viewport under the sticky header so
 * `mt-auto` children (the CTA block) sit at the bottom on tall phones and
 * scroll naturally on short ones.
 */
export function Screen({ label, gap = "md", compact = false, className, children }: ScreenProps) {
  return (
    <section
      data-screen={label}
      className={cn(
        "flex min-h-[calc(100dvh-var(--header-h))] flex-col animate-screen-in",
        compact ? "px-5 pt-5" : "px-6 pt-6",
        GAP_CLASS[gap],
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Bottom block for CTAs. Adds the home-indicator safe area. */
export function ScreenFooter({ className, children, delayMs }: { className?: string; children: ReactNode; delayMs?: number }) {
  return (
    <div
      className={cn("mt-auto pt-3 pb-[calc(28px+env(safe-area-inset-bottom))]", delayMs !== undefined && "animate-screen-in", className)}
      style={delayMs !== undefined ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** Screen title. `step` prints the small mono eyebrow above it. */
export function ScreenTitle({ step, children, size = "lg" }: { step?: string; children: ReactNode; size?: "lg" | "md" }) {
  return (
    <div>
      {step && <div className="font-mono text-xs tracking-[0.2em]">{step}</div>}
      <h1 className={cn("font-semibold leading-[1.1] tracking-[-0.02em]", size === "lg" ? "text-[30px]" : "text-[28px]", step && "mt-1.5")}>{children}</h1>
    </div>
  );
}
