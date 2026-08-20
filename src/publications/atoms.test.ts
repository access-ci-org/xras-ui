import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import {
  dismissUpdatePublicationsNoticeAtom,
  filterOptionsAtom,
  getFiltersAtom,
  showUpdatePublicationsAtom,
} from "@/publications/atoms";

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
