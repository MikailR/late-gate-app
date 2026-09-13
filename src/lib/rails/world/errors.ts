export type WorldSandboxUnavailableReason =
  | "NO_APP_ID"
  | "RP_CONTEXT_UNAVAILABLE"
  | "NOT_IN_WORLD_APP"
  | "IDKIT_LOAD_FAILED";

/**
 * Sandbox IDKit could not even start (no app id, no server-signed rp_context,
 * SDK failed to load). The caller may fall back to the orbLegacy stub path.
 */
export class WorldSandboxUnavailableError extends Error {
  constructor(
    readonly reason: WorldSandboxUnavailableReason,
    message: string,
  ) {
    super(message);
    this.name = "WorldSandboxUnavailableError";
  }
}

/** IDKit ran but the user or World App did not produce a proof. */
export class WorldProofError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "WorldProofError";
  }
}

export type WalletAdapterErrorCode = "WORLD_APP_REQUIRED" | "USER_REJECTED" | "PAY_DISABLED" | "VAULT_UNSET" | "RPC_FAILED" | "COMMAND_FAILED";

/** Live wallet path refused or failed. `message` is safe to show to the traveler. */
export class WalletAdapterError extends Error {
  constructor(
    readonly code: WalletAdapterErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WalletAdapterError";
  }
}
