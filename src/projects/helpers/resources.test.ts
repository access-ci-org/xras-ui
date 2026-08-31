import { describe, expect, it } from "vitest";
import {
  belowMinimum,
  cleanBalance,
  getBalance,
  groupAvailableResources,
  resourceAlertKind,
} from "./resources";
import type { Resource } from "../types";

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    allocated: 0,
    decimalPlaces: 0,
    exchangeRates: {
      base: { type: "base", unitCost: 1 },
      current: { type: "current", unitCost: 1 },
    },
    icon: "compute",
    isActive: true,
    isBoolean: false,
    isCredit: false,
    isFake: false,
    isUnderReview: false,
    isNew: false,
    minimumExchange: 0,
    name: "Bridges-3",
    negativeOnly: false,
    resourceProvider: { name: "PSC" },
    requested: 0,
    resourceId: 1,
    type: "Compute",
    unit: "Core Hours",
    used: 0,
    ...overrides,
  };
}

// The credit resource is what pays for an increase. Its `requested` is the
// credit balance and its *base* unit cost converts that balance into dollars of
// buying power, so both are needed to say what the project can afford.
const makeCredit = (requested: number, unitCost = 1) =>
  makeResource({
    resourceId: 99,
    isCredit: true,
    name: "ACCESS Credits",
    requested,
    exchangeRates: { base: { type: "base", unitCost }, current: { type: "current", unitCost } },
  });

describe("getBalance", () => {
  it("is what would be left once the exchange completes, not what is left today", () => {
    // `requested` is the post-exchange total, so the balance shown in the grid
    // moves as soon as the user edits it, before anything is submitted.
    expect(getBalance(makeResource({ requested: 100, used: 30 }))).toBe(70);
    expect(getBalance(makeResource({ requested: 20, used: 50 }))).toBe(-30);
  });
});

describe("belowMinimum", () => {
  it("only applies to a newly added resource asking for a non-zero amount", () => {
    const args = { minimumExchange: 1000, requested: 500 };
    expect(belowMinimum(makeResource({ ...args, isNew: true }))).toBe(true);
    // An existing resource is grandfathered - the minimum is an *initial*
    // request rule.
    expect(belowMinimum(makeResource({ ...args, isNew: false }))).toBe(false);
    // Zero is how a resource added by mistake gets backed out again, so it can
    // never be below the minimum.
    expect(belowMinimum(makeResource({ ...args, isNew: true, requested: 0 }))).toBe(false);
    expect(belowMinimum(makeResource({ ...args, isNew: true, requested: 1000 }))).toBe(false);
  });
});

describe("cleanBalance", () => {
  it("strips the formatting the field displays", () => {
    const row = makeResource({ allocated: 5000, used: 0, requested: 5000 });
    expect(cleanBalance("1,000", row, makeCredit(0))).toBe(1000);
  });

  it("refuses to reduce a balance below zero, or below what is already spent", () => {
    // Nothing can be given back that has already been used.
    const row = makeResource({ allocated: 100, used: 20, requested: 100 });
    expect(cleanBalance("-50", row, makeCredit(1000))).toBe(0);

    // An over-spent allocation has a negative floor: the balance is already
    // below zero and the exchange cannot make that worse.
    const overspent = makeResource({ allocated: 100, used: 150, requested: 100 });
    expect(cleanBalance("-100", overspent, makeCredit(1000))).toBe(-50);
  });

  it("allows no increase at all when there are no credits to spend", () => {
    const row = makeResource({ allocated: 100, used: 20, requested: 100 });
    expect(cleanBalance("50", row, undefined)).toBe(50);
    // The ceiling is the balance the project already has.
    expect(cleanBalance("100", row, undefined)).toBe(80);
  });

  it("buys an increase at the current exchange rate", () => {
    // 50 credits at a current cost of 2 per unit buys 25 units on top of the
    // existing balance of 80.
    const row = makeResource({
      allocated: 100,
      used: 20,
      requested: 100,
      exchangeRates: { base: { type: "base", unitCost: 1 }, current: { type: "current", unitCost: 2 } },
    });
    expect(cleanBalance("150", row, makeCredit(50))).toBe(105);
  });

  it("restores a reduction at the base rate rather than charging the new one", () => {
    // The case the split exists for. The user dropped 100 -> 60 and got 40
    // credits back at the base rate of 1; the current rate has since doubled.
    // Undoing that edit must cost exactly what it refunded, or the form would
    // punish the user for a change they never submitted.
    const row = makeResource({
      allocated: 100,
      used: 0,
      requested: 60,
      exchangeRates: { base: { type: "base", unitCost: 1 }, current: { type: "current", unitCost: 2 } },
    });
    expect(cleanBalance("100", row, makeCredit(40))).toBe(100);
    // And no further, because restoring consumed every credit.
    expect(cleanBalance("120", row, makeCredit(40))).toBe(100);
  });

  it("splits an increase at the current allocation, base rate below and current rate above", () => {
    // 60 credits: 40 restore the reduction at the base rate of 1 (40 units),
    // and the remaining 20 buy at the current rate of 2 (10 units).
    const row = makeResource({
      allocated: 100,
      used: 0,
      requested: 60,
      exchangeRates: { base: { type: "base", unitCost: 1 }, current: { type: "current", unitCost: 2 } },
    });
    expect(cleanBalance("999", row, makeCredit(60))).toBe(110);
  });

  it("rounds the ceiling down, never up, at the resource's precision", () => {
    // Rounding a ceiling to nearest would offer a fraction of a unit the
    // project cannot pay for.
    const row = makeResource({
      decimalPlaces: 2,
      allocated: 0,
      used: 0,
      requested: 0,
      exchangeRates: { base: { type: "base", unitCost: 3 }, current: { type: "current", unitCost: 3 } },
    });
    expect(cleanBalance("1", row, makeCredit(1))).toBe(0.33);
  });

  it("treats input it cannot parse as no change", () => {
    // The sanitizer removes characters but not shapes, so these reach `Number`
    // intact and come back NaN. NaN fails every comparison, so it used to slip
    // past both clamps and be written into the field as the string "NaN".
    const row = makeResource({ allocated: 100, used: 20, requested: 90 });
    expect(cleanBalance("1.2.3", row, makeCredit(1000))).toBe(70);
    expect(cleanBalance("1-2", row, makeCredit(1000))).toBe(70);
    expect(getBalance(row)).toBe(70);
    // An empty or wholly non-numeric field still means zero, as it always has:
    // `Number("")` is 0, and the floor clamp takes it from there.
    expect(cleanBalance("", row, makeCredit(1000))).toBe(0);
    expect(cleanBalance("abc", row, makeCredit(1000))).toBe(0);
  });
});

describe("groupAvailableResources", () => {
  const gpu = makeResource({ resourceId: 1, name: "Delta GPU", type: "GPU", unit: "GPU Hours" });
  const cheap = makeResource({
    resourceId: 2,
    name: "Anvil CPU",
    type: "Compute",
    unit: "Core Hours",
    exchangeRates: { base: { type: "base", unitCost: 1 }, current: { type: "current", unitCost: 1 } },
  });
  const pricey = makeResource({
    resourceId: 3,
    name: "Aardvark CPU",
    type: "Compute",
    unit: "Core Hours",
    exchangeRates: { base: { type: "base", unitCost: 1 }, current: { type: "current", unitCost: 9 } },
  });

  it("groups by type and unit, cheapest option first, groups alphabetical", () => {
    const groups = groupAvailableResources([pricey, gpu, cheap], []);

    expect(groups).toEqual([
      {
        label: "Compute Resources (Core Hours)",
        options: [
          { value: 2, label: "Anvil CPU" },
          { value: 3, label: "Aardvark CPU" },
        ],
      },
      { label: "GPU Resources (GPU Hours)", options: [{ value: 1, label: "Delta GPU" }] },
    ]);
  });

  it("breaks a unit-cost tie on name, not on input order", () => {
    const groups = groupAvailableResources([pricey, { ...cheap, exchangeRates: pricey.exchangeRates }], []);

    expect(groups[0].options.map((option) => option.label)).toEqual(["Aardvark CPU", "Anvil CPU"]);
  });

  it("drops the resources already on the request, and the group with them", () => {
    const groups = groupAvailableResources([pricey, gpu, cheap], [1, 3]);

    expect(groups).toEqual([
      { label: "Compute Resources (Core Hours)", options: [{ value: 2, label: "Anvil CPU" }] },
    ]);
  });

  // A decommissioned resource can only have its existing balance exchanged
  // *down*, so there is nothing to be gained by adding one to a request that
  // doesn't already hold a balance on it.
  it("drops decommissioned resources, and the group with them", () => {
    const retired = makeResource({
      resourceId: 4,
      name: "Retired Cluster",
      type: "GPU",
      unit: "GPU Hours",
      negativeOnly: true,
    });

    const groups = groupAvailableResources([cheap, gpu, retired], []);

    expect(groups).toEqual([
      { label: "Compute Resources (Core Hours)", options: [{ value: 2, label: "Anvil CPU" }] },
      { label: "GPU Resources (GPU Hours)", options: [{ value: 1, label: "Delta GPU" }] },
    ]);

    expect(groupAvailableResources([retired], [])).toEqual([]);
  });

  it("leads with the abbreviation, which is the part a user scanning recognises", () => {
    const groups = groupAvailableResources(
      [
        makeResource({ resourceId: 4, name: "Pittsburgh Supercomputing Center (Bridges2)" }),
        makeResource({ resourceId: 5, name: "Jetstream2" }),
      ],
      [],
    );

    // Note the order: the tie-break sorts on the raw `name`, so "Jetstream2"
    // beats "Pittsburgh Supercomputing Center (Bridges2)" even though the
    // labels the user reads are "Jetstream2" and "Bridges2 (...)". Longstanding
    // behavior, and inconsistent with `sortResources`, which sorts on the
    // abbreviation via `getSortResourceName`. Pinned as-is rather than changed:
    // switching it is a visible reordering, not part of this extraction.
    expect(groups[0].options.map((option) => option.label)).toEqual([
      "Jetstream2",
      "Bridges2 (Pittsburgh Supercomputing Center)",
    ]);
  });
});

describe("resourceAlertKind", () => {
  const nothingWrong = {
    saved: false,
    error: false,
    errorMessages: [] as string[],
    previous: false,
    timeStatus: "current",
    isManager: true,
    hasUnmetDeps: false,
    anyBelowMinimum: false,
  };
  const piStatusMessage =
    "The PI has a person status Unknown and cannot make an allocation request.";

  it("says nothing when there is nothing to say", () => {
    expect(resourceAlertKind(nothingWrong)).toBe(null);
  });

  it("reports a successful submission ahead of everything else", () => {
    // A submitted exchange makes every other banner stale, including errors
    // left over from a previous attempt.
    expect(
      resourceAlertKind({
        ...nothingWrong,
        saved: true,
        error: true,
        errorMessages: [piStatusMessage],
        previous: true,
        hasUnmetDeps: true,
      }),
    ).toBe("submitted");
  });

  it("singles out the unknown-PI-status failure from other errors", () => {
    expect(
      resourceAlertKind({ ...nothingWrong, error: true, errorMessages: [piStatusMessage] }),
    ).toBe("pi-status-unknown");
    expect(
      resourceAlertKind({ ...nothingWrong, error: true, errorMessages: ["Something else broke"] }),
    ).toBe("error");
    // Only the first message is examined, which is worth knowing: the specific
    // banner is lost if the server ever reorders them.
    expect(
      resourceAlertKind({
        ...nothingWrong,
        error: true,
        errorMessages: ["Something else broke", piStatusMessage],
      }),
    ).toBe("error");
    // `error` has to be set - a stale message list on its own is not a failure.
    expect(resourceAlertKind({ ...nothingWrong, errorMessages: [piStatusMessage] })).toBe(null);
  });

  it("prefers the pending-exchange notice to the read-only warning", () => {
    // The precedence that was hardest to see inline, and the one most likely to
    // be reversed by accident. Someone who cannot manage the project and has an
    // exchange under review is told about the review, because that explains why
    // the numbers below are not the current ones.
    expect(resourceAlertKind({ ...nothingWrong, previous: true, isManager: false })).toBe(
      "pending-exchange",
    );
  });

  it("only warns about permissions on the request that is currently in effect", () => {
    expect(resourceAlertKind({ ...nothingWrong, isManager: false })).toBe("not-manager");
    // A past or future request is read-only for everyone, so singling out this
    // user's permissions would be misleading.
    expect(resourceAlertKind({ ...nothingWrong, isManager: false, timeStatus: "past" })).toBe(null);
  });

  it("asks for dependencies before minimums, since a dependency can add a resource", () => {
    // Adding the missing dependency changes which minimums apply, so there is
    // no point asking about both at once.
    expect(
      resourceAlertKind({ ...nothingWrong, hasUnmetDeps: true, anyBelowMinimum: true }),
    ).toBe("unmet-dependencies");
    expect(resourceAlertKind({ ...nothingWrong, anyBelowMinimum: true })).toBe("below-minimum");
  });
});
