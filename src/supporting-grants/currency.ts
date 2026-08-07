const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatAsCurrency(value: string | number | null | undefined): string {
  // initialGrants is assigned as a plain JS property (see element.tsx) from
  // JSON that may represent awarded_amount as a number (or omit it) rather
  // than a string, even though SupportingGrant's type says string.
  if (value == null) return "";
  const stringValue = String(value);
  const amount = Number(stringValue.replace(/[^0-9.-]+/g, ""));
  if (!stringValue || !Number.isFinite(amount)) return stringValue;
  return currencyFormatter.format(amount);
}
