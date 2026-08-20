import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import {
  errorAtom,
  fetchProjectsListAtom,
  projectsListAtom,
  searchUsersAtom,
} from "@/projects/atoms";

// `searchUsersAtom` and `fetchProjectsListAtom` (src/projects/atoms.ts) are
// plain jotai write atoms that read their URLs from `get(routesAtom)`, so -
// like src/resource-catalog/atoms.test.ts and src/publications/atoms.test.ts
// - they can be driven with a bare `createStore()` and no React involved.
// This is task #2 of the routes-injection refactor: the projects feature's
// atoms used to read the `config.routes` singleton (mutated in place by
// `addRoutes()`, called from the `projects` mount function in src/main.jsx),
// which meant two mounted widgets on the same page could clobber each
// other's routes. Hydrating `routesAtom` per store (see src/shared/routes.ts)
// fixes that; these tests are the regression coverage for it.
describe("routesAtom hydration (projects)", () => {
  it("a route hydrated onto the store wins over the default route table", async () => {
    server.use(
      http.get("https://example.test/hydrated/people", () =>
        HttpResponse.json([
          {
            eligible_reason: null,
            email: "ada@example.test",
            first_name: "Ada",
            is_eligible: true,
            last_name: "Lovelace",
            username: "ada",
            organization: "Example University",
          },
        ]),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      search_people_path: () => "https://example.test/hydrated/people",
    });

    const found = await store.set(searchUsersAtom, "ada");

    expect(found).toEqual([
      {
        eligibility: true,
        eligibilityReason: null,
        email: "ada@example.test",
        firstName: "Ada",
        lastName: "Lovelace",
        username: "ada",
        organization: "Example University",
      },
    ]);
  });

  // This is the regression test for the actual bug the atom fixes: with the
  // old `config.routes` singleton, whichever mount called `addRoutes()` last
  // won for every mount on the page, because there was exactly one
  // `config.routes` object. `routesAtom`'s value lives in whichever jotai
  // store reads/writes it, so two independent stores hydrated with different
  // routes must each fetch their own URL, with no bleed between them.
  it("isolates routes between two independent stores", async () => {
    server.use(
      http.get("https://example.test/store-a/people", () =>
        HttpResponse.json([
          {
            eligible_reason: null,
            email: "a@example.test",
            first_name: "Store",
            is_eligible: true,
            last_name: "A",
            username: "store-a",
            organization: "A University",
          },
        ]),
      ),
      http.get("https://example.test/store-b/people", () =>
        HttpResponse.json([
          {
            eligible_reason: null,
            email: "b@example.test",
            first_name: "Store",
            is_eligible: true,
            last_name: "B",
            username: "store-b",
            organization: "B University",
          },
        ]),
      ),
    );

    const storeA = createStore();
    storeA.set(routesAtom, {
      ...defaultRoutes,
      search_people_path: () => "https://example.test/store-a/people",
    });

    const storeB = createStore();
    storeB.set(routesAtom, {
      ...defaultRoutes,
      search_people_path: () => "https://example.test/store-b/people",
    });

    const [foundA, foundB] = await Promise.all([
      storeA.set(searchUsersAtom, "x"),
      storeB.set(searchUsersAtom, "x"),
    ]);

    expect(foundA.map((user) => user.username)).toEqual(["store-a"]);
    expect(foundB.map((user) => user.username)).toEqual(["store-b"]);

    // Order shouldn't matter either: re-run storeA after storeB has already
    // set its own route, to rule out one store's `set` mutating the other's.
    const foundAAgain = await storeA.set(searchUsersAtom, "x");
    expect(foundAAgain.map((user) => user.username)).toEqual(["store-a"]);
  });

  // `projects_path` is one of the routes that already ships in
  // `defaultRoutes` (src/shared/routes.ts), unlike `search_people_path`'s
  // override above. An un-hydrated store's `routesAtom` should still resolve
  // it to that default, not throw or hit a stale route.
  it("falls back to the default route table when nothing is hydrated", async () => {
    server.use(
      http.get(`${defaultRoutes.projects_path()}.json`, () => HttpResponse.json({ result: [] })),
    );

    const store = createStore();
    await store.set(fetchProjectsListAtom, "ada");

    expect(store.get(errorAtom)).toBeNull();
    expect(store.get(projectsListAtom)).toEqual([]);
  });
});
