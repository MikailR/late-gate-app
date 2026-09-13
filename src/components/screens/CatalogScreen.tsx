"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Screen } from "@/components/ui/Screen";
import { INVENTORY_NOTCH_THRESHOLDS } from "@/lib/config/constants";
import { premiumUsdForProduct } from "@/lib/domain/pricing";
import { formatClock, scheduledMinutesFor } from "@/lib/domain/schedule";
import type { StubProduct } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";
import { useApp } from "@/state/AppProvider";
import { selectAirline, selectDateLabel, selectFlightLabel } from "@/state/selectors";

/** Five notches, one lit per four stubs left (17 left = 5 lit, 3 left = 1 lit). */
function InventoryChip({ remaining }: { remaining: number }) {
  return (
    <span className="mt-0.5 inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-cream py-1.5 pr-2.5 pl-2.5 font-mono text-[11px] font-bold leading-none tracking-[0.08em] text-ink">
      <span className="inline-flex items-end gap-[3px]" aria-hidden="true">
        {INVENTORY_NOTCH_THRESHOLDS.map((threshold) => (
          <i key={threshold} className={cn("block h-[10px] w-[5px] rounded-[2px]", remaining > threshold ? "bg-gate" : "bg-placeholder")} />
        ))}
      </span>
      {remaining} LEFT
    </span>
  );
}

/** One-line flight context so the stubs read as belonging to this flight. */
function FlightStrip() {
  const { state } = useApp();
  const airline = selectAirline(state);
  const { origin, dest } = state.flight;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-paper px-3.5 py-2.5 shadow-[0_1px_2px_rgba(26,26,26,0.04)]">
      <Image src={airline.logo} alt={airline.name} width={28} height={28} className="h-7 w-7 shrink-0 object-contain" unoptimized />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 font-mono leading-none">
        <span className="text-[14px] font-bold tracking-[0.02em]">
          {selectFlightLabel(state)} <span className="text-muted">·</span> {origin}
          <span className="text-muted"> → </span>
          {dest}
        </span>
        <span className="text-[11px] tracking-[0.06em] text-muted">
          DEP {formatClock(scheduledMinutesFor("takeoff"))} · ARR {formatClock(scheduledMinutesFor("arrival"))} · {selectDateLabel(state)}
        </span>
      </div>
      <span className="shrink-0 rounded px-1.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-gate">ON TIME</span>
    </div>
  );
}

type StubHalfProps = {
  product: StubProduct;
  position: "top" | "bottom";
  remaining: number;
  printDelayMs: number;
  onPick: () => void;
};

const STUB_COPY: Record<StubProduct, { tag: string; title: string; desc: string; trigger: string }> = {
  takeoff: { tag: "STUB A", title: "Takeoff delay", desc: "Pays if wheels-up is late", trigger: "Scheduled departure + your buffer" },
  arrival: { tag: "STUB B", title: "Arrival delay", desc: "Pays if gate-in is late", trigger: "Scheduled arrival + your buffer" },
};

/**
 * One half of the perforated ticket. The whole card is the button; the
 * Select pill is a visual cue, not a separate target. Payout is chosen on
 * the next screen, so only the premium shows here.
 */
function StubHalf({ product, position, remaining, printDelayMs, onPick }: StubHalfProps) {
  const copy = STUB_COPY[product];
  const premium = premiumUsdForProduct(product);
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "print group relative flex min-h-[248px] flex-1 flex-col gap-2 border border-rule bg-paper px-5 pb-[18px] text-left transition-[background,transform] duration-150",
        "hover:bg-hover-paper active:scale-[0.985] active:bg-wash",
        position === "top" ? "stub-half-top pt-5" : "stub-half-bottom pt-7",
      )}
      style={{ "--print-duration": "550ms", "--print-delay": `${printDelayMs}ms` } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-muted">{copy.tag}</span>
          <span className="font-sans text-[27px] font-bold leading-[1.05] tracking-[-0.025em]">{copy.title}</span>
        </div>
        <InventoryChip remaining={remaining} />
      </div>
      <span className="text-[15px] leading-[1.35] text-body">{copy.desc}</span>
      <span className="mt-1 flex items-center gap-2 font-mono text-xs leading-none text-body">
        <span className="rounded-[3px] border border-gate px-[5px] py-[3px] text-[10px] font-bold leading-none tracking-[0.14em] text-gate">TRIGGER</span>
        <span>{copy.trigger}</span>
      </span>
      <div className="mt-auto flex items-end justify-between border-t border-dotted border-rule pt-3.5">
        <span className="flex items-baseline gap-1.5">
          <span className="mt-[5px] self-start text-lg font-semibold text-muted">$</span>
          <span className="text-[40px] font-bold leading-none tracking-[-0.03em]">{premium}</span>
          <span className="font-mono text-[11px] tracking-[0.1em] text-muted">PREMIUM</span>
        </span>
        <span className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-gate py-2 pr-3.5 pl-4 text-[14px] font-semibold leading-none text-white shadow-[0_2px_8px_rgba(31,79,191,0.25)] transition-[transform,background-color] duration-150 group-hover:bg-[#1B47AD] group-active:scale-95">
          Select
          <span className="-mt-px text-lg leading-none" aria-hidden="true">
            ›
          </span>
        </span>
      </div>
    </button>
  );
}

/** Two stacked stubs joined only by the perforation. */
export function CatalogScreen() {
  const { state, actions } = useApp();

  return (
    <Screen label="Catalog" gap="sm" compact>
      <BackLink onClick={() => actions.navigate("flight")}>WHICH FLIGHT?</BackLink>
      <div className="flex flex-col gap-3">
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">Pick a stub</h1>
        <FlightStrip />
      </div>
      <div className="mt-1 mb-[calc(28px+env(safe-area-inset-bottom))] flex min-h-0 flex-1 flex-col drop-shadow-[0_10px_24px_rgba(26,26,26,0.08)]">
        <StubHalf product="takeoff" position="top" remaining={state.remaining} printDelayMs={50} onPick={() => actions.dispatch({ type: "PICK_PRODUCT", product: "takeoff" })} />
        <StubHalf product="arrival" position="bottom" remaining={state.remaining} printDelayMs={150} onPick={() => actions.dispatch({ type: "PICK_PRODUCT", product: "arrival" })} />
      </div>
    </Screen>
  );
}
