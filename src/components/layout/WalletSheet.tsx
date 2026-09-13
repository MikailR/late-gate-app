"use client";

import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { WALLET_NETWORK_LABEL } from "@/lib/config/constants";
import { formatUsdc, truncateAddress } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { selectPoolPositionUsd } from "@/state/selectors";
import { Sheet } from "./Sheet";

/** Wallet details plus the second entry point into the house pool. */
export function WalletSheet() {
  const { state, actions } = useApp();
  const { wallet, sheetOpen, owned } = state;
  const poolPosition = selectPoolPositionUsd(state);
  const close = () => actions.dispatch({ type: "CLOSE_SHEET" });

  const openPool = () => {
    actions.navigate("pool");
  };

  return (
    <Sheet open={sheetOpen && wallet.status === "connected"} onClose={close} label="Wallet">
      <div className="flex items-baseline justify-between">
        <div className="text-[22px] font-semibold tracking-[-0.02em]">Wallet</div>
        <div className="font-mono text-[11px] tracking-[0.12em] text-gate">CONNECTED</div>
      </div>
      <PaperCard>
        <ReceiptRow label="ADDRESS" value={wallet.address ? truncateAddress(wallet.address) : ""} valueClassName="font-bold" />
        <ReceiptRow label="BALANCE" value={formatUsdc(wallet.usdcBalance)} valueClassName="font-bold" />
        <ReceiptRow label="NETWORK" value={WALLET_NETWORK_LABEL} tone="muted" />
        <ReceiptRule />
        <ReceiptRow label="STUBS HELD" value={owned.length} tone="muted" />
        <ReceiptRow label="IN POOL" value={formatUsdc(poolPosition)} tone="muted" />
        <button
          type="button"
          onClick={openPool}
          className="-mx-2 flex min-h-11 items-center justify-between px-2 pt-0.5 font-bold text-gate active:opacity-70"
        >
          <span>HOUSE POOL</span>
          <span>{poolPosition > 0 ? "Manage" : "Deposit"} ›</span>
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
