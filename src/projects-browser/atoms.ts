import { atom } from "jotai";
import type { Filters, PageData, Project, TypeLists } from "./types";

export const apiUrlAtom = atom("");
export const projectsAtom = atom<Project[]>([]);
export const projectsLoadedAtom = atom(false);
export const filtersLoadedAtom = atom(true);
export const listIsFilteredAtom = atom(false);

export const filtersAtom = atom<Filters>({
  org: "",
  allocationType: "",
  fosTypeIds: [],
  resource: "",
  requestNumber: "",
});

export const pageDataAtom = atom<PageData>({
  current_page: 1,
  last_page: 1,
});

export const typeListsAtom = atom<TypeLists>({
  orgs: [],
  fosTypes: [],
  allocationTypes: [],
  resources: [],
});

export const showPaginationAtom = atom((get) => {
  return (
    get(filtersLoadedAtom) &&
    get(projectsLoadedAtom) &&
    get(pageDataAtom).last_page > 1
  );
});

function buildProjectsUrl(apiUrl: string, filters: Filters, typeLists: TypeLists, currentPage: number) {
  let url = `${apiUrl}?page=${currentPage}`;

  if (filters.requestNumber != "") {
    return `${url}&request_number=${filters.requestNumber}`;
  }

  if (filters.fosTypeIds.length != typeLists.fosTypes.length) {
    url += `&fos=${filters.fosTypeIds.join(",")}`;
  }

  if (filters.org != "" && filters.org != "-- ALL --") {
    url += `&org=${encodeURIComponent(filters.org)}`;
  }

  if (filters.allocationType != "") {
    url += `&allocation_type=${filters.allocationType}`;
  }

  if (filters.resource != "") {
    url += `&resources=${filters.resource}`;
  }

  return url;
}

export const getProjectsAtom = atom(null, async (get, set) => {
  const apiUrl = get(apiUrlAtom);
  const filters = get(filtersAtom);
  const typeLists = get(typeListsAtom);
  const pageData = get(pageDataAtom);

  set(projectsLoadedAtom, false);

  const url = buildProjectsUrl(apiUrl, filters, typeLists, pageData.current_page);

  try {
    const response = await fetch(url);
    const data = await response.json();

    set(projectsLoadedAtom, true);
    set(projectsAtom, data.projects);
    set(pageDataAtom, {
      current_page: data.pages != pageData.last_page ? 1 : pageData.current_page,
      last_page: data.pages,
    });
  } catch (error) {
    console.log(error);
  }
});

export const getFiltersAtom = atom(null, async (get, set) => {
  const apiUrl = get(apiUrlAtom);
  set(filtersLoadedAtom, false);

  const response = await fetch(`${apiUrl}?filters=1`);
  const data = await response.json();

  set(typeListsAtom, data.filters);
  set(filtersAtom, {
    ...get(filtersAtom),
    fosTypeIds: (data.filters as TypeLists).fosTypes.map((fos) => fos.fosTypeId),
  });
  set(filtersLoadedAtom, true);
});

export const filterCleanupAtom = atom(null, (get, set) => {
  const typeLists = get(typeListsAtom);
  set(typeListsAtom, {
    ...typeLists,
    orgs: ["-- ALL --", ...typeLists.orgs],
  });
});

export const initAppAtom = atom(null, async (get, set) => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("_requestNumber")) {
    set(filtersAtom, {
      ...get(filtersAtom),
      requestNumber: urlParams.get("_requestNumber") ?? "",
    });
    set(listIsFilteredAtom, true);
  }

  await set(getFiltersAtom);
  await set(getProjectsAtom);
  set(filterCleanupAtom);
});

export const resetFiltersAtom = atom(null, (get, set) => {
  set(filtersAtom, {
    org: "",
    allocationType: "",
    fosTypeIds: get(typeListsAtom).fosTypes.map((fos) => fos.fosTypeId),
    resource: "",
    requestNumber: "",
  });
});

export const commitFiltersAtom = atom(null, (_get, set, filters: Filters) => {
  set(filtersAtom, filters);
});

export const updatePageDataAtom = atom(null, (get, set, payload: Partial<PageData>) => {
  set(pageDataAtom, { ...get(pageDataAtom), ...payload });
});
