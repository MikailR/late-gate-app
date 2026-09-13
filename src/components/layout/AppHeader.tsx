"use client";

import { useLongPress } from "@/hooks/useLongPress";
import { APP_NAME, DEMO_LONG_PRESS_MS, WALLET_NETWORK_LABEL } from "@/lib/config/constants";
import { formatUsdc, truncateAddress } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";

/**
 * Sticky web header: wordmark left, wallet right. Lives outside the
 * scrolling screens so it never moves. Long-pressing the wordmark is the
 * hidden demo entry.
 */
export function AppHeader() {
  const { state, actions } = useApp();
  const { wallet } = state;
  const longPress = useLongPress(actions.startDemo, DEMO_LONG_PRESS_MS);

  return (
    <header className="sticky top-0 z-20 flex h-[var(--header-h)] items-center justify-between border-b border-line bg-phone px-5 pt-[env(safe-area-inset-top)]">
      <button
        type="button"
        {...longPress}
        className="-mx-2 flex h-11 select-none items-center px-2 font-mono text-xs tracking-[0.2em] text-ink"
        aria-label={`${APP_NAME}. Hold to open the demo flight.`}
      >
        {APP_NAME}
      </button>

      {wallet.status === "connected" && wallet.address ? (
        <button
          type="button"
          onClick={() => actions.dispatch({ type: "OPEN_SHEET" })}
          className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-1.5 font-mono leading-[1.15] active:scale-[0.97]"
          aria-label="Wallet details"
        >
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-gate" aria-hidden="true" />
          <span className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-bold">{truncateAddress(wallet.address)}</span>
            <span className="text-[11px] text-muted">
              {formatUsdc(wallet.usdcBalance)} · {WALLET_NETWORK_LABEL}
            </span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void actions.connectWallet()}
          disabled={wallet.status === "connecting"}
          className="min-h-11 whitespace-nowrap rounded-md border border-ink bg-paper px-3 text-xs font-medium leading-none text-ink active:scale-[0.97] disabled:opacity-70"
        >
          {wallet.status === "connecting" ? "Connecting…" : "Connect wallet"}
        </button>
      )}
    </header>
  );
}
