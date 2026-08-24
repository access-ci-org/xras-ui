// Contract tests for the mount functions exported from src/main.jsx - the
// package's entire public API. Rails apps call these directly (they aren't
// consumed as React components), so the contract that matters here isn't
// "does this component render right" - that's covered by each feature's own
// tests - it's "does calling the exported function the way a Rails view
// calls it actually work": it mounts into the given target, survives the
// optional props being omitted, and (for the widgets that take a `routes`
// prop) doesn't let two mounted instances clobber each other's state.
//
// These mount functions render into a real shadow root (see
// `renderShadow`/`shadowTarget` in src/main.jsx), not a plain RTL container,
// so assertions below query through `target.shadowRoot` rather than
// `screen`/RTL's default container.
//
// A handful of calls below cast their args through `any`: src/main.jsx is
// plain JS (not type-checked itself - `checkJs` is off), so TS infers each
// mount function's parameter type from its destructuring, and treats a prop
// as required unless the destructuring gives it a default. Several props that
// really are optional at runtime (e.g. `routes`, `editResource`'s
// `setExternalSubmit`, `shadowTarget`'s `baseUrl`/`stylesheets`) don't have
// one, so TS marks them required (or, for `baseUrl`/`stylesheets`, infers
// their type as the literal `null` from the default value alone). That's an
// inference artifact of importing untyped JS, not a real contract - omitting
// these is exactly the "tolerates omitted optional props" case this file
// exists to test - so those specific calls are cast rather than changing
// src/main.jsx to add type annotations it doesn't otherwise need.
import { afterEach, describe, expect, it } from "vitest";
import { waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes } from "@/shared/routes";
import {
  allocationsMap,
  editResource,
  keywords,
  myPublications,
  onRampsResourceCatalog,
  projects,
  projectsBrowser,
  publicationEdit,
  publicationsBrowser,
  publicationsSelect,
  resourceCatalog,
  resources,
  shadowTarget,
  supportingGrants,
} from "@/main";

// Each mount function attaches a shadow root directly to whatever host
// element it's given (via `host.attachShadow` in `shadowTarget`), rather than
// going through RTL's `render`/`cleanup`. Track hosts ourselves so a leftover
// shadow tree from one test can't be queried (or collide by id) in another.
const hosts: HTMLElement[] = [];

function makeTarget(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  hosts.push(host);
  return host;
}

afterEach(() => {
  hosts.forEach((host) => host.remove());
  hosts.length = 0;
});

// Every mount function's shadow content lives under `host.shadowRoot`, not
// under `host` itself (the light-DOM element is just the attachment point).
// `within` accepts anything implementing the DOM query methods, and a
// ShadowRoot does.
function shadowOf(host: HTMLElement) {
  if (!host.shadowRoot) throw new Error("mount function did not attach a shadow root");
  return within(host.shadowRoot as unknown as HTMLElement);
}

describe("resources", () => {
  it("mounts, renders, and tolerates omitted baseUrl/stylesheets", async () => {
    const target = makeTarget();

    resources({
      target,
      availableResources: [
        { resource_id: 1, display_resource_name: "Test Resource A", resource_repository_key: null, relative_order: 1 },
      ],
      unavailableResources: [],
      canAdd: false,
      relativeUrlRoot: "",
    });

    expect(await shadowOf(target).findByText("Test Resource A")).toBeInTheDocument();
  });
});

describe("editResource", () => {
  it("mounts, fetches its resource, renders, and tolerates omitted baseUrl/stylesheets", async () => {
    const target = makeTarget();
    server.use(
      http.get("/resources/1.json", () =>
        HttpResponse.json({
          resource_details: {
            resource_name: "Bridges-3",
            description: "A resource",
            resource_type_id: 1,
            unit_type_id: 1,
            min_exchange: 1,
            dollar_value: 1,
            allocation_types: [],
          },
        }),
      ),
    );

    editResource({ target, resourceId: 1, relativeUrlRoot: "" } as any);

    expect(await shadowOf(target).findByDisplayValue("Bridges-3")).toBeInTheDocument();
  });
});

describe("projects", () => {
  it("mounts, renders, and tolerates omitted routes/baseUrl/stylesheets (falls back to defaultRoutes)", async () => {
    const target = makeTarget();
    server.use(
      http.get(`${defaultRoutes.projects_path()}.json`, () => HttpResponse.json({ result: [] })),
    );

    projects({ target, username: "alice" } as any);

    // Empty project list -> the "no projects yet" panel, from ProjectsInner
    // (src/projects/Projects.tsx).
    //
    // `waitFor(() => expect(getBy...))` rather than `expect(await findBy...)`:
    // this file mounts widgets one after another into hosts that are only
    // ever detached (never `root.unmount()`-ed - `main.jsx` gives mount
    // functions no handle to do that with), so by this point in the file
    // there's at least one earlier root still mounted and free to schedule
    // its own re-renders. `findByText` resolves as soon as a MutationObserver
    // tick sees a matching node, but that resolution is itself a microtask
    // hop before `toBeInTheDocument()` runs on the handle it returned; with
    // another root's work interleaved on the same jsdom/React scheduler,
    // ProjectsInner's loading -> loaded transition occasionally replaces that
    // exact node in the gap between the two, so the handle `findByText`
    // already resolved with fails `toBeInTheDocument()` even though matching
    // text is on screen right after. Wrapping the query *and* the assertion
    // in one `waitFor` callback re-queries atomically on every retry, so it
    // can't observe that half-replaced state. Confirmed by ~200 runs of
    // `npx vitest run src/main.test.tsx`: this test alone accounted for every
    // observed flake, and switching to this pattern here made it pass 100%.
    await waitFor(() => {
      expect(shadowOf(target).getByText(/don't have any projects yet/i)).toBeInTheDocument();
    });
  });

  // Regression test for the bug src/shared/routes.ts documents at length:
  // `config.routes` used to be a single module-level object every mount
  // function overwrote via `addRoutes()`. Mounting a second `projects`
  // widget with different routes used to silently redirect the FIRST
  // widget's in-flight fetch to the second widget's URL, because both mount
  // calls wrote into the same shared object before either widget's effect
  // ran. `routesAtom` now lives per-store (each `Projects` instance calls its
  // own `createStore()`), so this mounts two widgets back-to-back, before
  // either has resolved, and checks that each one's fetch landed on its own
  // configured URL exactly once - never the other's, and never twice.
  it("keeps two mounted instances' routes isolated, even when mounted before either settles", async () => {
    const targetA = makeTarget();
    const targetB = makeTarget();
    const callsA: string[] = [];
    const callsB: string[] = [];
    server.use(
      http.get("https://isolation-a.test/projects.json", ({ request }) => {
        callsA.push(request.url);
        return HttpResponse.json({ result: [] });
      }),
      http.get("https://isolation-b.test/projects.json", ({ request }) => {
        callsB.push(request.url);
        return HttpResponse.json({ result: [] });
      }),
    );

    projects({
      target: targetA,
      username: "alice",
      routes: { projects_path: () => "https://isolation-a.test/projects" },
    });
    projects({
      target: targetB,
      username: "bob",
      routes: { projects_path: () => "https://isolation-b.test/projects" },
    });

    await waitFor(() => {
      expect(callsA).toHaveLength(1);
      expect(callsB).toHaveLength(1);
    });
    // Wait for each widget to actually finish rendering the fetched (empty)
    // result, not just for its handler to have been invoked: `callsA`/`callsB`
    // are pushed to at the start of the handler, before MSW has finished
    // delivering the response back through the fetch it's mocking. Returning
    // as soon as the call counts look right - without also waiting for the
    // response to be received and rendered - lets this test (and its
    // `afterEach`'s `server.resetHandlers()`) finish while that delivery is
    // still in flight, which intermittently surfaced as an unrelated
    // "TypeError: Failed to fetch" unhandled rejection once the handler that
    // was mid-delivery got reset out from under it.
    expect(await shadowOf(targetA).findByText(/don't have any projects yet/i)).toBeInTheDocument();
    expect(await shadowOf(targetB).findByText(/don't have any projects yet/i)).toBeInTheDocument();
  });
});

describe("projectsBrowser", () => {
  it("mounts, fetches filters and projects, renders, and tolerates omitted baseUrl/stylesheets", async () => {
    const target = makeTarget();
    const apiUrl = "https://example.test/projects-browser-api";
    server.use(
      http.get(apiUrl, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.has("filters")) {
          return HttpResponse.json({
            filters: { orgs: [], fosTypes: [], allocationTypes: [], resources: [] },
          });
        }
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    projectsBrowser({ target, apiUrl });

    expect(await shadowOf(target).findByText("No Projects Found")).toBeInTheDocument();
  });
});

describe("publicationsBrowser", () => {
  it("mounts, renders, and tolerates omitted routes/baseUrl/stylesheets (falls back to defaultRoutes)", async () => {
    const target = makeTarget();
    server.use(
      http.get(defaultRoutes.search_publications_path(), () =>
        HttpResponse.json({ publications: [], pagination: {} }),
      ),
      http.get(defaultRoutes.search_publications_filters_path(), () =>
        HttpResponse.json({ filters: { journals: [], publication_types: [] } }),
      ),
    );

    publicationsBrowser({ target } as any);

    expect(await shadowOf(target).findByText("Filters")).toBeInTheDocument();
  });

  // Same regression as the `projects` isolation test above, for the
  // publications feature's own per-store `routesAtom` hydration
  // (PublicationsBrowser creates its own `createStore()` too - see
  // src/publications/PublicationsBrowser.tsx). Distinguishing by rendered
  // title (not just by URL) additionally proves each store's fetched data
  // stayed with its own widget instead of bleeding into the other's list.
  it("keeps two mounted instances' routes and fetched data isolated", async () => {
    const targetA = makeTarget();
    const targetB = makeTarget();
    server.use(
      http.get("https://isolation-a.test/pubs", () =>
        HttpResponse.json({
          publications: [
            {
              publication_id: 1,
              publication_type: "Journal Paper",
              publication_year: 2024,
              title: "Store A Publication",
              doi: null,
              authors: [],
              fields: {},
              projects: [],
              resources: [],
            },
          ],
          pagination: {},
        }),
      ),
      http.get("https://isolation-b.test/pubs", () =>
        HttpResponse.json({
          publications: [
            {
              publication_id: 2,
              publication_type: "Journal Paper",
              publication_year: 2024,
              title: "Store B Publication",
              doi: null,
              authors: [],
              fields: {},
              projects: [],
              resources: [],
            },
          ],
          pagination: {},
        }),
      ),
      http.get("https://isolation-shared.test/filters", () =>
        HttpResponse.json({ filters: { journals: [], publication_types: [] } }),
      ),
    );

    publicationsBrowser({
      target: targetA,
      routes: {
        search_publications_path: () => "https://isolation-a.test/pubs",
        search_publications_filters_path: () => "https://isolation-shared.test/filters",
      },
    });
    publicationsBrowser({
      target: targetB,
      routes: {
        search_publications_path: () => "https://isolation-b.test/pubs",
        search_publications_filters_path: () => "https://isolation-shared.test/filters",
      },
    });

    expect(await shadowOf(targetA).findByText(/Store A Publication/)).toBeInTheDocument();
    expect(await shadowOf(targetB).findByText(/Store B Publication/)).toBeInTheDocument();
    // Neither store's list should ever show the other's publication.
    expect(shadowOf(targetA).queryByText(/Store B Publication/)).not.toBeInTheDocument();
    expect(shadowOf(targetB).queryByText(/Store A Publication/)).not.toBeInTheDocument();
  });
});

describe("publicationEdit", () => {
  it("mounts, renders, and tolerates omitted routes/baseUrl/stylesheets (falls back to defaultRoutes)", async () => {
    const target = makeTarget();
    server.use(
      http.get(`${defaultRoutes.edit_publication_path(7)}.json`, () =>
        HttpResponse.json({
          publication: {
            publication_id: 7,
            publication_type: "Journal Article",
            title: "Existing Pub",
            authors: [],
            fields: [],
            publication_resources: [],
          },
          publication_types: [],
        }),
      ),
    );

    publicationEdit({ target, publicationId: 7, authenticityToken: "token" } as any);

    expect(await shadowOf(target).findByDisplayValue("Existing Pub")).toBeInTheDocument();
  });

  // publicationEdit builds its own store and hydrates routesAtom explicitly
  // in src/main.jsx (rather than delegating to the component, like the other
  // publications mounts do) - it's the one mount function that calls
  // `mergeRoutes`/`useHydrateAtoms` itself. Worth covering directly since
  // that hydration is exactly the code path the routesAtom-per-store fix
  // touches.
  it("keeps two mounted instances' routes and fetched data isolated", async () => {
    const targetA = makeTarget();
    const targetB = makeTarget();
    server.use(
      http.get("https://isolation-a.test/pub-edit.json", () =>
        HttpResponse.json({
          publication: {
            publication_id: 1,
            publication_type: "Journal Article",
            title: "Store A Pub",
            authors: [],
            fields: [],
            publication_resources: [],
          },
          publication_types: [],
        }),
      ),
      http.get("https://isolation-b.test/pub-edit.json", () =>
        HttpResponse.json({
          publication: {
            publication_id: 2,
            publication_type: "Journal Article",
            title: "Store B Pub",
            authors: [],
            fields: [],
            publication_resources: [],
          },
          publication_types: [],
        }),
      ),
    );

    publicationEdit({
      target: targetA,
      publicationId: 1,
      authenticityToken: "token-a",
      routes: { edit_publication_path: () => "https://isolation-a.test/pub-edit" }, // getPublicationDataAtom appends ".json"
    });
    publicationEdit({
      target: targetB,
      publicationId: 2,
      authenticityToken: "token-b",
      routes: { edit_publication_path: () => "https://isolation-b.test/pub-edit" }, // getPublicationDataAtom appends ".json"
    });

    expect(await shadowOf(targetA).findByDisplayValue("Store A Pub")).toBeInTheDocument();
    expect(await shadowOf(targetB).findByDisplayValue("Store B Pub")).toBeInTheDocument();
  });
});

describe("publicationsSelect", () => {
  it("mounts, renders, and tolerates omitted routes/baseUrl/stylesheets (falls back to defaultRoutes)", async () => {
    const target = makeTarget();
    server.use(
      http.get(defaultRoutes.search_publications_path(), () =>
        HttpResponse.json({ publications: [], pagination: {} }),
      ),
    );

    publicationsSelect({
      target,
      authenticityToken: "token",
      selectedPublicationIds: [],
      usernames: ["alice"],
    } as any);

    expect(await shadowOf(target).findByText("Entered By")).toBeInTheDocument();
  });

  it("keeps two mounted instances' routes and fetched data isolated", async () => {
    const targetA = makeTarget();
    const targetB = makeTarget();
    server.use(
      http.get("https://isolation-a.test/pubs-select", () =>
        HttpResponse.json({
          publications: [
            {
              publication_id: 1,
              publication_type: "Journal Paper",
              publication_year: 2024,
              title: "Select Store A",
              doi: null,
              authors: [],
              fields: {},
              projects: [],
              resources: [],
            },
          ],
          pagination: {},
        }),
      ),
      http.get("https://isolation-b.test/pubs-select", () =>
        HttpResponse.json({
          publications: [
            {
              publication_id: 2,
              publication_type: "Journal Paper",
              publication_year: 2024,
              title: "Select Store B",
              doi: null,
              authors: [],
              fields: {},
              projects: [],
              resources: [],
            },
          ],
          pagination: {},
        }),
      ),
    );

    publicationsSelect({
      target: targetA,
      authenticityToken: "token-a",
      selectedPublicationIds: [],
      usernames: [],
      routes: { search_publications_path: () => "https://isolation-a.test/pubs-select" },
    });
    publicationsSelect({
      target: targetB,
      authenticityToken: "token-b",
      selectedPublicationIds: [],
      usernames: [],
      routes: { search_publications_path: () => "https://isolation-b.test/pubs-select" },
    });

    expect(await shadowOf(targetA).findByText(/Select Store A/)).toBeInTheDocument();
    expect(await shadowOf(targetB).findByText(/Select Store B/)).toBeInTheDocument();
  });
});

describe("myPublications", () => {
  it("mounts, renders, and tolerates omitted routes/baseUrl/stylesheets (falls back to defaultRoutes)", async () => {
    const target = makeTarget();
    server.use(
      http.get(defaultRoutes.search_publications_path(), () =>
        HttpResponse.json({ publications: [], pagination: {} }),
      ),
      http.get(defaultRoutes.search_publications_filters_path(), () =>
        HttpResponse.json({ filters: { journals: [], publication_types: [] } }),
      ),
    );

    myPublications({ target, authenticityToken: "token", username: "alice", showUpdatePublications: false } as any);

    expect(await shadowOf(target).findByText("My Publications")).toBeInTheDocument();
  });

  it("keeps two mounted instances' routes and fetched data isolated", async () => {
    const targetA = makeTarget();
    const targetB = makeTarget();
    server.use(
      http.get("https://isolation-a.test/my-pubs", () =>
        HttpResponse.json({
          publications: [
            {
              publication_id: 1,
              publication_type: "Journal Paper",
              publication_year: 2024,
              title: "My Store A Pub",
              doi: null,
              authors: [],
              fields: {},
              projects: [],
              resources: [],
            },
          ],
          pagination: {},
        }),
      ),
      http.get("https://isolation-b.test/my-pubs", () =>
        HttpResponse.json({
          publications: [
            {
              publication_id: 2,
              publication_type: "Journal Paper",
              publication_year: 2024,
              title: "My Store B Pub",
              doi: null,
              authors: [],
              fields: {},
              projects: [],
              resources: [],
            },
          ],
          pagination: {},
        }),
      ),
      http.get("https://isolation-shared.test/my-filters", () =>
        HttpResponse.json({ filters: { journals: [], publication_types: [] } }),
      ),
    );

    myPublications({
      target: targetA,
      authenticityToken: "token-a",
      username: "alice",
      showUpdatePublications: false,
      routes: {
        search_publications_path: () => "https://isolation-a.test/my-pubs",
        search_publications_filters_path: () => "https://isolation-shared.test/my-filters",
      },
    });
    myPublications({
      target: targetB,
      authenticityToken: "token-b",
      username: "bob",
      showUpdatePublications: false,
      routes: {
        search_publications_path: () => "https://isolation-b.test/my-pubs",
        search_publications_filters_path: () => "https://isolation-shared.test/my-filters",
      },
    });

    expect(await shadowOf(targetA).findByText(/My Store A Pub/)).toBeInTheDocument();
    expect(await shadowOf(targetB).findByText(/My Store B Pub/)).toBeInTheDocument();
  });
});

describe("onRampsResourceCatalog", () => {
  // This widget takes no data props: `initAppAtom` always fetches the three
  // hardcoded `operations-api.access-ci.org` URLs, so mocking those is the
  // whole of its input. The `catalogSources`/`onRampsApi` props it used to
  // accept were dropped along with the caller-configured-feeds path they
  // belonged to; nothing read either of them.
  it("mounts, renders, and tolerates omitted baseUrl/stylesheets", async () => {
    const target = makeTarget();
    server.use(
      http.get(/access-active-groups/, () =>
        HttpResponse.json({ results: { organizations: [], active_groups: [] } }),
      ),
      http.get(/access-allocated/, () => HttpResponse.json({ results: [] })),
      http.get(/\/features\//, () => HttpResponse.json({ results: [] })),
    );

    onRampsResourceCatalog({ target, onRamps: false });

    expect(await shadowOf(target).findByText("No Resources Match Your Filters")).toBeInTheDocument();
  });
});

describe("resourceCatalog", () => {
  it("mounts, fetches from apiUrl, renders, and tolerates omitted baseUrl/stylesheets", async () => {
    const target = makeTarget();
    const apiUrl = "https://example.test/resource-catalog-api";
    server.use(http.get(apiUrl, () => HttpResponse.json([])));

    resourceCatalog({ target, apiUrl } as any);

    expect(await shadowOf(target).findByText("No Resources Match Your Filters")).toBeInTheDocument();
  });
});

describe("keywords", () => {
  it("mounts, renders, and tolerates omitted baseUrl/stylesheets", async () => {
    const target = makeTarget();
    // No try/catch around the mount effect's fetch (readKeywords in
    // src/keywords/Keywords.tsx) - an unmocked request here would reject via
    // the MSW catch-all and surface as an unhandled rejection, not just a
    // failed assertion, so this still needs a handler even though the
    // assertion below doesn't wait on it.
    server.use(http.get("/keywords", () => HttpResponse.json([])));

    keywords({ target, allocationTypes: [] });

    expect(
      await shadowOf(target).findByText(/Type new keywords separated by semicolons/),
    ).toBeInTheDocument();
  });
});

describe("supportingGrants", () => {
  it("mounts, renders, and tolerates omitted baseUrl/stylesheets", async () => {
    const target = makeTarget();

    supportingGrants({ target, fundingAgencies: [], fosTypes: [], fieldsConfig: {} });

    expect(
      await shadowOf(target).findByText("Does this request include supporting grants?"),
    ).toBeInTheDocument();
  });
});

describe("allocationsMap", () => {
  // Per the Phase 5 brief: not meaningfully unit-testable in jsdom (no WebGL;
  // `maplibregl` is a stubbed bare global - see src/test/setup.ts). This is a
  // "does not throw" smoke test: the three data fetches it makes on mount
  // (basemap style, organizations, credits) have no try/catch in
  // src/allocations-map/AllocationsMap.tsx/utils.ts, so they're mocked here
  // purely to prevent unhandled rejections, not because the response shape is
  // asserted on.
  it("mounts without throwing and renders its chrome, tolerating omitted baseUrl/stylesheets", async () => {
    const target = makeTarget();
    server.use(
      http.get(/basemaps-api\.arcgis\.com/, () => HttpResponse.json({ version: 8, sources: {}, layers: [] })),
      http.get(/\/organizations$/, () => HttpResponse.json({ features: [] })),
      http.get(/\/credits_exchanged$/, () => HttpResponse.json({ result: [] })),
    );

    expect(() => allocationsMap({ target })).not.toThrow();

    // The map's `<section>` chrome (fullscreen toggle, controls) renders
    // unconditionally on first render, independent of whether the map data
    // fetches above have resolved yet.
    expect(await shadowOf(target).findByTitle("Enter Fullscreen")).toBeInTheDocument();
  });
});

describe("shadowTarget", () => {
  it("attaches a shadow root to the host and returns a mount point inside it, with the requested stylesheets", () => {
    const host = makeTarget();

    const mountPoint = shadowTarget(host, {
      baseUrl: "https://cdn.test",
      stylesheets: ["a.css", "b.css"],
    } as any);

    expect(host.shadowRoot).not.toBeNull();
    expect(mountPoint.parentNode).toBe(host.shadowRoot);
    const hrefs = [...host.shadowRoot!.querySelectorAll("link")].map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["https://cdn.test/a.css", "https://cdn.test/b.css"]);
  });
});
