import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getUpgrade } from "@/projects/helpers/upgrades";
import type { Action, AllowedAction, Request, Resource } from "@/projects/types";

// getUpgrade() is the only export; canRenewNormally/receivedAllCredits/
// needsMoreCredits/calculateCredits are internal and only reachable through
// it, so every branch below is driven end-to-end through getUpgrade().

function makeCreditResource(allocated: number, overrides: Partial<Resource> = {}): Resource {
  return {
    allocated,
    decimalPlaces: 0,
    exchangeRates: {
      base: { type: "base", unitCost: 1 },
      current: { type: "current", unitCost: 1 },
    },
    icon: "cash-coin",
    isActive: true,
    isBoolean: false,
    isCredit: true,
    isFake: false,
    isUnderReview: false,
    isNew: false,
    minimumExchange: 0,
    name: "ACCESS Credits",
    resourceProvider: { name: "ACCESS" },
    requested: allocated,
    resourceId: 1,
    unit: "credit",
    used: 0,
    ...overrides,
  };
}

function makeAction(overrides: Partial<Action> = {}): Action {
  return {
    actionId: 1,
    allowedOperations: [],
    detailAvailable: false,
    date: "2026-01-01",
    deleteStatus: null,
    isRequest: false,
    resources: [],
    showDeleteModal: false,
    status: "Approved",
    type: "Award",
    ...overrides,
  };
}

function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    actions: [],
    allocationType: "Explore",
    allowedActions: {},
    endDate: null,
    entryDate: "2026-01-01",
    exchangeActionId: null,
    exchangeActionEditable: false,
    exchangeErrors: [],
    exchangeStatus: null,
    grantNumber: "TEST000001",
    isMaximize: false,
    requestId: 1,
    resources: [],
    resourcesReason: "",
    returnedForCorrections: false,
    returnedForCorrectionsNotes: "",
    showActionsModal: false,
    showConfirmModal: false,
    showResourcesModal: false,
    startDate: null,
    status: "Active",
    timeStatus: "current",
    type: "New",
    usageDetail: null,
    usageDetailStatus: null,
    usesCredits: true,
    ...overrides,
  };
}

function makeRenewalAction(overrides: Partial<AllowedAction> = {}): AllowedAction {
  return { name: "Renewal", resources: [], ...overrides };
}

// canRenewNormally()/receivedAllCredits()/needsMoreCredits() all key off "now"
// (via `new Date()` and `request.endDate`), so pin the clock rather than
// computing offsets from the real wall clock - otherwise a test run near a
// day boundary could flip a result.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getUpgrade", () => {
  describe("non-credit allocation types (not in the upgrade map)", () => {
    it("falls back to normal renewal rules and never sets allocationType", () => {
      const request = makeRequest({ allocationType: "Maximize", allowedActions: { Renewal: [] } });
      expect(getUpgrade(request, [])).toEqual({ isEnabled: false, isRenewalEnabled: true });
    });

    it("reports isRenewalEnabled: false when Renewal isn't an allowed action", () => {
      const request = makeRequest({ allocationType: "Maximize", allowedActions: {} });
      expect(getUpgrade(request, [])).toEqual({ isEnabled: false, isRenewalEnabled: false });
    });
  });

  describe("credit-based allocation types", () => {
    it("disables the upgrade (and renewal) when Renewal isn't allowed at all", () => {
      const request = makeRequest({ allocationType: "Explore", allowedActions: {} });
      expect(getUpgrade(request, [])).toEqual({
        isEnabled: false,
        allocationType: "Discover",
        isRenewalEnabled: false,
      });
    });

    it("defers to normal renewal once inside the 30-day renewal window (boundary: exactly 30 days out)", () => {
      const request = makeRequest({
        allocationType: "Explore",
        endDate: "2026-01-31", // exactly 30 days after the pinned "now"
        allowedActions: { Renewal: [] },
      });
      expect(getUpgrade(request, [])).toEqual({
        isEnabled: false,
        allocationType: "Discover",
        isRenewalEnabled: true,
      });
    });

    it("still evaluates for an upgrade one day earlier in the window (boundary: exactly 31 days out)", () => {
      // Same shape as the 30-day case but crossing the `< 31` boundary the
      // other way - canRenewNormally is false, so isRenewalEnabled is
      // explicitly set to false and evaluation continues into the credit
      // checks instead of returning immediately.
      const request = makeRequest({
        allocationType: "Explore",
        endDate: "2026-02-01", // exactly 31 days after the pinned "now"
        allowedActions: { Renewal: [] },
        actions: [], // no credits at all -> receivedAllCredits() is false
      });
      expect(getUpgrade(request, [])).toEqual({
        isEnabled: false,
        allocationType: "Discover",
        isRenewalEnabled: false,
      });
    });

    it("withholds the upgrade until the first-half credits have actually been received", () => {
      const request = makeRequest({
        allocationType: "Explore", // full award is 400,000
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [makeAction({ resources: [makeCreditResource(100_000)] })], // well under full award, no supplement
      });
      expect(getUpgrade(request, [])).toEqual({
        isEnabled: false,
        allocationType: "Discover",
        isRenewalEnabled: false,
      });
    });

    it("treats an approved Supplement carrying credits as having received the full award", () => {
      const request = makeRequest({
        allocationType: "Explore",
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [
          makeAction({ resources: [makeCreditResource(100_000)] }),
          makeAction({ type: "Supplement", status: "Approved", resources: [makeCreditResource(50_000)] }),
          // exchange away almost everything so needsMoreCredits (usage >= 0.9) is also true
          makeAction({ type: "Exchange", resources: [makeCreditResource(-140_000)] }),
        ],
        // usage = exchanged/allocated = 140,000/150,000 ≈ 0.933 >= 0.9
      });
      const renewalActions = [makeRenewalAction({ opportunityName: "Discover ACCESS", opportunityId: 42 })];
      expect(getUpgrade(request, renewalActions)).toEqual({
        isEnabled: true,
        allocationType: "Discover",
        isRenewalEnabled: false,
        opportunityId: 42,
      });
    });

    it("withholds the upgrade while usage is under the Explore threshold (0.9)", () => {
      const request = makeRequest({
        allocationType: "Explore",
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [
          makeAction({ resources: [makeCreditResource(400_000)] }), // reaches full award directly
          makeAction({ type: "Exchange", resources: [makeCreditResource(-100_000)] }),
        ],
        // usage = 100,000/400,000 = 0.25, below the 0.9 Explore threshold
      });
      const renewalActions = [makeRenewalAction({ opportunityName: "Discover ACCESS", opportunityId: 42 })];
      expect(getUpgrade(request, renewalActions)).toEqual({
        isEnabled: false,
        allocationType: "Discover",
        isRenewalEnabled: false,
      });
    });

    it("uses the lower 0.75 usage threshold for Discover", () => {
      const request = makeRequest({
        allocationType: "Discover", // full award is 1,500,000
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [
          makeAction({ resources: [makeCreditResource(1_500_000)] }),
          makeAction({ type: "Exchange", resources: [makeCreditResource(-1_200_000)] }),
        ],
        // usage = 1,200,000/1,500,000 = 0.8 >= 0.75
      });
      const renewalActions = [makeRenewalAction({ opportunityName: "Accelerate ACCESS", opportunityId: 7 })];
      expect(getUpgrade(request, renewalActions)).toEqual({
        isEnabled: true,
        allocationType: "Accelerate",
        isRenewalEnabled: false,
        opportunityId: 7,
      });
    });

    it("bases Accelerate's threshold on exchanged amount vs. 75% of full award, not a usage ratio", () => {
      const request = makeRequest({
        allocationType: "Accelerate", // full award is 3,000,000; 0.75 of it is 2,250,000
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [
          makeAction({ resources: [makeCreditResource(3_000_000)] }),
          makeAction({ type: "Exchange", resources: [makeCreditResource(-2_300_000)] }),
        ],
        // exchanged = 2,300,000 >= 2,250,000
      });
      const renewalActions = [makeRenewalAction({ opportunityName: "Maximize ACCESS – March 2026", opportunityId: 99 })];
      expect(getUpgrade(request, renewalActions)).toEqual({
        isEnabled: true,
        allocationType: "Maximize",
        isRenewalEnabled: false,
        opportunityId: 99,
      });
    });

    it("does not enable the upgrade when exchanged is just under Accelerate's 75% threshold", () => {
      const request = makeRequest({
        allocationType: "Accelerate",
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [
          makeAction({ resources: [makeCreditResource(3_000_000)] }),
          makeAction({ type: "Exchange", resources: [makeCreditResource(-2_249_999)] }),
        ],
      });
      const renewalActions = [makeRenewalAction({ opportunityName: "Maximize ACCESS", opportunityId: 99 })];
      expect(getUpgrade(request, renewalActions)).toEqual({
        isEnabled: false,
        allocationType: "Maximize",
        isRenewalEnabled: false,
      });
    });

    it("leaves the upgrade disabled when no renewal opportunity name matches the target allocation type", () => {
      const request = makeRequest({
        allocationType: "Explore",
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [
          makeAction({ resources: [makeCreditResource(400_000)] }),
          makeAction({ type: "Exchange", resources: [makeCreditResource(-380_000)] }),
        ],
      });
      // Neither opportunity name contains "Discover".
      const renewalActions = [
        makeRenewalAction({ opportunityName: "Explore ACCESS", opportunityId: 1 }),
        makeRenewalAction({ opportunityName: "Accelerate ACCESS", opportunityId: 2 }),
      ];
      expect(getUpgrade(request, renewalActions)).toEqual({
        isEnabled: false,
        allocationType: "Discover",
        isRenewalEnabled: false,
      });
    });

    it("skips non-matching renewal actions before finding the matching one", () => {
      const request = makeRequest({
        allocationType: "Explore",
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [
          makeAction({ resources: [makeCreditResource(400_000)] }),
          makeAction({ type: "Exchange", resources: [makeCreditResource(-380_000)] }),
        ],
      });
      const renewalActions = [
        makeRenewalAction({ opportunityName: "Accelerate ACCESS", opportunityId: 2 }),
        makeRenewalAction({ opportunityName: "Discover ACCESS", opportunityId: 42 }),
      ];
      expect(getUpgrade(request, renewalActions)).toEqual({
        isEnabled: true,
        allocationType: "Discover",
        isRenewalEnabled: false,
        opportunityId: 42,
      });
    });

    it("ignores non-Approved actions when calculating credits", () => {
      const request = makeRequest({
        allocationType: "Explore",
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [
          makeAction({ status: "Pending", resources: [makeCreditResource(400_000)] }),
        ],
      });
      // The only action is Pending, so calculateCredits sees no credits at
      // all, and receivedAllCredits() is false (0 >= 400,000 is false, and
      // there's no approved Supplement to fall back on).
      expect(getUpgrade(request, [])).toEqual({
        isEnabled: false,
        allocationType: "Discover",
        isRenewalEnabled: false,
      });
    });

    it("ignores non-credit resources when calculating credits", () => {
      const request = makeRequest({
        allocationType: "Explore",
        endDate: "2026-02-01",
        allowedActions: { Renewal: [] },
        actions: [
          makeAction({ resources: [makeCreditResource(400_000, { isCredit: false })] }),
        ],
      });
      expect(getUpgrade(request, [])).toEqual({
        isEnabled: false,
        allocationType: "Discover",
        isRenewalEnabled: false,
      });
    });
  });
});
