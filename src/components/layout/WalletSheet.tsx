"use client";

import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { WALLET_NETWORK_LABEL } from "@/lib/config/constants";
import { formatEarnedUsd, formatUsd, formatUsdc, truncateAddress } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { selectPoolPositionUsd } from "@/state/selectors";
import { Sheet } from "./Sheet";

/** Wallet details plus the second entry point into the house pool. */
export function WalletSheet() {
  const { state, actions } = useApp();
  const { wallet, sheetOpen, owned, pool } = state;
  const poolPosition = selectPoolPositionUsd(state);
  const close = () => actions.dispatch({ type: "CLOSE_SHEET" });

  return (
    <Sheet open={sheetOpen && wallet.status === "connected"} onClose={close} label="Wallet">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandMark size={26} />
          <div className="text-[22px] font-semibold tracking-[-0.02em]">Wallet</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-wash px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-gate">
          <span className="h-1.5 w-1.5 rounded-full bg-gate" aria-hidden="true" />
          CONNECTED
        </div>
      </div>

      <PaperCard serrated>
        <div className="flex flex-col gap-1 py-1">
          <span className="text-[10px] tracking-[0.16em] text-muted">BALANCE · USDC</span>
          <span className="text-[34px] font-bold leading-none tracking-[-0.02em]">{formatUsd(wallet.usdcBalance)}</span>
        </div>
        <ReceiptRule />
        <ReceiptRow label="ADDRESS" value={wallet.address ? truncateAddress(wallet.address, 6, 4) : ""} valueClassName="font-bold" />
        <ReceiptRow label="NETWORK" value={WALLET_NETWORK_LABEL} />
        <ReceiptRow label="SOURCE" value={wallet.live ? "World App · MiniKit" : "Demo wallet"} tone="muted" />
        {!wallet.live && <ReceiptRow label="LIVE WALLET" value="Open in World App" tone="muted" />}
        <ReceiptRow label="STUBS HELD" value={owned.length} tone="muted" />
        <ReceiptRule />
        <button
          type="button"
          onClick={() => actions.navigate("pool")}
          className="-mx-2 -my-1 flex min-h-12 items-center justify-between rounded px-2 py-1 text-left active:bg-wash"
        >
          <span className="flex flex-col gap-1">
            <span className="text-[10px] tracking-[0.16em] text-muted">HOUSE POOL</span>
            <span className="text-[13px] font-bold">
              {poolPosition > 0 ? `${formatUsdc(poolPosition)} · ${formatEarnedUsd(pool.earnedUsd)} earned` : "Not deposited yet"}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-0.5 font-sans text-[13px] font-semibold text-gate">
            {poolPosition > 0 ? "Manage" : "Deposit"}
            <span className="-mt-px text-base leading-none" aria-hidden="true">
              ›
            </span>
          </span>
        </button>
      </PaperCard>

      <div className="flex gap-2.5">
        <Button variant="ghost" size="md" onClick={() => void actions.disconnectWallet()} className="flex-1">
          Disconnect
        </Button>
        <Button size="md" onClick={close} className="flex-1">
          Done
        </Button>
      </div>
    </Sheet>
  );
}
