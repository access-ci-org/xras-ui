import { atom } from "jotai";
import config from "../shared/helpers/config";
import { invalidFormAlert, validateForm } from "./FormValidation";
import type {
  EditableProject,
  EditablePublication,
  FilterOptions,
  FilterSelections,
  FormError,
  PageInfo,
  PublicationSummary,
  PublicationTypeOption,
  TagOption,
} from "./types";

// ---------------------------------------------------------------------------
// Publication edit flow (replaces publicationEditSlice)
// ---------------------------------------------------------------------------

export const authenticityTokenAtom = atom<string | null>(null);
export const dataLoadedAtom = atom(false);
export const errorsAtom = atom<FormError[]>([]);
export const formValidAtom = atom(false);
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

export const authorsAtom = atom((get) => get(publicationAtom)?.authors ?? []);
export const doiAtom = atom((get) => get(publicationAtom)?.doi ?? "");
export const publicationTagsAtom = atom((get) => get(publicationAtom)?.tags ?? []);

export const authorsExistAtom = atom((get) => {
  const authors = get(authorsAtom);
  if (authors.length === 0) return false;
  return authors.every((author) => author.first_name !== "" && author.last_name !== "");
});

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

export const resourcesSelectionSatisfiedAtom = atom(
  (get) => get(selectedResourcesAtom).length > 0 || get(resourcesNoneSelectedAtom),
);

export const saveEnabledAtom = atom((get) => {
  const selectedProjectsCount = get(selectedProjectsAtom).length;
  return (
    !get(savingAtom) &&
    get(dataLoadedAtom) &&
    get(formValidAtom) &&
    get(authorsExistAtom) &&
    selectedProjectsCount > 0 &&
    get(resourcesSelectionSatisfiedAtom)
  );
});

function emptyAuthor() {
  return {
    portal_username: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    prefix: "",
    suffix: "",
    initials: "",
    affiliation: "",
    hash: {},
  };
}

export const addAuthorAtom = atom(null, (get, set) => {
  const publication = get(publicationAtom);
  if (!publication) return;
  set(publicationAtom, { ...publication, authors: [...publication.authors, emptyAuthor()] });
});

export const deleteAuthorAtom = atom(null, (get, set, index: number) => {
  const publication = get(publicationAtom);
  if (!publication) return;
  set(publicationAtom, {
    ...publication,
    authors: publication.authors.filter((_, i) => i !== index),
  });
});

export const updateAuthorAtom = atom(
  null,
  (get, set, { idx, key, value }: { idx: number; key: string; value: string }) => {
    const publication = get(publicationAtom);
    if (!publication) return;
    set(publicationAtom, {
      ...publication,
      authors: publication.authors.map((author, i) =>
        i === idx ? { ...author, [key]: value } : author,
      ),
    });
  },
);

export const updatePublicationFieldAtom = atom(
  null,
  (get, set, { key, value }: { key: string; value: unknown }) => {
    const publication = get(publicationAtom);
    if (!publication) return;
    set(publicationAtom, { ...publication, [key]: value });
  },
);

export const updateFieldAtom = atom(
  null,
  (get, set, { index, value }: { index: number; value: string }) => {
    const publication = get(publicationAtom);
    if (!publication) return;
    set(publicationAtom, {
      ...publication,
      fields: publication.fields.map((field, i) =>
        i === index ? { ...field, field_value: value } : field,
      ),
    });
  },
);

export const changePublicationTypeAtom = atom(null, (get, set, publicationType: string) => {
  const publication = get(publicationAtom);
  const publicationTypes = get(publicationTypesAtom);
  if (!publication) return;

  const newFields = publicationTypes.find((pt) => pt.publication_type === publicationType)?.fields ?? [];
  const mergedFields = newFields.map((nf) => {
    const existing = publication.fields.find((f) => f.csl_field_name === nf.csl_field_name);
    return existing ? { ...nf, field_value: existing.field_value } : nf;
  });

  set(publicationAtom, { ...publication, publication_type: publicationType, fields: mergedFields });
});

export const updateTagsAtom = atom(
  null,
  (get, set, { category, tags }: { category: string; tags: TagOption[] }) => {
    const publication = get(publicationAtom);
    if (!publication) return;
    const otherTags = (publication.tags ?? []).filter((t) => t.label !== category);
    set(publicationAtom, {
      ...publication,
      tags: [...otherTags, { label: category, options: tags }],
    });
  },
);

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

export const updateSelectedResourcesAtom = atom(null, (_get, set, resourceIds: number[]) => {
  set(selectedResourcesAtom, resourceIds);
  if (resourceIds.length > 0) set(resourcesNoneSelectedAtom, false);
});

export const setResourcesNoneSelectedAtom = atom(null, (_get, set, noneSelected: boolean) => {
  set(resourcesNoneSelectedAtom, noneSelected);
  if (noneSelected) set(selectedResourcesAtom, []);
});

export const resetPublicationEditStateAtom = atom(null, (_get, set) => {
  set(dataLoadedAtom, false);
  set(errorsAtom, []);
  set(formValidAtom, false);
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
  set(formValidAtom, data.publication.title.trim() !== "");
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

const SKIPPED_PUBLICATION_KEYS = new Set(["fields", "projects", "publication_resources", "tags"]);

export const setPublicationFromDoiAtom = atom(null, (get, set, payload: Record<string, unknown>) => {
  const publication = get(publicationAtom);
  if (!publication) return;

  const fields = publication.fields.map((f) => ({
    ...f,
    field_value: (payload[f.csl_field_name] as string | undefined) ?? "",
  }));

  const updates: Partial<EditablePublication> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (SKIPPED_PUBLICATION_KEYS.has(key)) return;
    if (key === "authors") {
      if (Array.isArray(value)) {
        updates.authors = value.map((author) => ({ ...author, affiliation: author.affiliation ?? "" }));
      }
      return;
    }
    if (value != null) updates[key] = value;
  });

  set(publicationAtom, { ...publication, ...updates, fields });
  set(formValidAtom, Boolean((payload.title as string | undefined)?.trim()));
});

export const doiLookupAtom = atom(null, async (get, set) => {
  const doi = get(publicationAtom)?.doi;
  const lookupError =
    "Unable to retrieve publication. Double check your DOI, or continue entering information manually.";

  try {
    const response = await fetch(config.routes.publications_lookup_path({ doi }));
    const data = await response.json();

    if (data.title !== "") {
      const pubType = get(publicationTypesAtom).find((pt) => pt.citation_style_type === data.type);
      set(changePublicationTypeAtom, pubType ? pubType.publication_type : "Other");
      set(setPublicationFromDoiAtom, data);
    } else {
      set(addErrorAtom, lookupError);
    }
  } catch {
    set(addErrorAtom, lookupError);
  }
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

export const savePublicationAtom = atom(null, async (get, set) => {
  const publication = get(publicationAtom);
  if (!publication) return;

  const selectedProjects = get(selectedProjectsAtom);
  const errors = get(errorsAtom);
  const { formValid, missingFields } = validateForm(
    publication,
    ["title", "publication_year", "publication_month"],
    ["first_name", "last_name"],
  );

  if (!formValid) {
    errors.forEach((error) => set(hideErrorAtom, error.id));
    set(addErrorAtom, invalidFormAlert(missingFields));
    return;
  }

  const token =
    get(authenticityTokenAtom) ||
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ||
    "";

  const formData = {
    authenticity_token: token,
    publication: {
      ...publication,
      access_staff_publication: get(resourcesNoneSelectedAtom),
    },
    authors: publication.authors.map((a) => ({ ...a, order: 0 })),
    tags: [],
    projects: selectedProjects,
    resources: get(selectedResourcesAtom).map((resource_id) => ({ resource_id })),
  };

  const url = publication.publication_id
    ? config.routes.publication_path(publication.publication_id)
    : config.routes.publications_path();
  const method = publication.publication_id ? "PATCH" : "POST";

  set(savingAtom, true);
  set(showSavedAtom, false);

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error(`Save failed with status ${response.status}`);

    if (!publication.publication_id) {
      set(resetPublicationEditStateAtom);
      await set(getPublicationDataAtom, null);
    }

    set(showSavedAtom, true);
  } catch {
    set(addErrorAtom, "There was an error saving this publication.");
  } finally {
    set(savingAtom, false);
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
