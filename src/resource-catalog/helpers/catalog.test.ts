import { describe, expect, it } from "vitest";
import {
  activeFilters,
  computeFilteredResources,
  deselectAllFeatures,
  processCatalogResponse,
  toggleFeatureSelected,
} from "@/resource-catalog/helpers/catalog";
import type { CatalogParams, Feature, FilterCategoryType, Resource } from "@/resource-catalog/types";

function noParams(overrides: Partial<CatalogParams> = {}): CatalogParams {
  return {
    apiUrl: "https://example.test/resources.json",
    excludedCategories: [],
    excludedFilters: [],
    excludedResources: [],
    allowedCategories: [],
    allowedFilters: [],
    ...overrides,
  };
}

// Raw API shape (loosely typed `any[]` on the function itself). Two
// resources share a "CPU" feature (id 10) under "Resource Type" to exercise
// dedup into the shared filter tree; "Organization" carries a resource-unique
// feature each. A third resource has no "ACCESS Resource Grouping" category
// at all, so its sortCategory is "".
function apiResource(overrides: Record<string, any> = {}) {
  return {
    resourceName: "Bridges-2",
    resourceId: 1,
    resourceType: "Compute",
    organization: "PSC",
    units: "SUs",
    userGuideUrl: "https://example.test/guide",
    resourceDescription: "A resource",
    description: "A longer description",
    recommendedUse: "General use",
    featureCategories: [
      {
        categoryId: 100,
        categoryName: "ACCESS Resource Grouping",
        categoryIsFilter: true,
        features: [{ featureId: 900, name: "NSF Capacity Resources" }],
      },
      {
        categoryId: 1,
        categoryName: "Resource Type",
        categoryDescription: "What kind of compute",
        categoryIsFilter: true,
        features: [
          { featureId: 10, name: "CPU", description: "CPU-based" },
          { featureId: 11, name: "GPU", description: "GPU-based" },
        ],
      },
      {
        categoryId: 2,
        categoryName: "Organization",
        categoryDescription: "Who runs it",
        categoryIsFilter: true,
        features: [{ featureId: 20, name: "PSC", description: "Pittsburgh Supercomputing Center" }],
      },
      {
        categoryId: 3,
        categoryName: "Not A Filter",
        categoryIsFilter: false,
        features: [{ featureId: 30, name: "Ignored" }],
      },
    ],
    ...overrides,
  };
}

function secondApiResource(overrides: Record<string, any> = {}) {
  return apiResource({
    resourceName: "Expanse",
    resourceId: 2,
    organization: "SDSC",
    featureCategories: [
      {
        categoryId: 100,
        categoryName: "ACCESS Resource Grouping",
        categoryIsFilter: true,
        features: [{ featureId: 901, name: "NSF Innovative Testbeds" }],
      },
      {
        categoryId: 1,
        categoryName: "Resource Type",
        categoryDescription: "What kind of compute",
        categoryIsFilter: true,
        features: [{ featureId: 10, name: "CPU", description: "CPU-based" }],
      },
      {
        categoryId: 2,
        categoryName: "Organization",
        categoryDescription: "Who runs it",
        categoryIsFilter: true,
        features: [{ featureId: 21, name: "SDSC", description: "San Diego Supercomputer Center" }],
      },
    ],
    ...overrides,
  });
}

describe("processCatalogResponse", () => {
  it("builds a deduplicated, alphabetized filter tree from featureCategories", () => {
    const { filters } = processCatalogResponse([apiResource(), secondApiResource()], noParams());

    // "ACCESS Resource Grouping" never becomes a filter category (it only
    // feeds sortCategory); "Not A Filter" is dropped because
    // categoryIsFilter is false.
    expect(filters.map((f) => f.categoryName)).toEqual(["Organization", "Resource Type"]);

    const resourceType = filters.find((f) => f.categoryName == "Resource Type")!;
    // CPU (id 10) appears on both resources but is deduplicated by featureId.
    expect(resourceType.features.map((f) => f.name)).toEqual(["CPU", "GPU"]);

    const organization = filters.find((f) => f.categoryName == "Organization")!;
    expect(organization.features.map((f) => f.name)).toEqual(["PSC", "SDSC"]);
  });

  it("sorts resources by the ACCESS Resource Grouping ranking, then alphabetically within it", () => {
    const anton = apiResource({ resourceName: "Anton", resourceId: 5 }); // same "NSF Capacity Resources" grouping as Bridges-2
    const { resources } = processCatalogResponse(
      [apiResource(), secondApiResource(), anton],
      noParams(),
    );
    // NSF Capacity Resources (rank 1) before NSF Innovative Testbeds (rank 2);
    // Anton before Bridges-2 within the same rank.
    expect(resources.map((r) => r.resourceName)).toEqual(["Anton", "Bridges-2", "Expanse"]);
  });

  it("excludes a resource by name before any of its features are processed", () => {
    const { filters, resources } = processCatalogResponse(
      [apiResource(), secondApiResource()],
      noParams({ excludedResources: ["Expanse"] }),
    );
    expect(resources.map((r) => r.resourceName)).toEqual(["Bridges-2"]);
    // SDSC (unique to the excluded resource) never enters the tree; CPU
    // (shared with Bridges-2) still does.
    const organization = filters.find((f) => f.categoryName == "Organization")!;
    expect(organization.features.map((f) => f.name)).toEqual(["PSC"]);
  });

  // Category-level allow/exclude only controls whether a *category* shows up
  // in the filter tree - it does NOT gate which feature names land in a
  // resource's own `features` array. That's controlled solely by
  // allowedFilters/excludedFilters below. Confirmed by reading catalog.ts:
  // the `filterIncluded` check (feature-level) is independent of whether
  // `categories[categoryId]` exists (category-level).
  it("excluding a category removes it from the filter tree but not from resource.features", () => {
    const { filters, resources } = processCatalogResponse(
      [apiResource()],
      noParams({ excludedCategories: ["Organization"] }),
    );
    expect(filters.map((f) => f.categoryName)).toEqual(["Resource Type"]);
    const bridges = resources.find((r) => r.resourceName == "Bridges-2")!;
    expect(bridges.features).toContain("PSC");
  });

  it("excluding a filter name removes it from both resource.features and the filter tree", () => {
    const { filters, resources } = processCatalogResponse(
      [apiResource()],
      noParams({ excludedFilters: ["GPU"] }),
    );
    const resourceType = filters.find((f) => f.categoryName == "Resource Type")!;
    expect(resourceType.features.map((f) => f.name)).toEqual(["CPU"]);
    const bridges = resources.find((r) => r.resourceName == "Bridges-2")!;
    expect(bridges.features).toEqual(["CPU", "PSC"]);
  });

  it("an allow-list wins outright over an exclude-list for the same field (categories)", () => {
    // useFilter() only consults the exclude list when the allow list is
    // empty, so pairing both is not "intersect" - allow wins entirely.
    const { filters } = processCatalogResponse(
      [apiResource()],
      noParams({ allowedCategories: ["Organization"], excludedCategories: ["Organization"] }),
    );
    expect(filters.map((f) => f.categoryName)).toEqual(["Organization"]);
  });

  it("orders filter categories by allowedCategories instead of alphabetically when it's set", () => {
    const { filters } = processCatalogResponse(
      [apiResource()],
      noParams({ allowedCategories: ["Resource Type", "Organization"] }),
    );
    expect(filters.map((f) => f.categoryName)).toEqual(["Resource Type", "Organization"]);
  });

  it("allowedFilters restricts resource.features to just the allowed names", () => {
    const { resources } = processCatalogResponse(
      [apiResource()],
      noParams({ allowedFilters: ["CPU"] }),
    );
    const bridges = resources.find((r) => r.resourceName == "Bridges-2")!;
    expect(bridges.features).toEqual(["CPU"]);
  });

  it("gives a resource with no ACCESS Resource Grouping category an empty sortCategory", () => {
    const noGrouping = apiResource({ resourceName: "Anvil", resourceId: 3, featureCategories: [] });
    const { resources } = processCatalogResponse([noGrouping], noParams());
    expect(resources[0].sortCategory).toBe("");
    expect(resources[0].features).toEqual([]);
  });
});

describe("activeFilters", () => {
  const filters: FilterCategoryType[] = [
    {
      categoryId: 1,
      categoryName: "Resource Type",
      categoryDescription: "",
      features: [
        { featureId: 10, name: "CPU", description: "", categoryId: 1, selected: true },
        { featureId: 11, name: "GPU", description: "", categoryId: 1, selected: false },
      ],
    },
    {
      categoryId: 2,
      categoryName: "Organization",
      categoryDescription: "",
      features: [{ featureId: 20, name: "PSC", description: "", categoryId: 2, selected: false }],
    },
  ];

  it("keeps only categories with at least one selected feature, and only the selected features within them", () => {
    expect(activeFilters(filters)).toEqual([
      {
        categoryId: 1,
        categoryName: "Resource Type",
        categoryDescription: "",
        features: [{ featureId: 10, name: "CPU", description: "", categoryId: 1, selected: true }],
      },
    ]);
  });

  it("returns an empty array when nothing is selected", () => {
    expect(activeFilters(deselectAllFeatures(filters))).toEqual([]);
  });
});

describe("computeFilteredResources", () => {
  const resources: Resource[] = [
    { resourceName: "A", resourceId: 1, resourceType: "", organization: "", units: "", userGuideUrl: "", resourceDescription: "", description: "", recommendedUse: "", features: ["CPU", "PSC"], featureIds: [10, 20], sortCategory: "" },
    { resourceName: "B", resourceId: 2, resourceType: "", organization: "", units: "", userGuideUrl: "", resourceDescription: "", description: "", recommendedUse: "", features: ["GPU"], featureIds: [11], sortCategory: "" },
    { resourceName: "C", resourceId: 3, resourceType: "", organization: "", units: "", userGuideUrl: "", resourceDescription: "", description: "", recommendedUse: "", features: ["CPU"], featureIds: [10], sortCategory: "" },
  ];

  function makeFeature(overrides: Partial<Feature>): Feature {
    return { featureId: 0, name: "", description: "", categoryId: 0, selected: false, ...overrides };
  }

  it("returns a shallow copy of every resource when no filters are active", () => {
    const filters: FilterCategoryType[] = [];
    const result = computeFilteredResources(resources, filters);
    expect(result).toEqual(resources);
    expect(result).not.toBe(resources);
  });

  it("keeps a resource that matches the single active filter", () => {
    const filters: FilterCategoryType[] = [
      { categoryId: 1, categoryName: "Resource Type", categoryDescription: "", features: [makeFeature({ featureId: 10, categoryId: 1, selected: true })] },
    ];
    expect(computeFilteredResources(resources, filters).map((r) => r.resourceName)).toEqual(["A", "C"]);
  });

  it("requires at least one match per active category (AND across categories, OR within one)", () => {
    const filters: FilterCategoryType[] = [
      { categoryId: 1, categoryName: "Resource Type", categoryDescription: "", features: [makeFeature({ featureId: 10, categoryId: 1, selected: true })] },
      { categoryId: 2, categoryName: "Organization", categoryDescription: "", features: [makeFeature({ featureId: 20, categoryId: 2, selected: true })] },
    ];
    // Only "A" has both featureId 10 (Resource Type) and 20 (Organization).
    // "C" has 10 but not 20, so it's excluded despite matching one category.
    expect(computeFilteredResources(resources, filters).map((r) => r.resourceName)).toEqual(["A"]);
  });
});

describe("toggleFeatureSelected", () => {
  it("flips only the targeted feature, leaving siblings and other categories untouched", () => {
    const filters: FilterCategoryType[] = [
      {
        categoryId: 1,
        categoryName: "Resource Type",
        categoryDescription: "",
        features: [
          { featureId: 10, name: "CPU", description: "", categoryId: 1, selected: false },
          { featureId: 11, name: "GPU", description: "", categoryId: 1, selected: false },
        ],
      },
    ];
    const result = toggleFeatureSelected(filters, filters[0].features[0]);
    expect(result[0].features[0].selected).toBe(true);
    expect(result[0].features[1].selected).toBe(false);
    // Immutable: the input filters array/category/feature are untouched.
    expect(filters[0].features[0].selected).toBe(false);
    expect(result).not.toBe(filters);
  });
});

describe("deselectAllFeatures", () => {
  it("clears selected on every feature in every category", () => {
    const filters: FilterCategoryType[] = [
      {
        categoryId: 1,
        categoryName: "Resource Type",
        categoryDescription: "",
        features: [{ featureId: 10, name: "CPU", description: "", categoryId: 1, selected: true }],
      },
    ];
    expect(deselectAllFeatures(filters)[0].features[0].selected).toBe(false);
  });
});
