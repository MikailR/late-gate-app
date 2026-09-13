import { roundUsd } from "@/lib/domain/pricing";
import type { PoolMoveKind, PoolState, WalletState } from "./types";

export type PoolMoveResult = {
  walletUsd: number;
  depositUsd: number;
  earnedUsd: number;
  tvlUsd: number;
};

/** Principal plus earned: what the traveler can withdraw. */
export function poolPositionUsd(pool: Pick<PoolState, "depositUsd" | "earnedUsd">): number {
  return pool.depositUsd + pool.earnedUsd;
}

/**
 * Moves USDC between the wallet and the house pool.
 * Withdrawals drain earned before principal. Taking everything (MAX) empties
 * the position exactly so no sub-cent dust is left behind.
 */
export function applyPoolMove(kind: PoolMoveKind, amountUsd: number, pool: PoolState, wallet: WalletState): PoolMoveResult {
  if (kind === "deposit") {
    return {
      walletUsd: roundUsd(wallet.usdcBalance - amountUsd),
      depositUsd: roundUsd(pool.depositUsd + amountUsd),
      earnedUsd: pool.earnedUsd,
      tvlUsd: roundUsd(pool.tvlUsd + amountUsd),
    };
  }
  const position = poolPositionUsd(pool);
  if (amountUsd >= position - 0.005) {
    return {
      walletUsd: roundUsd(wallet.usdcBalance + position),
      depositUsd: 0,
      earnedUsd: 0,
      tvlUsd: roundUsd(pool.tvlUsd - position),
    };
  }
  const fromEarned = Math.min(amountUsd, pool.earnedUsd);
  return {
    walletUsd: roundUsd(wallet.usdcBalance + amountUsd),
    depositUsd: roundUsd(pool.depositUsd - (amountUsd - fromEarned)),
    earnedUsd: pool.earnedUsd - fromEarned,
    tvlUsd: roundUsd(pool.tvlUsd - amountUsd),
  };
}

/** Upper bound for the amount field: wallet balance on deposit, pool position on withdraw. */
export function poolMoveCapUsd(kind: PoolMoveKind, pool: PoolState, wallet: WalletState): number {
  return kind === "withdraw" ? roundUsd(poolPositionUsd(pool)) : wallet.usdcBalance;
}

export type PoolAmountCheck = {
  amountUsd: number;
  ok: boolean;
  reason: string;
};

export function checkPoolAmount(kind: PoolMoveKind, input: string, pool: PoolState, wallet: WalletState): PoolAmountCheck {
  const amountUsd = Number(input || 0);
  const cap = poolMoveCapUsd(kind, pool, wallet);
  const overCap = amountUsd > cap + 1e-9;
  return {
    amountUsd,
    ok: amountUsd > 0 && !overCap,
    reason: overCap ? (kind === "withdraw" ? "More than you hold in the pool." : "More than your wallet holds.") : "",
  };
}
