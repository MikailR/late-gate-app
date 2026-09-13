/**
 * Public runtime config for the rails client.
 * Everything here is NEXT_PUBLIC_* because the adapters run in the browser.
 * The app runs with zero env set: mock adapters are the default.
 */

export type RailsMode = "mock" | "http";

function readMode(): RailsMode {
  return process.env.NEXT_PUBLIC_RAILS_MODE === "http" ? "http" : "mock";
}

function readChainId(): number {
  const raw = process.env.NEXT_PUBLIC_WORLDCHAIN_CHAIN_ID;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 4801;
}

export const railsEnv = {
  /** `mock` (default) keeps every call in-browser. `http` talks to the rails repo. */
  mode: readMode(),
  /** Base URL of the rails deployment (MikailR/late-gate), no trailing slash. */
  baseUrl: (process.env.NEXT_PUBLIC_RAILS_BASE_URL ?? "").replace(/\/$/, ""),
  /** 4801 = World Chain Sepolia (demo lock). 480 = mainnet, documented only. */
  chainId: readChainId(),
  /** World IDKit app + RP ids. Empty means the Sandbox stub nullifier path. */
  worldAppId: process.env.NEXT_PUBLIC_WORLD_APP_ID ?? "",
  worldRpId: process.env.NEXT_PUBLIC_WORLD_RP_ID ?? "",
  worldAction: process.env.NEXT_PUBLIC_WORLD_ACTION ?? "late-gate-ticket",
  /** Overrides for token / vault addresses. Defaults come from chain.ts. */
  usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "",
  lpVaultAddress: process.env.NEXT_PUBLIC_LP_VAULT_ADDRESS ?? "",
} as const;

export function isMockMode(): boolean {
  return railsEnv.mode === "mock";
}
