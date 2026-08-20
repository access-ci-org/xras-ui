import { Fragment, createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  coalesce,
  formatArray,
  formatBoolean,
  formatDate,
  formatExchangeRate,
  formatManagers,
  formatNumber,
  formatRequestName,
  getCost,
  getResourceUsagePercent,
  icon,
  parseDate,
  parseResourceName,
  roundNumber,
  singularize,
  sortResources,
} from "@/shared/helpers/utils";
import type { ProjectSummary, RequestSummary } from "@/shared/types";

// formatArray/formatBoolean/formatManagers/icon return ReactNode (plain
// strings, JSX fragments, or null), so render them into the DOM to assert on
// text/markup rather than trying to compare React element trees directly.
function renderNode(node: ReactNode) {
  return render(createElement(Fragment, null, node));
}

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

  it("sits right at the K threshold", () => {
    // 1000 / 1000^1 = 1, which is < 1000, so the while loop in formatNumber
    // stops at power=1 rather than rolling over to the next tier.
    expect(formatNumber(1000, { abbreviate: true })).toBe("1K");
  });

  it("abbreviates billions with a B suffix", () => {
    expect(formatNumber(2_500_000_000, { abbreviate: true })).toBe("2.5B");
  });

  it("abbreviates trillions with a T suffix", () => {
    expect(formatNumber(1_000_000_000_000, { abbreviate: true })).toBe("1T");
  });

  it("abbreviates quadrillions with a Q suffix", () => {
    expect(formatNumber(1_000_000_000_000_000, { abbreviate: true })).toBe("1Q");
  });

  it("carries the sign through when abbreviating negative values", () => {
    expect(formatNumber(-12345, { abbreviate: true })).toBe("-12.3K");
  });

  it("pads/truncates to a fixed number of decimal places when not abbreviating", () => {
    expect(formatNumber(3, { decimalPlaces: 2 })).toBe("3.00");
    expect(formatNumber(-1234.5, { decimalPlaces: 1 })).toBe("-1,234.5");
  });
});

describe("parseDate", () => {
  it("parses as local midnight rather than UTC midnight", () => {
    // The suite pins TZ=UTC (vitest.config.ts, see src/test/tz.test.ts), so
    // local midnight and UTC midnight coincide here - this asserts the date
    // components land where expected without silently depending on a whole
    // day's offset masking a timezone bug.
    const date = parseDate("2024-03-15");
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // 0-indexed: March
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
  });
});

describe("formatDate", () => {
  it("formats with the default month/day/year options", () => {
    expect(formatDate("2024-03-15")).toBe("Mar 15, 2024");
  });

  it("honors custom Intl.DateTimeFormatOptions", () => {
    expect(formatDate("2024-01-01", { year: "numeric" })).toBe("2024");
  });
});

describe("formatRequestName", () => {
  it("formats a date range when both startDate and endDate are present", () => {
    const request: RequestSummary = {
      allocationType: "Explore",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      entryDate: "2023-12-01",
      status: "Active",
    };
    expect(formatRequestName(request)).toBe("Explore: Jan 1, 2024 to Dec 31, 2024");
  });

  it('uses "Started" for an Incomplete request with no date range', () => {
    const request: RequestSummary = {
      allocationType: "Discover",
      entryDate: "2024-05-01",
      status: "Incomplete",
    };
    expect(formatRequestName(request)).toBe("Discover: Started May 1, 2024");
  });

  it('uses "Submitted" for any other status with no date range', () => {
    const request: RequestSummary = {
      allocationType: "Accelerate",
      entryDate: "2024-06-15",
      status: "Pending",
    };
    expect(formatRequestName(request)).toBe("Accelerate: Submitted Jun 15, 2024");
  });
});

describe("parseResourceName", () => {
  it("extracts the parenthesized short name", () => {
    expect(parseResourceName("Bridges-2 (Bridges2)")).toEqual({
      full: "Bridges-2 (Bridges2)",
      short: "Bridges2",
    });
  });

  it("returns a null short name when there are no parens", () => {
    expect(parseResourceName("Expanse")).toEqual({ full: "Expanse", short: null });
  });

  // The regex is `^([^()]+) (\(([^)]+)\))?$` - the space before the optional
  // group is NOT part of the group, so a name with no trailing "(...)" and no
  // trailing space still matches with short: null, but a trailing space with
  // nothing after it does not match at all (the optional group can't consume
  // the dangling space), so `matches` is null and short falls back to null.
  it("falls back to a null short name for a dangling trailing space", () => {
    expect(parseResourceName("Expanse ")).toEqual({ full: "Expanse ", short: null });
  });

  // `[^()]+` can't span a paren, so a name with two paren groups doesn't match
  // the whole-string regex at all - this is a real limitation of the parser,
  // not a hypothetical.
  it("does not extract a short name when there are two parenthesized groups", () => {
    expect(parseResourceName("Foo (Bar) (Baz)")).toEqual({
      full: "Foo (Bar) (Baz)",
      short: null,
    });
  });
});

describe("sortResources", () => {
  // Only exercises one field at a time: the comparator ORs together three
  // "greater than" checks instead of a proper lexicographic chain (see the
  // BUG note below), so combining fields makes the result depend on
  // Array.sort's internal comparison order rather than any documented rule.
  it("sorts alphabetically by short/full name when isCredit and isActive are equal", () => {
    const a = { name: "Zeta", isCredit: false, isActive: true };
    const b = { name: "Alpha", isCredit: false, isActive: true };
    expect([a, b].sort(sortResources)).toEqual([b, a]);
  });

  it("sorts an active resource before an inactive one of the same credit-ness", () => {
    const active = { name: "A", isCredit: false, isActive: true };
    const inactive = { name: "A", isCredit: false, isActive: false };
    expect([inactive, active].sort(sortResources)).toEqual([active, inactive]);
  });

  // Counterintuitive given the name (one might expect credits sorted last),
  // but this is what `(a.isCredit ?? false) > (b.isCredit ?? false)` actually
  // does: true > false, so a credit resource sorts BEFORE a non-credit one
  // when that's the only difference.
  it("sorts a credit resource before a non-credit one of the same activity", () => {
    const credit = { name: "A", isCredit: true, isActive: false };
    const nonCredit = { name: "A", isCredit: false, isActive: false };
    expect([nonCredit, credit].sort(sortResources)).toEqual([credit, nonCredit]);
  });

  it("treats missing isCredit/isActive as false", () => {
    const withFlags = { name: "A", isCredit: false, isActive: false };
    const withoutFlags = { name: "A" };
    // Neither has a flag set, so they're equal on the first two clauses and
    // the tie should fall through to the (equal) name comparison.
    expect(sortResources(withFlags, withoutFlags)).toBe(1);
    expect(sortResources(withoutFlags, withFlags)).toBe(1);
  });

  // BUG: src/shared/helpers/utils.tsx:104-112. The comparator is not a valid
  // strict-weak-order - it only checks `a.field > b.field`, never
  // `a.field < b.field`, so when a field says "a should sort first" it still
  // falls through to compare the *next* field instead of returning +1
  // immediately. That produces genuine 3-way cycles (a<b, b<c, c<a), which
  // violates the contract Array.prototype.sort requires of its comparator
  // and makes multi-field results implementation-defined. Reproduced here,
  // not asserted as "correct" output:
  //   x = { isCredit: false, isActive: false, name: "A" }
  //   y = { isCredit: false, isActive: true,  name: "B" }
  //   z = { isCredit: true,  isActive: false, name: "A" }
  //   sortResources(x, y) === -1  (x before y)
  //   sortResources(y, z) === -1  (y before z)
  //   sortResources(z, x) === -1  (z before x) <- cycle
});

describe("coalesce", () => {
  it("returns the first defined, non-null value", () => {
    expect(coalesce(null, undefined, 3)).toBe(3);
  });

  it("returns null when every value is null or undefined", () => {
    expect(coalesce<number>(null, undefined)).toBeNull();
  });

  it("treats falsy-but-defined values (0, empty string) as present", () => {
    expect(coalesce(0, 5)).toBe(0);
    expect(coalesce("", "x")).toBe("");
  });
});

describe("formatArray", () => {
  it("returns a single item unwrapped, with no conjunction applied", () => {
    // Array.prototype.reduce with exactly one element and no initial value
    // returns that element without ever invoking the reducer.
    expect(formatArray(["Solo"])).toBe("Solo");
  });

  it("joins two items with the conjunction and no comma", () => {
    const { container } = renderNode(formatArray(["A", "B"]));
    expect(container.textContent).toBe("A and B");
  });

  it("joins three or more items with commas and a trailing conjunction", () => {
    const { container } = renderNode(formatArray(["A", "B", "C"]));
    expect(container.textContent).toBe("A, B and C");
  });

  it("honors a custom conjunction and separator", () => {
    const { container } = renderNode(formatArray(["A", "B"], "or"));
    expect(container.textContent).toBe("A or B");
  });

  // BUG: src/shared/helpers/utils.tsx:119-125. `items.reduce(...)` is called
  // with no initial value, so an empty array throws
  // "Reduce of empty array with no initial value" instead of returning ""
  // or null. formatManagers() (line 136) inherits this: a project with no
  // pi/co_pi/allocation_manager users would throw when rendered.
  it("throws on an empty array rather than returning an empty node", () => {
    expect(() => formatArray([])).toThrow(/Reduce of empty array/);
  });
});

describe("formatBoolean", () => {
  it("renders a check icon and Yes for true", () => {
    const { container } = renderNode(formatBoolean(true));
    expect(container.textContent).toBe(" Yes");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders an x icon and No for false", () => {
    const { container } = renderNode(formatBoolean(false));
    expect(container.textContent).toBe(" No");
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("formatManagers", () => {
  it("joins pi/co_pi/allocation_manager users and excludes plain users", () => {
    const project: ProjectSummary = {
      users: [
        { role: "pi", firstName: "Ada", lastName: "Lovelace" },
        { role: "user", firstName: "Grace", lastName: "Hopper" },
        { role: "co_pi", firstName: "Alan", lastName: "Turing" },
        { role: "allocation_manager", firstName: "Katherine", lastName: "Johnson" },
      ],
    };
    const { container } = renderNode(formatManagers(project));
    expect(container.textContent).toBe("Ada Lovelace, Alan Turing or Katherine Johnson");
  });
});

describe("icon", () => {
  it("renders a known icon name as an svg", () => {
    const { container } = renderNode(icon("chevron-right"));
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("returns null for an unknown icon name", () => {
    expect(icon("not-a-real-icon")).toBeNull();
  });
});

describe("singularize", () => {
  it("strips a trailing s when count is exactly 1", () => {
    expect(singularize("credits", 1)).toBe("credit");
  });

  it("leaves the name alone for any count other than 1", () => {
    expect(singularize("credits", 2)).toBe("credits");
    expect(singularize("credits", 0)).toBe("credits");
  });

  it("leaves a name that doesn't end in s alone even at count 1", () => {
    expect(singularize("core-hour", 1)).toBe("core-hour");
  });

  // Naive by design: it only strips a trailing "s", so a genuinely irregular
  // plural is mangled rather than correctly singularized. Documented here as
  // the function's actual (limited) behavior, not "fixed".
  it("mangles an irregular plural rather than correctly singularizing it", () => {
    expect(singularize("batches", 1)).toBe("batche");
  });
});

describe("formatExchangeRate", () => {
  it("singularizes the credit name and unit when the unit cost is 1", () => {
    expect(formatExchangeRate("hour", 1, "ACCESS Credits")).toBe("1 ACCESS Credit / hour");
  });

  it("keeps the credit name plural when the unit cost is not 1", () => {
    expect(formatExchangeRate("hour", 2.5, "ACCESS Credits")).toBe("2.5 ACCESS Credits / hour");
  });

  it("always singularizes the unit itself (count is hardcoded to 1)", () => {
    expect(formatExchangeRate("core-hours", 1, "Credits")).toBe("1 Credit / core-hour");
  });
});

describe("getResourceUsagePercent", () => {
  it("returns 0 when there are no resources", () => {
    expect(getResourceUsagePercent({ resources: [] })).toBe(0);
  });

  it("returns 0 when every resource is boolean (excluded from the total)", () => {
    const request = {
      resources: [
        { isBoolean: true, allocated: 10, used: 5, exchangeRates: { base: { unitCost: 1 } } },
      ],
    };
    expect(getResourceUsagePercent(request)).toBe(0);
  });

  it("weights usage by allocation and unit cost across resources", () => {
    const request = {
      resources: [
        { allocated: 100, used: 50, exchangeRates: { base: { unitCost: 2 } } },
        { allocated: 50, used: 50, exchangeRates: { base: { unitCost: 1 } } },
      ],
    };
    // total = 100*2 + 50*1 = 250; used = 50*2 + 50*1 = 150; 150/250 = 0.6
    expect(getResourceUsagePercent(request)).toBe(0.6);
  });

  it("clamps used at allocated so over-use can't push the percent past 1", () => {
    const request = {
      resources: [{ allocated: 100, used: 150, exchangeRates: { base: { unitCost: 1 } } }],
    };
    expect(getResourceUsagePercent(request)).toBe(1);
  });
});

describe("getCost", () => {
  const exchangeRates = { base: { unitCost: 10 }, current: { unitCost: 20 } };

  it("uses the base unit cost when requested equals allocated", () => {
    const res = { requested: 100, allocated: 100, exchangeRates };
    // difference = (100-100)*10 = 0; total = 0 + 100*10 = 1000
    expect(getCost(res, "difference")).toBe(0);
    expect(getCost(res, "total")).toBe(1000);
    expect(getCost(res)).toBe(1000); // defaults to "total"
  });

  it("uses the base unit cost when requested is below allocated (a decrease)", () => {
    const res = { requested: 50, allocated: 100, exchangeRates };
    // difference = (50-100)*10 = -500; total = -500 + 100*10 = 500
    expect(getCost(res, "difference")).toBe(-500);
    expect(getCost(res, "total")).toBe(500);
  });

  it("switches to the current unit cost when requested exceeds allocated (an increase)", () => {
    const res = { requested: 150, allocated: 100, exchangeRates };
    // difference = (150-100)*20 = 1000; total = 1000 + 100*10 = 2000
    expect(getCost(res, "difference")).toBe(1000);
    expect(getCost(res, "total")).toBe(2000);
  });
});
