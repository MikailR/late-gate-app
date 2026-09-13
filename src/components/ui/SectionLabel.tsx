import type { ReactNode } from "react";

/** Small mono caption with a trailing hairline, used to head each form block. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="section-label flex items-center gap-2.5 font-mono text-[11px] tracking-[0.14em] text-muted">{children}</div>;
}
