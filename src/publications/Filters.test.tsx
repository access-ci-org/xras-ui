import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import Filters from "./Filters";
import { filterOptionsAtom, filterSelectionsAtom, publicationsAtom } from "./atoms";
import type { FilterOptions } from "./types";

function Wrapper({ store }: { store: ReturnType<typeof createStore> }) {
  useHydrateAtoms(
    [
      [
        routesAtom,
        {
          ...defaultRoutes,
          search_publications_path: (params?: Record<string, unknown>) =>
            `https://example.test/search${
              params ? `?${new URLSearchParams(params as Record<string, string>)}` : ""
            }`,
        },
      ],
    ],
    { store },
  );
  return (
    <Provider store={store}>
      <Filters />
    </Provider>
  );
}

// Filters (src/publications/Filters.tsx) renders "Loading filters..." while
// `filterOptions.journals` is falsy, then on submit copies its local
// TanStack Form state into filterSelectionsAtom (mapping the sentinel
// "__all__" back to ""), resets pagination, and re-fetches. Reset restores
// the form to emptyFilters and clears filterSelectionsAtom the same way.
describe("Filters", () => {
  // Both submit and Reset call window.scrollTo(0, 0), which jsdom doesn't
  // implement and logs a "Not implemented" warning for on every call.
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  it("shows a loading placeholder when filterOptionsAtom has no journals list yet", () => {
    // filterOptionsAtom's own default already has `journals: []` (truthy), so
    // this state is otherwise unreachable through normal store creation - it
    // only happens via getFiltersAtom's `set(filterOptionsAtom, data.filters
    // || [])` fallback (src/publications/atoms.ts) when a malformed response
    // has no `filters` key. Reproducing that exact malformed shape here
    // (deliberately violating the FilterOptions type, as that fallback does).
    const store = createStore();
    store.set(filterOptionsAtom, [] as unknown as FilterOptions);
    render(<Wrapper store={store} />);
    expect(screen.getByText("Loading filters...")).toBeInTheDocument();
  });

  it("submits typed filter values into filterSelectionsAtom and triggers a search", async () => {
    server.use(
      http.get("https://example.test/search", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("author_name")).toBe("Lovelace, A");
        return HttpResponse.json({ publications: [{ publication_id: 1 }], pagination: {} });
      }),
    );

    const user = userEvent.setup();
    const store = createStore();
    store.set(filterOptionsAtom, { journals: ["Nature"], publication_types: ["Journal Paper"] });
    render(<Wrapper store={store} />);

    await user.type(screen.getByLabelText("Author Name"), "Lovelace, A");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(store.get(filterSelectionsAtom).authorName).toBe("Lovelace, A");
    expect(await screen.findByText("Nature")).toBeInTheDocument(); // datalist option still there
    expect(store.get(publicationsAtom)).toEqual([{ publication_id: 1 }]);
  });

  it("maps the '__all__' publication-type sentinel back to an empty filter value on submit", async () => {
    server.use(
      http.get("https://example.test/search", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.has("publication_type")).toBe(false);
        return HttpResponse.json({ publications: [], pagination: {} });
      }),
    );

    const user = userEvent.setup();
    const store = createStore();
    store.set(filterOptionsAtom, { journals: [], publication_types: ["Journal Paper"] });
    render(<Wrapper store={store} />);

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(store.get(filterSelectionsAtom).publicationType).toBe("");
  });

  it("Reset clears filter selections and re-fetches without waiting for a submit", async () => {
    server.use(
      http.get("https://example.test/search", () =>
        HttpResponse.json({ publications: [], pagination: {} }),
      ),
    );

    const user = userEvent.setup();
    const store = createStore();
    store.set(filterOptionsAtom, { journals: [], publication_types: [] });
    store.set(filterSelectionsAtom, {
      createdBy: ["someone"],
      doi: "10.1/x",
      grantNumber: "",
      journal: "Nature",
      authorName: "Someone",
      publicationType: "Journal Paper",
    });
    render(<Wrapper store={store} />);

    await user.click(screen.getByRole("button", { name: "Reset" }));

    const selections = store.get(filterSelectionsAtom);
    expect(selections.journal).toBe("");
    expect(selections.authorName).toBe("");
    expect(selections.doi).toBe("");
    expect(selections.publicationType).toBe("");
    expect(selections.createdBy).toEqual([]);
  });
});
