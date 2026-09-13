/**
 * Rails client entry point. Screens and the app store import from here only.
 *
 * Default: mock adapters, zero secrets, everything in-browser.
 * Flip: NEXT_PUBLIC_RAILS_MODE=http (+ NEXT_PUBLIC_RAILS_BASE_URL) to talk to
 * the rails repo, and the live wallet / IDKit adapters take over.
 */

import { isMockMode } from "./env";
import { HttpRailsClient } from "./http/httpRailsClient";
import { MockRailsClient } from "./mock/mockRailsClient";
import type { RailsClient } from "./types";
import { MockWalletAdapter } from "./wallet/mockWalletAdapter";
import type { WalletAdapter } from "./wallet/types";
import { WorldchainWalletAdapter } from "./wallet/worldchainWalletAdapter";
import { IdKitWorldIdAdapter } from "./world/idkitWorldIdAdapter";
import { MockWorldIdAdapter } from "./world/mockWorldIdAdapter";
import type { WorldIdAdapter } from "./world/types";

export type Rails = {
  api: RailsClient;
  wallet: WalletAdapter;
  worldId: WorldIdAdapter;
  mode: "mock" | "http";
};

let cached: Rails | null = null;

/** Singleton per browser session so mock counters (tickets, slips) stay coherent. */
export function getRails(): Rails {
  if (cached) return cached;
  cached = isMockMode()
    ? { mode: "mock", api: new MockRailsClient(), wallet: new MockWalletAdapter(), worldId: new MockWorldIdAdapter() }
    : { mode: "http", api: new HttpRailsClient(), wallet: new WorldchainWalletAdapter(), worldId: new IdKitWorldIdAdapter() };
  return cached;
}

export { railsEnv, isMockMode } from "./env";
export * from "./chain";
export type * from "./types";
export type { WalletAdapter, WalletAccount, UsdcTransferRequest, UsdcTransferReceipt } from "./wallet/types";
export type { WorldIdAdapter, WorldProofRequest, WorldEnvironment } from "./world/types";
