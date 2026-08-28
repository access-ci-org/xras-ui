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

// Shared by three independent gates - resources, categories and features - so
// it says nothing about *what* is being filtered. Each call site documents
// which output it controls; they are not symmetric, and that is the one thing
// worth knowing about this file.
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
    Omit<FilterCategoryType, "features"> & { features: Record<number, Feature> }
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
            // CATEGORY GATE: decides only whether this category gets a node in
            // the filter tree. It does NOT gate `resource.features` /
            // `resource.featureIds` - the feature gate below is the sole
            // authority on those, and it does not consult this result. So
            // excluding a category (or leaving it out of an allow-list) hides
            // the filter while its feature names go on rendering as badges on
            // every card in it. Both directions are pinned in catalog.test.ts.
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

              // FEATURE GATE: the only thing that keeps a name off a
              // resource card. It also gates the tree, via the
              // `categories[categoryId] && filterIncluded` check below - which
              // is why the two gates read as symmetric and are not. To drop a
              // category from the tree *and* its names from the cards, its
              // feature names have to go in excludedFilters as well.
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

  // A third, unrelated use of allowedCategories: when set it doubles as the
  // display order for the tree, so it is not a pure filter.
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
