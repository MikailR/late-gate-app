import type { StubProduct } from "./types";

/**
 * Demo schedule for the hero flight: departs 18:05, arrives 21:27 (local).
 * Takeoff stubs measure against departure, arrival stubs against arrival.
 * Live rails will replace this with the FlightSnapshot scheduled times.
 */
export const DEMO_SCHEDULED_MINUTES: Readonly<Record<StubProduct, number>> = {
  takeoff: 18 * 60 + 5,
  arrival: 21 * 60 + 27,
};

/** Minutes past midnight to HH:MM, wrapping past 24h. */
export function formatClock(minutesPastMidnight: number): string {
  const total = ((Math.round(minutesPastMidnight) % 1440) + 1440) % 1440;
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const m = String(total % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Scheduled time for the product's measured event, in minutes past midnight. */
export function scheduledMinutesFor(product: StubProduct): number {
  return DEMO_SCHEDULED_MINUTES[product];
}

/** The clock time after which the stub pays: scheduled + threshold. */
export function triggerClock(product: StubProduct, minutesLate: number): string {
  return formatClock(scheduledMinutesFor(product) + minutesLate);
}
