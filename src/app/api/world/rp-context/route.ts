import { signRequest } from "@worldcoin/idkit/signing";

export const dynamic = "force-dynamic";

/** Action is locked server-side; whatever the client sends is ignored. */
const LOCKED_ACTION = "late-gate-ticket";

/**
 * Local mirror of the rails contract for `POST /api/world/rp-context`.
 *
 * Body: {}  (ignored)
 * 200: { ok: true, rp_context: { rp_id, nonce, created_at, expires_at, signature } }
 * 503: { ok: false, reason, detail }
 *
 * The RP private key is server-only (`WORLD_RP_SIGNING_KEY`, never NEXT_PUBLIC_).
 * Order: sign here if the key is present; else proxy to the rails
 * (`RAILS_BASE_URL/api/world/rp-context`); else 503 so the client falls back
 * to the orbLegacy stub path. Nothing is invented.
 */
export async function POST() {
  const rpId = process.env.NEXT_PUBLIC_WORLD_RP_ID ?? "";
  if (!rpId.startsWith("rp_")) {
    return Response.json({ ok: false, reason: "RP_ID_UNSET", detail: "NEXT_PUBLIC_WORLD_RP_ID is not set." }, { status: 503 });
  }

  const signingKey = process.env.WORLD_RP_SIGNING_KEY ?? "";
  if (signingKey) {
    const signed = signRequest({ signingKeyHex: signingKey, action: LOCKED_ACTION, ttl: 300 });
    return Response.json({
      ok: true,
      rp_context: { rp_id: rpId, nonce: signed.nonce, created_at: signed.createdAt, expires_at: signed.expiresAt, signature: signed.sig },
    });
  }

  const railsBase = (process.env.RAILS_BASE_URL ?? process.env.NEXT_PUBLIC_RAILS_BASE_URL ?? "").replace(/\/$/, "");
  if (railsBase) {
    try {
      const upstream = await fetch(`${railsBase}/api/world/rp-context`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const payload = await upstream.json();
      return Response.json(payload, { status: upstream.status });
    } catch (error) {
      return Response.json(
        { ok: false, reason: "RAILS_UNAVAILABLE", detail: error instanceof Error ? error.message : "Rails signing endpoint unreachable." },
        { status: 503 },
      );
    }
  }

  return Response.json(
    {
      ok: false,
      reason: "RP_SIGNING_KEY_UNSET",
      detail: "No server-side WORLD_RP_SIGNING_KEY and no RAILS_BASE_URL. Sandbox IDKit cannot issue; use the orbLegacy stub path.",
    },
    { status: 503 },
  );
}
