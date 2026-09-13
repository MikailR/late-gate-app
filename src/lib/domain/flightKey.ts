import type { DateMode } from "./types";

const DAY_MS = 864e5;

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD input as local noon so timezone offsets never shift the day. */
export function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Resolves the picked date mode to a concrete calendar day. Falls back to today. */
export function resolveServiceDate(dateMode: DateMode, dateOther: string, now: Date = new Date()): Date {
  if (dateMode === "tomorrow") return new Date(now.getTime() + DAY_MS);
  if (dateMode === "other") return parseIsoDate(dateOther) ?? now;
  return now;
}

/**
 * Rails flight key: `UA837|2026-09-19|SFO`.
 * Carrier and number are concatenated, then the service date, then origin.
 */
export function buildFlightKey(input: { airline: string; flightNumber: string; serviceDate: string; origin: string }): string {
  return `${input.airline}${input.flightNumber}|${input.serviceDate}|${input.origin}`;
}
