import type { AirlineCode, FlightKind, FlightLookupStatus } from "@/lib/domain/types";
import { AIRLINES } from "./airlines";

/**
 * Inline lookup result per flight kind. Mirrors the rails refusal order
 * (HOT, CUTOFF, FULL, UNDERWRITE_REJECT) plus a departed state.
 */
export const FLIGHT_STATUS_BY_KIND: Readonly<Record<FlightKind, Omit<FlightLookupStatus, "kind">>> = {
  clean: { status: "ON TIME", dep: "18:05", arr: "21:27", reason: "" },
  hot: { status: "DELAYED +52", dep: "16:10", arr: "19:42", reason: "Already running late. Not for sale." },
  gone: { status: "DEPARTED", dep: "15:05", arr: "18:20", reason: "Already left the gate." },
  sold: { status: "SOLD OUT", dep: "19:40", arr: "23:05", reason: "No stubs left on this flight." },
  cutoff: { status: "CUTOFF", dep: "16:55", arr: "20:18", reason: "Inside the 90 minute cutoff." },
  uw: { status: "NOT COVERED", dep: "20:15", arr: "23:40", reason: "Not underwritten yet." },
};

/** Which demo kind a flight number maps to for a carrier. Unknown numbers are clean. */
export function flightKindFor(airline: AirlineCode, flightNumber: string): FlightKind {
  const demoNumbers = AIRLINES[airline].demoNumbers;
  const match = (Object.keys(demoNumbers) as FlightKind[]).find((kind) => demoNumbers[kind] === flightNumber);
  return match ?? "clean";
}

export function lookupStatusFor(airline: AirlineCode, flightNumber: string): FlightLookupStatus {
  const kind = flightKindFor(airline, flightNumber);
  return { kind, ...FLIGHT_STATUS_BY_KIND[kind] };
}
