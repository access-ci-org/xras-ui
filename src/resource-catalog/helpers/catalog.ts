import type {
  CatalogParams,
  Feature,
  FilterCategoryType,
  Resource,
} from "../types";

const resourceSorting: Record<string, number> = {
  "NSF Capacity Resources": 1,
  "NSF Innovative Testbeds": 2,
  "Other NSF-funded Resources": 3,
  "Services and Support": 4,
};

function useFilter(allowed: string[], excluded: string[], item: string) {
  if (allowed.length == 0 && excluded.length == 0) return true;

  // If users specified both allow and exclude lists
  // just use the allow list. Otherwise there's unresolvable conflicts.

  if (allowed.length > 0) {
    return allowed.includes(item);
  }
  return !excluded.includes(item);
}

export function activeFilters(filters: FilterCategoryType[]) {
  const categories = filters.filter(
    (f) => f.features.filter((feat) => feat.selected).length > 0,
  );

  return categories.map((c) => ({
    ...c,
    features: c.features.filter((feat) => feat.selected),
  }));
}

export function processCatalogResponse(
  apiResources: any[],
  params: CatalogParams,
) {
  const {
    excludedCategories,
    excludedFilters,
    excludedResources,
    allowedCategories,
    allowedFilters,
  } = params;

  const resources: Resource[] = [];
  const categories: Record<
    number,
    FilterCategoryType & { features: Record<number, Feature> }
  > = {};

  apiResources
    .filter((r) => !excludedResources.includes(r.resourceName))
    .forEach((r) => {
      const feature_list: Feature[] = [];
      let sortCategory = "";
      r.featureCategories
        .filter((f: any) => f.categoryIsFilter)
        .forEach((category: any) => {
          const categoryId = category.categoryId;

          if (category.categoryName == "ACCESS Resource Grouping") {
            sortCategory = category.features[0].name;
          } else {
            if (
              !categories[categoryId] &&
              useFilter(
                allowedCategories,
                excludedCategories,
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
                description: feat.description,
                categoryId: categoryId,
                selected: false,
              };

              const filterIncluded = useFilter(
                allowedFilters,
                excludedFilters,
                feature.name,
              );
              if (filterIncluded) feature_list.push(feature);

              if (
                categories[categoryId] &&
                filterIncluded &&
                !categories[categoryId].features[feature.featureId]
              ) {
                categories[categoryId].features[feature.featureId] = feature;
              }
            });
          }
        });

      resources.push({
        resourceName: r.resourceName,
        resourceId: r.resourceId,
        resourceType: r.resourceType,
        organization: r.organization,
        units: r.units,
        userGuideUrl: r.userGuideUrl,
        resourceDescription: r.resourceDescription,
        description: r.description,
        recommendedUse: r.recommendedUse,
        features: feature_list
          .map((f) => f.name)
          .sort((a, b) => (a > b ? 1 : -1)),
        featureIds: feature_list.map((f) => f.featureId),
        sortCategory,
      });
    });

  let filters: FilterCategoryType[] = Object.values(categories).map(
    (category) => ({
      ...category,
      features: Object.values(category.features).sort((a, b) =>
        a.name > b.name ? 1 : -1,
      ),
    }),
  );

  filters =
    allowedCategories.length > 0
      ? filters.sort(
          (a, b) =>
            allowedCategories.indexOf(a.categoryName) -
            allowedCategories.indexOf(b.categoryName),
        )
      : filters.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  const sortedResources = resources
    .sort((a, b) => a.resourceName.localeCompare(b.resourceName))
    .sort(
      (a, b) =>
        resourceSorting[a.sortCategory] - resourceSorting[b.sortCategory],
    );

  return { filters, resources: sortedResources };
}

export function computeFilteredResources(
  resources: Resource[],
  filters: FilterCategoryType[],
) {
  const active = activeFilters(filters);

  if (active.length === 0) return [...resources];

  const sets = active.map((c) => c.features.map((f) => f.featureId));

  return resources.filter((r) => {
    let checksPassed = 0;
    sets.forEach((set) => {
      if (r.featureIds.some((id) => set.includes(id))) checksPassed += 1;
    });
    return checksPassed >= sets.length;
  });
}

export function toggleFeatureSelected(
  filters: FilterCategoryType[],
  filter: Feature,
) {
  return filters.map((category) => {
    if (category.categoryId !== filter.categoryId) return category;
    return {
      ...category,
      features: category.features.map((f) =>
        f.featureId === filter.featureId ? { ...f, selected: !f.selected } : f,
      ),
    };
  });
}

export function deselectAllFeatures(filters: FilterCategoryType[]) {
  return filters.map((category) => ({
    ...category,
    features: category.features.map((f) => ({ ...f, selected: false })),
  }));
}
