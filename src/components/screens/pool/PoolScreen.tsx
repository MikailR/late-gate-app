"use client";

import { useEffect } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptHeader, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter, ScreenTitle } from "@/components/ui/Screen";
import { formatEarnedUsd, formatSharePercent, formatUsdc } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { selectPoolPositionUsd, selectWalletConnected } from "@/state/selectors";

/** House side. The overview reads as a receipt; Deposit and Withdraw are the only two moves. */
export function PoolScreen() {
  const { state, actions } = useApp();
  const { pool, wallet } = state;
  const connected = selectWalletConnected(state);
  const position = selectPoolPositionUsd(state);

  useEffect(() => {
    void actions.refreshPool();
  }, [actions]);

  return (
    <Screen label="House pool" gap="md">
      <BackLink onClick={() => actions.navigate("stubs")}>MY STUBS</BackLink>
      <ScreenTitle step="HOUSE SIDE">House pool</ScreenTitle>

      <PaperCard serrated print>
        <ReceiptHeader subtitle="HOUSE POOL · USDC · WORLD CHAIN" />
        <ReceiptRule />
        <ReceiptRow label="POOL TVL" value={formatUsdc(pool.tvlUsd)} align="baseline" valueClassName="text-[22px] font-bold leading-none" />
        <ReceiptRow label="OPEN STUBS" value={pool.openStubs} tone="muted" />
        <ReceiptRule />
        <ReceiptRow label="YOUR DEPOSIT" value={connected ? formatUsdc(pool.depositUsd) : "···"} tone="bold" />
        <ReceiptRow label="EARNED" value={connected ? `${formatEarnedUsd(pool.earnedUsd)} USDC` : "···"} valueClassName={pool.earnedUsd > 0 ? "font-bold text-gate" : "font-bold"} />
        <ReceiptRow label="YOUR SHARE" value={connected ? formatSharePercent(pool.depositUsd, pool.tvlUsd) : "···"} tone="muted" />
        {!connected && <ReceiptRow label="WALLET" value="NOT CONNECTED" tone="muted" valueClassName="text-stamp" />}
      </PaperCard>

      <ScreenFooter>
        {connected ? (
          <div className="flex gap-2.5">
            <Button variant="ghost" size="md" faded={position <= 0} onClick={() => actions.dispatch({ type: "POOL_START", kind: "withdraw" })} className="flex-1">
              Withdraw
            </Button>
            <Button size="md" onClick={() => actions.dispatch({ type: "POOL_START", kind: "deposit" })} className="flex-1">
              Deposit
            </Button>
          </div>
        ) : (
          <Button onClick={() => void actions.connectWallet()} disabled={wallet.status === "connecting"}>
            {wallet.status === "connecting" ? "Connecting…" : "Connect wallet to deposit"}
          </Button>
        )}
      </ScreenFooter>
    </Screen>
  );
}
