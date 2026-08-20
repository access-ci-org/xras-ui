import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "jotai";
import { defaultRoutes, mergeRoutes, routesAtom } from "@/shared/routes";

// `mergeRoutes` is what every publications mount function hydrates
// `routesAtom` with (src/main.jsx, MyPublications, PublicationsSelect,
// PublicationsBrowser), so it carries the semantics the old `addRoutes()`
// helper used to provide: host-supplied routes layered over the defaults,
// never replacing them wholesale. The atom-level tests in
// src/publications/atoms.test.ts hydrate the atom directly and so don't
// exercise this.
describe("mergeRoutes", () => {
  it("returns the defaults when a mount supplies no routes", () => {
    // Not a `toBe(defaultRoutes)` reference check: `mergeRoutes()` wraps its
    // result in a guard Proxy (see src/shared/routes.ts) to catch reads of
    // routes that don't exist, so the return value is never `defaultRoutes`
    // itself - only behaviorally equivalent to it.
    expect(mergeRoutes().how_to_path()).toBe(defaultRoutes.how_to_path());
    expect(mergeRoutes(undefined).how_to_path()).toBe("/how-to");
  });

  it("layers overrides on top of the defaults instead of replacing them", () => {
    const merged = mergeRoutes({ how_to_path: () => "/overridden" });

    expect(merged.how_to_path()).toBe("/overridden");
    // A default the host didn't override must survive the merge.
    expect(merged.profile_path()).toBe(defaultRoutes.profile_path());
  });

  it("accepts routes that have no default at all", () => {
    // Most Rails-supplied publications routes (publications_lookup_path,
    // search_publications_path, ...) exist only once a host page provides
    // them - they're reachable through the `Routes` index signature.
    const merged = mergeRoutes({ publications_lookup_path: () => "/publications/lookup" });

    expect(merged.publications_lookup_path()).toBe("/publications/lookup");
  });

  it("does not mutate the shared default table", () => {
    mergeRoutes({ how_to_path: () => "/mutated" });

    expect(defaultRoutes.how_to_path()).toBe("/how-to");
  });

  // Object spread and the `in` operator both have to keep working on the
  // guard-wrapped result: `{ ...routes }` is exactly how `mergeRoutes` itself
  // builds its return value from `defaultRoutes`, and call sites elsewhere
  // check `"foo" in routes`-style membership before calling a route that
  // might not exist. Only reading a missing route should change behavior.
  it("still supports object spread and the `in` operator", () => {
    const merged = mergeRoutes({ publications_lookup_path: () => "/publications/lookup" });

    expect("how_to_path" in merged).toBe(true);
    expect("publications_lookup_path" in merged).toBe(true);
    expect("does_not_exist_path" in merged).toBe(false);

    const spread = { ...merged };
    expect(spread.how_to_path()).toBe(defaultRoutes.how_to_path());
    expect(spread.publications_lookup_path()).toBe("/publications/lookup");
  });
});

// Reading a route that isn't in `defaultRoutes` used to fail as a bare
// `TypeError: routes.some_path is not a function`. The guard Proxy in
// src/shared/routes.ts replaces that with a descriptive error, and
// distinguishes a store whose `routesAtom` was never hydrated at all from
// one that was hydrated but is still missing the key.
describe("routesAtom guard", () => {
  it("names the missing route and says routesAtom was never hydrated, when nothing hydrated it", () => {
    const store = createStore();

    expect(() => (store.get(routesAtom) as any).some_undefined_path()).toThrow(
      /some_undefined_path.*never hydrated/s,
    );
  });

  it("still resolves a route that is in defaultRoutes, even when never hydrated", () => {
    const store = createStore();

    expect(store.get(routesAtom).how_to_path()).toBe("/how-to");
  });

  it("names the missing route and says routesAtom was hydrated, when mergeRoutes() produced the table", () => {
    const hydrated = mergeRoutes({ publications_lookup_path: () => "/publications/lookup" });

    expect(() => (hydrated as any).some_undefined_path()).toThrow(
      /some_undefined_path.*hydrated with mergeRoutes/s,
    );
  });
});

// The publications routes added to `defaultRoutes` encode real Rails paths
// (verified against `rails routes` in xras_submit_access, the app that mounts
// these widgets) and, for three of them, a reimplementation of js-routes'
// query serializer. Both are the kind of thing that drifts silently, so pin
// the exact strings the code under test builds URLs from.
describe("defaultRoutes publications paths", () => {
  it("matches the host app's Rails paths", () => {
    expect(defaultRoutes.edit_publication_path(5)).toBe("/publications/5/edit");
    expect(defaultRoutes.publication_path(5)).toBe("/publications/5");
    expect(defaultRoutes.publications_path()).toBe("/publications");
    expect(defaultRoutes.publications_lookup_path()).toBe("/publications/lookup");
    expect(defaultRoutes.publications_find_project_path()).toBe("/publications/find_project");
    expect(defaultRoutes.search_publications_path()).toBe("/search/publications");
    expect(defaultRoutes.search_publications_filters_path()).toBe("/search/publications/filters");
  });

  // src/publications/atoms.ts appends `.json` to the first two and passes
  // "new.json" as the id to the second, so those call shapes have to keep
  // producing the URLs Rails serves.
  it("supports the .json call shapes the publications atoms use", () => {
    expect(`${defaultRoutes.edit_publication_path(5)}.json`).toBe("/publications/5/edit.json");
    expect(defaultRoutes.publication_path("new.json")).toBe("/publications/new.json");
  });
});

describe("defaultRoutes query serialization", () => {
  it("appends scalar params, encoded", () => {
    expect(defaultRoutes.publications_lookup_path({ doi: "10.1000/a b" })).toBe(
      "/publications/lookup?doi=10.1000%2Fa%20b",
    );
    expect(defaultRoutes.publications_find_project_path({ grant_number: "ABC-123" })).toBe(
      "/publications/find_project?grant_number=ABC-123",
    );
  });

  it("expands arrays as key[]=a&key[]=b, like js-routes", () => {
    // `created_by` is the array `getPublicationsAtom` passes.
    expect(defaultRoutes.search_publications_path({ created_by: ["ada", "bob"] })).toBe(
      "/search/publications?created_by%5B%5D=ada&created_by%5B%5D=bob",
    );
  });

  it("drops null and undefined but keeps empty strings and false", () => {
    expect(
      defaultRoutes.search_publications_path({
        doi: null,
        journal: undefined,
        author_name: "",
        per_page: 9999,
      }),
    ).toBe("/search/publications?author_name=&per_page=9999");
  });

  it("omits the ? entirely when nothing survives serialization", () => {
    expect(defaultRoutes.search_publications_path({})).toBe("/search/publications");
    expect(defaultRoutes.search_publications_path({ doi: null })).toBe("/search/publications");
  });
});

// A route that resolves only because it fell through to `defaultRoutes` warns
// and still returns the default (see the guard comment in
// src/shared/routes.ts). The default is the real path xras_submit_access
// serves, so the widget works - but only while it's mounted on that app and
// origin, which is what the warning is there to say.
describe("defaulted-route warnings", () => {
  afterEach(() => vi.restoreAllMocks());

  it("warns and still returns the default when the host omitted the route", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const routes = mergeRoutes({ how_to_path: () => "/supplied" });

    expect(routes.publications_path()).toBe("/publications");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/publications_path.*falling back/s);
  });

  it("stays silent for a route the host did supply", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const routes = mergeRoutes({ publications_path: () => "/supplied" });

    expect(routes.publications_path()).toBe("/supplied");
    expect(warn).not.toHaveBeenCalled();
  });

  // Components re-render and atoms refetch, so an omission must not turn into
  // an unbounded stream of identical warnings.
  it("warns once per route name, not once per read", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const routes = mergeRoutes({});

    routes.publications_path();
    routes.publications_path();
    routes.publications_path();
    expect(warn).toHaveBeenCalledTimes(1);

    routes.how_to_path();
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("dedupes per table, so a second mount warns on its own", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    mergeRoutes({}).publications_path();
    mergeRoutes({}).publications_path();

    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("says the store was never hydrated when nothing hydrated it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createStore();

    expect(store.get(routesAtom).resources_path()).toBe(defaultRoutes.resources_path());
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/never hydrated.*"resources_path"/s);
  });

  // jotai probes `value.then` on every atom read to detect thenables, and
  // React/Node probe other incidental properties. Those must not warn, or a
  // single `store.get` would emit noise on every read.
  it("does not warn for non-route property probes", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const routes = mergeRoutes({}) as unknown as Record<string, unknown>;

    void routes.then;
    void routes.toJSON;
    void routes.constructor;

    expect(warn).not.toHaveBeenCalled();
  });
});
