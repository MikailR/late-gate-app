import type { FlightLookup } from "@/lib/domain/lookup";
import { cn } from "@/lib/utils/cn";

type LookupCardProps = {
  flightLabel: string;
  dateLabel: string;
  lookup: FlightLookup | null;
  loading: boolean;
  /** Inventory to print when the rails quote does not carry `remaining`. */
  fallbackRemaining: number;
};

/** Inline lookup result under the flight number. Gate-blue when buyable, stamp-red when blocked. */
export function LookupCard({ flightLabel, dateLabel, lookup, loading, fallbackRemaining }: LookupCardProps) {
  const blocked = lookup !== null && !lookup.ok;
  const accent = blocked ? "border-l-stamp" : "border-l-gate";
  const statusColor = blocked ? "text-stamp" : "text-gate";

  const seats = !lookup ? "" : lookup.ok ? `${lookup.remaining ?? fallbackRemaining} LEFT` : lookup.remaining === 0 ? "0 LEFT" : "CLOSED";

  return (
    <div className={cn("flex flex-col gap-1.5 rounded-r-[10px] border border-line border-l-4 bg-paper px-3.5 py-3 font-mono animate-row-print", accent)} aria-live="polite">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold">{flightLabel}</span>
        <span className={cn("text-xs font-bold tracking-[0.06em]", statusColor, loading && !lookup && "text-muted")}>
          {lookup ? lookup.statusLabel : "LOOKING UP…"}
        </span>
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>
          DEP {lookup?.dep ?? "··:··"} · ARR {lookup?.arr ?? "··:··"} · {dateLabel}
        </span>
        <span>{seats}</span>
      </div>
      {blocked && lookup.reason && <div className="border-t border-dotted border-line pt-2 text-xs text-stamp">{lookup.reason}</div>}
    </div>
  );
}
