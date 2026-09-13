/**
 * Shared product types for the Late Gate frontend.
 * Mirrors `lib/domain/types.ts` in the rails repo (MikailR/late-gate) so the
 * HTTP adapter can pass these through unchanged.
 *
 * Traveler-facing copy never says insurance, bet, prediction, or gamble.
 * The lateness threshold is only ever shown as 30 / 45 / 60 minutes late.
 */

export type StubProduct = "takeoff" | "arrival";

export type MinutesLate = 30 | 45 | 60;

export const MINUTES_LATE_OPTIONS: readonly MinutesLate[] = [30, 45, 60];

export type Configure = {
  product: StubProduct;
  minutesLate: MinutesLate;
};

export function isMinutesLate(value: unknown): value is MinutesLate {
  return value === 30 || value === 45 || value === 60;
}

export function isStubProduct(value: unknown): value is StubProduct {
  return value === "takeoff" || value === "arrival";
}

/** Two-letter IATA carrier codes the airline picker offers. */
export type AirlineCode = "DL" | "AA" | "UA" | "WN" | "B6" | "NK" | "EK" | "AC" | "BA" | "LH";

export type Airline = {
  code: AirlineCode;
  name: string;
  /** Path under /public. */
  logo: string;
  /**
   * Demo flight numbers that resolve to a fixed lookup status.
   * Any other number resolves as `clean` (on time, buyable).
   */
  demoNumbers: Record<FlightKind, string>;
};

export type Airport = {
  code: string;
  city: string;
};

/**
 * Inline lookup outcome for a flight. Only `clean` is buyable; the rest
 * disable Continue on the flight form with a reason.
 */
export type FlightKind = "clean" | "hot" | "gone" | "sold" | "cutoff" | "uw";

export type FlightLookupStatus = {
  kind: FlightKind;
  /** Status stamp printed on the lookup row, e.g. ON TIME or DELAYED +52. */
  status: string;
  /** Scheduled departure HH:MM (local). */
  dep: string;
  /** Scheduled arrival HH:MM (local). */
  arr: string;
  /** Traveler-facing reason when the flight is not for sale. Empty when buyable. */
  reason: string;
};

export type DateMode = "next24" | "tomorrow" | "other";

/** What the traveler has picked on the flight form. */
export type FlightSelection = {
  airline: AirlineCode;
  /** Digits only, up to four. Empty until typed. */
  flightNumber: string;
  origin: string;
  /** Empty until picked. */
  dest: string;
  dateMode: DateMode;
  /** YYYY-MM-DD when dateMode is `other`. */
  dateOther: string;
};

export type StubStatus = "OPEN" | "PAID" | "EXPIRED";

/** A stub the traveler holds. Stored client-side for the demo. */
export type OwnedStub = {
  id: string;
  /** `UA837|2026-09-19|SFO` */
  flightKey: string;
  ticketNumber: string;
  airline: AirlineCode;
  flightNumber: string;
  origin: string;
  dest: string;
  serviceDate: string;
  product: StubProduct;
  minutesLate: MinutesLate;
  payoutUsd: number;
  premiumUsd: number;
  status: StubStatus;
  /** Set once the stub settles PAID. */
  lateByMinutes?: number;
};

export type Hex = `0x${string}`;
