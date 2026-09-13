import { SETTLEMENT_ASSET } from "@/lib/config/constants";

/** `$1,234.50` */
export function formatUsd(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `$${safe.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** `$1,234.50 USDC` */
export function formatUsdc(amount: number): string {
  return `${formatUsd(amount)} ${SETTLEMENT_ASSET}`;
}

/** Whole-dollar payouts print without cents: `$150`. */
export function formatWholeUsd(amount: number): string {
  return `$${Math.round(amount)}`;
}

/** Earned amounts below a cent still read as something, not `$0.00`. */
export function formatEarnedUsd(amount: number): string {
  if (amount > 0 && amount < 0.005) return "<$0.01";
  return formatUsd(amount);
}

/** Pool share as a percentage with a floor for tiny positions. */
export function formatSharePercent(deposit: number, tvl: number): string {
  if (deposit <= 0 || tvl <= 0) return "0%";
  const pct = (deposit / tvl) * 100;
  return pct < 0.01 ? "<0.01%" : `${pct.toFixed(2)}%`;
}

/** `0x7a3e…c2f1` for chips and receipts. */
export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/**
 * Sanitizes a typed amount: digits and one dot, at most two decimals.
 * Returns the cleaned string so the input can be controlled.
 */
export function sanitizeAmountInput(raw: string): string {
  const stripped = raw.replace(/[^0-9.]/g, "");
  const match = stripped.match(/^(\d*)(?:\.(\d{0,2}))?/);
  if (!match) return "";
  const whole = match[1];
  return stripped.includes(".") ? `${whole}.${match[2] ?? ""}` : whole;
}
