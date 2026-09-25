import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import Filters from "./Filters";
import {
  apiUrlAtom,
  filtersAtom,
  filtersLoadedAtom,
  typeListsAtom,
} from "./atoms";
import type { Filters as FilterValues, TypeLists } from "./types";

const API_URL = "https://example.test/api/projects";

const fosTypes: TypeLists["fosTypes"] = [{ fosTypeId: 1, fosName: "Physics" }];

// The "-- All --" option is a display concern, and each filter that has one
// owns it here rather than in the store: the option carries the "__all__"
// sentinel, and onSubmit maps it back to "" before anything reaches
// filtersAtom. `org` used to be the exception - filterCleanupAtom prepended a
// "-- ALL --" string into typeListsAtom.orgs, which is server data, so the
// sentinel both mutated a fetched list (bug #10: a second call duplicated it)
// and leaked into filtersAtom, where buildProjectsUrl had to special-case it.
function renderFilters(overrides: Partial<FilterValues> = {}) {
  const store = createStore();
  store.set(apiUrlAtom, API_URL);
  store.set(filtersLoadedAtom, true);
  store.set(typeListsAtom, {
    orgs: ["Acme University", "Bedrock College"],
    fosTypes,
    allocationTypes: [],
    resources: [],
  });
  store.set(filtersAtom, {
    org: "",
    allocationType: "",
    fosTypeIds: fosTypes.map((fos) => fos.fosTypeId),
    resource: "",
    requestNumber: "",
    ...overrides,
  });

  render(
    <Provider store={store}>
      <Filters />
    </Provider>,
  );
  return store;
}

describe("Filters - organization filter", () => {
  // Submit and Reset both call window.scrollTo(0, 0), which jsdom doesn't
  // implement and logs a "Not implemented" warning for on every call.
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  it("offers a '-- All --' option without putting it in the loaded org list", async () => {
    const user = userEvent.setup();
    const store = renderFilters();

    // Opening the menu scopes the query: the sibling Project Type and Resource
    // selects render a "-- All --" of their own, but only one menu is open.
    await user.click(screen.getByRole("combobox", { name: "Organization" }));
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "-- All --",
      "Acme University",
      "Bedrock College",
    ]);

    // The option is offered exactly once, and typeListsAtom still holds what
    // the API returned. That is the property bug #10 violated, and the reason
    // it was latent: nothing re-derives this list today, so a duplicated
    // sentinel would only have surfaced on a second init.
    expect(store.get(typeListsAtom).orgs).toEqual(["Acme University", "Bedrock College"]);
  });

  it("maps the '__all__' org sentinel back to an empty filter value on submit", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get(API_URL, ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const user = userEvent.setup();
    const store = renderFilters();

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(store.get(filtersAtom).org).toBe("");
    expect(receivedUrl?.searchParams.has("org")).toBe(false);
  });

  it("submits a real org selection unchanged", async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get(API_URL, ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json({ projects: [], pages: 1 });
      }),
    );

    const user = userEvent.setup();
    const store = renderFilters({ org: "Acme University" });

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(store.get(filtersAtom).org).toBe("Acme University");
    expect(receivedUrl?.searchParams.get("org")).toBe("Acme University");
  });

  it("treats an explicitly chosen '-- All --' as no org filter at all", async () => {
    server.use(http.get(API_URL, () => HttpResponse.json({ projects: [], pages: 1 })));

    const user = userEvent.setup();
    const store = renderFilters({ org: "Acme University" });
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();

    // Go through the select rather than starting from the default, so this
    // exercises the path the user actually takes back to "no filter".
    await user.click(screen.getByRole("combobox", { name: "Organization" }));
    await user.click(screen.getByRole("option", { name: "-- All --" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(store.get(filtersAtom).org).toBe("");
    // `buttonDisabled` tests `filters.org === ""`. While the sentinel leaked
    // into filtersAtom this read as an active filter, so Reset stayed enabled
    // with nothing to reset.
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });

  it("enables Reset once a real org is selected", () => {
    renderFilters({ org: "Acme University" });

    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });
});
