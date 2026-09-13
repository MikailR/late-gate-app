import type { QuoteResult } from "@/lib/rails/types";

/** What the flight form prints on the inline lookup row. */
export type FlightLookup = {
  /** Buyable: quote returned, no refusal. */
  ok: boolean;
  /** ON TIME, DELAYED +52, SOLD OUT, and so on. */
  statusLabel: string;
  dep: string;
  arr: string;
  /** Traveler-facing reason when blocked. Empty when buyable. */
  reason: string;
  remaining: number | null;
  flightKey: string | null;
};

/**
 * HH:MM from an ISO timestamp. Uses the literal wall-clock part when present
 * so demo fixtures print exactly what they say.
 * TODO(rails): format in `flight.timeZone` once live snapshots carry zoned times.
 */
export function clockFromIso(iso: string | undefined): string {
  if (!iso) return "··:··";
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "··:··";
}

export function lookupFromQuote(quote: QuoteResult): FlightLookup {
  const dep = clockFromIso(quote.flight?.scheduledDeparture);
  const arr = clockFromIso(quote.flight?.scheduledArrival);
  if (quote.ok) {
    const delay = quote.flight.estimatedDelayMinutes;
    return {
      ok: true,
      statusLabel: delay > 0 ? `DELAYED +${delay}` : "ON TIME",
      dep,
      arr,
      reason: "",
      remaining: quote.remaining ?? null,
      flightKey: quote.flightKey,
    };
  }
  return {
    ok: false,
    statusLabel: quote.title.toUpperCase(),
    dep,
    arr,
    reason: quote.reason,
    remaining: quote.refusal === "FULL" ? 0 : null,
    flightKey: quote.flightKey ?? null,
  };
}
