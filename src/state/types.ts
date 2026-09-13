import type { FlightSelection, Hex, MinutesLate, OwnedStub, StubProduct } from "@/lib/domain/types";
import type { WorldVerifySuccess } from "@/lib/rails";

export type Screen =
  | "stubs"
  | "airline"
  | "flight"
  | "catalog"
  | "configure"
  | "verify"
  | "pay"
  | "issued"
  | "live"
  | "paid"
  | "expired"
  | "pool"
  | "deposit"
  | "withdraw"
  | "poolSlip";

export type RouteEdit = "origin" | "dest" | null;

export type WalletStatus = "disconnected" | "connecting" | "connected";

export type WalletState = {
  status: WalletStatus;
  address: Hex | null;
  /** USDC held, in whole dollars with cents (128.4). */
  usdcBalance: number;
  /** True when the address came from MiniKit inside World App, false for the demo wallet. */
  live: boolean;
  /** Live wallet read $0 on chain, so the session runs on the demo USDC ledger. Labelled in the UI. */
  demoLedger: boolean;
  /** Last connect / command failure, shown once under the header. */
  error: string | null;
};

export type VerifyPath = "sandbox" | "orbLegacy";

export type VerifyState = {
  status: "idle" | "pending" | "verified" | "failed";
  path: VerifyPath;
  /** Present only after the rails returned a worldSession. */
  session: WorldVerifySuccess | null;
  error: string | null;
};

export type PaymentState = {
  status: "idle" | "pending" | "failed";
  error: string | null;
};

export type LiveState = {
  /** Estimated minutes late as the tracker runs. */
  estMinutesLate: number;
};

export type PoolMoveKind = "deposit" | "withdraw";

export type PoolSlip = {
  kind: PoolMoveKind;
  amountUsd: number;
  serial: number;
  txHash: Hex | null;
};

export type PoolState = {
  tvlUsd: number;
  openStubs: number;
  /** Caller's principal. */
  depositUsd: number;
  /** Caller's earned share of premiums. Kept unrounded until displayed. */
  earnedUsd: number;
  amountInput: string;
  busy: boolean;
  error: string | null;
  slip: PoolSlip | null;
  slipSerial: number;
};

export type AppState = {
  screen: Screen;
  flight: FlightSelection;
  routeEdit: RouteEdit;
  airportQuery: string;
  product: StubProduct;
  minutesLate: MinutesLate;
  /** Stubs left on the selected flight. */
  remaining: number;
  verify: VerifyState;
  payment: PaymentState;
  /** The stub being issued or followed right now. */
  currentStub: OwnedStub | null;
  owned: OwnedStub[];
  live: LiveState;
  wallet: WalletState;
  sheetOpen: boolean;
  pool: PoolState;
};
