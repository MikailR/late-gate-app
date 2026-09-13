"use client";

import { BrandMark } from "@/components/ui/BrandMark";
import { useLongPress } from "@/hooks/useLongPress";
import { APP_NAME, DEMO_LONG_PRESS_MS, WALLET_NETWORK_LABEL } from "@/lib/config/constants";
import { formatUsd, truncateAddress } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";

/**
 * Sticky web header: mark + wordmark left, wallet right. Lives outside the
 * scrolling screens so it never moves. Long-pressing the wordmark is the
 * hidden demo entry.
 */
export function AppHeader() {
  const { state, actions } = useApp();
  const { wallet } = state;
  const longPress = useLongPress(actions.startDemo, DEMO_LONG_PRESS_MS);
  const connecting = wallet.status === "connecting";

  return (
    <header className="sticky top-0 z-20 flex h-[var(--header-h)] items-center justify-between gap-3 border-b border-line bg-phone/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <button
        type="button"
        {...longPress}
        className="-ml-1 flex h-11 select-none items-center gap-2.5 px-1 text-ink"
        aria-label={`${APP_NAME}. Hold to open the demo flight.`}
      >
        <BrandMark size={24} />
        <span className="font-mono text-xs font-bold tracking-[0.2em]">{APP_NAME}</span>
      </button>

      {wallet.status === "connected" && wallet.address ? (
        <button
          type="button"
          onClick={() => actions.dispatch({ type: "OPEN_SHEET" })}
          className="flex h-11 items-center gap-2.5 rounded-lg border border-rule bg-paper pr-2.5 pl-2 shadow-[0_1px_2px_rgba(26,26,26,0.05)] active:scale-[0.97]"
          aria-label={`Wallet on ${WALLET_NETWORK_LABEL}: ${formatUsd(wallet.usdcBalance)} USDC. Open details.`}
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-wash" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-gate" />
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="font-mono text-[13px] font-bold tracking-[0.02em]">{formatUsd(wallet.usdcBalance)}</span>
            <span className="mt-1 font-mono text-[10px] tracking-[0.08em] text-muted">
              {wallet.demoLedger ? "DEMO USDC" : "USDC"} · {truncateAddress(wallet.address, 4, 4)}
            </span>
          </span>
          <span className="ml-0.5 text-muted" aria-hidden="true">
            ›
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void actions.connectWallet()}
          disabled={connecting}
          className="flex h-11 items-center gap-2 whitespace-nowrap rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-white active:scale-[0.97] disabled:opacity-70"
        >
          {connecting ? (
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" aria-hidden="true" />
          ) : (
            <span className="h-2 w-2 rounded-full border-[1.5px] border-white/80" aria-hidden="true" />
          )}
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      )}
    </header>
  );
}
