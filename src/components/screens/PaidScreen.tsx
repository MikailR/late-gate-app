"use client";

import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptHeader, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { Stamp } from "@/components/ui/Stamp";
import { DEMO_LATE_MINUTES } from "@/lib/config/constants";
import { formatSerial } from "@/lib/format/date";
import { formatUsdc, formatWholeUsd, truncateAddress } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { productShort } from "@/state/selectors";
import { useRequireStub } from "./shared/useRequireStub";

/**
 * Settled PAID. Gate-blue eyebrow carries the number, the headline calls the
 * win, and the payout destination is a transfer slip torn off the receipt.
 */
export function PaidScreen() {
  const { state, actions } = useApp();
  const stub = useRequireStub();
  if (!stub) return null;
  const lateBy = stub.lateByMinutes ?? DEMO_LATE_MINUTES;
  const walletAddress = state.wallet.address ? truncateAddress(state.wallet.address) : "your wallet";

  return (
    <Screen label="Paid" gap="md">
      <div className="flex flex-col gap-[5px] animate-screen-in" style={{ animationDelay: "1400ms" }}>
        <div className="font-mono text-[11px] font-bold tracking-[0.18em] text-gate">HIT · +{lateBy} MIN LATE</div>
        <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.02em]">
          Called it. <span className="text-gate">You’re paid.</span>
        </h1>
        <p className="text-sm leading-[1.45] text-body">
          {stub.airline} {stub.flightNumber} ran past the line. Stub settled in full, no claim to file.
        </p>
      </div>

      {/* Extra bottom padding is reserved white space so the PAID stamp clears the last printed row. */}
      <PaperCard serrated print printDurationMs={900} printDelayMs={100} className="relative pb-[108px]">
        <span
          className="stamp-center absolute bottom-[30px] left-1/2 z-[2] whitespace-nowrap rounded-lg border-4 border-gate px-4 py-1.5 font-mono text-[32px] font-bold leading-none tracking-[0.14em] text-gate opacity-[0.92]"
          aria-label="Paid"
        >
          PAID
        </span>
        <ReceiptHeader subtitle={`TICKET ${formatSerial(Number(stub.ticketNumber))} · SETTLED`} />
        <ReceiptRule />
        <ReceiptRow label="FLIGHT" value={`${stub.airline} ${stub.flightNumber}`} />
        <ReceiptRow label="PRODUCT" value={productShort(stub.product)} />
        <ReceiptRow label="LATE BY" value={`+${lateBy} MIN`} valueClassName="font-bold text-gate" />
        <ReceiptRule />
        <ReceiptRow label="PAID OUT" value={formatWholeUsd(stub.payoutUsd)} tone="bold" align="baseline" valueClassName="text-4xl leading-none" />
        <ReceiptRow label="PREMIUM" value={`$${stub.premiumUsd}.00 USDC`} tone="muted" />
      </PaperCard>

      {/* Payout destination: USDC routed to the wallet. No card anywhere. */}
      <div
        className="relative -mt-1.5 flex items-center gap-3 rounded-b-md border border-t-2 border-gate border-t-dashed bg-wash py-3 pr-3.5 pl-4 font-mono animate-screen-in"
        style={{ animationDelay: "1500ms" }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="text-[10px] font-bold tracking-[0.18em] text-gate">PAYOUT ROUTED · USDC</div>
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="text-xl font-bold leading-none">{formatWholeUsd(stub.payoutUsd)}</span>
            <span className="text-[13px] text-muted" aria-hidden="true">
              →
            </span>
            <span className="truncate text-[15px] font-bold">{walletAddress}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="h-[7px] w-[7px] rounded-full bg-gate" aria-hidden="true" />
            In your wallet now · balance {formatUsdc(state.wallet.usdcBalance)}
          </div>
        </div>
        <Stamp animate="drop" animateDelayMs={1750} className="bg-paper px-2.5 py-1 text-xs">
          SENT
        </Stamp>
      </div>

      <ScreenFooter delayMs={1800} className="flex flex-col gap-2.5 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <Button onClick={() => actions.navigate("stubs")}>My stubs</Button>
        <Button variant="ghost" size="md" onClick={() => actions.navigate("airline")}>
          Cover another flight
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
