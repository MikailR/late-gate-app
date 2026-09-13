import { railsEnv } from "@/lib/rails/env";

/**
 * Honest small-print for money that did not move on chain.
 * Shown wherever a balance, transfer or tx id comes from the demo ledger.
 */
export const DEMO_USDC_LABEL = "DEMO USDC · LIVE PAY OFF";

/** True when this build cannot move real USDC (the deadline default). */
export function isDemoMoney(): boolean {
  return !railsEnv.worldPayEnabled;
}

/** `0x7a3e…c2f1`-style short form for tx ids on receipts. */
export function shortTx(hash: string | undefined): string {
  if (!hash) return "···";
  return hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;
}
