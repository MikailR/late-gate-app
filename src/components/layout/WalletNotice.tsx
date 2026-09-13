"use client";

import { useApp } from "@/state/AppProvider";

/** One-line notice under the header for a failed wallet command. Clears on the next wallet action. */
export function WalletNotice() {
  const { state, actions } = useApp();
  const message = state.wallet.error;
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start justify-between gap-3 border-b border-line bg-paper px-4 py-2.5 font-mono text-[11px] leading-[1.45] text-stamp">
      <span>{message}</span>
      <button type="button" onClick={() => actions.dispatch({ type: "WALLET_DISCONNECTED" })} aria-label="Dismiss" className="-my-1 min-h-8 px-1 text-muted">
        ✕
      </button>
    </div>
  );
}
