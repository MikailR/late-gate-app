"use client";

import type { CSSProperties } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Screen } from "@/components/ui/Screen";
import { INVENTORY_NOTCH_THRESHOLDS } from "@/lib/config/constants";
import { premiumUsdForProduct } from "@/lib/domain/pricing";
import type { StubProduct } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";
import { useApp } from "@/state/AppProvider";
import { selectFlightLabel, selectRouteLabel } from "@/state/selectors";

/** Five notches, one lit per four stubs left (17 left = 5 lit, 3 left = 1 lit). */
function InventoryChip({ remaining }: { remaining: number }) {
  return (
    <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cream py-1 pr-[9px] pl-2 font-mono text-[11px] font-bold leading-none tracking-[0.08em] text-ink">
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {INVENTORY_NOTCH_THRESHOLDS.map((threshold) => (
          <i key={threshold} className={cn("block h-[9px] w-[5px] rounded-sm", remaining > threshold ? "bg-gate" : "bg-placeholder")} />
        ))}
      </span>
      {remaining} LEFT
    </span>
  );
}

type StubHalfProps = {
  product: StubProduct;
  position: "top" | "bottom";
  remaining: number;
  printDelayMs: number;
  onPick: () => void;
};

const STUB_COPY: Record<StubProduct, { title: string; desc: string; trigger: string }> = {
  takeoff: { title: "Takeoff delay", desc: "Pays if wheels-up is late", trigger: "Scheduled departure + your buffer" },
  arrival: { title: "Arrival delay", desc: "Pays if gate-in is late", trigger: "Scheduled arrival + your buffer" },
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
        "print group relative flex min-h-[236px] flex-1 flex-col gap-1.5 border border-rule bg-paper px-5 pt-[18px] pb-4 text-left transition-[background,transform] duration-150",
        "active:scale-[0.985] active:bg-wash",
        position === "top" ? "stub-half-top" : "stub-half-bottom",
      )}
      style={{ "--print-duration": "550ms", "--print-delay": `${printDelayMs}ms` } as CSSProperties}
    >
      <div className={cn("flex items-start justify-between gap-3", position === "bottom" && "pt-2")}>
        <span className="font-sans text-[26px] font-bold leading-[1.05] tracking-[-0.025em]">{copy.title}</span>
        <InventoryChip remaining={remaining} />
      </div>
      <span className="text-sm leading-[1.35] text-body">{copy.desc}</span>
      <span className="mt-1 flex flex-col items-start gap-[5px] font-mono text-xs leading-[1.4] text-body">
        <span className="rounded-[3px] border border-gate px-[5px] py-0.5 text-[10px] font-bold leading-none tracking-[0.14em] text-gate">TRIGGER</span>
        <span>{copy.trigger}</span>
      </span>
      <div className="mt-auto flex items-end justify-between pt-2.5">
        <span className="flex items-baseline gap-1.5">
          <span className="mt-[5px] self-start text-base font-semibold text-muted">$</span>
          <span className="text-4xl font-bold leading-none tracking-[-0.03em]">{premium}</span>
          <span className="font-mono text-[11px] tracking-[0.08em] text-muted">PREMIUM</span>
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-gate py-2 pr-3 pl-3.5 text-[13px] font-semibold leading-none text-gate transition-colors duration-150 group-active:bg-gate group-active:text-white">
          Select
          <span className="-mt-px text-base leading-none" aria-hidden="true">
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
      <BackLink onClick={() => actions.navigate("flight")}>
        {selectFlightLabel(state)} · {selectRouteLabel(state)}
      </BackLink>
      <h1 className="text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">Pick a stub</h1>
      <div className="mb-[calc(28px+env(safe-area-inset-bottom))] flex min-h-0 flex-1 flex-col">
        <StubHalf product="takeoff" position="top" remaining={state.remaining} printDelayMs={50} onPick={() => actions.dispatch({ type: "PICK_PRODUCT", product: "takeoff" })} />
        <StubHalf product="arrival" position="bottom" remaining={state.remaining} printDelayMs={150} onPick={() => actions.dispatch({ type: "PICK_PRODUCT", product: "arrival" })} />
      </div>
    </Screen>
  );
}
