import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type CodeFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  /** Locked prefix on the left: airline code or `$`. */
  prefix: ReactNode;
  /** Optional control on the right: clear or MAX. */
  trailing?: ReactNode;
  inputClassName?: string;
};

/**
 * Big mono entry field with a locked prefix. Used for the flight number and
 * for USDC amounts on the pool screens.
 */
export function CodeField({ prefix, trailing, inputClassName, ...inputProps }: CodeFieldProps) {
  return (
    <div className="flex h-16 items-center overflow-hidden rounded-xl border-[1.5px] border-rule bg-paper transition-[border-color,box-shadow] duration-150 focus-within:border-gate focus-within:shadow-[0_0_0_3px_var(--color-wash)]">
      <span className="flex h-full items-center border-r border-rule bg-cream px-4 font-mono text-2xl font-bold tracking-[0.06em]">{prefix}</span>
      <input
        {...inputProps}
        className={cn(
          "min-w-0 flex-1 bg-transparent px-3.5 font-mono text-[28px] font-bold tracking-[0.12em] text-ink outline-none",
          "placeholder:font-normal placeholder:text-placeholder",
          inputClassName,
        )}
      />
      {trailing}
    </div>
  );
}

/** Right-side text control for a CodeField (clear ✕ or MAX). */
export function CodeFieldAction({ onClick, children, tone = "muted", label }: { onClick: () => void; children: ReactNode; tone?: "muted" | "gate"; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-full items-center px-4 font-mono text-xs font-bold tracking-[0.1em] active:bg-wash",
        tone === "gate" ? "border-l border-rule text-gate" : "text-sm text-muted",
      )}
    >
      {children}
    </button>
  );
}
