const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

/** `19 SEP` for receipt rows and date chips. */
export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Zero-padded ticket and slip numbers: `0001183`. */
export function formatSerial(n: number, width = 7): string {
  return String(n).padStart(width, "0");
}
