import { atom } from "jotai";
import config from "../shared/helpers/config";
import type {
  EditableProject,
  EditablePublication,
  FilterOptions,
  FilterSelections,
  FormError,
  PageInfo,
  PublicationSummary,
  PublicationTypeOption,
} from "./types";

// ---------------------------------------------------------------------------
// Publication edit flow (replaces publicationEditSlice)
// ---------------------------------------------------------------------------

export const authenticityTokenAtom = atom<string | null>(null);
export const dataLoadedAtom = atom(false);
export const errorsAtom = atom<FormError[]>([]);
export const grantNumberAtom = atom("");
export const editProjectsAtom = atom<EditableProject[]>([]);
export const publicationAtom = atom<EditablePublication | null>(null);
export const publicationIdAtom = atom<number | string | null>(null);
export const publicationTypesAtom = atom<PublicationTypeOption[]>([]);
export const savingAtom = atom(false);
export const selectedResourcesAtom = atom<number[]>([]);
export const showSavedAtom = atom(false);
export const showEditModalAtom = atom(false);
export const resourcesNoneSelectedAtom = atom(false);

export const selectedProjectsAtom = atom((get) => get(editProjectsAtom).filter((p) => p.selected));

export const availableResourcesAtom = atom((get) => {
  const seen = new Set<number | string>();
  const resources: NonNullable<EditableProject["resources"]>[number][] = [];

  get(selectedProjectsAtom).forEach((project) => {
    (project.resources || []).forEach((resource) => {
      if (!resource?.resource_id || seen.has(resource.resource_id)) return;
      seen.add(resource.resource_id);
      resources.push(resource);
    });
  });

  return resources;
});

export const toggleProjectSelectedAtom = atom(null, (get, set, index: number) => {
  set(
    editProjectsAtom,
    get(editProjectsAtom).map((project, i) =>
      i === index ? { ...project, selected: !project.selected } : project,
    ),
  );
});

export const addErrorAtom = atom(null, (get, set, message: FormError["message"]) => {
  set(errorsAtom, [...get(errorsAtom), { id: Math.random().toString(36).slice(2), message }]);
});

export const hideErrorAtom = atom(null, (get, set, id: string) => {
  set(
    errorsAtom,
    get(errorsAtom).filter((e) => e.id !== id),
  );
});

export const resetPublicationEditStateAtom = atom(null, (_get, set) => {
  set(dataLoadedAtom, false);
  set(errorsAtom, []);
  set(grantNumberAtom, "");
  set(editProjectsAtom, []);
  set(publicationAtom, null);
  set(savingAtom, false);
  set(selectedResourcesAtom, []);
  set(showSavedAtom, false);
  set(resourcesNoneSelectedAtom, false);
});

export const editPublicationAtom = atom(null, (_get, set, publicationId: number | string | null) => {
  set(publicationIdAtom, publicationId);
  set(showEditModalAtom, true);
});

export const getPublicationDataAtom = atom(null, async (_get, set, publicationId: number | string | null) => {
  const url = publicationId
    ? `${config.routes.edit_publication_path(publicationId)}.json`
    : config.routes.publication_path("new.json");
  const response = await fetch(url, { headers: { accept: "application/json" } });
  const data = await response.json();

  data.publication.authors.forEach((a: { affiliation?: string }) => {
    if (!a.affiliation) a.affiliation = "";
  });
  set(publicationAtom, data.publication);
  set(publicationTypesAtom, data.publication_types);
  set(editProjectsAtom, data.publication.projects ?? []);
  set(
    selectedResourcesAtom,
    ((data.publication.publication_resources ?? []) as { acct_resource_id: number | string }[])
      .map((pubResource) => pubResource.acct_resource_id)
      .filter(Boolean)
      .map(Number),
  );
  set(resourcesNoneSelectedAtom, Boolean(data.publication.access_staff_publication));
  set(dataLoadedAtom, true);
});

export const grantSearchAtom = atom(null, async (get, set) => {
  const grantNumber = get(grantNumberAtom);
  try {
    const response = await fetch(
      config.routes.publications_find_project_path({ grant_number: grantNumber }),
    );
    const data = await response.json();
    set(editProjectsAtom, [...get(editProjectsAtom), data]);
    set(grantNumberAtom, "");
  } catch {
    set(addErrorAtom, "Unable to find a project with this grant number.");
  }
});

// ---------------------------------------------------------------------------
// Publication search/browse (replaces publicationsSearchSlice)
// ---------------------------------------------------------------------------

export const publicationsAtom = atom<PublicationSummary[]>([]);
export const publicationsLoadedAtom = atom(false);
export const usePaginationAtom = atom(true);
export const pageAtom = atom<PageInfo>({ current: 0, last: 1 });

export const filterSelectionsAtom = atom<FilterSelections>({
  createdBy: [],
  doi: "",
  grantNumber: "",
  journal: "",
  authorName: "",
  publicationType: "",
});

export const filterOptionsAtom = atom<FilterOptions>({
  journals: [],
  publication_types: [],
});

export const addCreatedByUsernameAtom = atom(null, (get, set, username: string) => {
  const filters = get(filterSelectionsAtom);
  set(filterSelectionsAtom, { ...filters, createdBy: [...filters.createdBy, username] });
});

export const removeCreatedByUsernameAtom = atom(null, (get, set, username: string) => {
  const filters = get(filterSelectionsAtom);
  set(filterSelectionsAtom, {
    ...filters,
    createdBy: filters.createdBy.filter((u) => u !== username),
  });
});

export const updateFilterSelectionAtom = atom(
  null,
  (get, set, { name, value }: { name: keyof FilterSelections; value: string }) => {
    set(filterSelectionsAtom, { ...get(filterSelectionsAtom), [name]: value });
  },
);

export const resetFiltersAtom = atom(null, (get, set) => {
  set(filterSelectionsAtom, {
    ...get(filterSelectionsAtom),
    createdBy: [],
    doi: "",
    journal: "",
    authorName: "",
    publicationType: "",
  });
});

export const resetPublicationsAtom = atom(null, (_get, set) => {
  set(publicationsAtom, []);
});

export const getPublicationsAtom = atom(null, async (get, set) => {
  const filters = get(filterSelectionsAtom);
  const page = get(pageAtom);
  const usePagination = get(usePaginationAtom);
  const params: Record<string, unknown> = {};

  if (filters.doi) params.doi = filters.doi;
  if (filters.authorName) params.author_name = filters.authorName;
  if (filters.journal && get(filterOptionsAtom).journals.includes(filters.journal))
    params.journal = filters.journal;
  if (filters.publicationType) params.publication_type = filters.publicationType;
  if (filters.createdBy.length) params.created_by = filters.createdBy;
  if (filters.grantNumber) params.grant_number = filters.grantNumber;

  if (usePagination) params.page = page.current + 1;
  else params.per_page = 9999;

  set(publicationsLoadedAtom, false);
  try {
    const response = await fetch(config.routes.search_publications_path(params), {
      headers: { Accept: "application/json" },
    });
    const data = await response.json();

    set(publicationsLoadedAtom, true);
    if (usePagination) {
      set(publicationsAtom, [...get(publicationsAtom), ...(data.publications || [])]);
      set(pageAtom, {
        current: data.pagination?.current_page || 0,
        last: data.pagination?.last_page || 1,
      });
    } else {
      set(publicationsAtom, data.publications || []);
    }
  } catch (error) {
    set(publicationsLoadedAtom, true);
    console.error(error);
  }
});

export const getFiltersAtom = atom(null, async (_get, set) => {
  const response = await fetch(config.routes.search_publications_filters_path());
  const data = await response.json();
  set(filterOptionsAtom, data.filters || []);
});

// ---------------------------------------------------------------------------
// Publication selection (replaces publicationsSelectSlice)
// ---------------------------------------------------------------------------

export const selectedPublicationIdsAtom = atom<(number | string)[]>([]);

export const toggleSelectedPublicationAtom = atom(null, (get, set, publicationId: number | string) => {
  const selected = get(selectedPublicationIdsAtom);
  set(
    selectedPublicationIdsAtom,
    selected.includes(publicationId)
      ? selected.filter((id) => id !== publicationId)
      : [...selected, publicationId],
  );
});

// ---------------------------------------------------------------------------
// "Update your publications" notice (replaces the publications-specific
// slice of projects/helpers/apiSlice.js, which this feature doesn't
// otherwise need)
// ---------------------------------------------------------------------------

export const showUpdatePublicationsAtom = atom(false);

export const dismissUpdatePublicationsNoticeAtom = atom(null, async (_get, set) => {
  try {
    const response = await fetch(config.routes.publications_dismiss_notice_path(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "",
      },
      body: JSON.stringify({ acknowledged: true }),
    });
    const data = await response.json();
    if (data?.success) set(showUpdatePublicationsAtom, false);
  } catch (error) {
    console.error(error);
  }
});
