import type { MinutesLate, StubProduct } from "./types";

/**
 * Locked money triples (rails PR #1): the product selects a fixed premium,
 * the lateness threshold selects the payout. Never derive dollars from p x B.
 */
export const PREMIUM_USD_BY_PRODUCT: Readonly<Record<StubProduct, number>> = {
  takeoff: 14,
  arrival: 9,
};

export const PAYOUT_USD_BY_MINUTES_LATE: Readonly<Record<MinutesLate, number>> = {
  30: 100,
  45: 150,
  60: 200,
};

export function premiumUsdForProduct(product: StubProduct): number {
  return PREMIUM_USD_BY_PRODUCT[product];
}

export function payoutUsdForMinutesLate(minutesLate: MinutesLate): number {
  return PAYOUT_USD_BY_MINUTES_LATE[minutesLate];
}

export function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}

export function centsToUsd(cents: number): number {
  return cents / 100;
}

/** Round to whole cents so wallet and pool arithmetic never drifts. */
export function roundUsd(usd: number): number {
  return Math.round(usd * 100) / 100;
}
