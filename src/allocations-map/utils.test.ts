import { describe, expect, it } from "vitest";
import { makeLevels, quantile } from "./utils";

describe("quantile", () => {
  it("interpolates between the surrounding values", () => {
    expect(quantile([0, 10], 0.5)).toBe(5);
    expect(quantile([0, 100], 0.25)).toBe(25);
  });

  it("returns the last value at the top of the range", () => {
    expect(quantile([1, 2, 3], 1)).toBe(3);
  });

  it("sorts its input in place", () => {
    // Worth pinning down: makeLevels calls quantile repeatedly on one array,
    // so the sort is load-bearing rather than incidental.
    const values = [30, 10, 20];
    expect(quantile(values, 0)).toBe(10);
    expect(values).toEqual([10, 20, 30]);
  });
});

describe("makeLevels", () => {
  it("labels each quantile with the shared abbreviation and marks the top one", () => {
    // Quantiles chosen to land on exact array indices, so each label is the
    // formatting of that value and nothing else.
    //
    // All three of these were wrong under the local formatNumber this migrated
    // off, which started the K tier at 1001, never promoted a mantissa that
    // rounding pushed over the boundary, and had no suffix past T. It labelled
    // them "1000", "1000K" and "1000B".
    expect(makeLevels([1_000, 999_500, 1_000_000_000_000], [0, 0.5, 1])).toEqual([
      ["1.00K", 1_000],
      ["1.00M", 999_500],
      ["1.00T+", 1_000_000_000_000],
    ]);
  });

  it("produces one level per quantile, rounding before it formats", () => {
    // The default quantiles interpolate, so 3.7 and 6.4 are rounded to whole
    // credits first and only the label reflects that - the raw value stays in
    // the tuple for the map to compare against.
    const levels = makeLevels([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(levels).toHaveLength(4);
    expect(levels.map(([label]) => label)).toEqual(["1", "4", "6", "9+"]);
  });
});
