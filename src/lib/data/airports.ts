import type { Airport } from "@/lib/domain/types";

/** Airport picker list. The first six show as chips; search reaches the rest. */
export const AIRPORTS: readonly Airport[] = [
  { code: "EWR", city: "Newark" },
  { code: "JFK", city: "New York" },
  { code: "BOS", city: "Boston" },
  { code: "SFO", city: "San Francisco" },
  { code: "LAX", city: "Los Angeles" },
  { code: "MIA", city: "Miami" },
  { code: "LGA", city: "New York" },
  { code: "PHL", city: "Philadelphia" },
  { code: "IAD", city: "Washington" },
  { code: "DCA", city: "Washington" },
  { code: "ORD", city: "Chicago" },
  { code: "ATL", city: "Atlanta" },
  { code: "DFW", city: "Dallas" },
  { code: "DEN", city: "Denver" },
  { code: "SEA", city: "Seattle" },
  { code: "YYZ", city: "Toronto" },
  { code: "LHR", city: "London" },
  { code: "DXB", city: "Dubai" },
  { code: "FRA", city: "Frankfurt" },
  { code: "NRT", city: "Tokyo" },
  { code: "HND", city: "Tokyo" },
];

export const AIRPORT_CHIP_LIMIT = 6;

export function cityOf(code: string): string {
  return AIRPORTS.find((airport) => airport.code === code)?.city ?? "";
}

/** Case-insensitive match on code prefix or city substring. Empty query returns all. */
export function searchAirports(query: string): Airport[] {
  const q = query.trim().toUpperCase();
  if (!q) return [...AIRPORTS];
  return AIRPORTS.filter((airport) => airport.code.startsWith(q) || airport.city.toUpperCase().includes(q));
}
