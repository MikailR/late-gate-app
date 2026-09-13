"use client";

import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptHeader, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { Stamp } from "@/components/ui/Stamp";
import { triggerClock } from "@/lib/domain/schedule";
import { formatSerial, formatShortDate } from "@/lib/format/date";
import { parseIsoDate } from "@/lib/domain/flightKey";
import { formatWholeUsd } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { productShort } from "@/state/selectors";
import { useRequireStub } from "./shared/useRequireStub";

/** The stub prints. Save it to the drawer or follow the flight live. */
export function IssuedScreen() {
  const { actions } = useApp();
  const stub = useRequireStub();
  if (!stub) return null;
  const serviceDate = parseIsoDate(stub.serviceDate);

  return (
    <Screen label="Stub" gap="md">
      <PaperCard serrated print printDurationMs={900} printDelayMs={100} className="relative">
        <div className="absolute top-[18px] right-3.5">
          <Stamp animate="drop" animateDelayMs={1000} className="text-xs">
            OPEN
          </Stamp>
        </div>
        <ReceiptHeader subtitle={`TICKET ${formatSerial(Number(stub.ticketNumber))}`} />
        <ReceiptRule />
        <div className="flex items-center justify-between py-1">
          <span className="text-[30px] font-bold">{stub.origin}</span>
          <span className="text-muted" aria-hidden="true">
            →
          </span>
          <span className="text-[30px] font-bold">{stub.dest}</span>
        </div>
        <ReceiptRule />
        <ReceiptRow label="FLIGHT" value={`${stub.airline} ${stub.flightNumber} · ${serviceDate ? formatShortDate(serviceDate) : stub.serviceDate}`} />
        <ReceiptRow label="PRODUCT" value={productShort(stub.product)} />
        <ReceiptRow label="PAYS IF AFTER" value={triggerClock(stub.product, stub.minutesLate)} valueClassName="font-bold" />
        <ReceiptRule />
        <ReceiptRow label="PAYOUT" value={formatWholeUsd(stub.payoutUsd)} tone="bold" align="baseline" valueClassName="text-4xl leading-none" />
        <ReceiptRow label="PAID" value={`$${stub.premiumUsd}.00 USDC`} tone="muted" />
        <div className="barcode" aria-hidden="true" />
      </PaperCard>
      <ScreenFooter delayMs={1100} className="flex gap-2.5">
        <Button variant="ghost" size="md" onClick={actions.saveStub} className="flex-1">
          Save stub
        </Button>
        <Button size="md" onClick={actions.followStub} className="flex-1">
          Follow flight
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
