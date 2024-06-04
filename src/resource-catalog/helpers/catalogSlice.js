import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import sanitizeHtml from "sanitize-html";

const initialState = {
  catalogs: {},
  filteredResources: [],
  filters: [],
  hasErrors: false,
  onRamps: false,
  resources: [],
  resourcesLoaded: false,
};

export const getResources = createAsyncThunk(
  "resourceCatalog/getResources",
  async (params, { dispatch }) => {
    dispatch( setResourcesLoaded(false) );
    let sources = [];

    if(params.catalogSources) {
      sources = params.catalogSources;
    } else {
      sources.push({ ...params, catalogLabel: 'Default'})
    }

    if(params.onRamps){
      sources.push({
        apiUrl: 'https://allocations.access-ci.org/resources.json',
        catalogLabel: "ACCESS",
        allowedCategories: [],
        allowedFilters: [],
        allowedResources: [],
        excludedCategories: ["Resource Category"],
        excludedFilters: [],
        excludedResources: ["ACCESS Credits"],
      });
    }

    sources.forEach((c) => c.description = sanitizeHtml(c.description));

    const apiData = await Promise.all(sources.map( async (src) => {
      const response = await fetch(src.apiUrl);
      const json = await response.json();
      return {
        ...src,
        data: json
      }
    }));

    dispatch( handleResponse({ data: apiData, params }) );
    dispatch( setResourcesLoaded(true) );

  }
);

export const catalogFilter = createAsyncThunk("resourceCatalog/getResources",
  async (params, { dispatch }) => {
    dispatch( toggleCatalog(params) );
    dispatch( toggleFilter() );
  }
)

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

const mergeData = (apiResources) => {
  const catalogs = {};
  const resources = {};
  let filterCategories = {};
  const allFilters = [];

  apiResources.forEach((catalog) => {
    catalogs[catalog.catalogLabel] = {
      ...catalog,
      resourceIds: [],
      selected: false,
      catalogId: catalog.catalogLabel.replace(/[^(A-z)]/, '')
    }

    delete catalogs[catalog.catalogLabel].data;

    catalog.data.forEach((resource) => {
      if(useFilter(catalog.allowedResources, catalog.excludedResources, resource.resourceName)){
        const { categories, formattedResource } = formatResourceFeatures(catalog, resource, filterCategories);
        resources[resource.resourceId] = formattedResource;
        catalogs[catalog.catalogLabel].resourceIds.push(resource.resourceId);
        filterCategories = categories;
      }
    });

  });

  const uniqueResources = Object.keys(resources).map((key) => resources[key]);

  return {resources: uniqueResources, catalogs, categories: filterCategories}
}

const useFilter = (allowed, excluded, item) => {
  if (!allowed && !excluded) return true;
  if (
    (allowed && allowed.length == 0)
    &&
    (excluded && excluded.length == 0)
  ) return true;

  // If users specified both allow and exclude lists
  // just use the allow list. Otherwise there's unresolvable conflicts.

  if (allowed && allowed.length > 0) {
    return allowed.find((el) => el == item);
  } else if (excluded && excluded.length > 0) {
    return !excluded.find((el) => el == item);
  }

  return true;
};

const formatResourceFeatures = (catalog, resource, categories) => {

    const featureList = [];

    resource.featureCategories
      .filter((f) => f.categoryIsFilter)
      .forEach((category) => {
        const categoryId = category.categoryId;

        if (
          !categories[categoryId] &&
          useFilter(
            catalog.allowedCategories,
            catalog.excludedCategories,
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
            catalog.allowedFilters,
            catalog.excludedFilters,
            feature.name
          );
          if (filterIncluded) featureList.push(feature);

          if (
            categories[categoryId] &&
            filterIncluded &&
            !categories[categoryId].features[feat.featureId]
          ) {
            categories[categoryId].features[feat.featureId] = feature;
          }
        });
      });

    const featureNames = featureList
      .map((f) => f.name)
      .sort((a, b) => a > b);

    const formattedResource = {
      ...resource,
      resourceName: resource.resourceName.trim(),
      resourceDescription: sanitizeHtml(resource.resourceDescription),
      recommendedUse: sanitizeHtml(resource.recommendedUse),
      description: sanitizeHtml(resource.recommendedUse),
      features: featureNames,
      featureIds: featureList.map((f) => f.featureId),
    };

    return { formattedResource, categories }

}

export const catalogSlice = createSlice({
  name: "resourceCatalog",
  initialState,
  reducers: {
    handleResponse: (state, { payload }) => {
      const apiResources = payload.data;
      const { resources, catalogs, categories } = mergeData(apiResources);

      state.catalogs = catalogs;
      state.onRamps = payload.params.onRamps;

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

      state.filters = state.filters.sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName)
      );
      state.resources = resources.sort((a, b) =>
        a.resourceName.localeCompare(b.resourceName)
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
    setResourcesLoaded: (state, { payload }) => {
      state.resourcesLoaded = payload;
    },
    toggleCatalog: (state, { payload }) => {
      const { catalog, selected } = payload;

      state.catalogs[catalog.catalogLabel].selected = selected;
    },
    toggleFilter: (state, { payload }) => {
      if(payload){
        const filter = payload;

        const stateFilterCategory = state.filters.find(
          (f) => f.categoryId == filter.categoryId
        );

        const stateFilter = stateFilterCategory.features.find(
          (f) => f.featureId == filter.featureId
        );

        stateFilter.selected = !stateFilter.selected;
      }

      const active = activeFilters(state.filters);
      let filteredResources = [];
      let selected = [];

      if (active.length > 0) {
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

      } else {
        selected = state.resources;
      }

      const catalogs = Object.keys(state.catalogs).map(k => state.catalogs[k]);
      const selectedCatalogs = catalogs.filter((c) => c.selected);
      if(selectedCatalogs.length > 0 && selectedCatalogs.length < catalogs.length){
        const resourceIds = selectedCatalogs.map((c) => c.resourceIds).flat();
        selected = selected.filter((r) => {
          return resourceIds.indexOf(r.resourceId) >= 0;
        })
      }
      state.filteredResources = selected;
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

export const {
  handleResponse,
  processData,
  resetFilters,
  setResourcesLoaded,
  toggleCatalog,
  toggleFilter
} = catalogSlice.actions;

export const selectActiveFilters = (state) => {
  return activeFilters(state.resourceCatalog.filters);
};
export const selectCatalogs = (state) => state.resourceCatalog.catalogs;
export const selectFilters = (state) => state.resourceCatalog.filters;
export const selectHasErrors = (state) => state.resourceCatalog.hasErrors;
export const selectOnRamps = (state) => state.resourceCatalog.onRamps;
export const selectResourcesLoaded = (state) => state.resourceCatalog.resourcesLoaded;
export const selectResources = (state) => state.resourceCatalog.filteredResources;

export default catalogSlice.reducer;
