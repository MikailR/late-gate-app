import { pseudoDigest, randomHex, sleep } from "../mock/fakeHex";
import type { IdKitProofPayload } from "../types";
import type { WorldIdAdapter, WorldProofRequest } from "./types";

const PROOF_MS = 800;

/**
 * Stand-in for Sandbox IDKit. Produces a payload with the same field names
 * IDKit returns so the verify request shape is exercised end to end.
 * The nullifier is derived from action + signal, so re-verifying the same
 * flight yields the same nullifier (the rails would flag DUPLICATE).
 */
export class MockWorldIdAdapter implements WorldIdAdapter {
  readonly environment = "sandbox" as const;

  async requestProof(request: WorldProofRequest): Promise<IdKitProofPayload> {
    await sleep(PROOF_MS);
    return {
      proof: randomHex(256),
      merkle_root: randomHex(),
      nullifier_hash: pseudoDigest(`${request.action}|${request.signal ?? ""}`),
      verification_level: "orb",
      environment: "sandbox",
    };
  }
}
