import type { AirlineCode, DateMode, Hex, MinutesLate, OwnedStub, StubProduct } from "@/lib/domain/types";
import type { WorldVerifySuccess } from "@/lib/rails";
import type { PoolMoveKind, RouteEdit, Screen, VerifyPath } from "./types";

export type AppAction =
  | { type: "NAVIGATE"; screen: Screen }
  | { type: "RESTART"; demo: boolean }
  | { type: "START_DEMO" }
  | { type: "PREVIEW_EXPIRED" }
  // Flight form
  | { type: "PICK_AIRLINE"; airline: AirlineCode }
  | { type: "SET_FLIGHT_NUMBER"; flightNumber: string; airline?: AirlineCode }
  | { type: "SET_ROUTE_EDIT"; edit: RouteEdit }
  | { type: "SET_AIRPORT_QUERY"; query: string }
  | { type: "PICK_AIRPORT"; code: string }
  | { type: "SWAP_ROUTE" }
  | { type: "SET_DATE_MODE"; mode: DateMode }
  | { type: "SET_DATE_OTHER"; iso: string }
  | { type: "SET_REMAINING"; remaining: number }
  // Stub configure
  | { type: "PICK_PRODUCT"; product: StubProduct }
  | { type: "SET_MINUTES_LATE"; minutesLate: MinutesLate }
  // World verify
  | { type: "VERIFY_PENDING"; path: VerifyPath }
  | { type: "VERIFY_SUCCESS"; session: WorldVerifySuccess }
  | { type: "VERIFY_FAILED"; error: string }
  // Pay + issue
  | { type: "PAY_PENDING" }
  | { type: "PAY_FAILED"; error: string }
  | { type: "STUB_ISSUED"; stub: OwnedStub }
  | { type: "SAVE_STUB" }
  | { type: "OPEN_STUB"; id: string }
  // Live tracker + settlement
  | { type: "LIVE_TICK"; estMinutesLate: number }
  | { type: "SETTLE_PAID"; lateByMinutes: number }
  | { type: "SETTLE_EXPIRED" }
  // Wallet
  | { type: "WALLET_CONNECTING" }
  | { type: "WALLET_CONNECTED"; address: Hex; usdcBalance: number }
  | { type: "WALLET_DISCONNECTED" }
  | { type: "OPEN_SHEET" }
  | { type: "CLOSE_SHEET" }
  // House pool
  | { type: "POOL_SNAPSHOT"; tvlUsd: number; openStubs: number }
  | { type: "POOL_SET_AMOUNT"; amountInput: string }
  | { type: "POOL_START"; kind: PoolMoveKind }
  | { type: "POOL_PENDING" }
  | { type: "POOL_FAILED"; error: string }
  | { type: "POOL_MOVED"; kind: PoolMoveKind; amountUsd: number; txHash: Hex | null };
