/**
 * Rails client entry point. Screens and the app store import from here only.
 *
 * Default: mock adapters, zero secrets, everything in-browser.
 *
 * World App: when NEXT_PUBLIC_WORLD_APP_ID is set and MiniKit reports it is
 * installed (the app is open inside World App), the wallet and World ID
 * adapters switch to the live MiniKit / IDKit implementations at call time.
 * A normal mobile browser keeps the mock adapters so `/#demo` always works.
 *
 * Rails API: NEXT_PUBLIC_RAILS_MODE=http (+ NEXT_PUBLIC_RAILS_BASE_URL) talks
 * to the rails repo; it also forces the live wallet / IDKit adapters.
 */

import { isWorldAppLive } from "@/lib/world/minikit";
import { isMockMode } from "./env";
import { HttpRailsClient } from "./http/httpRailsClient";
import { MockRailsClient } from "./mock/mockRailsClient";
import { SwitchingWalletAdapter, SwitchingWorldIdAdapter } from "./switching";
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
  /** True right now when the live MiniKit / IDKit adapters would be used. */
  isLive: () => boolean;
};

let cached: Rails | null = null;

/** Singleton per browser session so mock counters (tickets, slips) stay coherent. */
export function getRails(): Rails {
  if (cached) return cached;
  const mock = isMockMode();
  const useLive = () => !mock || isWorldAppLive();
  const api: RailsClient = mock ? new MockRailsClient() : new HttpRailsClient();
  cached = {
    mode: mock ? "mock" : "http",
    api,
    wallet: new SwitchingWalletAdapter(new WorldchainWalletAdapter(), new MockWalletAdapter(), useLive),
    // rp_context always comes through the rails client so the signing key stays server-side.
    worldId: new SwitchingWorldIdAdapter(new IdKitWorldIdAdapter(() => api.getRpContext()), new MockWorldIdAdapter(), useLive),
    isLive: useLive,
  };
  return cached;
}

export { railsEnv, isMockMode, hasWorldAppId } from "./env";
export * from "./chain";
export * from "./world/errors";
export type * from "./types";
export type { WalletAdapter, WalletAccount, UsdcTransferRequest, UsdcTransferReceipt } from "./wallet/types";
export type { WorldIdAdapter, WorldProofRequest, WorldEnvironment } from "./world/types";
