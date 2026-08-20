import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import {
  addCreatedByUsernameAtom,
  addErrorAtom,
  availableResourcesAtom,
  dataLoadedAtom,
  dismissUpdatePublicationsNoticeAtom,
  editProjectsAtom,
  editPublicationAtom,
  errorsAtom,
  filterOptionsAtom,
  filterSelectionsAtom,
  getFiltersAtom,
  getPublicationDataAtom,
  getPublicationsAtom,
  grantNumberAtom,
  grantSearchAtom,
  hideErrorAtom,
  pageAtom,
  publicationAtom,
  publicationIdAtom,
  publicationsAtom,
  publicationsLoadedAtom,
  removeCreatedByUsernameAtom,
  resetFiltersAtom,
  resetPublicationEditStateAtom,
  resetPublicationsAtom,
  resourcesNoneSelectedAtom,
  selectedProjectsAtom,
  selectedPublicationIdsAtom,
  selectedResourcesAtom,
  showEditModalAtom,
  showUpdatePublicationsAtom,
  toggleProjectSelectedAtom,
  toggleSelectedPublicationAtom,
  updateFilterSelectionAtom,
  usePaginationAtom,
} from "@/publications/atoms";
import type { EditableProject, PublicationSummary } from "@/publications/types";

// Minimal, type-checked PublicationSummary fixture factory shared by the
// getPublicationsAtom / selection / reset tests below, so each test only
// spells out the fields it actually cares about.
function publicationSummary(overrides: Partial<PublicationSummary> = {}): PublicationSummary {
  return {
    publication_id: 1,
    publication_type: "Journal Article",
    publication_year: "2020",
    title: "A Publication",
    doi: null,
    authors: [],
    fields: {},
    projects: [],
    resources: [],
    ...overrides,
  };
}

// `getFiltersAtom` (src/publications/atoms.ts) is a plain jotai write atom
// that reads its URL from `get(routesAtom)`, so - like
// src/resource-catalog/atoms.test.ts - it can be driven with a bare
// `createStore()` and no React involved. Hydrating `routesAtom` here is what
// task #1 of the routes-injection refactor replaces `addRoutes()` /
// `config.routes` with for the publications feature: see src/shared/routes.ts
// for why a per-store atom value, rather than the `config` singleton, is
// required to keep two mounted widgets' routes from clobbering each other.
describe("routesAtom hydration (publications)", () => {
  it("a route hydrated onto the store wins over the default route table", async () => {
    server.use(
      http.get("https://example.test/hydrated/filters", () =>
        HttpResponse.json({ filters: { journals: ["Hydrated Journal"], publication_types: [] } }),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      search_publications_filters_path: () => "https://example.test/hydrated/filters",
    });

    await store.set(getFiltersAtom);

    expect(store.get(filterOptionsAtom)).toEqual({
      journals: ["Hydrated Journal"],
      publication_types: [],
    });
  });

  // This is the regression test for the actual bug the atom fixes: with the
  // old `config.routes` singleton, whichever mount called `addRoutes()` last
  // won for every mount on the page, because there was exactly one
  // `config.routes` object. `routesAtom`'s value lives in whichever jotai
  // store reads/writes it, so two independent stores hydrated with different
  // routes must each fetch their own URL, with no bleed between them.
  it("isolates routes between two independent stores", async () => {
    server.use(
      http.get("https://example.test/store-a/filters", () =>
        HttpResponse.json({ filters: { journals: ["Store A"], publication_types: [] } }),
      ),
      http.get("https://example.test/store-b/filters", () =>
        HttpResponse.json({ filters: { journals: ["Store B"], publication_types: [] } }),
      ),
    );

    const storeA = createStore();
    storeA.set(routesAtom, {
      ...defaultRoutes,
      search_publications_filters_path: () => "https://example.test/store-a/filters",
    });

    const storeB = createStore();
    storeB.set(routesAtom, {
      ...defaultRoutes,
      search_publications_filters_path: () => "https://example.test/store-b/filters",
    });

    await storeA.set(getFiltersAtom);
    await storeB.set(getFiltersAtom);

    expect(storeA.get(filterOptionsAtom).journals).toEqual(["Store A"]);
    expect(storeB.get(filterOptionsAtom).journals).toEqual(["Store B"]);

    // Order shouldn't matter either: re-run storeA after storeB has already
    // set its own route, to rule out one store's `set` mutating the other's.
    await storeA.set(getFiltersAtom);
    expect(storeA.get(filterOptionsAtom).journals).toEqual(["Store A"]);
  });

  // `publications_dismiss_notice_path` is one of the routes that already
  // ships in `defaultRoutes` (src/shared/routes.ts), unlike the
  // Rails-supplied-only routes above. An un-hydrated store's `routesAtom`
  // should still resolve it to that default, not throw or hit a stale route.
  it("falls back to the default route table when nothing is hydrated", async () => {
    server.use(
      http.post(defaultRoutes.publications_dismiss_notice_path(), () =>
        HttpResponse.json({ success: true }),
      ),
    );

    const store = createStore();
    store.set(showUpdatePublicationsAtom, true);
    await store.set(dismissUpdatePublicationsNoticeAtom);

    expect(store.get(showUpdatePublicationsAtom)).toBe(false);
  });
});

describe("selectedProjectsAtom / availableResourcesAtom", () => {
  it("derives only selected projects and de-duplicates resources across them by resource_id", () => {
    const store = createStore();
    const projects: EditableProject[] = [
      {
        grant_number: "AAA",
        title: "Project A",
        selected: true,
        resources: [
          { resource_id: 1, resource_name: "Resource One" },
          { resource_id: 2, resource_name: "Resource Two" },
        ],
      },
      {
        grant_number: "BBB",
        title: "Project B (not selected)",
        selected: false,
        resources: [{ resource_id: 3, resource_name: "Resource Three" }],
      },
      {
        grant_number: "CCC",
        title: "Project C",
        selected: true,
        resources: [
          { resource_id: 2, resource_name: "Resource Two (duplicate)" },
          { resource_id: 4, resource_name: "Resource Four" },
        ],
      },
    ];
    store.set(editProjectsAtom, projects);

    expect(store.get(selectedProjectsAtom).map((p) => p.grant_number)).toEqual(["AAA", "CCC"]);
    // Resource 2 appears on both selected projects; it should only surface once,
    // keeping the first occurrence encountered.
    expect(store.get(availableResourcesAtom)).toEqual([
      { resource_id: 1, resource_name: "Resource One" },
      { resource_id: 2, resource_name: "Resource Two" },
      { resource_id: 4, resource_name: "Resource Four" },
    ]);
  });
});

describe("toggleProjectSelectedAtom", () => {
  it("flips only the targeted project without mutating the previous array or its objects", () => {
    const store = createStore();
    const original: EditableProject[] = [
      { grant_number: "AAA", title: "A", selected: false },
      { grant_number: "BBB", title: "B", selected: false },
    ];
    store.set(editProjectsAtom, original);

    store.set(toggleProjectSelectedAtom, 1);

    const updated = store.get(editProjectsAtom);
    expect(updated).not.toBe(original);
    expect(updated[0]).toBe(original[0]); // untouched entry: same reference
    expect(updated[1]).not.toBe(original[1]); // toggled entry: new object
    expect(updated[1].selected).toBe(true);
    expect(updated[0].selected).toBe(false);

    // The original array/objects passed in must be left alone.
    expect(original[0].selected).toBe(false);
    expect(original[1].selected).toBe(false);
  });
});

describe("addErrorAtom / hideErrorAtom", () => {
  it("appends errors with generated ids, then hides one by id and leaves the rest", () => {
    const store = createStore();
    store.set(addErrorAtom, "First error");
    store.set(addErrorAtom, "Second error");

    const errors = store.get(errorsAtom);
    expect(errors).toHaveLength(2);
    expect(errors[0].message).toBe("First error");
    expect(errors[1].message).toBe("Second error");
    expect(errors[0].id).not.toBe(errors[1].id);
    expect(errors[0].id.length).toBeGreaterThan(0);

    store.set(hideErrorAtom, errors[0].id);

    const remaining = store.get(errorsAtom);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe("Second error");
  });
});

describe("resetPublicationEditStateAtom", () => {
  it("clears every edit-flow atom it touches back to its default", () => {
    const store = createStore();
    store.set(dataLoadedAtom, true);
    store.set(errorsAtom, [{ id: "x", message: "oops" }]);
    store.set(editProjectsAtom, [{ grant_number: "AAA", title: "A", selected: true }]);
    store.set(publicationAtom, {
      publication_type: "Journal Article",
      title: "T",
      authors: [],
      fields: [],
    });
    store.set(selectedResourcesAtom, [1, 2]);
    store.set(resourcesNoneSelectedAtom, true);

    store.set(resetPublicationEditStateAtom);

    expect(store.get(dataLoadedAtom)).toBe(false);
    expect(store.get(errorsAtom)).toEqual([]);
    expect(store.get(editProjectsAtom)).toEqual([]);
    expect(store.get(publicationAtom)).toBeNull();
    expect(store.get(selectedResourcesAtom)).toEqual([]);
    expect(store.get(resourcesNoneSelectedAtom)).toBe(false);
  });
});

describe("editPublicationAtom", () => {
  it("sets the publication id and opens the edit modal", () => {
    const store = createStore();
    store.set(editPublicationAtom, 42);

    expect(store.get(publicationIdAtom)).toBe(42);
    expect(store.get(showEditModalAtom)).toBe(true);
  });
});

describe("getPublicationDataAtom", () => {
  it("loads an existing publication, defaults missing author affiliations, and derives selection state", async () => {
    server.use(
      http.get(`${defaultRoutes.edit_publication_path(7)}.json`, () =>
        HttpResponse.json({
          publication: {
            publication_id: 7,
            publication_type: "Journal Article",
            title: "Existing Pub",
            authors: [
              { first_name: "Ada", last_name: "Lovelace", affiliation: "Analytical Engines Inc" },
              { first_name: "Grace", last_name: "Hopper" },
            ],
            fields: [],
            // Mixes a falsy id (0), a null id, and string ids that need
            // coercing to Number - all three edge cases the atom's
            // `.filter(Boolean).map(Number)` pipeline has to handle.
            publication_resources: [
              { acct_resource_id: "10" },
              { acct_resource_id: 0 },
              { acct_resource_id: null },
              { acct_resource_id: "20" },
            ],
            access_staff_publication: true,
          },
          publication_types: [{ publication_type: "Journal Article", fields: [] }],
        }),
      ),
    );

    const store = createStore();
    await store.set(getPublicationDataAtom, 7);

    const publication = store.get(publicationAtom);
    expect(publication?.authors[0].affiliation).toBe("Analytical Engines Inc");
    expect(publication?.authors[1].affiliation).toBe("");
    expect(store.get(editProjectsAtom)).toEqual([]); // publication.projects absent -> []
    expect(store.get(selectedResourcesAtom)).toEqual([10, 20]);
    expect(store.get(resourcesNoneSelectedAtom)).toBe(true);
    expect(store.get(dataLoadedAtom)).toBe(true);
  });

  it("loads the 'new' publication template when publicationId is null", async () => {
    server.use(
      http.get(defaultRoutes.publication_path("new.json"), () =>
        HttpResponse.json({
          publication: {
            publication_type: "Journal Article",
            title: "",
            authors: [],
            fields: [],
            projects: [{ grant_number: "AAA", title: "A", selected: true }],
          },
          publication_types: [],
        }),
      ),
    );

    const store = createStore();
    await store.set(getPublicationDataAtom, null);

    expect(store.get(editProjectsAtom)).toEqual([
      { grant_number: "AAA", title: "A", selected: true },
    ]);
    expect(store.get(resourcesNoneSelectedAtom)).toBe(false);
    expect(store.get(selectedResourcesAtom)).toEqual([]);
  });
});

describe("grantSearchAtom", () => {
  it("appends the fetched project to editProjectsAtom and clears the grant number on success", async () => {
    server.use(
      // Match on pathname only (not the query string js-routes would embed) so
      // the assertion below is the one actually verifying what was sent.
      http.get("/publications/find_project", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("grant_number")).toBe("TG-123");
        return HttpResponse.json({ grant_number: "TG-123", title: "Found Project", selected: true });
      }),
    );

    const store = createStore();
    store.set(grantNumberAtom, "TG-123");
    store.set(editProjectsAtom, [{ grant_number: "EXISTING", title: "Existing", selected: true }]);

    await store.set(grantSearchAtom);

    expect(store.get(editProjectsAtom)).toEqual([
      { grant_number: "EXISTING", title: "Existing", selected: true },
      { grant_number: "TG-123", title: "Found Project", selected: true },
    ]);
    expect(store.get(grantNumberAtom)).toBe("");
    expect(store.get(errorsAtom)).toEqual([]);
  });

  it("pushes a not-found error instead of throwing when the request is unhandled", async () => {
    const store = createStore();
    store.set(grantNumberAtom, "TG-404");

    await expect(store.set(grantSearchAtom)).resolves.toBeUndefined();

    const errors = store.get(errorsAtom);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe("Unable to find a project with this grant number.");
    expect(store.get(editProjectsAtom)).toEqual([]);
  });
});

describe("addCreatedByUsernameAtom / removeCreatedByUsernameAtom", () => {
  it("adds and removes usernames from filterSelectionsAtom.createdBy", () => {
    const store = createStore();
    store.set(addCreatedByUsernameAtom, "ada");
    store.set(addCreatedByUsernameAtom, "grace");
    expect(store.get(filterSelectionsAtom).createdBy).toEqual(["ada", "grace"]);

    store.set(removeCreatedByUsernameAtom, "ada");
    expect(store.get(filterSelectionsAtom).createdBy).toEqual(["grace"]);
  });
});

describe("updateFilterSelectionAtom", () => {
  it("updates a single named filter field, leaving the rest alone", () => {
    const store = createStore();
    store.set(updateFilterSelectionAtom, { name: "doi", value: "10.1000/xyz" });
    store.set(updateFilterSelectionAtom, { name: "journal", value: "Nature" });

    expect(store.get(filterSelectionsAtom)).toMatchObject({
      doi: "10.1000/xyz",
      journal: "Nature",
    });
  });
});

describe("resetFiltersAtom", () => {
  // This asymmetry (everything but grantNumber clears) is easy to miss by
  // reading the atom quickly, so it gets its own dedicated assertion.
  it("clears createdBy/doi/journal/authorName/publicationType but leaves grantNumber untouched", () => {
    const store = createStore();
    store.set(filterSelectionsAtom, {
      createdBy: ["ada"],
      doi: "10.1/x",
      grantNumber: "TG-123",
      journal: "Nature",
      authorName: "Ada",
      publicationType: "Journal Article",
    });

    store.set(resetFiltersAtom);

    expect(store.get(filterSelectionsAtom)).toEqual({
      createdBy: [],
      doi: "",
      grantNumber: "TG-123",
      journal: "",
      authorName: "",
      publicationType: "",
    });
  });
});

describe("resetPublicationsAtom", () => {
  it("clears the publications list", () => {
    const store = createStore();
    store.set(publicationsAtom, [publicationSummary()]);

    store.set(resetPublicationsAtom);

    expect(store.get(publicationsAtom)).toEqual([]);
  });
});

describe("getPublicationsAtom", () => {
  it("appends to the existing list and updates pageAtom from the response's pagination when paginating", async () => {
    server.use(
      http.get("/search/publications", () =>
        HttpResponse.json({
          publications: [publicationSummary({ publication_id: 2, title: "Second" })],
          pagination: { current_page: 2, last_page: 5 },
        }),
      ),
    );

    const store = createStore();
    store.set(publicationsAtom, [publicationSummary({ publication_id: 1, title: "First" })]);
    store.set(pageAtom, { current: 0, last: 1 });

    await store.set(getPublicationsAtom);

    expect(store.get(publicationsAtom).map((p) => p.publication_id)).toEqual([1, 2]);
    expect(store.get(pageAtom)).toEqual({ current: 2, last: 5 });
    expect(store.get(publicationsLoadedAtom)).toBe(true);
  });

  it("replaces the list and requests per_page=9999 (no page param) when pagination is disabled", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("/search/publications", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ publications: [publicationSummary({ publication_id: 9 })] });
      }),
    );

    const store = createStore();
    store.set(usePaginationAtom, false);
    store.set(publicationsAtom, [publicationSummary({ publication_id: 1 })]);

    await store.set(getPublicationsAtom);

    expect(store.get(publicationsAtom).map((p) => p.publication_id)).toEqual([9]);
    expect(receivedUrl?.searchParams.get("per_page")).toBe("9999");
    expect(receivedUrl?.searchParams.has("page")).toBe(false);
  });

  it("omits the journal filter from the request when it isn't one of the known filter options", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("/search/publications", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ publications: [] });
      }),
    );

    const store = createStore();
    store.set(filterOptionsAtom, { journals: ["Known Journal"], publication_types: [] });
    store.set(filterSelectionsAtom, {
      createdBy: [],
      doi: "",
      grantNumber: "",
      journal: "Unknown Journal",
      authorName: "",
      publicationType: "",
    });

    await store.set(getPublicationsAtom);

    expect(receivedUrl?.searchParams.has("journal")).toBe(false);
  });

  it("includes the journal filter when it matches a known filter option", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("/search/publications", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ publications: [] });
      }),
    );

    const store = createStore();
    store.set(filterOptionsAtom, { journals: ["Nature"], publication_types: [] });
    store.set(filterSelectionsAtom, {
      createdBy: [],
      doi: "",
      grantNumber: "",
      journal: "Nature",
      authorName: "",
      publicationType: "",
    });

    await store.set(getPublicationsAtom);

    expect(receivedUrl?.searchParams.get("journal")).toBe("Nature");
  });

  it("still marks publications as loaded (via the catch) when the request is unhandled, rather than hanging or throwing", async () => {
    const store = createStore();
    store.set(publicationsAtom, [publicationSummary({ publication_id: 1 })]);

    await expect(store.set(getPublicationsAtom)).resolves.toBeUndefined();

    expect(store.get(publicationsLoadedAtom)).toBe(true);
    // The catch block runs before either `set(publicationsAtom, ...)` call,
    // so the list from before the failed fetch is left as-is.
    expect(store.get(publicationsAtom)).toEqual([publicationSummary({ publication_id: 1 })]);
  });
});

describe("selectedPublicationIdsAtom / toggleSelectedPublicationAtom", () => {
  it("toggles a publication id on then off", () => {
    const store = createStore();
    store.set(toggleSelectedPublicationAtom, 5);
    expect(store.get(selectedPublicationIdsAtom)).toEqual([5]);

    store.set(toggleSelectedPublicationAtom, 5);
    expect(store.get(selectedPublicationIdsAtom)).toEqual([]);
  });
});

describe("dismissUpdatePublicationsNoticeAtom (additional cases)", () => {
  it("leaves the notice showing when the response reports success: false", async () => {
    server.use(
      http.post(defaultRoutes.publications_dismiss_notice_path(), () =>
        HttpResponse.json({ success: false }),
      ),
    );

    const store = createStore();
    store.set(showUpdatePublicationsAtom, true);
    await store.set(dismissUpdatePublicationsNoticeAtom);

    expect(store.get(showUpdatePublicationsAtom)).toBe(true);
  });

  it("leaves the notice showing and doesn't throw when the request is unhandled", async () => {
    const store = createStore();
    store.set(showUpdatePublicationsAtom, true);

    await expect(store.set(dismissUpdatePublicationsNoticeAtom)).resolves.toBeUndefined();

    expect(store.get(showUpdatePublicationsAtom)).toBe(true);
  });
});
