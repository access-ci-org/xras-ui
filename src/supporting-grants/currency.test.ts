import { describe, expect, it } from "vitest";
import {
  AWARDED_UNITS,
  formatAsCurrency,
  formatAsDollars,
  parseCurrencyAmount,
  unformatCurrency,
} from "./currency";

// The awarded amount is the one field that exists in three different
// spellings at once: what the user sees ("$12,561,813.00"), what is held in
// form state (the same formatted string - see SupportingGrantsSection's
// defaultValues and GrantFields' onBlur), and what goes over the wire
// ("12561813", because Rails' `to_d` reads the formatted string as 0). These
// three functions are the conversions between them, so the round trip and the
// "not a number" cases are what matter here.

describe("parseCurrencyAmount", () => {
  it("strips display formatting from a formatted amount", () => {
    expect(parseCurrencyAmount("$12,561,813.00")).toBe(12561813);
  });

  it("accepts a plain number unchanged", () => {
    expect(parseCurrencyAmount(1234.5)).toBe(1234.5);
  });

  it("returns 0 for a zero amount rather than NaN", () => {
    // The reason the function returns NaN rather than 0 for bad input: a
    // legitimate zero has to stay distinguishable from "no numeric content".
    expect(parseCurrencyAmount(0)).toBe(0);
    expect(parseCurrencyAmount("$0.00")).toBe(0);
  });

  it("returns NaN for null and undefined", () => {
    expect(parseCurrencyAmount(null)).toBeNaN();
    expect(parseCurrencyAmount(undefined)).toBeNaN();
  });

  it("returns NaN when nothing numeric is left after stripping", () => {
    expect(parseCurrencyAmount("")).toBeNaN();
    expect(parseCurrencyAmount("about a million")).toBeNaN();
    expect(parseCurrencyAmount("$")).toBeNaN();
  });

  it("returns NaN when the surviving characters are not a single number", () => {
    // Stripping is character-wise, not a parse, so "." and "-" can survive in
    // positions that make the result unparseable. Number() catches it.
    expect(parseCurrencyAmount("1.2.3")).toBeNaN();
    expect(parseCurrencyAmount("2020-2024")).toBeNaN();
  });
});

describe("formatAsCurrency", () => {
  it("formats a number as US dollars", () => {
    expect(formatAsCurrency(12561813)).toBe("$12,561,813.00");
  });

  it("is idempotent on an already-formatted amount", () => {
    // Load-bearing: the value is stored formatted, so GrantFields' onBlur
    // re-formats a string it has already formatted every time the field is
    // blurred again, and parseInitialGrants formats on the way in.
    expect(formatAsCurrency("$12,561,813.00")).toBe("$12,561,813.00");
  });

  it("formats zero rather than treating it as empty", () => {
    expect(formatAsCurrency(0)).toBe("$0.00");
  });

  it("returns an empty string for null and undefined", () => {
    // initialGrants arrives as plain JSON, which may omit awarded_amount
    // entirely even though the type says string.
    expect(formatAsCurrency(null)).toBe("");
    expect(formatAsCurrency(undefined)).toBe("");
  });

  it("leaves unparseable input exactly as the user typed it", () => {
    // Rewriting "twelve million" to "$0.00" would silently invent an amount;
    // leaving it alone lets the schema's "Enter a valid amount" issue fire.
    expect(formatAsCurrency("twelve million")).toBe("twelve million");
    expect(formatAsCurrency("")).toBe("");
  });
});

describe("formatAsDollars", () => {
  it("formats a number as whole US dollars", () => {
    expect(formatAsDollars(12561813)).toBe("$12,561,813");
  });

  it("rounds to the nearest dollar rather than truncating", () => {
    expect(formatAsDollars(1234.56)).toBe("$1,235");
    expect(formatAsDollars("$1,234.49")).toBe("$1,234");
  });

  it("handles the empty and unparseable cases like formatAsCurrency", () => {
    expect(formatAsDollars(0)).toBe("$0");
    expect(formatAsDollars(null)).toBe("");
    expect(formatAsDollars("twelve million")).toBe("twelve million");
  });
});

describe("unformatCurrency", () => {
  it("strips formatting back to a plain numeric string", () => {
    expect(unformatCurrency("$12,561,813.00")).toBe("12561813");
  });

  it("keeps a fractional amount", () => {
    expect(unformatCurrency("$1,234.56")).toBe("1234.56");
  });

  it("serializes zero as \"0\", not as empty", () => {
    expect(unformatCurrency("$0.00")).toBe("0");
  });

  it("returns an empty string for anything with no numeric content", () => {
    expect(unformatCurrency(null)).toBe("");
    expect(unformatCurrency(undefined)).toBe("");
    expect(unformatCurrency("")).toBe("");
    expect(unformatCurrency("twelve million")).toBe("");
  });

  it("round-trips a formatted amount back to the number it came from", () => {
    expect(unformatCurrency(formatAsCurrency(12561813))).toBe("12561813");
  });
});

describe("AWARDED_UNITS", () => {
  it("is the constant Rails expects, since no control sets it", () => {
    expect(AWARDED_UNITS).toBe("Dollars");
  });
});
