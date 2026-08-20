import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import {
  filteredResourcesAtom,
  filtersAtom,
  getResourcesAtom,
  hasErrorsAtom,
  resetFiltersAtom,
  resourcesAtom,
  resourcesLoadedAtom,
  toggleFilterAtom,
} from "@/resource-catalog/atoms";
import type {
  CatalogParams,
  Feature,
  FilterCategoryType,
  Resource,
} from "@/resource-catalog/types";

const params: CatalogParams = {
  apiUrl: "https://example.test/api/resources",
  excludedCategories: [],
  excludedFilters: [],
  excludedResources: [],
  allowedCategories: [],
  allowedFilters: [],
};

// getResourcesAtom (52-line src/resource-catalog/atoms.ts) is a plain
// jotai write atom, so it can be driven with a bare createStore() with no
// React involved. Backing its `fetch` with an MSW handler proves the harness
// can test async atom logic against controlled responses instead of a real
// XRAS API.
describe("getResourcesAtom", () => {
  it("loads and stores resources from the (mocked) API response", async () => {
    server.use(
      http.get(params.apiUrl, () => HttpResponse.json([])),
    );

    const store = createStore();
    await store.set(getResourcesAtom, params);

    expect(store.get(resourcesLoadedAtom)).toBe(true);
    expect(store.get(hasErrorsAtom)).toBe(false);
    expect(store.get(resourcesAtom)).toEqual([]);
    expect(store.get(filtersAtom)).toEqual([]);
  });

  // Proves `onUnhandledRequest: "error"` (src/test/setup.ts) is actually
  // live: a request to a URL with no registered handler makes `fetch`
  // reject, which the atom's own try/catch turns into `hasErrorsAtom`. If
  // the suite ever silently allowed unhandled requests through - e.g. to a
  // real XRAS host - this test would instead see a successful (or hanging)
  // response.
  it("records an error when the request is unhandled by MSW", async () => {
    const store = createStore();
    await store.set(getResourcesAtom, {
      ...params,
      apiUrl: "https://example.test/api/unhandled",
    });

    expect(store.get(hasErrorsAtom)).toBe(true);
  });

  // richer fixture: two feature categories selected, exercising
  // processCatalogResponse's category/feature extraction plus the
  // resourceSorting priority map, which is otherwise easy to get "accidentally
  // right" with a single-category, single-resource fixture.
  it("orders resources by the resourceSorting priority map, not fetch/name order", async () => {
    const richApiUrl = "https://example.test/api/resources-rich";

    // Fetched (and name-sorted) as [Alpha, Zulu], but "Alpha" is tagged with
    // the lower-priority "Other NSF-funded Resources" sort category and
    // "Zulu" with the higher-priority "NSF Capacity Resources" one (see
    // `resourceSorting` in helpers/catalog.ts). A naive
    // fetch-order-or-name-order implementation would yield [Alpha, Zulu];
    // resourceSorting should flip it to [Zulu, Alpha].
    server.use(
      http.get(richApiUrl, () =>
        HttpResponse.json([
          {
            resourceName: "Alpha",
            resourceId: 1,
            resourceType: "Compute",
            organization: "Org",
            units: "",
            userGuideUrl: "",
            resourceDescription: "",
            description: "",
            recommendedUse: "",
            featureCategories: [
              {
                categoryId: 900,
                categoryName: "ACCESS Resource Grouping",
                categoryDescription: "",
                categoryIsFilter: true,
                features: [
                  {
                    featureId: 9001,
                    name: "Other NSF-funded Resources",
                    description: "",
                  },
                ],
              },
              {
                categoryId: 1,
                categoryName: "Compute",
                categoryDescription: "Compute options",
                categoryIsFilter: true,
                features: [
                  { featureId: 11, name: "CPU", description: "CPU compute" },
                ],
              },
            ],
          },
          {
            resourceName: "Zulu",
            resourceId: 2,
            resourceType: "Compute",
            organization: "Org",
            units: "",
            userGuideUrl: "",
            resourceDescription: "",
            description: "",
            recommendedUse: "",
            featureCategories: [
              {
                categoryId: 900,
                categoryName: "ACCESS Resource Grouping",
                categoryDescription: "",
                categoryIsFilter: true,
                features: [
                  {
                    featureId: 9002,
                    name: "NSF Capacity Resources",
                    description: "",
                  },
                ],
              },
              {
                categoryId: 1,
                categoryName: "Compute",
                categoryDescription: "Compute options",
                categoryIsFilter: true,
                features: [
                  { featureId: 10, name: "GPU", description: "GPU compute" },
                ],
              },
            ],
          },
        ]),
      ),
    );

    const store = createStore();
    await store.set(getResourcesAtom, { ...params, apiUrl: richApiUrl });

    expect(store.get(hasErrorsAtom)).toBe(false);
    expect(store.get(resourcesAtom).map((r) => r.resourceName)).toEqual([
      "Zulu",
      "Alpha",
    ]);

    // The "Compute" category (id 1) accumulates features contributed by
    // BOTH resources, sorted by feature name - proving category/feature
    // extraction merges across the whole response, not just per-resource.
    const filters = store.get(filtersAtom);
    expect(filters).toHaveLength(1);
    expect(filters[0].categoryName).toBe("Compute");
    expect(filters[0].features.map((f) => f.name)).toEqual(["CPU", "GPU"]);

    // No filters are active yet, so filteredResourcesAtom is a full copy.
    expect(store.get(filteredResourcesAtom)).toEqual(store.get(resourcesAtom));
  });
});

function makeFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    featureId: 1,
    name: "feature",
    description: "",
    categoryId: 1,
    selected: false,
    ...overrides,
  };
}

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    resourceName: "resource",
    resourceId: 1,
    resourceType: "",
    organization: "",
    units: "",
    userGuideUrl: "",
    resourceDescription: "",
    description: "",
    recommendedUse: "",
    features: [],
    featureIds: [],
    sortCategory: "",
    ...overrides,
  };
}

// toggleFilterAtom/resetFiltersAtom drive toggleFeatureSelected/
// deselectAllFeatures (helpers/catalog.ts) and recompute filteredResourcesAtom
// via computeFilteredResources, whose semantics require a match in EVERY
// *active filter category* (AND-across-categories) - unlike the sibling
// onramps-resource-catalog package's filteredResourcesAtom, which is
// OR-across-selected-filters. This fixture selects one feature from each of
// two categories to prove the AND behavior.
describe("toggleFilterAtom / resetFiltersAtom", () => {
  it("recomputes filteredResourcesAtom requiring a match in every active category", () => {
    const store = createStore();

    const featureA1 = makeFeature({ featureId: 101, name: "A1", categoryId: 1 });
    const featureA2 = makeFeature({ featureId: 102, name: "A2", categoryId: 1 });
    const featureB1 = makeFeature({ featureId: 201, name: "B1", categoryId: 2 });
    const featureB2 = makeFeature({ featureId: 202, name: "B2", categoryId: 2 });

    const filters: FilterCategoryType[] = [
      {
        categoryId: 1,
        categoryName: "Category A",
        categoryDescription: "",
        features: [featureA1, featureA2],
      },
      {
        categoryId: 2,
        categoryName: "Category B",
        categoryDescription: "",
        features: [featureB1, featureB2],
      },
    ];

    const hasBoth = makeResource({
      resourceId: 1,
      resourceName: "hasBoth",
      featureIds: [101, 201],
    });
    const hasOnlyA = makeResource({
      resourceId: 2,
      resourceName: "hasOnlyA",
      featureIds: [101],
    });
    const hasOnlyB = makeResource({
      resourceId: 3,
      resourceName: "hasOnlyB",
      featureIds: [201],
    });
    const hasNeither = makeResource({
      resourceId: 4,
      resourceName: "hasNeither",
      featureIds: [],
    });
    const resources = [hasBoth, hasOnlyA, hasOnlyB, hasNeither];

    store.set(filtersAtom, filters);
    store.set(resourcesAtom, resources);
    store.set(filteredResourcesAtom, resources);

    // Select one feature in category A only: a single active category means
    // "matches A" is sufficient.
    store.set(toggleFilterAtom, featureA1);
    expect(store.get(filteredResourcesAtom).map((r) => r.resourceId)).toEqual([
      1, 2,
    ]);

    // Also select a feature in category B: now both categories are active,
    // so only the resource matching BOTH survives - the AND-across-categories
    // behavior that distinguishes this package from onramps-resource-catalog.
    store.set(toggleFilterAtom, featureB1);
    expect(store.get(filteredResourcesAtom).map((r) => r.resourceId)).toEqual([
      1,
    ]);

    // resetFiltersAtom deselects every feature and restores the full list.
    store.set(resetFiltersAtom);
    expect(store.get(filteredResourcesAtom)).toEqual(resources);
    expect(
      store.get(filtersAtom).every((c) => c.features.every((f) => !f.selected)),
    ).toBe(true);
  });
});
