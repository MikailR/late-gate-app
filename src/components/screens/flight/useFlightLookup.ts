"use client";

import { useEffect, useMemo, useState } from "react";
import { lookupFromQuote, type FlightLookup } from "@/lib/domain/lookup";
import { getRails } from "@/lib/rails";

type LookupInput = {
  airline: string;
  flightNumber: string;
  serviceDate: string;
  origin: string;
};

export type FlightLookupState =
  | { status: "idle"; lookup: null }
  | { status: "loading"; lookup: FlightLookup | null }
  | { status: "ready"; lookup: FlightLookup }
  | { status: "error"; lookup: null };

type LookupResult = { key: string; lookup: FlightLookup | null; failed: boolean };

/**
 * Resolves the typed flight against GET /api/quote as the traveler types.
 * Loading is derived by comparing the input key with the last resolved key,
 * so stale responses are ignored and the row always reflects the latest input.
 */
export function useFlightLookup(input: LookupInput): FlightLookupState {
  const rails = useMemo(() => getRails(), []);
  const { airline, flightNumber, serviceDate, origin } = input;
  const key = flightNumber ? `${airline}|${flightNumber}|${serviceDate}|${origin}` : "";
  const [result, setResult] = useState<LookupResult>({ key: "", lookup: null, failed: false });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    rails.api
      .getQuote({ carrier: airline, flightNumber, serviceDate, origin })
      .then((quote) => {
        if (!cancelled) setResult({ key, lookup: lookupFromQuote(quote), failed: false });
      })
      .catch((error: unknown) => {
        console.error("[late-gate] quote lookup failed", error);
        if (!cancelled) setResult({ key, lookup: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [rails, key, airline, flightNumber, serviceDate, origin]);

  if (!key) return { status: "idle", lookup: null };
  if (result.key !== key) return { status: "loading", lookup: result.lookup };
  if (result.failed || !result.lookup) return { status: "error", lookup: null };
  return { status: "ready", lookup: result.lookup };
}
