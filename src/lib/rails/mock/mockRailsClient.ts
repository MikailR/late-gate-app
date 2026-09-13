import {
  DEMO_INITIAL_INVENTORY,
  DEMO_LATE_MINUTES,
  DEMO_POOL_OPEN_STUBS,
  DEMO_POOL_TVL_USDC,
  DEMO_TICKET_NUMBER_START,
} from "@/lib/config/constants";
import { isAirlineCode } from "@/lib/data/airlines";
import { cityOf } from "@/lib/data/airports";
import { lookupStatusFor } from "@/lib/data/flightFixtures";
import { payoutUsdForMinutesLate, premiumUsdForProduct, usdToCents } from "@/lib/domain/pricing";
import type { FlightKind, Hex } from "@/lib/domain/types";
import { activeNetwork, centsToUsdcUnits, explorerTxUrl } from "../chain";
import type {
  FlightSnapshot,
  LpDepositRequest,
  LpWithdrawRequest,
  Policy,
  PoolSnapshot,
  QuoteRequest,
  QuoteResult,
  RailsClient,
  RefusalCode,
  TicketIssueRequest,
  TicketIssueResult,
  UsdcReceipt,
  UsdcResult,
  WorkerTickResult,
  WorldVerifyRequest,
  WorldVerifyResult,
} from "../types";
import { pseudoDigest, randomHex, sleep } from "./fakeHex";

/** Rails refusal code per demo fixture kind. `gone` has no rails code; CUTOFF is the closest. */
const REFUSAL_BY_KIND: Readonly<Record<Exclude<FlightKind, "clean">, RefusalCode>> = {
  hot: "HOT",
  gone: "CUTOFF",
  sold: "FULL",
  cutoff: "CUTOFF",
  uw: "UNDERWRITE_REJECT",
};

const MOCK_LATENCY_MS = 220;
const WORLD_SESSION_TTL_MS = 5 * 60_000;

/** Demo vault placeholder. The real `LP_VAULT_ADDRESS` is set on the rails side. */
const MOCK_VAULT_ADDRESS: Hex = "0x000000000000000000000000000000004c50564c";

function isoAtLocalClock(serviceDate: string, clock: string): string {
  return `${serviceDate}T${clock}:00`;
}

function snapshotFor(request: QuoteRequest, dep: string, arr: string, delayMinutes: number): FlightSnapshot {
  const origin = request.origin ?? "SFO";
  return {
    carrier: request.carrier,
    flightNumber: request.flightNumber,
    serviceDate: request.serviceDate,
    origin,
    destination: "",
    originCity: cityOf(origin),
    destinationCity: "",
    scheduledDeparture: isoAtLocalClock(request.serviceDate, dep),
    scheduledArrival: isoAtLocalClock(request.serviceDate, arr),
    estimatedArrival: isoAtLocalClock(request.serviceDate, arr),
    estimatedDelayMinutes: delayMinutes,
    timeZone: "local",
  };
}

/**
 * In-browser stand-in for the rails API. Keeps just enough state (ticket
 * counter, open policies) to make the buy path and worker tick coherent.
 * Money movement is owned by the UI store during the demo.
 */
export class MockRailsClient implements RailsClient {
  private nextTicketNumber = DEMO_TICKET_NUMBER_START;
  private openPolicies: Policy[] = [];
  private remainingByFlightKey = new Map<string, number>();

  async getQuote(request: QuoteRequest): Promise<QuoteResult> {
    await sleep(MOCK_LATENCY_MS);
    const flightKey = `${request.carrier}${request.flightNumber}|${request.serviceDate}|${request.origin ?? ""}`;
    if (!isAirlineCode(request.carrier) || !request.flightNumber) {
      return {
        ok: false,
        refusal: "NOT_FOUND",
        title: "NOT FOUND",
        reason: "Need a two-letter carrier and a flight number.",
        detail: "",
      };
    }

    const lookup = lookupStatusFor(request.carrier, request.flightNumber);
    if (lookup.kind !== "clean") {
      const delay = lookup.kind === "hot" ? 52 : 0;
      return {
        ok: false,
        refusal: REFUSAL_BY_KIND[lookup.kind],
        title: lookup.status,
        reason: lookup.reason,
        detail: "",
        flightKey,
        flight: snapshotFor(request, lookup.dep, lookup.arr, delay),
      };
    }

    const product = request.product ?? "arrival";
    const minutesLate = request.minutesLate ?? 60;
    return {
      ok: true,
      flightKey,
      product,
      configure: { product, minutesLate },
      premiumCents: usdToCents(premiumUsdForProduct(product)),
      payoutCents: usdToCents(payoutUsdForMinutesLate(minutesLate)),
      currency: "USD",
      flight: snapshotFor(request, lookup.dep, lookup.arr, 0),
      remaining: this.remainingByFlightKey.get(flightKey) ?? DEMO_INITIAL_INVENTORY,
    };
  }

  async verifyWorld(request: WorldVerifyRequest): Promise<WorldVerifyResult> {
    await sleep(MOCK_LATENCY_MS * 2);
    const nullifier = request.idkitResponse?.nullifier_hash ?? request.stubNullifier;
    if (!nullifier) {
      return {
        ok: false,
        refusal: "UNVERIFIED",
        title: "NOT VERIFIED",
        reason: "No proof payload was supplied.",
        detail: "Run Sandbox IDKit and forward its result unchanged.",
        flightKey: request.flightKey,
      };
    }
    const issuedAt = Date.now();
    const humanKey = pseudoDigest(`${nullifier}|${request.flightKey}`);
    const sessionClaims = { flightKey: request.flightKey, humanKey, issuedAt, expiresAt: issuedAt + WORLD_SESSION_TTL_MS };
    return {
      ok: true,
      flightKey: request.flightKey,
      humanKey,
      worldSession: `mock.${btoa(JSON.stringify(sessionClaims))}`,
      expiresAt: new Date(sessionClaims.expiresAt).toISOString(),
      stub: !request.idkitResponse,
      preset: "orbLegacy",
    };
  }

  async issueTicket(request: TicketIssueRequest): Promise<TicketIssueResult> {
    await sleep(MOCK_LATENCY_MS * 2);
    if (!request.worldSession) {
      return { ok: false, status: "NOT_ISSUED", refusal: "UNVERIFIED", reason: "Need flightKey and worldSession." };
    }
    const premiumCents = usdToCents(premiumUsdForProduct(request.product));
    const payoutCents = usdToCents(payoutUsdForMinutesLate(request.minutesLate));
    const ticketNumber = String(this.nextTicketNumber++);
    const policy: Policy = {
      policyId: ticketNumber,
      flightKey: request.flightKey,
      configure: { product: request.product, minutesLate: request.minutesLate },
      premiumCents,
      payoutCents,
      status: "OPEN",
      travelerAddress: request.travelerAddress,
      issuedAt: new Date().toISOString(),
    };
    this.openPolicies.push(policy);
    const remaining = this.remainingByFlightKey.get(request.flightKey) ?? DEMO_INITIAL_INVENTORY;
    this.remainingByFlightKey.set(request.flightKey, Math.max(0, remaining - 1));
    return {
      ok: true,
      policy,
      ticketNumber,
      usdc: this.receipt("payPremium", request.travelerAddress ?? randomHex(20), MOCK_VAULT_ADDRESS, premiumCents, request.usdcTxHash),
    };
  }

  /** Demo worker: every open policy settles PAID at the demo lateness. */
  async workerTick(): Promise<WorkerTickResult> {
    await sleep(MOCK_LATENCY_MS);
    const settled = this.openPolicies.map((policy) => ({
      policyId: policy.policyId,
      ticketNumber: policy.policyId,
      status: "PAID" as const,
      outcome: "PAID" as const,
      observedDelayMinutes: DEMO_LATE_MINUTES,
    }));
    const scanned = this.openPolicies.length;
    this.openPolicies = [];
    return { ok: true, scanned, settled, skipped: 0 };
  }

  async getPool(): Promise<PoolSnapshot> {
    await sleep(MOCK_LATENCY_MS);
    return {
      tvlCents: usdToCents(DEMO_POOL_TVL_USDC),
      openStubs: DEMO_POOL_OPEN_STUBS,
      depositCents: 0,
      earnedCents: 0,
    };
  }

  async lpDeposit(request: LpDepositRequest): Promise<UsdcResult> {
    await sleep(MOCK_LATENCY_MS * 3);
    if (request.amountCents <= 0) return { ok: false, op: "lpDeposit", error: "INVALID_AMOUNT", reason: "Amount must be positive." };
    return this.receipt("lpDeposit", request.from, MOCK_VAULT_ADDRESS, request.amountCents, request.txHash);
  }

  async lpWithdraw(request: LpWithdrawRequest): Promise<UsdcResult> {
    await sleep(MOCK_LATENCY_MS * 3);
    if (request.amountCents <= 0) return { ok: false, op: "lpWithdraw", error: "INVALID_AMOUNT", reason: "Amount must be positive." };
    return this.receipt("lpWithdraw", MOCK_VAULT_ADDRESS, request.to, request.amountCents);
  }

  private receipt(op: UsdcReceipt["op"], from: Hex, to: Hex, amountCents: number, txHash: Hex = randomHex()): UsdcReceipt {
    const network = activeNetwork();
    return {
      ok: true,
      op,
      asset: "USDC",
      chainId: network.chainId,
      token: network.usdc,
      from,
      to,
      amountCents,
      amountUnits: centsToUsdcUnits(amountCents),
      txHash,
      explorerUrl: explorerTxUrl(txHash, network),
      stub: true,
      recordedAt: new Date().toISOString(),
    };
  }
}
