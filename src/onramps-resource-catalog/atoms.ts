import { atom } from "jotai";
import { transformRampsData } from "./helpers/catalog";
import type { FilterCategoryType, Resource } from "./types";

export const filtersAtom = atom<FilterCategoryType[]>([]);
export const hasErrorsAtom = atom(false);
export const resourcesAtom = atom<Resource[]>([]);
export const resourcesLoadedAtom = atom(false);
export const selectedFiltersAtom = atom<number[]>([]);

export const filteredResourcesAtom = atom((get) => {
  const resources = get(resourcesAtom);
  const selectedFilters = get(selectedFiltersAtom);

  if (selectedFilters.length == 0) return resources;

  return resources.filter((resource) =>
    selectedFilters.some((filter) => resource.filters?.includes(filter)),
  );
});

/**
 * Base of the ACCESS operations API the catalog reads. The three feeds below
 * all hang off it, so one knob is enough to point the widget at a staging or
 * sandbox deployment; `onRampsResourceCatalog`'s `apiUrl` prop overrides it.
 *
 * Exported so tests can set it instead of having to intercept these literal
 * production URLs.
 */
export const defaultApiUrl = "https://operations-api.access-ci.org/wh2/cider/v1";

export const apiUrlAtom = atom(defaultApiUrl);

const getRampsResourcesAtom = atom(null, async (get, set) => {
  // Tolerate a trailing slash on a caller-supplied base, since every path
  // below adds its own.
  const api = get(apiUrlAtom).replace(/\/+$/, "");

  const [metadataRes, resourcesRes, featuresRes] = await Promise.all([
    fetch(`${api}/access-active-groups/type/resource-catalog.access-ci.org/`),
    fetch(`${api}/access-allocated/`),
    fetch(`${api}/features/`),
  ]);
  const metadata = (await metadataRes.json()).results;
  const rampsResources = (await resourcesRes.json()).results;
  const features = (await featuresRes.json()).results;

  const { resources, filters } = transformRampsData(
    metadata,
    rampsResources,
    features,
  );

  set(filtersAtom, filters);
  set(resourcesAtom, resources);
  set(resourcesLoadedAtom, true);
});

export const initAppAtom = atom(null, async (_get, set) => {
  set(resourcesLoadedAtom, false);
  try {
    await set(getRampsResourcesAtom);
  } catch (error) {
    set(hasErrorsAtom, true);
    console.log(error);
  }
  set(resourcesLoadedAtom, true);
});

export const resetFiltersAtom = atom(null, (_get, set) => {
  set(selectedFiltersAtom, []);
});

export const toggleFilterAtom = atom(null, (get, set, featureId: number) => {
  const selectedFilters = get(selectedFiltersAtom);
  set(
    selectedFiltersAtom,
    selectedFilters.includes(featureId)
      ? selectedFilters.filter((f) => f != featureId)
      : [...selectedFilters, featureId],
  );
});
