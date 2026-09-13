import {
  DEMO_FLIGHT,
  DEMO_INITIAL_INVENTORY,
  DEMO_LIVE_START_MINUTES,
  DEMO_POOL_OPEN_STUBS,
  DEMO_POOL_SLIP_START,
  DEMO_POOL_TVL_USDC,
  DEMO_WALLET_USDC,
} from "@/lib/config/constants";
import type { AppState, PaymentState, VerifyState } from "./types";

export const INITIAL_VERIFY: VerifyState = { status: "idle", path: "sandbox", session: null, error: null };
export const INITIAL_PAYMENT: PaymentState = { status: "idle", error: null };

/**
 * Fresh demo state. The hero flight is prefilled so the flight form is one
 * tap from Continue; `demo` decides whether we land there or on My stubs.
 */
export function createInitialState(options: { demo?: boolean } = {}): AppState {
  return {
    screen: options.demo ? "flight" : "stubs",
    flight: { ...DEMO_FLIGHT },
    routeEdit: null,
    airportQuery: "",
    product: "arrival",
    minutesLate: 30,
    remaining: DEMO_INITIAL_INVENTORY,
    verify: INITIAL_VERIFY,
    payment: INITIAL_PAYMENT,
    currentStub: null,
    owned: [],
    live: { estMinutesLate: DEMO_LIVE_START_MINUTES },
    wallet: { status: "disconnected", address: null, usdcBalance: DEMO_WALLET_USDC, live: false, error: null },
    sheetOpen: false,
    pool: {
      tvlUsd: DEMO_POOL_TVL_USDC,
      openStubs: DEMO_POOL_OPEN_STUBS,
      depositUsd: 0,
      earnedUsd: 0,
      amountInput: "",
      busy: false,
      error: null,
      slip: null,
      slipSerial: DEMO_POOL_SLIP_START,
    },
  };
}
