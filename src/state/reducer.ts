import { DEMO_FLIGHT, DEMO_LIVE_START_MINUTES, DEMO_TICKET_NUMBER_START } from "@/lib/config/constants";
import { roundUsd } from "@/lib/domain/pricing";
import type { AppAction } from "./actions";
import { createInitialState, INITIAL_PAYMENT, INITIAL_VERIFY } from "./initialState";
import { applyPoolMove } from "./poolMath";
import { buildCurrentStub } from "./selectors";
import type { AppState, Screen } from "./types";

/** Screen change that also clears any half-finished checkout step. */
function navigate(state: AppState, screen: Screen): AppState {
  return { ...state, screen, sheetOpen: false, verify: screen === "verify" ? INITIAL_VERIFY : state.verify, payment: INITIAL_PAYMENT };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "NAVIGATE":
      return navigate(state, action.screen);

    case "RESTART":
      return createInitialState({ demo: action.demo });

    case "START_DEMO":
      return {
        ...state,
        screen: "flight",
        flight: { ...DEMO_FLIGHT },
        routeEdit: null,
        airportQuery: "",
        verify: INITIAL_VERIFY,
        payment: INITIAL_PAYMENT,
        sheetOpen: false,
      };

    case "PREVIEW_EXPIRED": {
      // Hidden #expired preview: reuse a held stub, or print one for the demo flight.
      const stub = state.currentStub ?? state.owned[0] ?? buildCurrentStub(state, String(DEMO_TICKET_NUMBER_START));
      return { ...navigate(state, "expired"), currentStub: { ...stub, status: "EXPIRED" } };
    }

    // -- Flight form -------------------------------------------------------

    case "PICK_AIRLINE": {
      const isDemoCarrier = action.airline === DEMO_FLIGHT.airline;
      return {
        ...navigate(state, "flight"),
        flight: { ...state.flight, airline: action.airline, flightNumber: isDemoCarrier ? DEMO_FLIGHT.flightNumber : "" },
        airportQuery: "",
        routeEdit: state.flight.dest ? null : "dest",
      };
    }

    case "SET_FLIGHT_NUMBER":
      return {
        ...state,
        flight: { ...state.flight, flightNumber: action.flightNumber, airline: action.airline ?? state.flight.airline },
      };

    case "SET_ROUTE_EDIT":
      return { ...state, routeEdit: action.edit, airportQuery: "" };

    case "SET_AIRPORT_QUERY":
      return { ...state, airportQuery: action.query };

    case "PICK_AIRPORT": {
      if (state.routeEdit === "origin") {
        if (action.code === state.flight.dest) return state;
        return { ...state, flight: { ...state.flight, origin: action.code }, airportQuery: "", routeEdit: state.flight.dest ? null : "dest" };
      }
      if (state.routeEdit === "dest") {
        if (action.code === state.flight.origin) return state;
        return { ...state, flight: { ...state.flight, dest: action.code }, airportQuery: "", routeEdit: null };
      }
      return state;
    }

    case "SWAP_ROUTE":
      if (!state.flight.dest) return state;
      return { ...state, flight: { ...state.flight, origin: state.flight.dest, dest: state.flight.origin } };

    case "SET_DATE_MODE":
      return { ...state, flight: { ...state.flight, dateMode: action.mode } };

    case "SET_DATE_OTHER":
      return { ...state, flight: { ...state.flight, dateOther: action.iso } };

    case "SET_REMAINING":
      return state.remaining === action.remaining ? state : { ...state, remaining: action.remaining };

    // -- Configure ---------------------------------------------------------

    case "PICK_PRODUCT":
      return { ...navigate(state, "configure"), product: action.product };

    case "SET_MINUTES_LATE":
      return { ...state, minutesLate: action.minutesLate };

    // -- World verify ------------------------------------------------------

    case "VERIFY_PENDING":
      return { ...state, verify: { status: "pending", path: action.path, session: null, error: null } };

    case "VERIFY_SUCCESS":
      return { ...state, verify: { ...state.verify, status: "verified", session: action.session, error: null } };

    case "VERIFY_FAILED":
      return { ...state, verify: { ...state.verify, status: "failed", session: null, error: action.error } };

    // -- Pay + issue -------------------------------------------------------

    case "PAY_PENDING":
      return { ...state, payment: { status: "pending", error: null } };

    case "PAY_FAILED":
      return { ...state, payment: { status: "failed", error: action.error } };

    case "STUB_ISSUED": {
      // The premium lands in the house pool; a depositor earns their share of it.
      const share = state.pool.tvlUsd > 0 ? state.pool.depositUsd / state.pool.tvlUsd : 0;
      const premium = action.stub.premiumUsd;
      return {
        ...state,
        screen: "issued",
        payment: INITIAL_PAYMENT,
        currentStub: action.stub,
        remaining: Math.max(0, state.remaining - 1),
        wallet: { ...state.wallet, usdcBalance: roundUsd(state.wallet.usdcBalance - premium) },
        pool: {
          ...state.pool,
          tvlUsd: roundUsd(state.pool.tvlUsd + premium),
          earnedUsd: state.pool.earnedUsd + premium * share,
          openStubs: state.pool.openStubs + 1,
        },
      };
    }

    case "SAVE_STUB": {
      const stub = state.currentStub;
      if (!stub) return state;
      const alreadyOwned = state.owned.some((owned) => owned.id === stub.id);
      return { ...state, owned: alreadyOwned ? state.owned : [...state.owned, stub] };
    }

    case "OPEN_STUB": {
      const stub = state.owned.find((owned) => owned.id === action.id);
      if (!stub) return state;
      return {
        ...navigate(state, stub.status === "PAID" ? "paid" : stub.status === "EXPIRED" ? "expired" : "live"),
        currentStub: stub,
        product: stub.product,
        minutesLate: stub.minutesLate,
        live: { estMinutesLate: DEMO_LIVE_START_MINUTES },
      };
    }

    // -- Live + settlement -------------------------------------------------

    case "LIVE_TICK":
      return { ...state, live: { estMinutesLate: action.estMinutesLate } };

    case "SETTLE_PAID": {
      const stub = state.currentStub;
      if (!stub) return navigate(state, "stubs");
      const settled = { ...stub, status: "PAID" as const, lateByMinutes: action.lateByMinutes };
      return {
        ...navigate(state, "paid"),
        currentStub: settled,
        owned: state.owned.map((owned) => (owned.id === settled.id ? settled : owned)),
        // The house pool pays the stub, so TVL drops by the payout while the wallet gains it.
        wallet: { ...state.wallet, usdcBalance: roundUsd(state.wallet.usdcBalance + stub.payoutUsd) },
        pool: { ...state.pool, tvlUsd: roundUsd(state.pool.tvlUsd - stub.payoutUsd), openStubs: Math.max(0, state.pool.openStubs - 1) },
      };
    }

    case "SETTLE_EXPIRED": {
      const stub = state.currentStub;
      if (!stub) return navigate(state, "stubs");
      const settled = { ...stub, status: "EXPIRED" as const };
      return {
        ...navigate(state, "expired"),
        currentStub: settled,
        owned: state.owned.map((owned) => (owned.id === settled.id ? settled : owned)),
        pool: { ...state.pool, openStubs: Math.max(0, state.pool.openStubs - 1) },
      };
    }

    // -- Wallet ------------------------------------------------------------

    case "WALLET_CONNECTING":
      return { ...state, wallet: { ...state.wallet, status: "connecting" } };

    case "WALLET_CONNECTED":
      return { ...state, wallet: { status: "connected", address: action.address, usdcBalance: action.usdcBalance } };

    case "WALLET_DISCONNECTED":
      return { ...state, wallet: { ...state.wallet, status: "disconnected", address: null }, sheetOpen: false };

    case "OPEN_SHEET":
      return { ...state, sheetOpen: true };

    case "CLOSE_SHEET":
      return { ...state, sheetOpen: false };

    // -- House pool --------------------------------------------------------

    case "POOL_SNAPSHOT":
      return { ...state, pool: { ...state.pool, tvlUsd: action.tvlUsd, openStubs: action.openStubs } };

    case "POOL_SET_AMOUNT":
      return { ...state, pool: { ...state.pool, amountInput: action.amountInput, error: null } };

    case "POOL_START":
      return { ...navigate(state, action.kind), pool: { ...state.pool, amountInput: "", busy: false, error: null } };

    case "POOL_PENDING":
      return { ...state, pool: { ...state.pool, busy: true, error: null } };

    case "POOL_FAILED":
      return { ...state, pool: { ...state.pool, busy: false, error: action.error } };

    case "POOL_MOVED": {
      const moved = applyPoolMove(action.kind, action.amountUsd, state.pool, state.wallet);
      const serial = state.pool.slipSerial + 1;
      return {
        ...navigate(state, "poolSlip"),
        wallet: { ...state.wallet, usdcBalance: moved.walletUsd },
        pool: {
          ...state.pool,
          tvlUsd: moved.tvlUsd,
          depositUsd: moved.depositUsd,
          earnedUsd: moved.earnedUsd,
          amountInput: "",
          busy: false,
          error: null,
          slip: { kind: action.kind, amountUsd: action.amountUsd, serial, txHash: action.txHash },
          slipSerial: serial,
        },
      };
    }

    default:
      return state;
  }
}
