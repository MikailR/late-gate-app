import type { IdKitProofPayload } from "../types";

export type WorldEnvironment = "sandbox" | "production";

export type WorldProofRequest = {
  /** Uniqueness action. Rails default: `late-gate-ticket`. */
  action: string;
  /** Bind the proof to the flight so one human covers one flight. */
  signal?: string;
};

/**
 * Runs World IDKit in the browser and hands back the raw proof payload.
 * The payload is forwarded unchanged to POST /api/world/verify; the UI never
 * treats a proof as verified until the rails return a `worldSession`.
 */
export interface WorldIdAdapter {
  readonly environment: WorldEnvironment;
  requestProof(request: WorldProofRequest): Promise<IdKitProofPayload>;
}
