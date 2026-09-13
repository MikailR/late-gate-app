import { getAirline } from "@/lib/data/airlines";
import { buildFlightKey, resolveServiceDate, toIsoDate } from "@/lib/domain/flightKey";
import { payoutUsdForMinutesLate, premiumUsdForProduct } from "@/lib/domain/pricing";
import { triggerClock } from "@/lib/domain/schedule";
import type { Airline, OwnedStub, StubProduct } from "@/lib/domain/types";
import { formatShortDate } from "@/lib/format/date";
import { poolPositionUsd } from "./poolMath";
import type { AppState } from "./types";

export function selectAirline(state: AppState): Airline {
  return getAirline(state.flight.airline);
}

/** `UA 837`, or just `UA` before a number is typed. */
export function selectFlightLabel(state: AppState): string {
  const { airline, flightNumber } = state.flight;
  return flightNumber ? `${airline} ${flightNumber}` : airline;
}

export function selectServiceDate(state: AppState): Date {
  return resolveServiceDate(state.flight.dateMode, state.flight.dateOther);
}

export function selectServiceDateIso(state: AppState): string {
  return toIsoDate(selectServiceDate(state));
}

export function selectDateLabel(state: AppState): string {
  return formatShortDate(selectServiceDate(state));
}

export function selectFlightKey(state: AppState): string {
  return buildFlightKey({
    airline: state.flight.airline,
    flightNumber: state.flight.flightNumber,
    serviceDate: selectServiceDateIso(state),
    origin: state.flight.origin,
  });
}

/** `SFO→NRT`, or just the origin before a destination is picked. */
export function selectRouteLabel(state: AppState): string {
  const { origin, dest } = state.flight;
  return dest ? `${origin}→${dest}` : origin;
}

export function selectRouteReady(state: AppState): boolean {
  const { origin, dest } = state.flight;
  return Boolean(origin && dest && origin !== dest);
}

export function selectPremiumUsd(state: AppState): number {
  return premiumUsdForProduct(state.product);
}

export function selectPayoutUsd(state: AppState): number {
  return payoutUsdForMinutesLate(state.minutesLate);
}

export function selectTriggerClock(state: AppState): string {
  return triggerClock(state.product, state.minutesLate);
}

export function selectWalletConnected(state: AppState): boolean {
  return state.wallet.status === "connected" && state.wallet.address !== null;
}

export function selectPoolPositionUsd(state: AppState): number {
  return poolPositionUsd(state.pool);
}

export function productName(product: StubProduct): string {
  return product === "takeoff" ? "Takeoff delay" : "Arrival delay";
}

export function productShort(product: StubProduct): string {
  return product === "takeoff" ? "TAKEOFF DELAY" : "ARRIVAL DELAY";
}

/** Builds the stub record for the current selection once the rails issue a ticket. */
export function buildCurrentStub(state: AppState, ticketNumber: string): OwnedStub {
  const serviceDate = selectServiceDateIso(state);
  return {
    id: `${state.flight.airline}-${state.flight.flightNumber}-${serviceDate}-${state.product}-${state.minutesLate}`,
    flightKey: selectFlightKey(state),
    ticketNumber,
    airline: state.flight.airline,
    flightNumber: state.flight.flightNumber,
    origin: state.flight.origin,
    dest: state.flight.dest,
    serviceDate,
    product: state.product,
    minutesLate: state.minutesLate,
    payoutUsd: selectPayoutUsd(state),
    premiumUsd: selectPremiumUsd(state),
    status: "OPEN",
  };
}
