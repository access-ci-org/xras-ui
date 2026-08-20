import { afterEach, describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import {
  apiUrlAtom,
  commitFiltersAtom,
  filterCleanupAtom,
  filtersAtom,
  filtersLoadedAtom,
  getFiltersAtom,
  getProjectsAtom,
  initAppAtom,
  listIsFilteredAtom,
  pageDataAtom,
  projectsAtom,
  projectsLoadedAtom,
  resetFiltersAtom,
  showPaginationAtom,
  typeListsAtom,
  updatePageDataAtom,
} from "@/projects-browser/atoms";
import type { Filters, TypeLists } from "@/projects-browser/types";

// Unlike src/publications/atoms.ts and src/projects/atoms.ts, this module
// doesn't read `routesAtom` at all - its atoms build every URL from a plain
// `apiUrlAtom` string the host page sets directly (see ProjectsBrowser.tsx).
// So these tests hydrate `apiUrlAtom` instead of `routesAtom`, but otherwise
// follow the same bare-`createStore()` + MSW pattern as the routes-hydration
// suites.

const fosTypes: TypeLists["fosTypes"] = [
  { fosTypeId: 1, fosName: "Biological Sciences" },
  { fosTypeId: 2, fosName: "Computer Science" },
];

describe("showPaginationAtom", () => {
  it("is true once filters and projects are loaded and there's more than one page", () => {
    const store = createStore();
    store.set(projectsLoadedAtom, true);
    store.set(pageDataAtom, { current_page: 1, last_page: 3 });

    expect(store.get(showPaginationAtom)).toBe(true);
  });

  it("is false when projects haven't loaded yet, even with multiple pages", () => {
    const store = createStore();
    // projectsLoadedAtom defaults to false; filtersLoadedAtom defaults to true.
    store.set(pageDataAtom, { current_page: 1, last_page: 3 });

    expect(store.get(showPaginationAtom)).toBe(false);
  });

  it("is false when there's only a single page", () => {
    const store = createStore();
    store.set(projectsLoadedAtom, true);
    store.set(pageDataAtom, { current_page: 1, last_page: 1 });

    expect(store.get(showPaginationAtom)).toBe(false);
  });
});

describe("getProjectsAtom (buildProjectsUrl branches, via the request MSW actually receives)", () => {
  it("short-circuits to page + request_number and ignores every other filter when requestNumber is set", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");
    store.set(typeListsAtom, { orgs: [], fosTypes, allocationTypes: [], resources: [] });
    store.set(filtersAtom, {
      org: "Some Org",
      allocationType: "Research",
      fosTypeIds: [1],
      resource: "Bridges",
      requestNumber: "TG-42",
    });

    await store.set(getProjectsAtom);

    expect(receivedUrl?.search).toBe("?page=1&request_number=TG-42");
  });

  it("adds a fos param when the selected fos types are a strict subset of all known fos types", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");
    store.set(typeListsAtom, { orgs: [], fosTypes, allocationTypes: [], resources: [] });
    store.set(filtersAtom, {
      org: "",
      allocationType: "",
      fosTypeIds: [1],
      resource: "",
      requestNumber: "",
    });

    await store.set(getProjectsAtom);

    expect(receivedUrl?.searchParams.get("fos")).toBe("1");
  });

  it("omits the fos param when every known fos type is selected", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");
    store.set(typeListsAtom, { orgs: [], fosTypes, allocationTypes: [], resources: [] });
    store.set(filtersAtom, {
      org: "",
      allocationType: "",
      fosTypeIds: [1, 2],
      resource: "",
      requestNumber: "",
    });

    await store.set(getProjectsAtom);

    expect(receivedUrl?.searchParams.has("fos")).toBe(false);
  });

  it("adds an org param when org is set to something other than the ALL sentinel", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");
    store.set(typeListsAtom, { orgs: [], fosTypes, allocationTypes: [], resources: [] });
    store.set(filtersAtom, {
      org: "Acme University",
      allocationType: "",
      fosTypeIds: [1, 2],
      resource: "",
      requestNumber: "",
    });

    await store.set(getProjectsAtom);

    expect(receivedUrl?.searchParams.get("org")).toBe("Acme University");
  });

  it("omits the org param when org is the ALL sentinel", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");
    store.set(typeListsAtom, { orgs: [], fosTypes, allocationTypes: [], resources: [] });
    store.set(filtersAtom, {
      org: "-- ALL --",
      allocationType: "",
      fosTypeIds: [1, 2],
      resource: "",
      requestNumber: "",
    });

    await store.set(getProjectsAtom);

    expect(receivedUrl?.searchParams.has("org")).toBe(false);
  });

  it("adds an allocation_type param when set", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");
    store.set(typeListsAtom, { orgs: [], fosTypes, allocationTypes: [], resources: [] });
    store.set(filtersAtom, {
      org: "",
      allocationType: "Research",
      fosTypeIds: [1, 2],
      resource: "",
      requestNumber: "",
    });

    await store.set(getProjectsAtom);

    expect(receivedUrl?.searchParams.get("allocation_type")).toBe("Research");
  });

  it("adds a resources param when a resource filter is set", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");
    store.set(typeListsAtom, { orgs: [], fosTypes, allocationTypes: [], resources: [] });
    store.set(filtersAtom, {
      org: "",
      allocationType: "",
      fosTypeIds: [1, 2],
      resource: "Bridges-2",
      requestNumber: "",
    });

    await store.set(getProjectsAtom);

    expect(receivedUrl?.searchParams.get("resources")).toBe("Bridges-2");
  });

  it("on success, replaces projectsAtom and resets current_page to 1 when the response's page count differs from last_page", async () => {
    server.use(
      http.get("https://example.test/api/projects", () =>
        HttpResponse.json({ projects: [{ projectId: 1 }], pages: 4 }),
      ),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");
    store.set(pageDataAtom, { current_page: 3, last_page: 2 }); // stale last_page

    await store.set(getProjectsAtom);

    expect(store.get(projectsAtom)).toEqual([{ projectId: 1 }]);
    expect(store.get(pageDataAtom)).toEqual({ current_page: 1, last_page: 4 });
    expect(store.get(projectsLoadedAtom)).toBe(true);
  });

  it("keeps the existing current_page when the response's page count matches last_page", async () => {
    server.use(
      http.get("https://example.test/api/projects", () =>
        HttpResponse.json({ projects: [], pages: 4 }),
      ),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");
    store.set(pageDataAtom, { current_page: 3, last_page: 4 });

    await store.set(getProjectsAtom);

    expect(store.get(pageDataAtom)).toEqual({ current_page: 3, last_page: 4 });
  });

  it("leaves projectsLoadedAtom false, rather than throwing, when the request is unhandled", async () => {
    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/unhandled-projects");
    // Prove it's the fetch's own set(false)-before/set(true)-on-success
    // sequence at fault, not merely an untouched default: start it `true` and
    // confirm the atom drives it back to `false` before the catch swallows
    // the error and never sets it back.
    store.set(projectsLoadedAtom, true);

    await expect(store.set(getProjectsAtom)).resolves.toBeUndefined();

    expect(store.get(projectsLoadedAtom)).toBe(false);
  });
});

describe("getFiltersAtom", () => {
  it("hits `${apiUrl}?filters=1`, loads typeListsAtom, and seeds filtersAtom.fosTypeIds from data.filters.fosTypes", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({
          filters: {
            orgs: ["Org A", "Org B"],
            fosTypes,
            allocationTypes: ["Research"],
            resources: [{ resourceId: 10, resourceName: "Bridges" }],
          },
        });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");

    await store.set(getFiltersAtom);

    expect(receivedUrl?.search).toBe("?filters=1");
    expect(store.get(typeListsAtom)).toEqual({
      orgs: ["Org A", "Org B"],
      fosTypes,
      allocationTypes: ["Research"],
      resources: [{ resourceId: 10, resourceName: "Bridges" }],
    });
    expect(store.get(filtersAtom).fosTypeIds).toEqual([1, 2]);
    expect(store.get(filtersLoadedAtom)).toBe(true);
  });
});

describe("filterCleanupAtom", () => {
  it("prepends the ALL sentinel to typeListsAtom.orgs", () => {
    const store = createStore();
    store.set(typeListsAtom, { orgs: ["Org A", "Org B"], fosTypes: [], allocationTypes: [], resources: [] });

    store.set(filterCleanupAtom);

    expect(store.get(typeListsAtom).orgs).toEqual(["-- ALL --", "Org A", "Org B"]);
  });
});

describe("initAppAtom", () => {
  const originalUrl = window.location.href;

  // `initAppAtom` reads `window.location.search` directly, so these tests
  // mutate real global location state via `history.pushState` - restore it
  // afterward so no state leaks into other test files' assumptions about the
  // jsdom URL.
  afterEach(() => {
    window.history.pushState(null, "", originalUrl);
  });

  it("seeds requestNumber/listIsFilteredAtom from a _requestNumber query param and runs getFilters -> getProjects -> filterCleanup", async () => {
    window.history.pushState(null, "", "/?_requestNumber=42");

    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("filters") === "1") {
          return HttpResponse.json({
            filters: { orgs: ["Org A"], fosTypes, allocationTypes: [], resources: [] },
          });
        }
        return HttpResponse.json({ projects: [{ projectId: 99 }], pages: 1 });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");

    await store.set(initAppAtom);

    expect(store.get(filtersAtom).requestNumber).toBe("42");
    expect(store.get(listIsFilteredAtom)).toBe(true);
    // filterCleanupAtom ran after getFilters/getProjects: the ALL sentinel is
    // prepended to whatever getFiltersAtom just loaded.
    expect(store.get(typeListsAtom).orgs).toEqual(["-- ALL --", "Org A"]);
    expect(store.get(projectsAtom)).toEqual([{ projectId: 99 }]);
  });

  it("leaves requestNumber/listIsFilteredAtom at their defaults when there's no _requestNumber param", async () => {
    window.history.pushState(null, "", "/");

    server.use(
      http.get("https://example.test/api/projects", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("filters") === "1") {
          return HttpResponse.json({
            filters: { orgs: [], fosTypes: [], allocationTypes: [], resources: [] },
          });
        }
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const store = createStore();
    store.set(apiUrlAtom, "https://example.test/api/projects");

    await store.set(initAppAtom);

    expect(store.get(filtersAtom).requestNumber).toBe("");
    expect(store.get(listIsFilteredAtom)).toBe(false);
  });
});

describe("resetFiltersAtom", () => {
  it("selects every known fos type and clears the other filter fields", () => {
    const store = createStore();
    store.set(typeListsAtom, {
      orgs: [],
      fosTypes: [...fosTypes, { fosTypeId: 3, fosName: "Physics" }],
      allocationTypes: [],
      resources: [],
    });
    store.set(filtersAtom, {
      org: "Acme University",
      allocationType: "Research",
      fosTypeIds: [1],
      resource: "Bridges",
      requestNumber: "TG-1",
    });

    store.set(resetFiltersAtom);

    expect(store.get(filtersAtom)).toEqual({
      org: "",
      allocationType: "",
      fosTypeIds: [1, 2, 3],
      resource: "",
      requestNumber: "",
    });
  });
});

describe("commitFiltersAtom", () => {
  it("replaces filtersAtom wholesale with the given filters", () => {
    const store = createStore();
    const filters: Filters = {
      org: "Acme University",
      allocationType: "Research",
      fosTypeIds: [1, 2],
      resource: "Bridges",
      requestNumber: "TG-1",
    };

    store.set(commitFiltersAtom, filters);

    expect(store.get(filtersAtom)).toEqual(filters);
  });
});

describe("updatePageDataAtom", () => {
  it("merges a partial payload into pageDataAtom rather than replacing it", () => {
    const store = createStore();
    store.set(pageDataAtom, { current_page: 2, last_page: 5 });

    store.set(updatePageDataAtom, { current_page: 3 });

    expect(store.get(pageDataAtom)).toEqual({ current_page: 3, last_page: 5 });
  });
});
