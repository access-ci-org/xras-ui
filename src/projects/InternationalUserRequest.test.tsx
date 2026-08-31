import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { mergeRoutes, routesAtom } from "@/shared/routes";
import InternationalUserRequest from "./InternationalUserRequest";
import type { InternationalUserRequestSummary, Project } from "./types";

function makeProject(
  internationalUserRequests: InternationalUserRequestSummary[] | null | undefined,
): Project {
  return {
    currentRequestId: 555,
    grantNumber: "ABC123",
    internationalUserRequests,
    isManager: true,
    requestsList: [],
    selectedRequestId: 555,
    status: "Active",
    tab: "international",
    title: "Test Project",
    users: [],
    usersNewRowIndex: 0,
    usersStatus: null,
  };
}

// The component reads only `routesAtom`, so the store exists to hydrate that.
function Hydrate({ children }: { children: React.ReactNode }) {
  useHydrateAtoms([[routesAtom, mergeRoutes()]] as const);
  return children;
}

function renderWith(project: Project, requestId = 555) {
  const store = createStore();
  return render(
    <Provider store={store}>
      <Hydrate>
        <InternationalUserRequest project={project} requestId={requestId} />
      </Hydrate>
    </Provider>,
  );
}

describe("InternationalUserRequest", () => {
  it("renders nothing when the project has no international user requests", () => {
    const { container } = renderWith(makeProject(null));
    expect(container).toBeEmptyDOMElement();
  });

  // Present-but-empty is a real state: the project needs justifications, none
  // has been started. The table renders with only its header.
  it("renders an empty table when the list is present but empty", () => {
    renderWith(makeProject([]));

    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  // Hosts older than xras_submit_access 87e1f6d0 send no `requestId` per
  // justification (see `InternationalUserRequestSummary`), and a Rails route
  // helper called with an undefined id throws `ParametersMissing` rather than
  // producing a bad href - so the fallback is what keeps the tab renderable
  // against one of those.
  it("falls back to the request being viewed when the justification has no requestId", () => {
    renderWith(makeProject([{ id: 9, status: "Incomplete", submittedAt: null }]), 777);

    expect(screen.getByRole("link", { name: "View / Update" })).toHaveAttribute(
      "href",
      "/requests/777/justifications/9/edit",
    );
  });

  it("prefers the justification's own requestId over the request being viewed", () => {
    renderWith(makeProject([{ id: 9, requestId: 555, status: "Incomplete", submittedAt: null }]), 777);

    expect(screen.getByRole("link", { name: "View / Update" })).toHaveAttribute(
      "href",
      "/requests/555/justifications/9/edit",
    );
  });

  it("links an incomplete form to its edit page", () => {
    renderWith(makeProject([{ id: 9, requestId: 555, status: "Incomplete", submittedAt: null }]));

    const link = screen.getByRole("link", { name: "View / Update" });
    expect(link).toHaveAttribute(
      "href",
      "/requests/555/justifications/9/edit",
    );
    // No submission date yet.
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  // A submitted form is still editable: it's only frozen once the Allocations
  // Team picks it up.
  it("links a submitted form to its edit page too, and shows the submission date", () => {
    renderWith(
      makeProject([
        { id: 10, requestId: 555, status: "Submitted", submittedAt: "2025-06-01T18:30:00Z" },
      ]),
    );

    expect(screen.getByRole("link", { name: "View / Update" })).toHaveAttribute(
      "href",
      "/requests/555/justifications/10/edit",
    );
    // Rendered from the date part in local time, so a late-evening UTC
    // submission doesn't display as the next day.
    expect(screen.getByText("Jun 1, 2025")).toBeInTheDocument();
  });

  it("links any other status to the read-only page", () => {
    renderWith(
      makeProject([
        { id: 11, requestId: 555, status: "Approved", submittedAt: "2025-06-01T00:00:00Z" },
      ]),
    );

    const link = screen.getByRole("link", { name: "View" });
    expect(link).toHaveAttribute("href", "/requests/555/justifications/11");
  });

  it("renders one row per justification, each linking to its own request", () => {
    renderWith(
      makeProject([
        { id: 9, requestId: 555, status: "Incomplete", submittedAt: null },
        { id: 12, requestId: 556, status: "Approved", submittedAt: "2025-01-15T00:00:00Z" },
      ]),
    );

    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2
    expect(screen.getByRole("link", { name: "View / Update" })).toHaveAttribute(
      "href",
      "/requests/555/justifications/9/edit",
    );
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/requests/556/justifications/12",
    );
  });
});
