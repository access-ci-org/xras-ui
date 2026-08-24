import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import {
  filteredResourcesAtom,
  filtersAtom,
  hasErrorsAtom,
  initAppAtom,
  resetFiltersAtom,
  resourcesAtom,
  resourcesLoadedAtom,
  selectedFiltersAtom,
  toggleFilterAtom,
} from "@/onramps-resource-catalog/atoms";
import type { Resource } from "@/onramps-resource-catalog/types";

// initAppAtom (src/onramps-resource-catalog/atoms.ts:50) fetches these three
// literal, hardcoded URLs directly - there is no routesAtom indirection to
// override, so tests must intercept these exact strings with MSW.
const dataUrl =
  "https://operations-api.access-ci.org/wh2/cider/v1/access-active-groups/type/resource-catalog.access-ci.org/";
const resourcesUrl =
  "https://operations-api.access-ci.org/wh2/cider/v1/access-allocated/";
const featuresUrl =
  "https://operations-api.access-ci.org/wh2/cider/v1/features/";

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    resourceId: 1,
    resourceName: "resource",
    features: [],
    ...overrides,
  };
}

describe("filteredResourcesAtom", () => {
  // This module's filter semantics are OR-across-selected-filters: a
  // resource is included if it matches ANY selected filter id
  // (`selectedFilters.some(...)`, atoms.ts:18). This is deliberately
  // different from the sibling `resource-catalog` package's
  // `computeFilteredResources`, which requires a match in EVERY active
  // filter *category* (AND-across-categories). Do not assume the two
  // packages behave the same.
  it("includes a resource that matches ANY selected filter, not all of them", () => {
    const store = createStore();
    const matchesFirst = makeResource({ resourceId: 1, filters: [1, 2] });
    const matchesSecond = makeResource({ resourceId: 2, filters: [3] });
    const matchesNeither = makeResource({ resourceId: 3, filters: [99] });

    store.set(resourcesAtom, [matchesFirst, matchesSecond, matchesNeither]);
    store.set(selectedFiltersAtom, [1, 3]);

    const filtered = store.get(filteredResourcesAtom);
    expect(filtered).toEqual([matchesFirst, matchesSecond]);
  });

  it("returns all resources unfiltered when no filters are selected", () => {
    const store = createStore();
    const resources = [makeResource({ resourceId: 1, filters: [1] })];
    store.set(resourcesAtom, resources);

    expect(store.get(filteredResourcesAtom)).toEqual(resources);
  });
});

describe("resetFiltersAtom / toggleFilterAtom", () => {
  it("adds and removes a feature id from the selected filters, and resets to empty", () => {
    const store = createStore();
    expect(store.get(selectedFiltersAtom)).toEqual([]);

    store.set(toggleFilterAtom, 5);
    expect(store.get(selectedFiltersAtom)).toEqual([5]);

    store.set(toggleFilterAtom, 7);
    expect(store.get(selectedFiltersAtom)).toEqual([5, 7]);

    // Toggling an already-selected id removes it.
    store.set(toggleFilterAtom, 5);
    expect(store.get(selectedFiltersAtom)).toEqual([7]);

    store.set(resetFiltersAtom);
    expect(store.get(selectedFiltersAtom)).toEqual([]);
  });
});

describe("initAppAtom", () => {
  // A minimal-but-valid fixture for all three endpoints, built by reading
  // helpers/catalog.ts's transformRampsData carefully:
  //  - metadata needs `active_groups` (used to find resource groupings -
  //    empty is fine) and `organizations` (looked up by organization_name).
  //  - a raw ramps resource needs the id/name/description fields
  //    transformRampsData copies through, plus a `features` array of
  //    { id, feature_category, name } - `feature_category` (a *name*, not
  //    an id) is how the "Resource Type" feature is located.
  //  - the features feed needs `feature_category_id/name/description`,
  //    `other_attributes.is_allocations_filter` (this is what makes a
  //    category survive into the filter list downstream), and each nested
  //    feature needs `id/name/feature_category_id/is_allocations_filter`.
  //
  // "Resource Type" is deliberately excluded-from-filters
  // (is_allocations_filter: false) since it's only used to compute
  // resourceCategory, while "Community" is a real filter category, so this
  // fixture exercises both branches.
  it("loads resources/filters from the (mocked) three-endpoint API on success", async () => {
    server.use(
      http.get(dataUrl, () =>
        HttpResponse.json({
          results: {
            active_groups: [],
            organizations: [
              {
                organization_name: "PSC",
                organization_favicon_url: "https://example.test/icon.png",
              },
            ],
          },
        }),
      ),
      http.get(resourcesUrl, () =>
        HttpResponse.json({
          results: [
            {
              cider_resource_id: 501,
              info_resourceid: 9001,
              short_name: "test.resource",
              resource_descriptive_name: "Test Resource",
              resource_description: "A resource for testing",
              recommended_use: "Testing",
              organization_name: "PSC",
              features: [
                { id: 10, feature_category: "Resource Type", name: "CPU Compute" },
                { id: 20, feature_category: "Community", name: "Community A" },
              ],
            },
          ],
        }),
      ),
      http.get(featuresUrl, () =>
        HttpResponse.json({
          results: [
            {
              feature_category_id: 1,
              feature_category_name: "Resource Type",
              feature_category_description: "The type of resource",
              other_attributes: { is_allocations_filter: false },
              features: [
                {
                  id: 10,
                  name: "CPU Compute",
                  feature_category_id: 1,
                  is_allocations_filter: false,
                },
              ],
            },
            {
              feature_category_id: 2,
              feature_category_name: "Community",
              feature_category_description: "Community served",
              other_attributes: { is_allocations_filter: true },
              features: [
                {
                  id: 20,
                  name: "Community A",
                  feature_category_id: 2,
                  is_allocations_filter: true,
                },
              ],
            },
          ],
        }),
      ),
    );

    const store = createStore();
    await store.set(initAppAtom);

    expect(store.get(hasErrorsAtom)).toBe(false);
    expect(store.get(resourcesLoadedAtom)).toBe(true);

    const resources = store.get(resourcesAtom);
    expect(resources).toHaveLength(1);
    expect(resources[0]).toMatchObject({
      resourceId: 501,
      resourceName: "test.resource",
      features: ["Community A"],
      resourceCategory: "CPU",
    });

    const filters = store.get(filtersAtom);
    expect(filters).toHaveLength(1);
    expect(filters[0]).toMatchObject({ categoryName: "Community" });
    expect(filters[0].features).toHaveLength(1);
    expect(filters[0].features[0]).toMatchObject({
      featureId: 20,
      name: "Community A",
    });
  });

  // Network-level failure: none of the three URLs is registered, so MSW's
  // terminal catch-all (src/test/msw.ts) returns HttpResponse.error() for
  // all of them, which makes `fetch` reject. `Promise.all` in
  // getRampsResourcesAtom rejects on the first one, initAppAtom's try/catch
  // (atoms.ts:52-57) catches it, and the `finally`-style
  // `set(resourcesLoadedAtom, true)` after the try/catch still runs.
  it("catches an unhandled (network-level) failure and still marks resourcesLoaded", async () => {
    const store = createStore();

    await store.set(initAppAtom);

    expect(store.get(hasErrorsAtom)).toBe(true);
    expect(store.get(resourcesLoadedAtom)).toBe(true);
    expect(store.get(resourcesAtom)).toEqual([]);
  });

  // Shape-level failure: the metadata endpoint responds (no network error),
  // but with a body that doesn't have the expected `results.active_groups`
  // shape. `fetch` resolves fine and `.json()` parses fine, but
  // `transformRampsData` then throws a synchronous TypeError reading
  // `.active_groups` off `undefined`. This is a different failure mode than
  // the network-level case above (no rejected fetch at all), and it's still
  // caught by the same try/catch in initAppAtom.
  it("catches a malformed success response and still marks resourcesLoaded", async () => {
    server.use(
      http.get(dataUrl, () => HttpResponse.json({}, { status: 500 })),
      http.get(resourcesUrl, () => HttpResponse.json({ results: [] })),
      http.get(featuresUrl, () => HttpResponse.json({ results: [] })),
    );

    const store = createStore();
    await store.set(initAppAtom);

    expect(store.get(hasErrorsAtom)).toBe(true);
    expect(store.get(resourcesLoadedAtom)).toBe(true);
  });
});
