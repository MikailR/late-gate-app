import type { FlightSelection } from "@/lib/domain/types";

/** Wordmark and network label. World Chain is the only chain shown in the UI. */
export const APP_NAME = "LATE GATE";
export const WALLET_NETWORK_LABEL = "World Chain";
export const SETTLEMENT_ASSET = "USDC";

/**
 * Locked demo hero flight: United 837, San Francisco to Tokyo Narita.
 * flightKey style `UA837|serviceDate|SFO`. Demo restart and #demo land here.
 */
export const DEMO_FLIGHT: Readonly<FlightSelection> = {
  airline: "UA",
  flightNumber: "837",
  origin: "SFO",
  dest: "NRT",
  dateMode: "next24",
  dateOther: "",
};

/** Demo inventory: stubs left on the hero flight when the app opens. */
export const DEMO_INITIAL_INVENTORY = 17;

/** Inventory gauge on Pick a stub: five notches, one lit per four stubs left. */
export const INVENTORY_NOTCH_THRESHOLDS = [0, 4, 8, 12, 16] as const;

/** Demo wallet: a small USDC balance. Stubs spend from it, payouts land in it. */
export const DEMO_WALLET_USDC = 128.4;
export const DEMO_WALLET_ADDRESS = "0x7a3e19b4c0d25f8e6a1b7c9d4e2f3a5b6c7d8c2f1";

/** Demo house pool: TVL in USDC on World Chain, and how many stubs it currently backs. */
export const DEMO_POOL_TVL_USDC = 12480;
export const DEMO_POOL_OPEN_STUBS = 41;
export const DEMO_POOL_SLIP_START = 217;
export const DEMO_TICKET_NUMBER_START = 1183;

/** Live tracker demo: the flight ends up this many minutes late. */
export const DEMO_LATE_MINUTES = 47;
export const DEMO_LIVE_START_MINUTES = 12;
export const DEMO_LIVE_STEP_MINUTES = 3;
export const DEMO_LIVE_TICK_MS = 550;

/** Hidden demo entry: hold the wordmark this long. */
export const DEMO_LONG_PRESS_MS = 700;
