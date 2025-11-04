import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";

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
  },
  selectedCategory: "CPU",
  selectedFilters: [],
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

    dispatch( handleRamps({ params, metadata: dataJson.results, rampsResources: resourcesJson.results, features: featuresJson.results }) );

  }
);

export const catalogFilter = createAsyncThunk("resourceCatalog/getResources",
  async (params, { dispatch }) => {
    dispatch( toggleCatalog(params) );
    dispatch( toggleFilter() );
  }
)

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
      const { features, metadata, rampsResources } = payload;
      const featureCategories = {};
      const formattedFeatures = {};
      const groups = metadata.active_groups;
      const resourceTypes = {
        "Innovative / Novel Compute": "Innovative",
        "CPU Compute": "CPU",
        "GPU Compute": "GPU",
        "Commercial Cloud": "Cloud",
        "Cloud": "Cloud",
        "Storage": "Storage"
      }

      features
      .filter((feat) => {
        return !["Resource Category", "**DELETED** ACCESS Integration Roadmap", "Resource Status", "Allocations"].includes(feat.feature_category_name);
      })
      .forEach((feat) => {
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
        const originalResourceType = r.features.find((f) => f.feature_category == "Resource Type");
        const resourceType = resourceTypes[originalResourceType?.name] || "other";
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

        const filters = [];
        r.features.forEach((f) => {

          filters.push(f.id);

          const ff = formattedFeatures[f.id];
          if(ff) {
            const category = featureCategories[ff.categoryId];
            if(!rfc[ff.categoryId]) rfc[ff.categoryId] = {...category, features: []}

            rfc[ff.categoryId].features.push(ff);
          }
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
          resourceType: originalResourceType?.name,
          resourceCategory: resourceType,
          organization: r.organization_name,
          featureCategories: Object.values(rfc),
          relatedResources,
          groupId: resourceGroup?.info_groupid,
          filters
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
        //if(category.categoryName == "Resource Type") continue;

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
      state.selectedFilters = [];
    },
    setResourcesLoaded: (state, { payload }) => {
      state.resourcesLoaded = payload;
    },
    setSelectedCategory: (state, { payload }) => {
      state.selectedCategory = payload;
    },
    toggleCatalog: (state, { payload }) => {
      const { catalog, selected } = payload;

      state.catalogs[catalog.catalogLabel].selected = selected;
    },
    toggleFilter: (state, { payload }) => {
      if(state.selectedFilters.includes(payload)){
        state.selectedFilters = state.selectedFilters.filter((f) => f != payload);
      } else {
        state.selectedFilters.push(payload);
      }
      return;
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
  setSelectedCategory,
  toggleCatalog,
  toggleFilter
} = catalogSlice.actions;

export const selectAllResources = (state) => state.resourceCatalog.resources;
export const selectCatalogs = (state) => state.resourceCatalog.catalogs;
export const selectFilters = (state) => state.resourceCatalog.filters;
export const selectHasErrors = (state) => state.resourceCatalog.hasErrors;
export const selectOnRamps = (state) => state.resourceCatalog.onRamps;
export const selectResourcesLoaded = (state) => state.resourceCatalog.resourcesLoaded;
export const selectSelectedCategory = (state) => state.resourceCatalog.selectedCategory;
export const selectSelectedFilters = (state) => state.resourceCatalog.selectedFilters;

export const selectResources = createSelector(
	[selectAllResources, selectSelectedFilters, selectSelectedCategory],
	(resources, filters, selectedCategory) => {
    const filtered = resources.filter((r) => r.resourceCategory == selectedCategory);

    if(filters.length == 0) return resources;

    return resources.filter((resource) => {
      return filters.some(filter => resource.filters.includes(filter));
    })

  }
);

export default catalogSlice.reducer;
