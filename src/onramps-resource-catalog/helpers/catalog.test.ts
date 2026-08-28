import { describe, expect, it } from "vitest";
import { mergeData, transformRampsData } from "@/onramps-resource-catalog/helpers/catalog";
import type { CatalogSource } from "@/onramps-resource-catalog/types";

function source(overrides: Partial<CatalogSource> = {}): CatalogSource {
  return {
    allowedCategories: [],
    allowedFilters: [],
    excludedCategories: [],
    excludedFilters: [],
    excludedResources: [],
    ...overrides,
  };
}

function rawResource(overrides: Record<string, any> = {}) {
  return {
    resourceId: 1,
    resourceName: "Bridges-2",
    featureCategories: [
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
    ],
    ...overrides,
  };
}

describe("mergeData", () => {
  it("trims resourceName and dedupes shared features by featureId across resources", () => {
    const resourceA = rawResource({ resourceId: 1, resourceName: "  Bridges-2  " });
    const resourceB = rawResource({
      resourceId: 2,
      resourceName: "Expanse",
      featureCategories: [
        {
          categoryId: 1,
          categoryName: "Resource Type",
          categoryDescription: "What kind of compute",
          categoryIsFilter: true,
          // Shares featureId 10 ("CPU") with resourceA.
          features: [{ featureId: 10, name: "CPU", description: "CPU-based" }],
        },
      ],
    });
    const { resources, categories } = mergeData({ ...source(), data: [resourceA, resourceB] });
    expect(resources.find((r) => r.resourceId == 1)!.resourceName).toBe("Bridges-2");
    expect(categories[1].features[10]).toBeDefined();
    expect(Object.keys(categories[1].features)).toEqual(["10", "11"]);
  });

  it("excludes resources not in a catalog source's allowedResources list", () => {
    const { resources } = mergeData({
      ...source({ allowedResources: ["Bridges-2"] }),
      data: [rawResource({ resourceId: 1, resourceName: "Bridges-2" }), rawResource({ resourceId: 2, resourceName: "Expanse" })],
    });
    expect(resources.map((r) => r.resourceId)).toEqual([1]);
  });

  // Resources are collected into an id-keyed map, so a duplicate resourceId
  // within the feed keeps the last one rather than emitting both.
  it("a later resource with the same resourceId overwrites an earlier one", () => {
    const { resources } = mergeData({
      ...source(),
      data: [
        rawResource({ resourceId: 1, resourceName: "First" }),
        rawResource({ resourceId: 1, resourceName: "Second" }),
      ],
    });
    expect(resources).toHaveLength(1);
    expect(resources[0].resourceName).toBe("Second");
  });

  // "ACCESS Resource Grouping" contributes neither a filter category nor any
  // features, even though it is flagged categoryIsFilter.
  it("skips the ACCESS Resource Grouping category entirely", () => {
    const { resources, categories } = mergeData({
      ...source(),
      data: [
        rawResource({
          resourceId: 1,
          featureCategories: [
            {
              categoryId: 7,
              categoryName: "ACCESS Resource Grouping",
              categoryDescription: "How resources roll up",
              categoryIsFilter: true,
              features: [{ featureId: 70, name: "Bridges family", description: "" }],
            },
          ],
        }),
      ],
    });
    expect(categories).toEqual({});
    expect(resources[0].features).toEqual([]);
  });
});

describe("transformRampsData", () => {
  // active_groups is empty by default; the tests that care about rollup groups
  // supply their own. A group naming an id absent from rampsResources is no
  // longer fatal - see "skips a rollup id with no matching resource" below.
  const metadata = {
    active_groups: [] as { info_groupid: number; rollup_info_resourceids: number[] }[],
    organizations: [{ organization_name: "PSC", organization_favicon_url: "https://psc.test/favicon.ico" }],
  };

  const features = [
    // is_allocations_filter: false -> excluded from the final `filters` tree,
    // but still drives resourceCategory bucketing below.
    {
      feature_category_id: 1,
      feature_category_name: "Resource Type",
      feature_category_description: "What kind of compute",
      other_attributes: { is_allocations_filter: false },
      features: [
        { id: 101, name: "CPU Compute", feature_category_id: 1, is_allocations_filter: false },
        { id: 102, name: "GPU Compute", feature_category_id: 1, is_allocations_filter: false },
      ],
    },
    // is_allocations_filter: true -> ends up in the final `filters` tree.
    {
      feature_category_id: 2,
      feature_category_name: "Access Type",
      feature_category_description: "How you access it",
      other_attributes: { is_allocations_filter: true },
      features: [{ id: 201, name: "Batch", feature_category_id: 2, is_allocations_filter: true }],
    },
    // Dropped upstream by the hardcoded feature_category_name exclusion list
    // before it ever reaches formattedFeatures/featureCategories at all.
    {
      feature_category_id: 3,
      feature_category_name: "Resource Status",
      other_attributes: { is_allocations_filter: true },
      features: [{ id: 301, name: "Production", feature_category_id: 3, is_allocations_filter: true }],
    },
  ];

  function rampsResource(overrides: Record<string, any> = {}) {
    return {
      cider_resource_id: 1,
      info_resourceid: 1,
      short_name: "Bridges-2",
      resource_descriptive_name: "Bridges-2 Regular Memory",
      resource_description: "A supercomputer",
      recommended_use: "General purpose",
      organization_name: "PSC",
      features: [
        { id: 101, name: "CPU Compute", feature_category: "Resource Type" },
        { id: 201, name: "Batch", feature_category: "Access Type" },
        // Present on the resource but the category was dropped upstream;
        // formattedFeatures[301] never gets created, so this id is pushed to
        // the resource's raw `filters` list but contributes nothing to
        // featureCategories.
        { id: 301, name: "Production", feature_category: "Resource Status" },
      ],
      ...overrides,
    };
  }

  it("maps a known Resource Type name to its short resourceCategory bucket", () => {
    const { resources } = transformRampsData(metadata, [rampsResource()], features);
    const bridges = resources.find((r) => r.resourceName == "Bridges-2")!;
    expect(bridges.resourceCategory).toBe("CPU");
  });

  it('falls back to "other" for an unrecognized Resource Type name', () => {
    const unknownType = rampsResource({
      cider_resource_id: 9,
      info_resourceid: 9,
      short_name: "Mystery",
      features: [{ id: 101, name: "Quantum Compute", feature_category: "Resource Type" }],
    });
    const { resources } = transformRampsData(metadata, [unknownType], features);
    expect(resources.find((r) => r.resourceName == "Mystery")!.resourceCategory).toBe("other");
  });

  it("only carries non-allocations-filter categories through to resource type, not into the filters tree", () => {
    const { filters } = transformRampsData(metadata, [rampsResource()], features);
    expect(filters.map((f) => f.categoryName)).toEqual(["Access Type"]);
  });

  it("drops a feature category entirely (Resource Status) before it can become a filter or feature", () => {
    const { resources, filters } = transformRampsData(metadata, [rampsResource()], features);
    const bridges = resources.find((r) => r.resourceName == "Bridges-2")!;
    expect(bridges.features).not.toContain("Production");
    expect(filters.some((f) => f.categoryName == "Resource Status")).toBe(false);
  });

  it("resolves an organization's favicon as the resource icon, or null when unknown", () => {
    const { resources } = transformRampsData(metadata, [rampsResource()], features);
    expect(resources.find((r) => r.resourceName == "Bridges-2")!.icon).toBe("https://psc.test/favicon.ico");

    const unknownOrg = rampsResource({ cider_resource_id: 8, info_resourceid: 8, short_name: "Orphan", organization_name: "Nobody" });
    const { resources: withUnknown } = transformRampsData(metadata, [unknownOrg], features);
    expect(withUnknown.find((r) => r.resourceName == "Orphan")!.icon).toBeNull();
  });

  it("computes relatedResources from the resource's rollup group, excluding itself", () => {
    const grouped = rampsResource({ cider_resource_id: 1, info_resourceid: 1, short_name: "Bridges-2" });
    const groupMate = rampsResource({
      cider_resource_id: 2,
      info_resourceid: 2,
      short_name: "Bridges-2 Wide",
      resource_descriptive_name: "Bridges-2 Wide Memory",
    });
    const metadataWithGroup = {
      ...metadata,
      active_groups: [{ info_groupid: 555, rollup_info_resourceids: [1, 2] }],
    };
    const { resources } = transformRampsData(metadataWithGroup, [grouped, groupMate], features);
    const bridges = resources.find((r) => r.resourceName == "Bridges-2")!;
    expect(bridges.groupId).toBe(555);
    expect(bridges.relatedResources).toEqual([
      { cider_resource_id: 2, displayResourceName: "Bridges-2 Wide Memory" },
    ]);
  });

  // Was bug #11. The group list and the resource list come from separate
  // endpoints, so a group can outrun the resources actually in the feed; the
  // unguarded `.map` over `rampsResources.find(...)` then threw
  // `TypeError: Cannot read properties of undefined (reading
  // 'cider_resource_id')` and took the entire catalog down with it.
  it("skips a rollup id with no matching resource instead of throwing", () => {
    const grouped = rampsResource({ cider_resource_id: 1, info_resourceid: 1, short_name: "Bridges-2" });
    const metadataWithGroup = {
      ...metadata,
      active_groups: [{ info_groupid: 555, rollup_info_resourceids: [1, 2] }],
    };

    // Only resource 1 is in the feed; the group also names 2.
    const { resources } = transformRampsData(metadataWithGroup, [grouped], features);

    const bridges = resources.find((r) => r.resourceName == "Bridges-2")!;
    // The group membership itself still holds - only the unresolvable link is
    // dropped, so groupId survives and the resource stays in the catalog.
    expect(bridges.groupId).toBe(555);
    expect(bridges.relatedResources).toEqual([]);
  });

  it("keeps the resolvable members of a group that also names a missing one", () => {
    const grouped = rampsResource({ cider_resource_id: 1, info_resourceid: 1, short_name: "Bridges-2" });
    const groupMate = rampsResource({
      cider_resource_id: 2,
      info_resourceid: 2,
      short_name: "Bridges-2 Wide",
      resource_descriptive_name: "Bridges-2 Wide Memory",
    });
    const metadataWithGroup = {
      ...metadata,
      active_groups: [{ info_groupid: 555, rollup_info_resourceids: [1, 2, 99] }],
    };

    const { resources } = transformRampsData(metadataWithGroup, [grouped, groupMate], features);

    // 99 is dropped, 2 is not: the filter has to be per-id, not all-or-nothing.
    expect(resources.find((r) => r.resourceName == "Bridges-2")!.relatedResources).toEqual([
      { cider_resource_id: 2, displayResourceName: "Bridges-2 Wide Memory" },
    ]);
  });

  // Same class as #11, one level up: the metadata payload is upstream data, so
  // a missing list should cost the field it feeds and nothing else. Both of
  // these threw before the guards - `groups.find(...)` and
  // `metadata.organizations.find(...)` were the only unguarded dereferences
  // left in the function.
  it("treats missing active_groups as no rollup groups", () => {
    const solo = rampsResource({ cider_resource_id: 3, info_resourceid: 3, short_name: "Solo" });
    // Built explicitly rather than destructured, so what is absent is obvious.
    const { resources } = transformRampsData(
      { organizations: metadata.organizations },
      [solo],
      features,
    );

    const result = resources.find((r) => r.resourceName == "Solo")!;
    expect(result.groupId).toBeUndefined();
    expect(result.relatedResources).toEqual([]);
    // The rest of the resource is unaffected - losing the group list costs the
    // grouping fields only.
    expect(result.icon).toBe("https://psc.test/favicon.ico");
  });

  it("treats missing organizations as an unknown organization", () => {
    const solo = rampsResource({ cider_resource_id: 3, info_resourceid: 3, short_name: "Solo" });
    const { resources } = transformRampsData(
      { active_groups: metadata.active_groups },
      [solo],
      features,
    );

    const result = resources.find((r) => r.resourceName == "Solo")!;
    // Same outcome as an organization_name that matches nothing, which the
    // "unknown organization" test above already covers.
    expect(result.icon).toBeNull();
    expect(result.resourceCategory).toBe("CPU");
  });

  it("leaves groupId and relatedResources empty for a resource in no rollup group", () => {
    const solo = rampsResource({ cider_resource_id: 3, info_resourceid: 3, short_name: "Solo" });
    const { resources } = transformRampsData(metadata, [solo], features);
    const result = resources.find((r) => r.resourceName == "Solo")!;
    expect(result.groupId).toBeUndefined();
    expect(result.relatedResources).toEqual([]);
  });

  it('excludes "ACCESS Credits" via the hardcoded ACCESS source config', () => {
    const credits = rampsResource({ cider_resource_id: 4, info_resourceid: 4, short_name: "ACCESS Credits" });
    const { resources } = transformRampsData(metadata, [rampsResource(), credits], features);
    expect(resources.map((r) => r.resourceName)).not.toContain("ACCESS Credits");
  });

  it("sorts the final resource list alphabetically by name, not by any grouping rank", () => {
    const zeta = rampsResource({ cider_resource_id: 5, info_resourceid: 5, short_name: "Zeta" });
    const alpha = rampsResource({ cider_resource_id: 6, info_resourceid: 6, short_name: "Alpha" });
    const { resources } = transformRampsData(metadata, [zeta, alpha, rampsResource()], features);
    expect(resources.map((r) => r.resourceName)).toEqual(["Alpha", "Bridges-2", "Zeta"]);
  });
});
