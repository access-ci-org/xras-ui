import { describe, expect, it } from "vitest";
import { formatNumber, roundNumber } from "@/shared/helpers/utils";

// Proves the TS transform, the "@" alias, and basic Vitest wiring work.
describe("roundNumber", () => {
  it("rounds to a number of decimal places (default mode)", () => {
    expect(roundNumber(1.2345, 2)).toBe(1.23);
  });

  it("floors when mode is floor", () => {
    expect(roundNumber(1.2999, 2, "floor")).toBe(1.29);
  });

  it("ceils when mode is ceil", () => {
    expect(roundNumber(1.2001, 2, "ceil")).toBe(1.21);
  });

  it("defaults to 0 decimal places", () => {
    expect(roundNumber(4.6)).toBe(5);
  });
});

describe("formatNumber", () => {
  it("formats a plain number with thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("abbreviates thousands with a K suffix", () => {
    expect(formatNumber(12345, { abbreviate: true })).toBe("12.3K");
  });

  it("abbreviates millions with an M suffix", () => {
    expect(formatNumber(2500000, { abbreviate: true })).toBe("2.5M");
  });

  it("does not abbreviate values under 1000", () => {
    expect(formatNumber(999, { abbreviate: true })).toBe("999");
  });
});
