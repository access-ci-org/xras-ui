import { atom } from "jotai";
import {
  computeFilteredResources,
  processCatalogResponse,
  toggleFeatureSelected,
  deselectAllFeatures,
} from "./helpers/catalog";
import type { CatalogParams, Feature, FilterCategoryType, Resource } from "./types";

export const filtersAtom = atom<FilterCategoryType[]>([]);
export const resourcesAtom = atom<Resource[]>([]);
export const filteredResourcesAtom = atom<Resource[]>([]);
export const resourcesLoadedAtom = atom(false);
export const hasErrorsAtom = atom(false);

export const getResourcesAtom = atom(null, async (_get, set, params: CatalogParams) => {
  try {
    const response = await fetch(params.apiUrl);
    const data = await response.json();
    const { filters, resources } = processCatalogResponse(data, params);
    set(filtersAtom, filters);
    set(resourcesAtom, resources);
    set(filteredResourcesAtom, [...resources]);
    set(resourcesLoadedAtom, true);
  } catch (error) {
    set(hasErrorsAtom, true);
    console.log(error);
  }
});

export const toggleFilterAtom = atom(null, (get, set, filter: Feature) => {
  const filters = toggleFeatureSelected(get(filtersAtom), filter);
  set(filtersAtom, filters);
  set(filteredResourcesAtom, computeFilteredResources(get(resourcesAtom), filters));
});

export const resetFiltersAtom = atom(null, (get, set) => {
  const filters = deselectAllFeatures(get(filtersAtom));
  set(filtersAtom, filters);
  set(filteredResourcesAtom, [...get(resourcesAtom)]);
});
