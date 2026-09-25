import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import {
  addExchangeRateAtom,
  allowedActionsOptionsAtom,
  availableAllocationTypesAtom,
  availableResourcesAtom,
  changeAllowedActionAtom,
  changeCommentAtom,
  changeRequiredResourceAtom,
  dateErrorsAtom,
  deleteExchangeRateAtom,
  errorsAtom,
  fetchResourceDataAtom,
  loadingAtom,
  relativeUrlRootAtom,
  requiredResourceNamesAtom,
  resourceDataAtom,
  resourceDetailsAtom,
  resourceIdAtom,
  resourceTypesOptionsAtom,
  saveAllocationTypeAtom,
  saveRequiredResourcesAtom,
  submitResourceAtom,
  successMessageAtom,
  unitTypesOptionsAtom,
  updateAllocationAtom,
  updateBaseRateAtom,
  updateRateDateAtom,
  updateRateValueAtom,
  updateResourceFieldAtom,
  usesExchangeRatesAtom,
} from "@/edit-resource/atoms";
import type { AllocationType, DiscountRate, ResourceData } from "@/edit-resource/types";

const ROOT = "https://example.test";
const RESOURCE_ID = 42;

// `updateRateDateAtom` reads its floor as `new Date().toISOString().split("T")[0]`
// on each call. Deriving all fixture dates from "today" (as computed here, at
// test-run time) rather than hardcoding calendar dates keeps every assertion
// correct regardless of what day the suite runs on - both values come from the
// same clock instant modulo UTC-midnight, and `vitest.config.ts` pins TZ=UTC so
// both computations agree. The date rules themselves take their bounds as
// arguments and are tested against fixed dates in
// `helpers/exchangeRates.test.ts`; what is left here is the wiring.
const TODAY = new Date().toISOString().split("T")[0];

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

function makeAllocationType(overrides: Partial<AllocationType> = {}): AllocationType {
  return {
    allocation_type_id: 1,
    display_name: "Startup",
    allowed_action: { resource_state_type_id: 1 },
    comment: "",
    required_resources: [],
    ...overrides,
  };
}

function makeResourceData(overrides: Partial<ResourceData> = {}): ResourceData {
  return {
    resource_details: {
      resource_name: "Bridges-3",
      description: "A resource",
      resource_type_id: 1,
      unit_type_id: 1,
      min_exchange: 1,
      dollar_value: 1,
      allocation_types: [makeAllocationType()],
    },
    ...overrides,
  };
}

describe("fetchResourceDataAtom", () => {
  it("on success: sets resourceDataAtom, clears errors, and toggles loading true then false", async () => {
    const fixture = makeResourceData();
    server.use(
      http.get(`${ROOT}/resources/${RESOURCE_ID}.json`, () => HttpResponse.json(fixture)),
    );

    const store = createStore();
    store.set(relativeUrlRootAtom, ROOT);
    store.set(resourceIdAtom, RESOURCE_ID);
    // loadingAtom defaults to true; reset it so the true->false transition
    // during the fetch is actually observable rather than a no-op re-set.
    store.set(loadingAtom, false);

    const loadingHistory: boolean[] = [];
    store.sub(loadingAtom, () => loadingHistory.push(store.get(loadingAtom)));

    await store.set(fetchResourceDataAtom);

    expect(loadingHistory).toEqual([true, false]);
    expect(store.get(loadingAtom)).toBe(false);
    expect(store.get(resourceDataAtom)).toEqual(fixture);
    expect(store.get(errorsAtom)).toEqual([]);
  });

  it("on an unhandled/failed request: leaves resourceDataAtom null, populates errorsAtom, and still ends loading=false", async () => {
    const store = createStore();
    store.set(relativeUrlRootAtom, ROOT);
    store.set(resourceIdAtom, RESOURCE_ID);
    store.set(loadingAtom, false);

    const loadingHistory: boolean[] = [];
    store.sub(loadingAtom, () => loadingHistory.push(store.get(loadingAtom)));

    // No MSW handler registered for this URL -> the terminal catch-all in
    // src/test/msw.ts rejects the fetch, exercising the atom's catch block.
    await store.set(fetchResourceDataAtom);

    expect(loadingHistory).toEqual([true, false]);
    expect(store.get(resourceDataAtom)).toBeNull();
    expect(store.get(errorsAtom)).toEqual([
      "Failed to fetch resource data. Please try again later.",
    ]);
  });
});

describe("derived atoms", () => {
  it("map raw resource data into UI-shaped values", () => {
    const fixture = makeResourceData({
      uses_exchange_rates: true,
      resource_state_types_available: [
        {
          resource_state_type_id: 5,
          display_resource_state_type: "Active",
          action_types: [{ display_action_type: "Login" }, { display_action_type: "Submit" }],
        },
      ],
      resource_types_available: [{ resource_type_id: 1, display_resource_type: "Compute" }],
      unit_types_available: [{ unit_type_id: 2, display_unit_type: "SU" }],
      required_resources_available: [{ resource_id: 7, resource_name: "Storage" }],
      unassigned_allocation_types: [{ allocation_type_id: 9, display_name: "Startup" }],
      resource_details: {
        resource_name: "Bridges-3",
        description: "A resource",
        resource_type_id: 1,
        unit_type_id: 1,
        min_exchange: 1,
        dollar_value: 1,
        allocation_types: [
          makeAllocationType({
            allocation_type_id: 1,
            required_resources: [
              { resource_name: "Zeta", required_resource_id: 1 },
              { resource_name: "Alpha", required_resource_id: 2 },
            ],
          }),
          makeAllocationType({
            allocation_type_id: 2,
            required_resources: [
              { resource_name: "Alpha", required_resource_id: 2 },
              { resource_name: "Beta", required_resource_id: 3 },
            ],
          }),
        ],
      },
    });

    const store = createStore();
    store.set(resourceDataAtom, fixture);

    expect(store.get(resourceDetailsAtom)).toEqual(fixture.resource_details);
    expect(store.get(usesExchangeRatesAtom)).toBe(true);
    expect(store.get(allowedActionsOptionsAtom)).toEqual([
      { value: 5, label: "Active", additionalInfo: "Login, Submit" },
    ]);
    expect(store.get(resourceTypesOptionsAtom)).toEqual([{ value: 1, label: "Compute" }]);
    expect(store.get(unitTypesOptionsAtom)).toEqual([{ value: 2, label: "SU" }]);
    expect(store.get(availableResourcesAtom)).toEqual([{ resource_id: 7, resource_name: "Storage" }]);
    expect(store.get(availableAllocationTypesAtom)).toEqual([
      { allocation_type_id: 9, display_name: "Startup" },
    ]);
    // Dedupes "Alpha" (present in both allocation types) and sorts
    // alphabetically rather than preserving encounter order (Zeta was seen
    // before Alpha/Beta).
    expect(store.get(requiredResourceNamesAtom)).toEqual(["Alpha", "Beta", "Zeta"]);
  });

  it("default to empty/false values when resourceDataAtom is null", () => {
    const store = createStore();

    expect(store.get(resourceDetailsAtom)).toBeNull();
    expect(store.get(usesExchangeRatesAtom)).toBe(false);
    expect(store.get(allowedActionsOptionsAtom)).toEqual([]);
    expect(store.get(resourceTypesOptionsAtom)).toEqual([]);
    expect(store.get(unitTypesOptionsAtom)).toEqual([]);
    expect(store.get(availableResourcesAtom)).toEqual([]);
    expect(store.get(availableAllocationTypesAtom)).toEqual([]);
    expect(store.get(requiredResourceNamesAtom)).toEqual([]);
  });
});

describe("dateErrorsAtom", () => {
  it("delegates to collectDateErrors: filters empty errors and dedupes repeated overlap messages", () => {
    const discountRates: DiscountRate[] = [
      { id: 1, exchange_rate: "1", rate_error: "Rate cannot be empty" },
      { id: 2, exchange_rate: "1", start_date_error: "", end_date_error: "" },
      {
        id: 3,
        exchange_rate: "1",
        start_date_error: "range overlaps with an existing rate",
        end_date_error: "range overlaps with an existing rate",
      },
    ];
    const fixture = makeResourceData({
      resource_details: {
        resource_name: "Bridges-3",
        description: "A resource",
        resource_type_id: 1,
        unit_type_id: 1,
        min_exchange: 1,
        dollar_value: 1,
        allocation_types: [],
        exchange_rates: { base_rate: "1", discount_rates: discountRates },
      },
    });

    const store = createStore();
    store.set(resourceDataAtom, fixture);

    expect(store.get(dateErrorsAtom)).toEqual([
      "Rate cannot be empty",
      "range overlaps with an existing rate",
    ]);
  });
});

describe("updateResourceFieldAtom / updateAllocationAtom / changeAllowedActionAtom / changeCommentAtom", () => {
  it("updateResourceFieldAtom replaces a resource_details field without mutating the previous object", () => {
    const original = makeResourceData();
    const originalDetails = original.resource_details;
    const store = createStore();
    store.set(resourceDataAtom, original);

    store.set(updateResourceFieldAtom, { field: "resource_name", value: "New Name" });

    expect(store.get(resourceDataAtom)?.resource_details.resource_name).toBe("New Name");
    // Neither the top-level object nor the nested resource_details it
    // replaced were mutated in place.
    expect(original.resource_details).toBe(originalDetails);
    expect(originalDetails.resource_name).toBe("Bridges-3");
    expect(store.get(resourceDataAtom)).not.toBe(original);
  });

  it("updateAllocationAtom patches one allocation type by id without mutating the previous array/objects", () => {
    const type1 = makeAllocationType({ allocation_type_id: 1, comment: "old" });
    const type2 = makeAllocationType({ allocation_type_id: 2, comment: "untouched" });
    const original = makeResourceData({
      resource_details: {
        resource_name: "Bridges-3",
        description: "A resource",
        resource_type_id: 1,
        unit_type_id: 1,
        min_exchange: 1,
        dollar_value: 1,
        allocation_types: [type1, type2],
      },
    });
    const originalAllocationTypes = original.resource_details.allocation_types;
    const store = createStore();
    store.set(resourceDataAtom, original);

    store.set(updateAllocationAtom, { allocationTypeId: 1, updates: { comment: "new" } });

    const updated = store.get(resourceDataAtom)!;
    expect(updated.resource_details.allocation_types.find((t) => t.allocation_type_id === 1)?.comment).toBe(
      "new",
    );
    expect(updated.resource_details.allocation_types.find((t) => t.allocation_type_id === 2)?.comment).toBe(
      "untouched",
    );
    // Previous array and the previous type-1 object were not mutated.
    expect(originalAllocationTypes).toBe(original.resource_details.allocation_types);
    expect(type1.comment).toBe("old");
    expect(originalAllocationTypes[0]).toBe(type1);
  });

  it("changeAllowedActionAtom sets allowed_action.resource_state_type_id via updateAllocationAtom", () => {
    const store = createStore();
    store.set(resourceDataAtom, makeResourceData());

    store.set(changeAllowedActionAtom, { allocationTypeId: 1, resourceStateTypeId: 5 });

    expect(
      store.get(resourceDataAtom)?.resource_details.allocation_types[0].allowed_action,
    ).toEqual({ resource_state_type_id: 5 });
  });

  it("changeCommentAtom sets the comment via updateAllocationAtom", () => {
    const store = createStore();
    store.set(resourceDataAtom, makeResourceData());

    store.set(changeCommentAtom, { allocationTypeId: 1, comment: "hello" });

    expect(store.get(resourceDataAtom)?.resource_details.allocation_types[0].comment).toBe("hello");
  });
});

describe("changeRequiredResourceAtom", () => {
  function fixtureWithAvailable() {
    return makeResourceData({
      required_resources_available: [
        { resource_id: 1, resource_name: "CPU" },
        { resource_id: 2, resource_name: "GPU" },
      ],
      resource_details: {
        resource_name: "Bridges-3",
        description: "A resource",
        resource_type_id: 1,
        unit_type_id: 1,
        min_exchange: 1,
        dollar_value: 1,
        allocation_types: [
          makeAllocationType({
            allocation_type_id: 10,
            required_resources: [{ resource_name: "CPU", required_resource_id: 1 }],
          }),
        ],
      },
    });
  }

  it("checked: true adds a required resource looked up by name from availableResourcesAtom", () => {
    const store = createStore();
    store.set(resourceDataAtom, fixtureWithAvailable());

    store.set(changeRequiredResourceAtom, {
      allocationTypeId: 10,
      resourceName: "GPU",
      checked: true,
    });

    expect(
      store.get(resourceDataAtom)?.resource_details.allocation_types[0].required_resources,
    ).toEqual([
      { resource_name: "CPU", required_resource_id: 1 },
      { resource_name: "GPU", required_resource_id: 2 },
    ]);
  });

  it("checked: false removes a required resource by name", () => {
    const store = createStore();
    store.set(resourceDataAtom, fixtureWithAvailable());

    store.set(changeRequiredResourceAtom, {
      allocationTypeId: 10,
      resourceName: "CPU",
      checked: false,
    });

    expect(
      store.get(resourceDataAtom)?.resource_details.allocation_types[0].required_resources,
    ).toEqual([]);
  });
});

describe("saveRequiredResourcesAtom", () => {
  it("returns false and makes no changes when resourceDataAtom is null", () => {
    const store = createStore();
    expect(store.set(saveRequiredResourcesAtom, [1])).toBe(false);
  });

  it("adds newly-selected resources to every allocation type and removes deselected ones, across multiple types", () => {
    const fixture = makeResourceData({
      required_resources_available: [
        { resource_id: 1, resource_name: "CPU" },
        { resource_id: 2, resource_name: "GPU" },
        { resource_id: 3, resource_name: "Storage" },
      ],
      resource_details: {
        resource_name: "Bridges-3",
        description: "A resource",
        resource_type_id: 1,
        unit_type_id: 1,
        min_exchange: 1,
        dollar_value: 1,
        allocation_types: [
          makeAllocationType({
            allocation_type_id: 1,
            required_resources: [{ resource_name: "CPU", required_resource_id: 1 }],
          }),
          makeAllocationType({
            allocation_type_id: 2,
            required_resources: [
              { resource_name: "CPU", required_resource_id: 1 },
              { resource_name: "GPU", required_resource_id: 2 },
            ],
          }),
        ],
      },
    });
    const store = createStore();
    store.set(resourceDataAtom, fixture);

    // Select Storage (new, id 3) and GPU (id 2, already on type 2 only);
    // deselect CPU (id 1, currently on both types).
    const result = store.set(saveRequiredResourcesAtom, [2, 3]);

    expect(result).toBe(true);
    const types = store.get(resourceDataAtom)!.resource_details.allocation_types;
    const type1 = types.find((t) => t.allocation_type_id === 1)!;
    const type2 = types.find((t) => t.allocation_type_id === 2)!;

    // "Added" is computed globally across all allocation types: GPU (id 2)
    // is already required somewhere (type2), so it does NOT count as newly
    // added and is only applied to types that already had it - it is not
    // pushed onto type1. Only the genuinely-new Storage (id 3) is applied to
    // every allocation type. CPU (id 1) is removed from both.
    expect(type1.required_resources).toEqual([{ resource_name: "Storage", required_resource_id: 3 }]);
    expect(type2.required_resources).toEqual([
      { resource_name: "GPU", required_resource_id: 2 },
      { resource_name: "Storage", required_resource_id: 3 },
    ]);
  });
});

describe("saveAllocationTypeAtom", () => {
  function fixtureWithUnassigned() {
    return makeResourceData({
      unassigned_allocation_types: [{ allocation_type_id: 99, display_name: "New Type" }],
      resource_state_types_available: [
        { resource_state_type_id: 7, display_resource_state_type: "Active", action_types: [] },
      ],
    });
  }

  it("adds a genuinely new allocation type, defaulting allowed_action to the first available option", () => {
    const store = createStore();
    store.set(resourceDataAtom, fixtureWithUnassigned());

    const result = store.set(saveAllocationTypeAtom, "99");

    expect(result).toBe(true);
    const added = store
      .get(resourceDataAtom)!
      .resource_details.allocation_types.find((t) => t.allocation_type_id === 99);
    expect(added).toEqual({
      allocation_type_id: 99,
      display_name: "New Type",
      allowed_action: { resource_state_type_id: 7 },
      comment: "",
      required_resources: [],
    });
  });

  it("returns false when the id is not in availableAllocationTypesAtom", () => {
    const store = createStore();
    const fixture = fixtureWithUnassigned();
    store.set(resourceDataAtom, fixture);

    const result = store.set(saveAllocationTypeAtom, "not-a-real-id");

    expect(result).toBe(false);
    expect(store.get(resourceDataAtom)?.resource_details.allocation_types).toEqual(
      fixture.resource_details.allocation_types,
    );
  });

  it("returns false when the allocation type already exists on resourceDetailsAtom", () => {
    const fixture = fixtureWithUnassigned();
    fixture.resource_details.allocation_types = [
      makeAllocationType({ allocation_type_id: 99, display_name: "New Type" }),
    ];
    const store = createStore();
    store.set(resourceDataAtom, fixture);

    const result = store.set(saveAllocationTypeAtom, "99");

    expect(result).toBe(false);
    expect(store.get(resourceDataAtom)?.resource_details.allocation_types).toHaveLength(1);
  });
});

describe("updateBaseRateAtom / updateRateValueAtom", () => {
  function fixtureWithRate(rate: DiscountRate) {
    return makeResourceData({
      resource_details: {
        resource_name: "Bridges-3",
        description: "A resource",
        resource_type_id: 1,
        unit_type_id: 1,
        min_exchange: 1,
        dollar_value: 1,
        allocation_types: [],
        exchange_rates: { base_rate: "1.0", discount_rates: [rate] },
      },
    });
  }

  it("updateBaseRateAtom replaces exchange_rates.base_rate", () => {
    const store = createStore();
    store.set(resourceDataAtom, fixtureWithRate({ id: 1, exchange_rate: "1.0" }));

    store.set(updateBaseRateAtom, "2.5");

    expect(store.get(resourceDataAtom)?.resource_details.exchange_rates?.base_rate).toBe("2.5");
  });

  it("updateRateValueAtom sets the value and clears rate_error when non-empty", () => {
    const store = createStore();
    store.set(
      resourceDataAtom,
      fixtureWithRate({ id: 1, exchange_rate: "1.0", rate_error: "stale error" }),
    );

    store.set(updateRateValueAtom, { rateId: 1, value: "3.0" });

    const rate = store.get(resourceDataAtom)?.resource_details.exchange_rates?.discount_rates?.[0];
    expect(rate?.exchange_rate).toBe("3.0");
    expect(rate?.rate_error).toBe("");
  });

  it("updateRateValueAtom sets rate_error when the value is empty", () => {
    const store = createStore();
    store.set(resourceDataAtom, fixtureWithRate({ id: 1, exchange_rate: "1.0" }));

    store.set(updateRateValueAtom, { rateId: 1, value: "" });

    const rate = store.get(resourceDataAtom)?.resource_details.exchange_rates?.discount_rates?.[0];
    expect(rate?.exchange_rate).toBe("");
    expect(rate?.rate_error).toBe("Exchange Rate cannot be empty");
  });
});

describe("updateRateDateAtom", () => {
  function storeWithRates(rates: DiscountRate[]) {
    const store = createStore();
    store.set(
      resourceDataAtom,
      makeResourceData({
        resource_details: {
          resource_name: "Bridges-3",
          description: "A resource",
          resource_type_id: 1,
          unit_type_id: 1,
          min_exchange: 1,
          dollar_value: 1,
          allocation_types: [],
          exchange_rates: { base_rate: "1.0", discount_rates: rates },
        },
      }),
    );
    return store;
  }

  function rateAfter(store: ReturnType<typeof createStore>, rateId: number) {
    return store
      .get(resourceDataAtom)!
      .resource_details.exchange_rates!.discount_rates!.find((r) => r.id === rateId)!;
  }

  it("an empty value sets the generic empty/invalid error and still writes the (empty) field", () => {
    const store = storeWithRates([
      { id: 1, exchange_rate: "1.0", begin_date: TODAY, end_date: addDays(TODAY, 5) },
    ]);

    store.set(updateRateDateAtom, { rateId: 1, dateField: "start_date", value: "" });

    const rate = rateAfter(store, 1);
    expect(rate.begin_date).toBe("");
    expect(rate.start_date_error).toBe("Date cannot be empty or invalid");
  });

  it("a start date after the paired end date sets end_date_error", () => {
    const endDate = addDays(TODAY, 5);
    const store = storeWithRates([
      { id: 1, exchange_rate: "1.0", begin_date: addDays(TODAY, 1), end_date: endDate },
    ]);
    const newStart = addDays(TODAY, 8);

    store.set(updateRateDateAtom, { rateId: 1, dateField: "start_date", value: newStart });

    const rate = rateAfter(store, 1);
    expect(rate.begin_date).toBe(newStart);
    expect(rate.start_date_error).toBe("");
    expect(rate.end_date_error).toBe(`end date ${endDate} cannot be before ${newStart}`);
  });

  it("a start date before today (the effective min) is rejected", () => {
    const store = storeWithRates([{ id: 1, exchange_rate: "1.0" }]);
    const pastDate = addDays(TODAY, -10);

    store.set(updateRateDateAtom, { rateId: 1, dateField: "start_date", value: pastDate });

    expect(rateAfter(store, 1).start_date_error).toBe(
      `start date ${pastDate} cannot be before ${TODAY}`,
    );
  });

  it("an end date before the rate's own begin_date (its effective min) is rejected", () => {
    const beginDate = addDays(TODAY, 10);
    const store = storeWithRates([{ id: 1, exchange_rate: "1.0", begin_date: beginDate }]);
    const tooEarly = addDays(TODAY, 5);

    store.set(updateRateDateAtom, { rateId: 1, dateField: "end_date", value: tooEarly });

    expect(rateAfter(store, 1).end_date_error).toBe(
      `end date ${tooEarly} cannot be before ${beginDate}`,
    );
  });

  it("a date after 2100-12-31 is rejected", () => {
    const store = storeWithRates([{ id: 1, exchange_rate: "1.0" }]);

    store.set(updateRateDateAtom, { rateId: 1, dateField: "start_date", value: "2101-01-01" });

    expect(rateAfter(store, 1).start_date_error).toBe("start date cannot be after 2100-12-31");
  });

  it("an overlap with another discount rate on the same resource sets the same message on both error fields", () => {
    const otherBegin = addDays(TODAY, 10);
    const otherEnd = addDays(TODAY, 19);
    const store = storeWithRates([
      { id: 1, exchange_rate: "1.0", begin_date: otherBegin, end_date: otherEnd },
      { id: 2, exchange_rate: "1.0", begin_date: addDays(TODAY, 12) },
    ]);
    const newEnd = addDays(TODAY, 15);

    store.set(updateRateDateAtom, { rateId: 2, dateField: "end_date", value: newEnd });

    const rate = rateAfter(store, 2);
    expect(rate.start_date_error).toBeTruthy();
    expect(rate.start_date_error).toBe(rate.end_date_error);
    expect(rate.start_date_error).toContain("overlaps with an existing discount rate");
  });

  it("setting an end date on a rate with no begin_date yet still flags start_date_error", () => {
    const store = storeWithRates([{ id: 1, exchange_rate: "1.0" }]);
    const value = addDays(TODAY, 3);

    store.set(updateRateDateAtom, { rateId: 1, dateField: "end_date", value });

    const rate = rateAfter(store, 1);
    expect(rate.end_date).toBe(value);
    expect(rate.end_date_error).toBe("");
    expect(rate.start_date_error).toBe("Date cannot be empty or invalid");
  });

  it("setting a start date on a rate with no end_date yet still flags end_date_error", () => {
    const store = storeWithRates([{ id: 1, exchange_rate: "1.0" }]);
    const value = addDays(TODAY, 3);

    store.set(updateRateDateAtom, { rateId: 1, dateField: "start_date", value });

    const rate = rateAfter(store, 1);
    expect(rate.begin_date).toBe(value);
    expect(rate.start_date_error).toBe("");
    expect(rate.end_date_error).toBe("Date cannot be empty or invalid");
  });

  it("clears the other field's message once it stops being true", () => {
    // The regression that motivated validating the candidate rate. Two ordinary
    // edits used to be enough to strand a message: the first creates an overlap,
    // which is reported on both fields; the second makes the start date invalid,
    // and the write that carried it only touched `start_date_error`. Because
    // `patchDiscountRate` merges, `end_date_error` kept an overlap complaint
    // quoting a begin date the rate no longer had - and `dateErrorsAtom` lifted
    // it into the form-level alert, so the admin saw a demand to fix a date
    // range they had already abandoned.
    const store = storeWithRates([
      { id: 1, exchange_rate: "1.0", begin_date: addDays(TODAY, 1), end_date: addDays(TODAY, 4) },
      { id: 2, exchange_rate: "0.5", begin_date: addDays(TODAY, 5), end_date: addDays(TODAY, 20) },
    ]);

    store.set(updateRateDateAtom, { rateId: 1, dateField: "end_date", value: addDays(TODAY, 10) });
    expect(rateAfter(store, 1).end_date_error).toContain("overlaps with an existing discount rate");

    const pastDate = addDays(TODAY, -10);
    store.set(updateRateDateAtom, { rateId: 1, dateField: "start_date", value: pastDate });

    const rate = rateAfter(store, 1);
    expect(rate.start_date_error).toBe(`start date ${pastDate} cannot be before ${TODAY}`);
    expect(rate.end_date_error).toBe("");
    expect(store.get(dateErrorsAtom)).toEqual([
      `start date ${pastDate} cannot be before ${TODAY}`,
    ]);
  });

  it("reaches the same verdict whichever endpoint was moved to invert the range", () => {
    // Editing either field now runs the same rules over the resulting rate, so
    // "the range is backwards" reads identically in both directions rather than
    // being two branches with two wordings.
    const early = addDays(TODAY, 4);
    const late = addDays(TODAY, 9);
    const expected = `end date ${early} cannot be before ${late}`;

    const movedStart = storeWithRates([
      { id: 1, exchange_rate: "1.0", begin_date: addDays(TODAY, 1), end_date: early },
    ]);
    movedStart.set(updateRateDateAtom, { rateId: 1, dateField: "start_date", value: late });

    const movedEnd = storeWithRates([
      { id: 1, exchange_rate: "1.0", begin_date: late, end_date: addDays(TODAY, 12) },
    ]);
    movedEnd.set(updateRateDateAtom, { rateId: 1, dateField: "end_date", value: early });

    for (const store of [movedStart, movedEnd]) {
      const rate = rateAfter(store, 1);
      expect(rate.begin_date).toBe(late);
      expect(rate.end_date).toBe(early);
      expect(rate.start_date_error).toBe("");
      expect(rate.end_date_error).toBe(expected);
    }
  });
});

describe("addExchangeRateAtom", () => {
  it("begins the day after the latest existing rate's end_date (across multiple rates) and ends 15 days later", () => {
    const store = createStore();
    store.set(
      resourceDataAtom,
      makeResourceData({
        resource_details: {
          resource_name: "Bridges-3",
          description: "A resource",
          resource_type_id: 1,
          unit_type_id: 1,
          min_exchange: 1,
          dollar_value: 1,
          allocation_types: [],
          exchange_rates: {
            base_rate: "1.0",
            discount_rates: [
              { id: 1, exchange_rate: "1.0", begin_date: TODAY, end_date: addDays(TODAY, 5) },
              // Earlier end_date than rate 1: the "latest" logic must take
              // the max across all rates, not the last one in the array.
              { id: 2, exchange_rate: "1.0", begin_date: TODAY, end_date: addDays(TODAY, 1) },
            ],
          },
        },
      }),
    );

    store.set(addExchangeRateAtom);

    const rates = store.get(resourceDataAtom)!.resource_details.exchange_rates!.discount_rates!;
    const added = rates[rates.length - 1];
    expect(added.begin_date).toBe(addDays(TODAY, 6));
    expect(added.end_date).toBe(addDays(TODAY, 21));
    expect(added.exchange_rate).toBe("1.0");
    expect(added.is_new).toBe(true);
  });

  it("begins today+1 when there are no existing rates", () => {
    const before = new Date();
    const store = createStore();
    store.set(
      resourceDataAtom,
      makeResourceData({
        resource_details: {
          resource_name: "Bridges-3",
          description: "A resource",
          resource_type_id: 1,
          unit_type_id: 1,
          min_exchange: 1,
          dollar_value: 1,
          allocation_types: [],
          exchange_rates: { base_rate: "1.0", discount_rates: [] },
        },
      }),
    );

    store.set(addExchangeRateAtom);

    const rates = store.get(resourceDataAtom)!.resource_details.exchange_rates!.discount_rates!;
    expect(rates).toHaveLength(1);
    const nowDate = before.toISOString().split("T")[0];
    const expectedBegin = addDays(nowDate, 1);
    expect(rates[0].begin_date).toBe(expectedBegin);
    expect(rates[0].end_date).toBe(addDays(expectedBegin, 15));
  });
});

describe("deleteExchangeRateAtom", () => {
  it("removes the given rate and clears stale start/end date errors only on remaining rates with both dates set", () => {
    const store = createStore();
    store.set(
      resourceDataAtom,
      makeResourceData({
        resource_details: {
          resource_name: "Bridges-3",
          description: "A resource",
          resource_type_id: 1,
          unit_type_id: 1,
          min_exchange: 1,
          dollar_value: 1,
          allocation_types: [],
          exchange_rates: {
            base_rate: "1.0",
            discount_rates: [
              {
                id: 1,
                exchange_rate: "1.0",
                begin_date: addDays(TODAY, 1),
                end_date: addDays(TODAY, 10),
                start_date_error: "stale overlap message",
                end_date_error: "stale overlap message",
              },
              {
                id: 2,
                exchange_rate: "1.0",
                begin_date: addDays(TODAY, 12),
                end_date: addDays(TODAY, 20),
              },
              {
                // Missing begin_date: should NOT have its stale error
                // cleared, since it doesn't have "both dates" valid.
                id: 3,
                exchange_rate: "1.0",
                end_date: addDays(TODAY, 30),
                start_date_error: "still incomplete",
              },
            ],
          },
        },
      }),
    );

    store.set(deleteExchangeRateAtom, 2);

    const rates = store.get(resourceDataAtom)!.resource_details.exchange_rates!.discount_rates!;
    expect(rates.map((r) => r.id)).toEqual([1, 3]);
    const rate1 = rates.find((r) => r.id === 1)!;
    const rate3 = rates.find((r) => r.id === 3)!;
    expect(rate1.start_date_error).toBe("");
    expect(rate1.end_date_error).toBe("");
    expect(rate3.start_date_error).toBe("still incomplete");
  });
});

describe("submitResourceAtom", () => {
  function fixtureForSubmit() {
    return makeResourceData({
      resource_details: {
        resource_name: "Bridges-3",
        description: "A resource",
        resource_type_id: 1,
        unit_type_id: 1,
        min_exchange: 1,
        dollar_value: 1,
        allocation_types: [makeAllocationType()],
      },
    });
  }

  it("returns false and does nothing when there is no resourceDetailsAtom yet", async () => {
    const store = createStore();
    // No handlers registered: if the atom attempted a fetch anyway, the MSW
    // catch-all would reject it and this test would fail loudly rather than
    // silently pass.
    const result = await store.set(submitResourceAtom);
    expect(result).toBe(false);
  });

  it("on 200: sets a success message and re-fetches resourceDataAtom", async () => {
    const refetched = makeResourceData({
      resource_details: {
        resource_name: "Refetched Name",
        description: "A resource",
        resource_type_id: 1,
        unit_type_id: 1,
        min_exchange: 1,
        dollar_value: 1,
        allocation_types: [],
      },
    });
    server.use(
      http.patch(`${ROOT}/resources/${RESOURCE_ID}`, () =>
        HttpResponse.json({ message: "Great success!" }, { status: 200 }),
      ),
      http.get(`${ROOT}/resources/${RESOURCE_ID}.json`, () => HttpResponse.json(refetched)),
    );

    const store = createStore();
    store.set(relativeUrlRootAtom, ROOT);
    store.set(resourceIdAtom, RESOURCE_ID);
    store.set(resourceDataAtom, fixtureForSubmit());

    const result = await store.set(submitResourceAtom);

    expect(result).toBe(true);
    expect(store.get(successMessageAtom)).toEqual({ message: "Great success!", color: "success" });
    expect(store.get(resourceDataAtom)).toEqual(refetched);
  });

  it("sends the auto-approve exchange fields, which the form does not otherwise touch", async () => {
    // `auto_approve_exchanges` has no control in the form: it only survives a
    // save because the payload passes it back through, so a submit test is the
    // only place it is pinned down.
    let payload: any;
    server.use(
      http.patch(`${ROOT}/resources/${RESOURCE_ID}`, async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ message: "Great success!" }, { status: 200 });
      }),
      http.get(`${ROOT}/resources/${RESOURCE_ID}.json`, () =>
        HttpResponse.json(fixtureForSubmit()),
      ),
    );

    const data = fixtureForSubmit();
    data.resource_details.auto_approve_exchanges = true;
    data.resource_details.auto_approve_exchange_limit = "500";

    const store = createStore();
    store.set(relativeUrlRootAtom, ROOT);
    store.set(resourceIdAtom, RESOURCE_ID);
    store.set(resourceDataAtom, data);

    await store.set(submitResourceAtom);

    expect(payload.resource).toMatchObject({
      auto_approve_exchanges: true,
      auto_approve_exchange_limit: "500",
    });
  });

  it("on a non-200 response with { errors }: populates errorsAtom from the array", async () => {
    server.use(
      http.patch(`${ROOT}/resources/${RESOURCE_ID}`, () =>
        HttpResponse.json({ errors: ["Bad thing one", "Bad thing two"] }, { status: 422 }),
      ),
    );

    const store = createStore();
    store.set(relativeUrlRootAtom, ROOT);
    store.set(resourceIdAtom, RESOURCE_ID);
    store.set(resourceDataAtom, fixtureForSubmit());

    const result = await store.set(submitResourceAtom);

    expect(result).toBe(false);
    expect(store.get(errorsAtom)).toEqual(["Bad thing one", "Bad thing two"]);
  });

  it("on a non-200 response with { message } instead of { errors }: wraps it in a single-element array", async () => {
    server.use(
      http.patch(`${ROOT}/resources/${RESOURCE_ID}`, () =>
        HttpResponse.json({ message: "Something specific went wrong" }, { status: 400 }),
      ),
    );

    const store = createStore();
    store.set(relativeUrlRootAtom, ROOT);
    store.set(resourceIdAtom, RESOURCE_ID);
    store.set(resourceDataAtom, fixtureForSubmit());

    const result = await store.set(submitResourceAtom);

    expect(result).toBe(false);
    expect(store.get(errorsAtom)).toEqual(["Something specific went wrong"]);
  });

  it("when the request itself throws (unhandled URL): sets a generic danger success-message rather than throwing", async () => {
    // No PATCH handler registered for this resource id -> MSW catch-all
    // rejects the fetch, exercising the atom's outer try/catch.
    const store = createStore();
    store.set(relativeUrlRootAtom, ROOT);
    store.set(resourceIdAtom, RESOURCE_ID);
    store.set(resourceDataAtom, fixtureForSubmit());

    const result = await store.set(submitResourceAtom);

    expect(result).toBe(false);
    expect(store.get(successMessageAtom)).toEqual({
      message: "Error updating resource. Please try again later.",
      color: "danger",
    });
  });
});
