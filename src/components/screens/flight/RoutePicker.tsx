"use client";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { AIRPORT_CHIP_LIMIT, cityOf, searchAirports } from "@/lib/data/airports";
import { cn } from "@/lib/utils/cn";
import type { RouteEdit } from "@/state/types";

type RoutePickerProps = {
  origin: string;
  dest: string;
  editing: RouteEdit;
  query: string;
  onEdit: (edit: RouteEdit) => void;
  onQuery: (query: string) => void;
  onPick: (code: string) => void;
  onSwap: () => void;
};

function RouteCell({ label, code, city, active, placeholder, onClick }: { label: string; code: string; city: string; active: boolean; placeholder: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border-[1.5px] bg-paper px-3.5 py-3 text-left transition-[border-color,background] duration-150 active:scale-[0.98]",
        active ? "border-gate bg-wash" : "border-rule",
      )}
    >
      <span className="font-mono text-[10px] tracking-[0.14em] text-muted">{label}</span>
      <span className={cn("font-mono text-[26px] font-bold leading-[1.1] tracking-[0.04em]", placeholder && "text-faint")}>{code}</span>
      <span className="truncate text-xs text-muted">{city || "\u00a0"}</span>
    </button>
  );
}

/** FROM / TO cells with a swap knob. Tapping a cell opens the airport chips under it. */
export function RoutePicker({ origin, dest, editing, query, onEdit, onQuery, onPick, onSwap }: RoutePickerProps) {
  const matches = searchAirports(query);
  const otherEnd = editing === "origin" ? dest : origin;
  const chips = matches.slice(0, AIRPORT_CHIP_LIMIT);

  return (
    <div className="flex flex-col gap-2.5">
      <SectionLabel>ROUTE</SectionLabel>
      <div className="flex items-stretch gap-2">
        <RouteCell label="FROM" code={origin} city={cityOf(origin)} active={editing === "origin"} placeholder={false} onClick={() => onEdit(editing === "origin" ? null : "origin")} />
        <button
          type="button"
          onClick={onSwap}
          disabled={!dest}
          aria-label="Swap origin and destination"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center self-center rounded-full border border-rule bg-paper text-base text-muted active:rotate-180 disabled:opacity-40"
        >
          ⇄
        </button>
        <RouteCell label="TO" code={dest || "···"} city={dest ? cityOf(dest) : ""} active={editing === "dest"} placeholder={!dest} onClick={() => onEdit(editing === "dest" ? null : "dest")} />
      </div>

      {editing && (
        <div className="flex flex-col gap-2 animate-row-print">
          <input
            type="text"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={editing === "origin" ? "Search departure airport" : "Search arrival airport"}
            autoComplete="off"
            aria-label={editing === "origin" ? "Search departure airport" : "Search arrival airport"}
            className="h-[42px] w-full rounded-[10px] border-[1.5px] border-rule bg-paper px-3.5 text-sm text-ink outline-none focus:border-gate focus:shadow-[0_0_0_3px_var(--color-wash)]"
          />
          <div className="grid grid-cols-3 gap-2">
            {chips.map((airport) => {
              const selected = editing === "origin" ? origin === airport.code : dest === airport.code;
              const disabled = airport.code === otherEnd;
              return (
                <button
                  key={airport.code}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => onPick(airport.code)}
                  className={cn(
                    "flex min-h-[54px] min-w-0 flex-col items-center gap-0.5 rounded-xl border-[1.5px] bg-paper px-1.5 py-2.5 text-center font-mono",
                    selected ? "border-gate bg-wash text-gate" : "border-rule",
                    disabled && "cursor-not-allowed opacity-35",
                  )}
                >
                  <span className="text-[15px] font-bold">{airport.code}</span>
                  <span className={cn("max-w-full truncate font-sans text-[10px] font-medium", selected ? "text-gate" : "text-muted")}>{airport.city}</span>
                </button>
              );
            })}
          </div>
          {matches.length === 0 && <div className="py-1 text-center font-mono text-xs text-muted">No airport matches “{query}”.</div>}
        </div>
      )}
    </div>
  );
}
