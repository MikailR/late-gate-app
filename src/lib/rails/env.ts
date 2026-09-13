/**
 * Public runtime config for the rails client.
 * Everything here is NEXT_PUBLIC_* because the adapters run in the browser.
 * The app runs with zero env set: mock adapters are the default.
 *
 * Never put the World RP private signing key here. It is rails / server only.
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

function readFlag(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

type IdkitEnvironment = "production" | "staging" | "sandbox";

/**
 * "sandbox" opens the World ID Sandbox app handoff (prize-track proofs).
 * "production" is the production World ID app. "staging" is simulator-only
 * and is never selected here.
 */
function readIdkitEnvironment(): IdkitEnvironment {
  return process.env.NEXT_PUBLIC_IDKIT_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export const railsEnv = {
  /** `mock` (default) keeps every call in-browser. `http` talks to the rails repo. */
  mode: readMode(),
  /** Base URL of the rails deployment (MikailR/late-gate), no trailing slash. */
  baseUrl: (process.env.NEXT_PUBLIC_RAILS_BASE_URL ?? "").replace(/\/$/, ""),
  /** 4801 = World Chain Sepolia (demo lock). 480 = mainnet, documented only. */
  chainId: readChainId(),
  /**
   * World ID app id (new Sandbox portal account, World ID enabled). Used by
   * IDKit.request. Empty disables every live World path.
   */
  worldAppId: process.env.NEXT_PUBLIC_WORLD_APP_ID ?? "",
  worldRpId: process.env.NEXT_PUBLIC_WORLD_RP_ID ?? "",
  /**
   * Mini App id MiniKit installs with (legacy LateKid portal entry). Falls back
   * to the World ID app id when the two are the same portal app.
   */
  minikitAppId: process.env.NEXT_PUBLIC_MINIKIT_APP_ID || process.env.NEXT_PUBLIC_WORLD_APP_ID || "",
  worldAction: process.env.NEXT_PUBLIC_WORLD_ACTION ?? "late-gate-ticket",
  /**
   * IDKit `environment` string passed to IDKit.request. Default "sandbox"
   * (World ID Sandbox app proofs, required for the prize track). This is NOT
   * the rails server flag WORLD_ENV=sandbox.
   */
  idkitEnvironment: readIdkitEnvironment(),
  /**
   * `stub` (default until the Sandbox app enrolment lands): skip IDKit and
   * verify through the orbLegacy stub path (`stubNullifier`) on
   * POST /api/world/verify. `sandbox`: run the real IDKit Sandbox flow first,
   * falling back to the stub path only when no signed rp_context exists.
   */
  worldVerifyMode: (process.env.NEXT_PUBLIC_WORLD_VERIFY_MODE === "sandbox" ? "sandbox" : "stub") as "stub" | "sandbox",
  /** Rails demo contract: POST /api/world/verify { flightKey, stubNullifier } → 200 { ok, stub: true, preset: orbLegacy, worldSession, humanKey }. */
  worldStubNullifier: process.env.NEXT_PUBLIC_WORLD_STUB_NULLIFIER || "demo-human-a",
  /**
   * Mock mode only: where the browser asks for a server-signed `rp_context`.
   * Defaults to this app's own thin route (503 without a server key).
   * In http mode the rails client uses `${baseUrl}/api/world/rp-context`.
   */
  worldRpContextUrl: process.env.NEXT_PUBLIC_WORLD_RP_CONTEXT_URL ?? "/api/world/rp-context",
  /** Overrides for token / vault addresses. Defaults come from chain.ts. */
  usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "",
  /** Recipient for premiums and LP deposits. Live pay refuses to run while this is empty. */
  lpVaultAddress: process.env.NEXT_PUBLIC_LP_VAULT_ADDRESS ?? "",
  /**
   * Opt-in for real USDC movement through MiniKit `pay`. World App pays on
   * World Chain mainnet (480) with real funds, so this stays off by default.
   */
  worldPayEnabled: readFlag(process.env.NEXT_PUBLIC_WORLD_PAY_ENABLED),
} as const;

export function isMockMode(): boolean {
  return railsEnv.mode === "mock";
}

/** True when the portal app id is present, i.e. live World paths are allowed to try. */
export function hasWorldAppId(): boolean {
  return railsEnv.worldAppId.startsWith("app_");
}
