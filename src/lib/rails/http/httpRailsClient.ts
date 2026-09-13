import type { Hex } from "@/lib/domain/types";
import { railsEnv } from "../env";
import type {
  LpDepositRequest,
  LpWithdrawRequest,
  PoolSnapshot,
  QuoteRequest,
  QuoteResult,
  RailsClient,
  RpContextResult,
  TicketIssueRequest,
  TicketIssueResult,
  UsdcResult,
  WorkerTickRequest,
  WorkerTickResult,
  WorldVerifyRequest,
  WorldVerifyResult,
} from "../types";

export class RailsHttpError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = "RailsHttpError";
  }
}

/**
 * Talks to the rails deployment (MikailR/late-gate) over HTTP.
 * Enabled with NEXT_PUBLIC_RAILS_MODE=http and NEXT_PUBLIC_RAILS_BASE_URL.
 *
 * Every method maps 1:1 to a seam in docs/INTEGRATION_SEAMS.md. Bodies are
 * forwarded as-is; response shapes are trusted to match `../types`.
 * Refusals (4xx with a JSON body) are returned, not thrown, so screens can
 * render NOT ISSUED copy. Network / 5xx errors throw RailsHttpError.
 */
export class HttpRailsClient implements RailsClient {
  constructor(private readonly baseUrl: string = railsEnv.baseUrl) {
    if (!baseUrl) {
      throw new Error("HttpRailsClient needs NEXT_PUBLIC_RAILS_BASE_URL.");
    }
  }

  /** GET /api/quote?carrier=UA&flightNumber=837&serviceDate=2026-09-19&origin=SFO&product=arrival&minutesLate=60 */
  getQuote(request: QuoteRequest): Promise<QuoteResult> {
    const params = new URLSearchParams({
      carrier: request.carrier,
      flightNumber: request.flightNumber,
      serviceDate: request.serviceDate,
    });
    if (request.origin) params.set("origin", request.origin);
    if (request.product) params.set("product", request.product);
    if (request.minutesLate) params.set("minutesLate", String(request.minutesLate));
    // 200 quote / 409 refusal / 400 incomplete. All three carry a JSON body.
    return this.request<QuoteResult>(`/api/quote?${params}`, { method: "GET" }, [400, 409]);
  }

  /**
   * POST /api/world/rp-context  (no body; GET is accepted by the rails too)  [rails PR #8]
   * 200 { ok: true, rp_context: { rp_id, nonce, created_at, expires_at, signature } }
   * 503 missing key / rp_id, 500 sign failure. Both carry a JSON body and are returned, not thrown.
   * The rails lock the action to late-gate-ticket and use their own NEXT_PUBLIC_WORLD_RP_ID.
   * The result goes straight into IDKit.request as `rp_context`.
   */
  getRpContext(): Promise<RpContextResult> {
    return this.request<RpContextResult>("/api/world/rp-context", { method: "POST" }, [500, 503]);
  }

  /**
   * POST /api/world/verify  (body: { flightKey, idkitResponse })
   * The IDKit result goes through UNCHANGED, no field remap. Empty proof = UNVERIFIED.
   * 200 { ok, humanKey, worldSession, expiresAt, stub, preset } / 401 UNVERIFIED / 409 DUPLICATE.
   */
  verifyWorld(request: WorldVerifyRequest): Promise<WorldVerifyResult> {
    return this.request<WorldVerifyResult>("/api/world/verify", { method: "POST", body: JSON.stringify(request) }, [401, 409]);
  }

  /**
   * POST /api/tickets { flightKey, worldSession, product, minutesLate, travelerAddress, usdcTxHash? }
   * 201 policy OPEN / 409 NOT ISSUED.
   * TODO(rails): once `payPremium` moves from stub receipt to live ERC-20, the
   * wallet transfer must complete before this call and `usdcTxHash` becomes required.
   */
  issueTicket(request: TicketIssueRequest): Promise<TicketIssueResult> {
    return this.request<TicketIssueResult>("/api/tickets", { method: "POST", body: JSON.stringify(request) }, [400, 409]);
  }

  /**
   * POST /api/worker/tick
   * House-side. Requires `x-worker-key` on the rails when WORKER_KEY is set, so
   * the browser should only call this in demo mode.
   * TODO(rails): replace with a read-only policy status endpoint for the live tracker.
   */
  workerTick(request: WorkerTickRequest = {}): Promise<WorkerTickResult> {
    return this.request<WorkerTickResult>("/api/worker/tick", { method: "POST", body: JSON.stringify(request) });
  }

  /**
   * TODO(rails): no pool read endpoint exists yet. Proposed: GET /api/pool?address=0x…
   * returning { tvlCents, openStubs, depositCents, earnedCents }.
   */
  getPool(address?: Hex): Promise<PoolSnapshot> {
    const params = address ? `?address=${address}` : "";
    return this.request<PoolSnapshot>(`/api/pool${params}`, { method: "GET" });
  }

  /**
   * TODO(rails): `lpDeposit` is a library call in the rails repo (`@/lib/usdc`),
   * not an HTTP route. Proposed: POST /api/pool/deposit { from, amountCents, role, txHash }.
   * The USDC transfer itself is signed by the wallet adapter first.
   */
  lpDeposit(request: LpDepositRequest): Promise<UsdcResult> {
    return this.request<UsdcResult>("/api/pool/deposit", { method: "POST", body: JSON.stringify(request) }, [400, 409]);
  }

  /**
   * TODO(rails): `lpWithdraw` is house-gated in the rails. Proposed:
   * POST /api/pool/withdraw { to, amountCents, role }. Returns MISSING_VAULT until LP_VAULT_ADDRESS is set.
   */
  lpWithdraw(request: LpWithdrawRequest): Promise<UsdcResult> {
    return this.request<UsdcResult>("/api/pool/withdraw", { method: "POST", body: JSON.stringify(request) }, [400, 409]);
  }

  private async request<T>(path: string, init: RequestInit, acceptedErrorStatuses: number[] = []): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { "content-type": "application/json", accept: "application/json", ...(init.headers ?? {}) },
    });
    if (!response.ok && !acceptedErrorStatuses.includes(response.status)) {
      throw new RailsHttpError(response.status, path, `Rails ${init.method ?? "GET"} ${path} failed with ${response.status}.`);
    }
    return (await response.json()) as T;
  }
}
