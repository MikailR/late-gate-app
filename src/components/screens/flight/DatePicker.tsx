"use client";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { parseIsoDate, toIsoDate } from "@/lib/domain/flightKey";
import type { DateMode } from "@/lib/domain/types";
import { formatShortDate } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";

type DatePickerProps = {
  mode: DateMode;
  other: string;
  onMode: (mode: DateMode) => void;
  onOther: (iso: string) => void;
};

/** Next 24h is the default; the stub prints whichever date was chosen. */
export function DatePicker({ mode, other, onMode, onOther }: DatePickerProps) {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 864e5);
  const otherDate = parseIsoDate(other);

  const chips: Array<{ mode: DateMode; label: string; sub: string }> = [
    { mode: "next24", label: "NEXT 24H", sub: formatShortDate(today) },
    { mode: "tomorrow", label: "TOMORROW", sub: formatShortDate(tomorrow) },
    { mode: "other", label: "PICK DATE", sub: otherDate ? formatShortDate(otherDate) : "···" },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <SectionLabel>DATE</SectionLabel>
      <div className="flex gap-2">
        {chips.map((chip) => {
          const on = mode === chip.mode;
          return (
            <button
              key={chip.mode}
              type="button"
              aria-pressed={on}
              onClick={() => onMode(chip.mode)}
              className={cn(
                "flex min-h-[54px] flex-1 flex-col gap-[3px] rounded-xl border-[1.5px] bg-paper px-1.5 py-2.5 text-center font-mono text-xs font-bold tracking-[0.08em]",
                on ? "border-gate bg-wash text-gate" : "border-rule",
              )}
            >
              <span>{chip.label}</span>
              <span className={cn("text-[11px] font-normal tracking-normal", on ? "text-gate" : "text-muted")}>{chip.sub}</span>
            </button>
          );
        })}
      </div>
      {mode === "other" && (
        <input
          type="date"
          value={other}
          min={toIsoDate(today)}
          onChange={(event) => onOther(event.target.value)}
          name="flightDate"
          aria-label="Flight date"
          className="h-[42px] w-full rounded-[10px] border-[1.5px] border-rule bg-paper px-3.5 font-mono text-sm text-ink outline-none animate-row-print focus:border-gate focus:shadow-[0_0_0_3px_var(--color-wash)]"
        />
      )}
    </div>
  );
}
