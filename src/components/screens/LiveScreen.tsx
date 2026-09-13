"use client";

import { useCallback } from "react";
import { PaperCard, ReceiptHeader, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { Stamp } from "@/components/ui/Stamp";
import { DEMO_LIVE_START_MINUTES } from "@/lib/config/constants";
import { formatClock, scheduledMinutesFor, triggerClock } from "@/lib/domain/schedule";
import { formatWholeUsd } from "@/lib/format/money";
import { cn } from "@/lib/utils/cn";
import { useApp } from "@/state/AppProvider";
import { productShort } from "@/state/selectors";
import { liveRowsFor } from "./live/liveRows";
import { useLiveTracker } from "./live/useLiveTracker";
import { useRequireStub } from "./shared/useRequireStub";

/** Open stub, flight in progress. The estimate ticks up until the worker settles it. */
export function LiveScreen() {
  const { state, actions } = useApp();
  const stub = useRequireStub();
  const est = state.live.estMinutesLate;

  const onTick = useCallback((estMinutesLate: number) => actions.dispatch({ type: "LIVE_TICK", estMinutesLate }), [actions]);
  const onSettle = useCallback((estMinutesLate: number) => void actions.settleCurrentStub(estMinutesLate), [actions]);
  const { skipAhead, targetMinutesLate } = useLiveTracker({ estMinutesLate: est, onTick, onSettle });

  if (!stub) return null;

  const scheduled = scheduledMinutesFor(stub.product);
  const progress = Math.max(0, Math.min(1, (est - DEMO_LIVE_START_MINUTES) / Math.max(1, targetMinutesLate - DEMO_LIVE_START_MINUTES)));
  const planeLeft = `${Math.round(10 + progress * 86)}%`;
  const pastLine = est > stub.minutesLate;
  const rows = liveRowsFor(stub.product, stub.dest, progress, targetMinutesLate);

  return (
    <Screen label="Live" gap="md">
      <div className="flex items-center justify-between font-mono">
        <button type="button" onClick={() => actions.navigate("stubs")} className="-mx-2 min-h-11 px-2 text-[13px] text-muted underline">
          ‹ MY STUBS
        </button>
        <Stamp rotate={-2} className="px-2 py-[3px] text-[10px]">
          OPEN
        </Stamp>
      </div>

      <PaperCard serrated>
        <ReceiptHeader subtitle={`LIVE · ${productShort(stub.product)}`} />
        <ReceiptRule />
        <div className="flex items-center justify-between py-1.5 text-lg font-bold">
          <span>{stub.origin}</span>
          <span className="relative mx-3 h-7 flex-1">
            <span className="absolute top-1/2 right-0 left-0 border-t-2 border-dotted border-ink" aria-hidden="true" />
            <span
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper px-1 text-[22px] transition-[left] duration-[550ms] ease-out"
              style={{ left: planeLeft }}
              aria-hidden="true"
            >
              ✈
            </span>
          </span>
          <span className="text-muted">{stub.dest}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted">EST. EVENT</span>
          <span key={est} className={cn("inline-block text-[40px] font-bold leading-none animate-tick", pastLine ? "text-gate" : "text-ink")} aria-live="polite">
            {formatClock(scheduled + est)}
          </span>
        </div>
        <ReceiptRow label="RUNNING" value={`+${est} MIN`} valueClassName="font-bold" />
        <ReceiptRow label="PAYS IF AFTER" value={triggerClock(stub.product, stub.minutesLate)} />
        <ReceiptRule />
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between text-[13px] animate-row-print">
            <span className="text-muted">{row.key}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </PaperCard>

      <ScreenFooter className="flex items-center justify-between font-mono">
        <span className="text-xs">{formatWholeUsd(stub.payoutUsd)} USDC PENDING</span>
        <button type="button" onClick={skipAhead} className="-mx-2 min-h-11 px-2 text-xs text-muted underline">
          skip ahead ⏵
        </button>
      </ScreenFooter>
    </Screen>
  );
}
