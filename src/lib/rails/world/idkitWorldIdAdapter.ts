import { railsEnv } from "../env";
import type { IdKitProofPayload } from "../types";
import type { WorldIdAdapter } from "./types";

/**
 * Live Sandbox IDKit. Scaffold only; `requestProof` throws until wired.
 *
 * Wiring notes (rails PR #6, docs/INTEGRATION_SEAMS.md section 3):
 *   - `npm i @worldcoin/idkit`
 *   - Render `<IDKitWidget app_id={NEXT_PUBLIC_WORLD_APP_ID} action="late-gate-ticket"
 *       signal={flightKey} verification_level={VerificationLevel.Orb}
 *       environment="sandbox" onSuccess={resolve} onError={reject} />`
 *     from the Verify screen, or inside World App use
 *     `MiniKit.commandsAsync.verify({ action, signal, verification_level })`.
 *   - Preset stays `orbLegacy`. `selfieCheckLegacy` only works after Tools for
 *     Humanity enables the app flag (developers@toolsforhumanity.com).
 *   - Resolve with the IDKit result object unchanged. Do not reshape it.
 *   - Empty NEXT_PUBLIC_WORLD_APP_ID / RP_ID means Sandbox cannot issue; the
 *     Verify screen then offers the orbLegacy stub path (`stubNullifier`).
 */
export class IdKitWorldIdAdapter implements WorldIdAdapter {
  readonly environment = "sandbox" as const;

  requestProof(): Promise<IdKitProofPayload> {
    return Promise.reject(
      new Error(
        `IdKitWorldIdAdapter.requestProof is not wired yet (app ${railsEnv.worldAppId || "unset"}, rp ${railsEnv.worldRpId || "unset"}). ` +
          "See src/lib/rails/world/idkitWorldIdAdapter.ts for the integration notes.",
      ),
    );
  }
}
