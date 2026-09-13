"use client";

import { CodeField, CodeFieldAction } from "@/components/ui/CodeField";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { isAirlineCode } from "@/lib/data/airlines";
import type { AirlineCode } from "@/lib/domain/types";

type FlightNumberFieldProps = {
  airline: AirlineCode;
  flightNumber: string;
  /** Example number for the placeholder (the carrier's clean demo flight). */
  placeholder: string;
  onChange: (next: { flightNumber: string; airline?: AirlineCode }) => void;
};

const MAX_DIGITS = 4;

/**
 * Digits only, four max. A pasted full code like AC2847 or ua123 also
 * switches the carrier prefix.
 */
export function parseFlightNumberInput(raw: string): { flightNumber: string; airline?: AirlineCode } {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = cleaned.match(/^([A-Z][A-Z0-9]|[0-9][A-Z])(\d*)$/);
  if (match && isAirlineCode(match[1])) {
    return { airline: match[1], flightNumber: match[2].slice(0, MAX_DIGITS) };
  }
  return { flightNumber: cleaned.replace(/\D/g, "").slice(0, MAX_DIGITS) };
}

export function FlightNumberField({ airline, flightNumber, placeholder, onChange }: FlightNumberFieldProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <SectionLabel>FLIGHT NUMBER</SectionLabel>
      <CodeField
        prefix={airline}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
        aria-label="Flight number"
        value={flightNumber}
        placeholder={placeholder}
        onChange={(event) => onChange(parseFlightNumberInput(event.target.value))}
        trailing={
          flightNumber ? (
            <CodeFieldAction label="Clear flight number" onClick={() => onChange({ flightNumber: "" })}>
              ✕
            </CodeFieldAction>
          ) : undefined
        }
      />
    </div>
  );
}
