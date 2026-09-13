"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptHeader, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { Stamp } from "@/components/ui/Stamp";
import { WALLET_NETWORK_LABEL } from "@/lib/config/constants";
import { formatSerial } from "@/lib/format/date";
import { formatEarnedUsd, formatUsd, formatUsdc, truncateAddress } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { selectPoolPositionUsd } from "@/state/selectors";

/** Receipt strip after a deposit or withdrawal. Same card and stamp as a stub, fewer rows. */
export function PoolSlipScreen() {
  const { state, actions } = useApp();
  const { pool, wallet } = state;
  const slip = pool.slip;

  useEffect(() => {
    if (!slip) actions.navigate("pool");
  }, [slip, actions]);
  if (!slip) return null;

  const isWithdraw = slip.kind === "withdraw";

  return (
    <Screen label="Pool slip" gap="md">
      <PaperCard serrated print printDurationMs={800} printDelayMs={100} className="relative">
        <div className="absolute top-[18px] right-3.5">
          <Stamp animate="drop" animateDelayMs={900} className="text-xs">
            {isWithdraw ? "WITHDRAWN" : "DEPOSITED"}
          </Stamp>
        </div>
        <ReceiptHeader subtitle={`POOL SLIP ${formatSerial(slip.serial)}`} />
        <ReceiptRule />
        <div className="flex items-baseline justify-between py-1 font-bold">
          <span>{isWithdraw ? "WITHDREW" : "DEPOSITED"}</span>
          <span className="text-4xl leading-none">{formatUsd(slip.amountUsd)}</span>
        </div>
        <ReceiptRow label="ROUTE" value={isWithdraw ? "POOL → WALLET" : "WALLET → POOL"} />
        <ReceiptRow label="NETWORK" value={`USDC · ${WALLET_NETWORK_LABEL}`} />
        <ReceiptRow label="WALLET" value={wallet.address ? truncateAddress(wallet.address) : "···"} />
        <ReceiptRule />
        <ReceiptRow label="IN POOL" value={formatUsdc(selectPoolPositionUsd(state))} tone="bold" />
        <ReceiptRow label="EARNED" value={`${formatEarnedUsd(pool.earnedUsd)} USDC`} valueClassName={pool.earnedUsd > 0 ? "text-gate" : undefined} />
        <ReceiptRow label="POOL TVL" value={formatUsdc(pool.tvlUsd)} tone="muted" />
        <ReceiptRow label="BALANCE" value={formatUsdc(wallet.usdcBalance)} tone="muted" />
        <div className="barcode" aria-hidden="true" />
      </PaperCard>
      <ScreenFooter delayMs={1000} className="flex gap-2.5">
        <Button variant="ghost" size="md" onClick={() => actions.navigate("stubs")} className="flex-1">
          My stubs
        </Button>
        <Button size="md" onClick={() => actions.navigate("pool")} className="flex-1">
          House pool
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
