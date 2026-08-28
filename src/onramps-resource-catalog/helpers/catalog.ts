import type {
  CatalogSource,
  Feature,
  FilterCategoryType,
  Resource,
} from "../types";

function useFilter(
  allowed: string[] | undefined,
  excluded: string[] | undefined,
  item: string,
) {
  if (!allowed && !excluded) return true;
  if (allowed && allowed.length == 0 && excluded && excluded.length == 0)
    return true;

  // If users specified both allow and exclude lists
  // just use the allow list. Otherwise there's unresolvable conflicts.

  if (allowed && allowed.length > 0) {
    return allowed.includes(item);
  } else if (excluded && excluded.length > 0) {
    return !excluded.includes(item);
  }

  return true;
}

function formatResourceFeatures(
  catalog: CatalogSource,
  resource: any,
  categories: Record<
    number,
    Omit<FilterCategoryType, "features"> & { features: Record<number, Feature> }
  >,
) {
  const featureList: Feature[] = [];

  resource.featureCategories
    .filter((f: any) => f.categoryIsFilter)
    .forEach((category: any) => {
      const categoryId = category.categoryId;

      // "ACCESS Resource Grouping" is metadata about how resources roll up,
      // not something to filter on, so it contributes neither a category nor
      // any features.
      if (category.categoryName == "ACCESS Resource Grouping") return;

      if (
        !categories[categoryId] &&
        useFilter(
          catalog.allowedCategories,
          catalog.excludedCategories,
          category.categoryName,
        )
      ) {
        categories[categoryId] = {
          categoryId: categoryId,
          categoryName: category.categoryName,
          categoryDescription: category.categoryDescription,
          features: {},
        };
      }

      category.features.forEach((feat: any) => {
        const feature: Feature = {
          featureId: feat.featureId,
          name: feat.name,
          categoryId: categoryId,
        };

        const filterIncluded = useFilter(
          catalog.allowedFilters,
          catalog.excludedFilters,
          feature.name,
        );
        if (filterIncluded) featureList.push(feature);

        if (
          categories[categoryId] &&
          filterIncluded &&
          !categories[categoryId].features[feature.featureId]
        ) {
          categories[categoryId].features[feature.featureId] = feature;
        }
      });
    });

  const featureNames = featureList
    .map((f) => f.name)
    .sort((a, b) => (a > b ? 1 : -1));

  const formattedResource: Resource = {
    ...resource,
    resourceName: resource.resourceName.trim(),
    features: featureNames,
  };

  return { formattedResource, categories };
}

/**
 * Applies one feed's allow/exclude configuration, returning its resources and
 * the filter categories they contribute.
 *
 * This used to merge an array of caller-supplied feeds into a keyed `catalogs`
 * record, which is why resources are collected into an id-keyed map first: a
 * later feed's resource overwrote an earlier one with the same id. There is
 * only ever the one hardcoded feed now (see `transformRampsData`), so the map
 * just dedupes within it.
 */
export function mergeData(catalog: CatalogSource & { data: any[] }) {
  const resources: Record<number, Resource> = {};
  let filterCategories: Record<
    number,
    Omit<FilterCategoryType, "features"> & { features: Record<number, Feature> }
  > = {};

  catalog.data.forEach((resource) => {
    if (
      useFilter(
        catalog.allowedResources,
        catalog.excludedResources,
        resource.resourceName,
      )
    ) {
      const { categories, formattedResource } = formatResourceFeatures(
        catalog,
        resource,
        filterCategories,
      );
      resources[resource.resourceId] = formattedResource;
      filterCategories = categories;
    }
  });

  return { resources: Object.values(resources), categories: filterCategories };
}

const rampsResourceTypes: Record<string, string> = {
  "Innovative / Novel Compute": "Innovative",
  "CPU Compute": "CPU",
  "GPU Compute": "GPU",
  "Commercial Cloud": "Cloud",
  Cloud: "Cloud",
  Storage: "Storage",
};

export function transformRampsData(
  metadata: any,
  rampsResources: any[],
  features: any[],
) {
  const featureCategories: Record<number, any> = {};
  const formattedFeatures: Record<number, any> = {};
  // Both metadata lists default to empty for the same reason the rollup lookup
  // below filters: this payload comes from an upstream API, and a missing key
  // should cost the affected field, not the whole catalog. Every per-resource
  // lookup here already tolerates a miss (`organization?.`, `resourceGroup?.`),
  // so the arrays themselves were the last thing that could take the call down.
  const groups = metadata.active_groups ?? [];
  const organizations = metadata.organizations ?? [];

  features
    .filter(
      (feat) =>
        ![
          "Resource Category",
          "**DELETED** ACCESS Integration Roadmap",
          "Resource Status",
          "Allocations",
        ].includes(feat.feature_category_name),
    )
    .forEach((feat) => {
      featureCategories[feat.feature_category_id] = {
        categoryId: feat.feature_category_id,
        categoryName: feat.feature_category_name,
        categoryDescription: feat.feature_category_description,
        features: feat.features.map((f: any) => f.id),
        categoryIsFilter:
          feat?.other_attributes?.is_allocations_filter || false,
      };

      feat.features.forEach((ff: any) => {
        formattedFeatures[ff.id] = {
          featureId: ff.id,
          name: ff.name,
          categoryId: ff.feature_category_id,
        };
      });
    });

  const formattedResources = rampsResources.map((r) => {
    const organization = organizations.find(
      (o: any) => o.organization_name == r.organization_name,
    );
    const originalResourceType = r.features.find(
      (f: any) => f.feature_category == "Resource Type",
    );
    const resourceType =
      rampsResourceTypes[originalResourceType?.name] || "other";
    const rfc: Record<number, any> = {};
    const resourceGroup = groups.find((g: any) =>
      g.rollup_info_resourceids.includes(r.info_resourceid),
    );
    let relatedResources: any[] = [];

    if (resourceGroup) {
      relatedResources = resourceGroup.rollup_info_resourceids
        .filter((id: number) => id != r.info_resourceid)
        .map((id: number) =>
          rampsResources.find((rr) => rr.info_resourceid == id),
        )
        // A rollup group can name a resource this feed doesn't carry - the
        // group list and the resource list come from separate endpoints, so
        // the two can disagree. There is nothing to link to for an id we have
        // no resource for, so drop it: a stale entry in one group is not worth
        // throwing away the whole catalog for.
        .filter((rr: any) => rr !== undefined)
        .map((rr: any) => ({
          cider_resource_id: rr.cider_resource_id,
          displayResourceName: rr.resource_descriptive_name,
        }));
    }

    const filters: number[] = [];
    r.features.forEach((f: any) => {
      filters.push(f.id);

      const ff = formattedFeatures[f.id];
      if (ff) {
        const category = featureCategories[ff.categoryId];
        if (!rfc[ff.categoryId])
          rfc[ff.categoryId] = { ...category, features: [] };
        rfc[ff.categoryId].features.push(ff);
      }
    });

    return {
      cider_resource_id: r.cider_resource_id,
      info_resourceid: r.info_resourceid,
      resourceId: r.cider_resource_id,
      resourceName: r.short_name,
      displayResourceName: r.resource_descriptive_name,
      recommendedUse: r.recommended_use,
      icon: organization?.organization_favicon_url || null,
      resourceCategory: resourceType,
      featureCategories: Object.values(rfc),
      relatedResources,
      groupId: resourceGroup?.info_groupid,
      filters,
    };
  });

  const source: CatalogSource & { data: any[] } = {
    allowedCategories: [],
    allowedFilters: [],
    allowedResources: [],
    excludedCategories: [
      "Resource Category",
      "**DELETED** ACCESS Integration Roadmap",
      "Resource Status",
    ],
    excludedFilters: ["Resource Status"],
    excludedResources: ["ACCESS Credits"],
    data: formattedResources,
  };

  const { resources, categories } = mergeData(source);

  const filters: FilterCategoryType[] = Object.values(categories)
    .map((category) => ({
      ...category,
      features: Object.values(category.features).sort((a, b) =>
        a.name > b.name ? 1 : -1,
      ),
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  const sortedResources = [...resources].sort((a, b) =>
    a.resourceName.localeCompare(b.resourceName),
  );

  return { resources: sortedResources, filters };
}
