import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import PublicationsGrid from "./PublicationsGrid";
import { publicationsAtom, selectedPublicationIdsAtom } from "./atoms";
import type { PublicationSummary } from "./types";

function makePublication(overrides: Partial<PublicationSummary> = {}): PublicationSummary {
  return {
    publication_id: 1,
    publication_type: "Journal Paper",
    publication_year: 2024,
    title: "A Study of Testing",
    doi: null,
    authors: [{ first_name: "Ada", last_name: "Lovelace" }],
    fields: {},
    projects: [],
    resources: [],
    created_by: "alovelace",
    can_edit: true,
    ...overrides,
  };
}

// PublicationsGrid (src/publications/PublicationsGrid.tsx) always re-fetches
// once on mount (its effect's guard is `if (!saving)`, and savingAtom starts
// false), with usePagination forced to false - so every render needs a
// search_publications_path handler even when the test seeds publicationsAtom
// directly.
function renderGrid(props: Parameters<typeof PublicationsGrid>[0] = {}, seeded: PublicationSummary[] = []) {
  server.use(
    http.get("https://example.test/search", () =>
      HttpResponse.json({ publications: seeded, pagination: {} }),
    ),
  );
  const store = createStore();
  store.set(publicationsAtom, seeded);

  function Wrapper() {
    useHydrateAtoms(
      [
        [
          routesAtom,
          { ...defaultRoutes, search_publications_path: () => "https://example.test/search" },
        ],
      ],
      { store },
    );
    return <PublicationsGrid {...props} />;
  }

  return { store, ...render(<Provider store={store}><Wrapper /></Provider>) };
}

describe("PublicationsGrid", () => {
  it("renders each publication's citation and an Add button by default", () => {
    renderGrid({}, [makePublication()]);
    expect(screen.getByText(/A Study of Testing/)).toBeInTheDocument();
    // PublicationCitation splits "Lovelace, A." from the rest of the
    // citation across sibling text nodes, so match loosely instead of
    // requiring it to be one contiguous text node.
    expect(screen.getByText(/Lovelace, A\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a New Publication" })).toBeInTheDocument();
  });

  it("hides the Add button when allowAdd is false", () => {
    renderGrid({ allowAdd: false }, [makePublication()]);
    expect(screen.queryByRole("button", { name: "Add a New Publication" })).not.toBeInTheDocument();
  });

  it("shows an edit button only for rows the user can edit, and opens the edit modal on click", async () => {
    const user = userEvent.setup();
    // Clicking the edit button mounts PublicationEdit, which fires
    // getPublicationDataAtom (src/publications/atoms.ts) against
    // `edit_publication_path(1).json` on mount - unlike most other atoms in
    // that file, it has no try/catch around the fetch/json calls, so an
    // unhandled request here surfaces as an unhandled promise rejection
    // rather than a graceful in-app error. Mock it so this test exercises
    // only PublicationsGrid's own behavior (opening the dialog).
    server.use(
      http.get("/publications/1/edit.json", () =>
        HttpResponse.json({
          publication: {
            publication_id: 1,
            publication_type: "Journal Paper",
            title: "A Study of Testing",
            authors: [],
            fields: [],
          },
          publication_types: [],
        }),
      ),
    );
    renderGrid(
      {},
      [
        makePublication({ publication_id: 1, can_edit: true }),
        makePublication({ publication_id: 2, title: "Not Editable", can_edit: false }),
      ],
    );

    const editButtons = screen.getAllByTitle("Edit publication");
    expect(editButtons).toHaveLength(1);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(editButtons[0]);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByText("Edit Publication")).toBeInTheDocument();
  });

  it("renders a selection checkbox column only when allowSelect is true, and the header toggles all rows", async () => {
    const user = userEvent.setup();
    const { store } = renderGrid(
      { allowSelect: true },
      [makePublication({ publication_id: 1 }), makePublication({ publication_id: 2 })],
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // One header "select all" checkbox plus one per row.
    expect(checkboxes).toHaveLength(3);

    await user.click(checkboxes[0]);
    expect(store.get(selectedPublicationIdsAtom)).toEqual([1, 2]);

    await user.click(checkboxes[0]);
    expect(store.get(selectedPublicationIdsAtom)).toEqual([]);
  });
});
