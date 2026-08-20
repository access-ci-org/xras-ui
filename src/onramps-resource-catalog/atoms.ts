import { atom } from "jotai";
import { transformRampsData } from "./helpers/catalog";
import type { Catalog, FilterCategoryType, Resource } from "./types";

export const catalogsAtom = atom<Record<string, Catalog>>({});
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

const dataUrl =
  "https://operations-api.access-ci.org/wh2/cider/v1/access-active-groups/type/resource-catalog.access-ci.org/";
const resourcesUrl =
  "https://operations-api.access-ci.org/wh2/cider/v1/access-allocated/";
const featuresUrl =
  "https://operations-api.access-ci.org/wh2/cider/v1/features/";

const getRampsResourcesAtom = atom(null, async (_get, set) => {
  const [metadataRes, resourcesRes, featuresRes] = await Promise.all([
    fetch(dataUrl),
    fetch(resourcesUrl),
    fetch(featuresUrl),
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

export const toggleCatalogAtom = atom(
  null,
  (
    get,
    set,
    { catalog, selected }: { catalog: Catalog; selected: boolean },
  ) => {
    set(catalogsAtom, {
      ...get(catalogsAtom),
      [catalog.catalogLabel]: {
        ...get(catalogsAtom)[catalog.catalogLabel],
        selected,
      },
    });
  },
);
