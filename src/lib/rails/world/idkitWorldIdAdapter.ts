"use client";

import { isInsideWorldApp, worldAppId } from "@/lib/world/minikit";
import { railsEnv } from "../env";
import type { IdKitProofPayload, RpContext, RpContextResult } from "../types";
import { WorldProofError, WorldSandboxUnavailableError } from "./errors";
import type { WorldIdAdapter, WorldProofRequest } from "./types";

/** Give the traveler up to five minutes to confirm in World App. */
const PROOF_TIMEOUT_MS = 5 * 60_000;

/**
 * Live World ID via IDKit 4 against the rails contract.
 *
 * 1. `rp_context` comes from the rails (`POST /api/world/rp-context`, body `{}`);
 *    the RP private key never touches the frontend. 503 means fall back.
 * 2. `IDKit.request({ app_id, action, rp_context, allow_legacy_proofs: true,
 *    environment })` with the `orbLegacy` preset and the flightKey as signal.
 *    `environment` is the IDKit string, "sandbox" by default: it opens the
 *    World ID Sandbox app handoff, which is what issues prize-track proofs.
 *    "production" targets the production World ID app; "staging" is
 *    simulator-only and never used. The rails server flag WORLD_ENV=sandbox
 *    is a separate thing and is not sent here.
 * 3. Inside World App the request travels natively over MiniKit; in a mobile
 *    browser IDKit hands back a connector URI that we open for World App.
 * 4. The result is returned UNCHANGED for `POST /api/world/verify`.
 */
export class IdKitWorldIdAdapter implements WorldIdAdapter {
  /** Product label: this is the Sandbox tester path, production Selfie Check is gated. */
  readonly environment = "sandbox" as const;

  constructor(private readonly fetchRpContext: () => Promise<RpContextResult>) {}

  async requestProof(request: WorldProofRequest): Promise<IdKitProofPayload> {
    const appId = worldAppId();
    if (!appId) {
      throw new WorldSandboxUnavailableError("NO_APP_ID", "NEXT_PUBLIC_WORLD_APP_ID is not set.");
    }

    const rpContext = await this.loadRpContext();

    let idkit: typeof import("@worldcoin/idkit");
    try {
      // Dynamic import keeps the IDKit bundle (and its WASM bridge) out of the first paint.
      idkit = await import("@worldcoin/idkit");
    } catch (error) {
      throw new WorldSandboxUnavailableError("IDKIT_LOAD_FAILED", error instanceof Error ? error.message : "IDKit failed to load.");
    }

    const proofRequest = await idkit.IDKit.request({
      app_id: appId,
      action: request.action,
      action_description: "Confirm you are one human covering this flight.",
      rp_context: rpContext,
      allow_legacy_proofs: true,
      environment: railsEnv.idkitEnvironment,
    }).preset(idkit.orbLegacy({ signal: request.signal }));

    if (!isInsideWorldApp() && proofRequest.connectorURI) {
      request.onConnectorUri?.(proofRequest.connectorURI);
      // Universal link into World App. Same-tab navigation would unload this page mid-poll.
      window.open(proofRequest.connectorURI, "_blank", "noopener");
    }

    const completion = await proofRequest.pollUntilCompletion({ timeout: PROOF_TIMEOUT_MS });
    if (!completion.success) {
      throw new WorldProofError(String(completion.error), proofErrorCopy(String(completion.error)));
    }
    return completion.result as IdKitProofPayload;
  }

  private async loadRpContext(): Promise<RpContext> {
    let result: RpContextResult;
    try {
      result = await this.fetchRpContext();
    } catch (error) {
      throw new WorldSandboxUnavailableError("RP_CONTEXT_UNAVAILABLE", error instanceof Error ? error.message : "rp_context request failed.");
    }
    if (!result.ok) {
      throw new WorldSandboxUnavailableError("RP_CONTEXT_UNAVAILABLE", result.detail ?? result.reason);
    }
    return result.rp_context;
  }
}

function proofErrorCopy(code: string): string {
  switch (code) {
    case "user_rejected":
      return "Verification was cancelled in World App.";
    case "verification_rejected":
    case "credential_unavailable":
      return "World App could not issue a proof for this credential.";
    case "connection_failed":
    case "timeout":
      return "World App did not answer in time. Try again.";
    default:
      return `World ID returned ${code.replace(/_/g, " ")}.`;
  }
}
