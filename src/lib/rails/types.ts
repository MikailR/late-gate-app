/**
 * Typed contracts for the rails seams (MikailR/late-gate, PRs #4 / #5 / #6).
 * Shapes follow `docs/INTEGRATION_SEAMS.md` and the route handlers under
 * `app/api/*` in that repo. Where the rails type is wider than what the UI
 * needs, only the fields the UI reads are typed here.
 */

import type { Configure, Hex, MinutesLate, StubProduct } from "@/lib/domain/types";

// ---------------------------------------------------------------------------
// GET /api/quote
// ---------------------------------------------------------------------------

export type RefusalCode =
  | "HOT"
  | "CUTOFF"
  | "NOT_FOUND"
  | "FULL"
  | "DUPLICATE"
  | "UNVERIFIED"
  | "UNDERWRITE_REJECT"
  | "EXPOSURE_CAP";

export type QuoteRequest = {
  carrier: string;
  flightNumber: string;
  /** YYYY-MM-DD */
  serviceDate: string;
  origin?: string;
  product?: StubProduct;
  minutesLate?: MinutesLate;
};

export type FlightSnapshot = {
  carrier: string;
  flightNumber: string;
  serviceDate: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  /** ISO timestamps. */
  scheduledDeparture: string;
  scheduledArrival: string;
  estimatedArrival: string;
  estimatedDelayMinutes: number;
  estimatedTakeoffDelayMinutes?: number;
  timeZone: string;
};

export type QuoteSuccess = {
  ok: true;
  flightKey: string;
  product: StubProduct;
  configure: Configure;
  /** Fixed premium in USD cents ($9 = 900). */
  premiumCents: number;
  /** Payout in USD cents ($200 = 20000). */
  payoutCents: number;
  currency: "USD";
  flight: FlightSnapshot;
  /** Stubs still open on this flight / product. Optional until the rails expose openCount. */
  remaining?: number;
};

export type QuoteRefusal = {
  ok: false;
  refusal: RefusalCode;
  title: string;
  reason: string;
  detail: string;
  flightKey?: string;
  flight?: FlightSnapshot;
};

export type QuoteResult = QuoteSuccess | QuoteRefusal;

// ---------------------------------------------------------------------------
// POST /api/world/verify
// ---------------------------------------------------------------------------

export type WorldPreset = "orbLegacy" | "selfieCheckLegacy";

/** One credential response inside an IDKit 4 result (v3 legacy or v4 shape). */
export type IdKitResponseItem = {
  identifier: string;
  signal_hash?: string;
  /** v3: ABI-encoded proof hex. v4: array of compressed proof elements. */
  proof: string | string[];
  merkle_root?: string;
  nullifier: string;
  issuer_schema_id?: number;
  expires_at_min?: number;
};

/**
 * IDKit result forwarded unchanged to the server. Covers the IDKit 4
 * `IDKitResult` (protocol 3.0 legacy or 4.0) and the flat IDKit 1.x shape
 * the rails verify route already accepts. The UI never displays these values.
 */
export type IdKitProofPayload = {
  protocol_version?: "3.0" | "4.0";
  nonce?: string;
  action?: string;
  responses?: IdKitResponseItem[];
  /** Flat legacy fields (IDKit 1.x style). */
  proof?: string;
  merkle_root?: string;
  nullifier_hash?: string;
  verification_level?: string;
  /** Sandbox proofs are issued by the World Sandbox environment. */
  environment?: string;
};

/** Nullifier from either payload shape, or null when the payload carries none. */
export function nullifierOf(payload: IdKitProofPayload | undefined): string | null {
  if (!payload) return null;
  return payload.nullifier_hash ?? payload.responses?.[0]?.nullifier ?? null;
}

export type WorldVerifyRequest = {
  flightKey: string;
  /** IDKit result, forwarded UNCHANGED (no field remap). Preferred path. */
  idkitResponse?: IdKitProofPayload;
  /** Local / fallback only. The server returns `stub: true` for this path. */
  stubNullifier?: string;
};

// ---------------------------------------------------------------------------
// POST /api/world/rp-context (rails, shipping next)
// ---------------------------------------------------------------------------

/** Server-signed IDKit 4 RP context. The signing key never leaves the rails. */
export type RpContext = {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
};

export type RpContextResult =
  | { ok: true; rp_context: RpContext }
  /** 503 when WORLD_RP_SIGNING_KEY is unset on the rails. */
  | { ok: false; reason: string; detail?: string };

export type WorldVerifySuccess = {
  ok: true;
  flightKey: string;
  humanKey: Hex;
  /** 5-minute HMAC session. Send to POST /api/tickets. */
  worldSession: string;
  expiresAt: string;
  stub: boolean;
  preset: WorldPreset;
};

export type WorldVerifyFailure = {
  ok: false;
  refusal: "UNVERIFIED" | "DUPLICATE";
  title: string;
  reason: string;
  detail: string;
  flightKey: string;
  existingPolicyId?: string;
};

export type WorldVerifyResult = WorldVerifySuccess | WorldVerifyFailure;

// ---------------------------------------------------------------------------
// POST /api/tickets
// ---------------------------------------------------------------------------

export type TicketIssueRequest = {
  flightKey: string;
  worldSession: string;
  product: StubProduct;
  minutesLate: MinutesLate;
  /** Mini App / browser wallet that paid the premium. */
  travelerAddress?: Hex;
  /** Set when the wallet already broadcast the USDC transfer. */
  usdcTxHash?: Hex;
};

export type PolicyStatus = "OPEN" | "PAID" | "EXPIRED" | "VOID";

export type Policy = {
  policyId: string;
  flightKey: string;
  configure: Configure;
  premiumCents: number;
  payoutCents: number;
  status: PolicyStatus;
  travelerAddress?: Hex;
  issuedAt: string;
};

export type TicketIssueSuccess = {
  ok: true;
  policy: Policy;
  ticketNumber: string;
  usdc: UsdcReceipt;
};

export type TicketIssueFailure = {
  ok: false;
  status: "NOT_ISSUED";
  refusal: RefusalCode;
  reason: string;
};

export type TicketIssueResult = TicketIssueSuccess | TicketIssueFailure;

// ---------------------------------------------------------------------------
// POST /api/worker/tick
// ---------------------------------------------------------------------------

export type WorkerTickRequest = {
  /** Honoured by the rails only when DEMO_MODE=1. */
  now?: string;
};

export type SettledPolicy = {
  policyId: string;
  ticketNumber: string;
  status: PolicyStatus;
  outcome: "PAID" | "EXPIRED" | "VOID";
  /** Observed lateness in minutes, when the worker exposes it. */
  observedDelayMinutes?: number;
  /** USDC payout transfer hash, when the worker paid out. */
  payoutTxHash?: Hex;
};

export type WorkerTickResult = {
  ok: true;
  scanned: number;
  settled: SettledPolicy[];
  skipped: number;
};

// ---------------------------------------------------------------------------
// USDC till: payPremium / payout / lpDeposit / lpWithdraw
// ---------------------------------------------------------------------------

export type UsdcOp = "payPremium" | "payout" | "lpDeposit" | "lpWithdraw";

export type LpRole = "house" | "lp";

export type UsdcReceipt = {
  ok: true;
  op: UsdcOp;
  asset: "USDC";
  chainId: number;
  token: Hex;
  from: Hex;
  to: Hex;
  amountCents: number;
  amountUnits: string;
  txHash: Hex;
  explorerUrl: string;
  /** True while the rails still return stub receipts instead of live transfers. */
  stub: boolean;
  recordedAt: string;
};

export type UsdcFailure = {
  ok: false;
  op: UsdcOp;
  error: "INVALID_AMOUNT" | "INVALID_ADDRESS" | "MISSING_VAULT" | "NOT_IMPLEMENTED" | "NETWORK";
  reason: string;
};

export type UsdcResult = UsdcReceipt | UsdcFailure;

export type LpDepositRequest = {
  from: Hex;
  amountCents: number;
  role: LpRole;
  txHash?: Hex;
};

export type LpWithdrawRequest = {
  to: Hex;
  amountCents: number;
  role: LpRole;
};

/** Pool overview the House Pool screen reads. */
export type PoolSnapshot = {
  tvlCents: number;
  openStubs: number;
  /** Caller's principal, when a wallet address is supplied. */
  depositCents: number;
  /** Caller's earned share of premiums. */
  earnedCents: number;
};

// ---------------------------------------------------------------------------
// Client surface
// ---------------------------------------------------------------------------

export interface RailsClient {
  getQuote(request: QuoteRequest): Promise<QuoteResult>;
  /** POST /api/world/rp-context with an empty body. Action is locked server-side to late-gate-ticket. */
  getRpContext(): Promise<RpContextResult>;
  verifyWorld(request: WorldVerifyRequest): Promise<WorldVerifyResult>;
  issueTicket(request: TicketIssueRequest): Promise<TicketIssueResult>;
  workerTick(request?: WorkerTickRequest): Promise<WorkerTickResult>;
  getPool(address?: Hex): Promise<PoolSnapshot>;
  lpDeposit(request: LpDepositRequest): Promise<UsdcResult>;
  lpWithdraw(request: LpWithdrawRequest): Promise<UsdcResult>;
}
