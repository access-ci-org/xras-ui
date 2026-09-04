const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// For read-only displays of an amount, where cents are noise. The form's own
// field keeps them, since they're what the user typed.
const wholeDollarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Awarded amounts are always dollars; there's no control for this in the
// form, so it's a constant rather than something the user picks.
export const AWARDED_UNITS = "Dollars";

/**
 * Parses a possibly display-formatted amount ("$12,561,813.00") into a
 * number, returning NaN for anything with no numeric content so callers can
 * tell "not a valid amount" apart from a legitimate zero.
 */
export function parseCurrencyAmount(
  value: string | number | null | undefined,
): number {
  if (value == null) return NaN;
  const digits = String(value).replace(/[^0-9.-]+/g, "");
  if (!digits) return NaN;
  return Number(digits);
}

function format(
  formatter: Intl.NumberFormat,
  value: string | number | null | undefined,
): string {
  // initialGrants is assigned as a plain JS property (see element.tsx) from
  // JSON that may represent awarded_amount as a number (or omit it) rather
  // than a string, even though SupportingGrant's type says string.
  if (value == null) return "";
  const amount = parseCurrencyAmount(value);
  // Leave unparseable input as the user typed it so the schema can flag it,
  // rather than silently rewriting it to $0.00.
  if (!Number.isFinite(amount)) return String(value);
  return formatter.format(amount);
}

export function formatAsCurrency(value: string | number | null | undefined): string {
  return format(currencyFormatter, value);
}

/** As formatAsCurrency, but rounded to the nearest whole dollar. */
export function formatAsDollars(value: string | number | null | undefined): string {
  return format(wholeDollarFormatter, value);
}

/**
 * Strips display formatting back to a plain numeric string for submission.
 * Rails' `to_d` reads "$12,561,813.00" as 0, so the formatted value can
 * never be what goes over the wire.
 */
export function unformatCurrency(
  value: string | number | null | undefined,
): string {
  const amount = parseCurrencyAmount(value);
  return Number.isFinite(amount) ? String(amount) : "";
}
