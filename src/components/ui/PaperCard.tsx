import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type PaperCardProps = Omit<HTMLAttributes<HTMLDivElement>, "className" | "style"> & {
  /** Torn bottom edge. */
  serrated?: boolean;
  /** Feed the card out of the printer on mount. */
  print?: boolean;
  printDurationMs?: number;
  printDelayMs?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * The receipt. White paper, hairline border, mono type, 10px row gap.
 * Every quote, stub, slip and settlement in the app is one of these.
 */
export function PaperCard({
  serrated = false,
  print = false,
  printDurationMs = 700,
  printDelayMs = 50,
  className,
  style,
  children,
  ...rest
}: PaperCardProps) {
  const printVars = print
    ? ({ "--print-duration": `${printDurationMs}ms`, "--print-delay": `${printDelayMs}ms` } as CSSProperties)
    : undefined;
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 border border-rule bg-paper px-5 pt-[18px] pb-5 font-mono text-sm text-ink",
        serrated && "serrated",
        print && "print",
        className,
      )}
      style={{ ...printVars, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Centered header pair at the top of a receipt: wordmark + subtitle. */
export function ReceiptHeader({ title = "LATE GATE", subtitle }: { title?: string; subtitle: ReactNode }) {
  return (
    <>
      <div className="text-center text-xs tracking-[0.2em]">{title}</div>
      <div className="text-center text-xs text-muted">{subtitle}</div>
    </>
  );
}

/** Dotted tear line between receipt sections. */
export function ReceiptRule() {
  return <div className="receipt-rule" aria-hidden="true" />;
}

type ReceiptRowProps = {
  label: ReactNode;
  value: ReactNode;
  /** `muted` is the small grey secondary row; `bold` is the total row. */
  tone?: "default" | "muted" | "bold";
  align?: "center" | "baseline";
  valueClassName?: string;
};

/** Two-column receipt line: label left, value right. */
export function ReceiptRow({ label, value, tone = "default", align = "center", valueClassName }: ReceiptRowProps) {
  return (
    <div
      className={cn(
        "flex justify-between gap-3",
        align === "baseline" ? "items-baseline" : "items-center",
        tone === "muted" && "text-xs text-muted",
        tone === "bold" && "font-bold",
      )}
    >
      <span className="shrink-0">{label}</span>
      <span className={cn("min-w-0 text-right", valueClassName)}>{value}</span>
    </div>
  );
}
