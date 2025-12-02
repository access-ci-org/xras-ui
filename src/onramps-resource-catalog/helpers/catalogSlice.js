import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  catalogs: {},
  filteredResources: [],
  filters: [],
  hasErrors: false,
  onRamps: false,
  resources: [],
  resourcesLoaded: false,
  resourceSorting: {
    "NSF Capacity Resources": 1,
    "NSF Innovative Testbeds": 2,
    "Other NSF-funded Resources": 3,
    "Services and Support": 4
  }
};

export const initApp = createAsyncThunk(
  "resourceCatalog/initApp",
  async (params, { dispatch }) => {
    dispatch( setResourcesLoaded(false) );
    dispatch( getRampsResources() );
    dispatch( setResourcesLoaded(true) );
  }
);

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

export const getRampsResources = createAsyncThunk(
  "resourceCatalog/getRampsResources",
  async (params, { dispatch }) => {
    const dataUrl = "https://operations-api.access-ci.org/wh2/cider/v1/access-active-groups/type/resource-catalog.access-ci.org/";
    const resourcesUrl = "https://operations-api.access-ci.org/wh2/cider/v1/access-allocated/";
    const featuresUrl = "https://operations-api.access-ci.org/wh2/cider/v1/features/";

    const data = await fetch(dataUrl);
    const dataJson = await data.json();

    const resources = await fetch(resourcesUrl);
    const resourcesJson = await resources.json();

    const features = await fetch(featuresUrl);
    const featuresJson = await features.json();

    dispatch( handleRamps({ params, metadata: dataJson.results, resources: resourcesJson.results, features: featuresJson.results }) );

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
    return !excluded.includes(item);
  }

  return true;
};

const formatResourceFeatures = (catalog, resource, categories) => {

    const featureList = [];
    let sortCategory = "";
    resource.featureCategories
      .filter((f) => f.categoryIsFilter)
      .forEach((category) => {
        const categoryId = category.categoryId;

        if(category.categoryName == "ACCESS Resource Grouping"){
          sortCategory = category.features[0].name;
        } else {
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
        }


      });

    const featureNames = featureList
      .map((f) => f.name)
      .sort((a, b) => a > b);

    const formattedResource = {
      ...resource,
      resourceName: resource.resourceName.trim(),
      features: featureNames,
      featureIds: featureList.map((f) => f.featureId),
      sortCategory
    };

    return { formattedResource, categories }

}

const isRejectedAction = (action) => {
	return action.type.endsWith('rejected');
}

export const catalogSlice = createSlice({
  name: "resourceCatalog",
  initialState,
  reducers: {
    handleResponse: (state, { payload }) => {
      const apiResources = payload.data;
      const groups = payload.groups;
      const onRamps = payload.rampsResources;

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
      state.resources = resources
      .map((resource) => {
        if(!groups) return resource;
        const org = groups.organizations.find((o) => o.organization_name == resource.organization);
        resource.logo = org?.organization_favicon_url || null;

        if(org) {
          const group = groups.active_groups.find((ag) => ag.rollup_organization_ids.includes(org.organization_id));
          const relatedResources = groups.resources
            .filter((r) => group.rollup_info_resourceids.includes(r.info_resourceid))
          console.log(relatedResources);
        }

        return resource;
      })
      .sort((a, b) =>
        a.resourceName.localeCompare(b.resourceName)
      )
      .sort((a, b) =>
        state.resourceSorting[a.sortCategory] > state.resourceSorting[b.sortCategory]
      )

      state.filteredResources = [...state.resources];
      state.resourcesLoaded = true;
    },
    handleRamps: (state, { payload }) => {
      const { features, metadata } = payload;
      const rampsResources = payload.resources;
      const featureCategories = {};
      const formattedFeatures = {};
      const groups = metadata.active_groups;

      features.forEach((feat) => {
        featureCategories[feat.feature_category_id] = {
          categoryId: feat.feature_category_id,
          categoryName: feat.feature_category_name,
          categoryDescription: feat.feature_category_description,
          features: feat.features.map((f) => f.id),
          categoryIsFilter: feat?.other_attributes?.is_allocations_filter || false
        };

        feat.features.forEach((ff) => {
          formattedFeatures[ff.id] = {
            featureId: ff.id,
            name: ff.name,
            categoryId: ff.feature_category_id,
            isFilter: ff.is_allocations_filter,
          }
        })
      });

      const formattedResources = rampsResources.map((r) => {
        const organization = metadata.organizations.find((o) => o.organization_name == r.organization_name);
        const resourceType = r.features.find((f) => f.feature_category == "Resource Type");
        console.log(resourceType.name);
        const rfc = {}; //resourceFeatureCategories
        const resourceGroup = groups.find((g) => g.rollup_info_resourceids.includes(r.info_resourceid))
        let relatedResources = [];

        if(resourceGroup){
          relatedResources = resourceGroup.rollup_info_resourceids
            .filter((id) => id != r.info_resourceid)
            .map((id) => {
              return rampsResources.find((rr) => rr.info_resourceid == id)
            }).map((r) => {
              return {
                info_resourceid: r.info_resourceid,
                cider_resource_id: r.cider_resource_id,
                resourceName: r.short_name,
                displayResourceName: r.resource_descriptive_name,
              }
            })
        }

        r.features.forEach((f) => {
          const ff = formattedFeatures[f.id];
          const category = featureCategories[ff.categoryId];
          if(!rfc[ff.categoryId]) rfc[ff.categoryId] = {...category, features: []}

          rfc[ff.categoryId].features.push(ff);
        })

        let resource = {
          cider_resource_id: r.cider_resource_id,
          info_resourceid: r.info_resourceid,
          resourceId: r.cider_resource_id,
          resourceName: r.short_name,
          displayResourceName: r.resource_descriptive_name,
          resourceDescription: r.resource_description,
          recommendedUse: r.recommended_use,
          icon: organization?.organization_favicon_url || null,
          resourceType: resourceType?.name,
          organization: r.organization_name,
          featureCategories: Object.values(rfc),
          relatedResources,
          groupId: resourceGroup?.info_groupid
        }

        return resource;
      });

      const sources = [{
        apiUrl: 'https://allocations.access-ci.org/resources.json',
        catalogLabel: "ACCESS",
        allowedCategories: [],
        allowedFilters: [],
        allowedResources: [],
        excludedCategories: ["Resource Category", "**DELETED** ACCESS Integration Roadmap", "Resource Status"],
        excludedFilters: ["Resource Status"],
        excludedResources: ["ACCESS Credits"],
        data: formattedResources
      }];

      const { resources, catalogs, categories } = mergeData(sources);

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

      state.resources = resources
        .sort((a, b) =>
          a.resourceName.localeCompare(b.resourceName)
        )

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
      .addMatcher(isRejectedAction, (state, action) => {
        console.log(action);
      })
  },
});

export const {
  handleRamps,
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
