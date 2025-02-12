import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  filters: [],
  resources: [],
  filteredResources: [],
  resourcesLoaded: false,
  hasErrors: false,
  resourceSorting: {
    "NSF Capacity Resources": 1,
    "NSF Innovative Testbeds": 2,
    "Other NSF-funded Resources": 3,
    "Services and Support": 4
  }
};

export const getResources = createAsyncThunk(
  "resourceCatalog/getResources",
  async (params, { dispatch }) => {
    const response = await fetch(params.apiUrl);
    const data = await response.json();
    dispatch(handleResponse({ data, params }));
  }
);

const activeFilters = (filters) => {
  const selected = [];
  const categories = filters.filter(
    (f) => f.features.filter((feat) => feat.selected).length > 0
  );

  filters.forEach((c) => {
    c.features.forEach((f) => {
      if (f.selected) selected.push(f.featureId);
    });
  });

  return categories.map((c) => {
    return {
      ...c,
      features: c.features.filter((feat) => feat.selected),
    };
  });
};

const useFilter = (allowed, excluded, item) => {
  if (allowed.length == 0 && excluded.length == 0) return true;

  // If users specified both allow and exclude lists
  // just use the allow list. Otherwise there's unresolvable conflicts.

  if (allowed.length > 0) {
    return allowed.find((el) => el == item);
  } else if (excluded.length > 0) {
    return !excluded.find((el) => el == item);
  }
};

export const catalogSlice = createSlice({
  name: "resourceCatalog",
  initialState,
  reducers: {
    handleResponse: (state, { payload }) => {
      const apiResources = payload.data;
      const excludedCategories = payload.params.excludedCategories;
      const excludedFilters = payload.params.excludedFilters;
      const excludedResources = payload.params.excludedResources;
      const allowedCategories = payload.params.allowedCategories;
      const allowedFilters = payload.params.allowedFilters;

      const resources = [];
      const categories = {};
      apiResources
        .filter((r) => !excludedResources.includes(r.resourceName))
        .forEach((r) => {
          const feature_list = [];
          let sortCategory = "";
          r.featureCategories
            .filter((f) => f.categoryIsFilter)
            .forEach((category) => {
              const categoryId = category.categoryId;

              if(category.categoryName == "ACCESS Resource Grouping"){
                sortCategory = category.features[0].name;
              } else {
                if (
                  !categories[categoryId] &&
                  useFilter(
                    allowedCategories,
                    excludedCategories,
                    category.categoryName
                  )
                ) {
                  categories[categoryId] = {
                    categoryId: categoryId,
                    categoryName: category.categoryName,
                    categoryDescription: category.categoryDescription,
                    features: {},
                  };
                }

                category.features.forEach((feat) => {
                  const feature = {
                    featureId: feat.featureId,
                    name: feat.name,
                    description: feat.description,
                    categoryId: categoryId,
                    selected: false,
                  };

                  const filterIncluded = useFilter(
                    allowedFilters,
                    excludedFilters,
                    feature.name
                  );
                  if (filterIncluded) feature_list.push(feature);

                  if (
                    categories[categoryId] &&
                    filterIncluded &&
                    !categories[categoryId].features[feat.featureId]
                  ) {
                    categories[categoryId].features[feat.featureId] = feature;
                  }
                });
              }
            });

          const resource = {
            resourceName: r.resourceName,
            resourceId: r.resourceId,
            resourceType: r.resourceType,
            organization: r.organization,
            units: r.units,
            userGuideUrl: r.userGuideUrl,
            resourceDescription: r.resourceDescription,
            description: r.description,
            recommendedUse: r.recommendedUse,
            features: feature_list.map((f) => f.name).sort((a, b) => a > b),
            featureIds: feature_list.map((f) => f.featureId),
            sortCategory
          };

          resources.push(resource);
        });

      for (const categoryId in categories) {
        const category = categories[categoryId];
        const features = [];

        for (const featureId in category.features) {
          features.push(category.features[featureId]);
        }

        state.filters.push({
          ...category,
          features: features.sort((a, b) => a.name > b.name),
        });
      }

      if(allowedCategories.length > 0){
        state.filters = state.filters.sort((a, b) =>
          allowedCategories.indexOf(a.categoryName) > allowedCategories.indexOf(b.categoryName)
        );
      } else {
        state.filters = state.filters.sort((a, b) =>
          a.categoryName.localeCompare(b.categoryName)
        );
      }


      state.resources = resources
      .sort((a, b) =>
        a.resourceName.localeCompare(b.resourceName)
      )
      .sort((a, b) =>
        state.resourceSorting[a.sortCategory] > state.resourceSorting[b.sortCategory]
      );

      state.filteredResources = [...state.resources];
      state.resourcesLoaded = true;
    },
    resetFilters: (state) => {
      state.filters.forEach((c) => {
        c.features.forEach((f) => (f.selected = false));
      });

      state.filteredResources = [...state.resources];
    },
    toggleFilter: (state, { payload }) => {
      const filter = payload;

      const stateFilterCategory = state.filters.find(
        (f) => f.categoryId == filter.categoryId
      );

      const stateFilter = stateFilterCategory.features.find(
        (f) => f.featureId == filter.featureId
      );

      stateFilter.selected = !stateFilter.selected;

      const active = activeFilters(state.filters);

      if (active.length > 0) {
        const selected = [];
        const sets = active.map((c) => c.features.map((f) => f.featureId));

        state.resources.forEach((r) => {
          let checksPassed = 0;
          sets.forEach((set) => {
            let passed = false;
            r.featureIds.forEach((id) => {
              if (set.indexOf(id) >= 0) passed = true;
            });
            if (passed) checksPassed += 1;
          });
          if (checksPassed >= sets.length) {
            selected.push(r);
          }
        });

        state.filteredResources = selected;
      } else {
        state.filteredResources = [...state.resources];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getResources.pending, (state) => {})
      .addCase(getResources.fulfilled, (state, action) => {})
      .addCase(getResources.rejected, (state, data) => {
        state.hasErrors = true;
        console.log(data.error);
      });
  },
});

export const { handleResponse, processData, resetFilters, toggleFilter } =
  catalogSlice.actions;

export const selectActiveFilters = (state) => {
  return activeFilters(state.resourceCatalog.filters);
};
export const selecthasErrors = (state) => state.resourceCatalog.hasErrors;
export const selectResourcesLoaded = (state) =>
  state.resourceCatalog.resourcesLoaded;
export const selectFilters = (state) => state.resourceCatalog.filters;
export const selectResources = (state) =>
  state.resourceCatalog.filteredResources;
export default catalogSlice.reducer;
