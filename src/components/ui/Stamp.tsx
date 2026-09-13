import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type StampTone = "gate" | "red";

export type StampProps = {
  tone?: StampTone;
  children: ReactNode;
  /** Degrees. Rubber stamps never land square. */
  rotate?: number;
  /** `drop` lands in place; `center` also keeps translateX(-50%) for absolutely centered stamps. */
  animate?: "none" | "drop" | "center";
  animateDelayMs?: number;
  className?: string;
  style?: CSSProperties;
};

const TONE_CLASS: Record<StampTone, string> = {
  gate: "border-gate text-gate",
  red: "border-stamp text-stamp",
};

/** Inked rubber stamp: bold mono, wide tracking, 3px border, slight tilt. */
export function Stamp({ tone = "gate", children, rotate = -4, animate = "none", animateDelayMs, className, style }: StampProps) {
  const animationClass = animate === "drop" ? "stamp-drop" : animate === "center" ? "stamp-center" : undefined;
  const transform = animate === "none" ? `rotate(${rotate}deg)` : undefined;
  const delayVar = animateDelayMs !== undefined ? ({ "--stamp-delay": `${animateDelayMs}ms` } as CSSProperties) : undefined;
  return (
    <span
      className={cn("inline-block rounded-[6px] border-[3px] px-3.5 py-1.5 font-mono font-bold tracking-[0.12em]", TONE_CLASS[tone], animationClass, className)}
      style={{ transform, ...delayVar, ...style }}
    >
      {children}
    </span>
  );
}
