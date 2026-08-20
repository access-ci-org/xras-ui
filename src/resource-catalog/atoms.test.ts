import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import {
  filtersAtom,
  getResourcesAtom,
  hasErrorsAtom,
  resourcesAtom,
  resourcesLoadedAtom,
} from "@/resource-catalog/atoms";
import type { CatalogParams } from "@/resource-catalog/types";

const params: CatalogParams = {
  apiUrl: "https://example.test/api/resources",
  excludedCategories: [],
  excludedFilters: [],
  excludedResources: [],
  allowedCategories: [],
  allowedFilters: [],
};

// getResourcesAtom (52-line src/resource-catalog/atoms.ts) is a plain
// jotai write atom, so it can be driven with a bare createStore() with no
// React involved. Backing its `fetch` with an MSW handler proves the harness
// can test async atom logic against controlled responses instead of a real
// XRAS API.
describe("getResourcesAtom", () => {
  it("loads and stores resources from the (mocked) API response", async () => {
    server.use(
      http.get(params.apiUrl, () => HttpResponse.json([])),
    );

    const store = createStore();
    await store.set(getResourcesAtom, params);

    expect(store.get(resourcesLoadedAtom)).toBe(true);
    expect(store.get(hasErrorsAtom)).toBe(false);
    expect(store.get(resourcesAtom)).toEqual([]);
    expect(store.get(filtersAtom)).toEqual([]);
  });

  // Proves `onUnhandledRequest: "error"` (src/test/setup.ts) is actually
  // live: a request to a URL with no registered handler makes `fetch`
  // reject, which the atom's own try/catch turns into `hasErrorsAtom`. If
  // the suite ever silently allowed unhandled requests through - e.g. to a
  // real XRAS host - this test would instead see a successful (or hanging)
  // response.
  it("records an error when the request is unhandled by MSW", async () => {
    const store = createStore();
    await store.set(getResourcesAtom, {
      ...params,
      apiUrl: "https://example.test/api/unhandled",
    });

    expect(store.get(hasErrorsAtom)).toBe(true);
  });
});
