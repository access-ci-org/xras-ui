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
  noManagers,
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
  const resource = (over = {}) => ({ name: "A", isCredit: false, isActive: false, ...over });

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
  // but credits-first is the long-standing intent, so it is pinned here.
  it("sorts a credit resource before a non-credit one of the same activity", () => {
    const credit = { name: "A", isCredit: true, isActive: false };
    const nonCredit = { name: "A", isCredit: false, isActive: false };
    expect([nonCredit, credit].sort(sortResources)).toEqual([credit, nonCredit]);
  });

  it("treats missing isCredit/isActive as false", () => {
    const withFlags = { name: "A", isCredit: false, isActive: false };
    const withoutFlags = { name: "A" };
    // Equal on both flags and on name, so this is a genuine tie.
    expect(sortResources(withFlags, withoutFlags)).toBe(0);
    expect(sortResources(withoutFlags, withFlags)).toBe(0);
  });

  // The tiers have to cascade in order of precedence. The previous
  // implementation OR-ed three `a.field > b.field` checks together, so a tier
  // favoring `b` fell through and let a lower tier decide - these two cases
  // are what that got wrong.
  // Asserted on the comparator directly, in both directions, rather than
  // through `.sort()`: a two-element sort only calls the comparator once, and
  // which way round is up to the engine, so a `.sort()` assertion here can
  // pass against a broken comparator by luck.
  it("lets isCredit outrank both isActive and name", () => {
    const credit = resource({ isCredit: true, isActive: false, name: "Zeta" });
    const active = resource({ isCredit: false, isActive: true, name: "Alpha" });
    expect(sortResources(credit, active)).toBeLessThan(0);
    expect(sortResources(active, credit)).toBeGreaterThan(0);
  });

  it("lets isActive outrank name", () => {
    const active = resource({ isActive: true, name: "Zeta" });
    const inactive = resource({ isActive: false, name: "Alpha" });
    expect(sortResources(active, inactive)).toBeLessThan(0);
    expect(sortResources(inactive, active)).toBeGreaterThan(0);
  });

  // Array.prototype.sort gives implementation-defined output for a comparator
  // that isn't a consistent ordering, so these two properties are the actual
  // contract - not any single pairwise result. Brute-forced over every
  // combination of the three fields rather than spot-checked, because the
  // original bug only showed up on specific triples.
  const permutations = [false, true].flatMap((isCredit) =>
    [false, true].flatMap((isActive) =>
      ["Alpha", "Zeta"].map((name) => resource({ isCredit, isActive, name })),
    ),
  );

  it("is antisymmetric for every combination of fields", () => {
    for (const x of permutations)
      for (const y of permutations)
        // Summed rather than negated-and-compared: Math.sign returns -0 for a
        // tie, and toBe uses Object.is, which distinguishes +0 from -0.
        expect(Math.sign(sortResources(x, y)) + Math.sign(sortResources(y, x))).toBe(0);
  });

  it("is transitive for every combination of fields", () => {
    for (const x of permutations)
      for (const y of permutations)
        for (const z of permutations)
          if (sortResources(x, y) <= 0 && sortResources(y, z) <= 0)
            expect(sortResources(x, z)).toBeLessThanOrEqual(0);
  });
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

  // The reduce has no initial value (that is what makes the two cases above
  // work), so an empty array would throw "Reduce of empty array with no
  // initial value" without the early return guarding it.
  it("returns null for an empty array instead of throwing", () => {
    expect(formatArray([])).toBeNull();

    const { container } = renderNode(formatArray([]));
    expect(container.textContent).toBe("");
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

  // The reachable route into formatArray's empty case: the role filter matches
  // nothing, so the render used to throw. Three components drop this straight
  // into "Please contact ... to request a change" (Resources.tsx,
  // OverviewResources.tsx, Users.tsx), so a project whose user list is empty
  // or carries only plain users took the whole panel down with it - and a
  // blank would have left a hole in the sentence, hence the generic phrase.
  it("falls back to the generic role phrase when a project has no managers", () => {
    const noUsers: ProjectSummary = { users: [] };
    const onlyPlainUsers: ProjectSummary = {
      users: [{ role: "user", firstName: "Grace", lastName: "Hopper" }],
    };

    expect(formatManagers(noUsers)).toBe(noManagers);
    expect(formatManagers(onlyPlainUsers)).toBe(noManagers);
    expect(noManagers).toBe("your PI, Co-PI, or Allocation Manager");
  });

  // The sentence the three call sites build, end to end.
  it("reads correctly mid-sentence with and without managers", () => {
    const withPi: ProjectSummary = {
      users: [{ role: "pi", firstName: "Ada", lastName: "Lovelace" }],
    };

    const sentence = (project: ProjectSummary) =>
      renderNode(
        createElement(Fragment, null, "Please contact ", formatManagers(project), " to request a change."),
      ).container.textContent;

    expect(sentence(withPi)).toBe("Please contact Ada Lovelace to request a change.");
    expect(sentence({ users: [] })).toBe(
      "Please contact your PI, Co-PI, or Allocation Manager to request a change.",
    );
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
