"use client";

import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptHeader, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { MINUTES_LATE_OPTIONS, type MinutesLate } from "@/lib/domain/types";
import { payoutUsdForMinutesLate } from "@/lib/domain/pricing";
import { formatWholeUsd } from "@/lib/format/money";
import { cn } from "@/lib/utils/cn";
import { useApp } from "@/state/AppProvider";
import { productName, productShort, selectFlightLabel, selectPayoutUsd, selectPremiumUsd, selectTriggerClock } from "@/state/selectors";

/**
 * One tear-off stub per threshold. Paper border, mono, dotted rule with
 * punch notches, gate-blue tick when picked. Minutes on top, payout below.
 */
function MinutesStub({ minutes, selected, onPick }: { minutes: MinutesLate; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-0.5 rounded-[3px] border bg-paper px-1.5 pt-3.5 pb-2.5 text-center font-mono text-ink",
        "shadow-[0_1px_2px_rgba(26,26,26,0.05)] transition-[border-color,background,box-shadow,transform] duration-150 active:scale-[0.97]",
        selected ? "border-gate bg-wash text-gate shadow-[0_0_0_1px_var(--color-gate),0_4px_14px_rgba(31,79,191,0.12)]" : "border-rule",
      )}
    >
      <span
        className={cn(
          "absolute top-1.5 right-1.5 h-[18px] w-[18px] rounded border-2 border-gate text-[11px] font-bold leading-[14px] text-gate transition-[opacity,transform] duration-200",
          selected ? "rotate-[-8deg] scale-100 opacity-100" : "rotate-[-8deg] scale-[1.8] opacity-0",
        )}
        aria-hidden="true"
      >
        ✓
      </span>
      <span className="text-[30px] font-bold leading-none tracking-[-0.02em]">{minutes}</span>
      <span className={cn("text-[10px] tracking-[0.16em]", selected ? "text-gate" : "text-muted")}>MIN</span>
      <span className={cn("tear-rule", selected && "tear-rule-on")} aria-hidden="true" />
      <span className="flex items-baseline gap-1 text-base font-bold leading-none">
        <span className={cn("text-[9px] font-normal tracking-[0.14em]", selected ? "text-gate" : "text-muted")}>PAYS</span>
        {formatWholeUsd(payoutUsdForMinutesLate(minutes))}
      </span>
    </button>
  );
}

/** How late? The quote receipt reprints as the threshold changes; the premium never moves. */
export function ConfigureScreen() {
  const { state, actions } = useApp();
  const premium = selectPremiumUsd(state);
  const payout = selectPayoutUsd(state);

  return (
    <Screen label="Configure" gap="md">
      <BackLink onClick={() => actions.navigate("catalog")}>{productName(state.product)}</BackLink>
      <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">How late?</h1>

      <PaperCard serrated print>
        <ReceiptHeader subtitle="QUOTE · NOT YET ISSUED" />
        <ReceiptRule />
        <ReceiptRow label="FLIGHT" value={selectFlightLabel(state)} />
        <ReceiptRow label="PRODUCT" value={productShort(state.product)} />
        <ReceiptRow label="PAYS IF AFTER" value={selectTriggerClock(state)} />
        <ReceiptRule />
        <div className="font-sans text-base leading-[1.3]">
          Pays if <b className="font-mono text-xl">{state.minutesLate} minutes</b> late
        </div>
        <div key={payout} className="text-center text-[56px] font-bold leading-none tracking-[-0.02em] animate-pop" style={{ animationDelay: "120ms" }}>
          {formatWholeUsd(payout)}
        </div>
        <ReceiptRule />
        <ReceiptRow label="PREMIUM" value={`$${premium}.00`} tone="bold" />
        <ReceiptRow label="REMAINING" value={`${state.remaining} STUBS`} tone="muted" />
      </PaperCard>

      <div className="flex gap-2.5" role="radiogroup" aria-label="Minutes late">
        {MINUTES_LATE_OPTIONS.map((minutes) => (
          <MinutesStub key={minutes} minutes={minutes} selected={state.minutesLate === minutes} onPick={() => actions.dispatch({ type: "SET_MINUTES_LATE", minutesLate: minutes })} />
        ))}
      </div>

      <ScreenFooter>
        <Button onClick={() => actions.navigate("verify")}>Continue · ${premium}</Button>
      </ScreenFooter>
    </Screen>
  );
}
