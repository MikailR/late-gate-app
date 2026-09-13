"use client";

import { formatEarnedUsd, formatUsd } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { selectPoolPositionUsd, selectWalletConnected } from "@/state/selectors";

/**
 * House pool entry on the home screen. Ink-bordered so it reads apart from
 * the gate-blue stubs. Opens the pool, never the buy path.
 */
export function PoolEntryRow() {
  const { state, actions } = useApp();
  const position = selectPoolPositionUsd(state);
  const hasPosition = selectWalletConnected(state) && position > 0;

  return (
    <button
      type="button"
      onClick={() => actions.navigate("pool")}
      className="flex w-full items-center justify-between gap-3 rounded border border-line border-l-[5px] border-l-ink bg-paper px-4 py-3.5 text-left font-mono active:scale-[0.99]"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="whitespace-nowrap text-[10px] tracking-[0.14em] text-muted">HOUSE POOL · USDC · WORLD CHAIN</span>
        <span className="truncate text-[13px] font-bold">
          {hasPosition ? `${formatUsd(position)} in pool · ${formatEarnedUsd(state.pool.earnedUsd)} earned` : "Deposit. Earn as the house."}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 font-sans text-[13px] font-semibold text-gate">
        {hasPosition ? "Pool" : "Deposit"}
        <span className="-mt-px text-base leading-none" aria-hidden="true">
          ›
        </span>
      </span>
    </button>
  );
}
