import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import Grants from "./Grants";
import { apiStateAtom } from "./atoms";
import type { Grant, Project, Request as RequestType } from "./types";

const GRANT_NUMBER = "TEST000001";
const REQUEST_ID = 555;
const SAVE_URL = "https://example.test/save-grants";

function makeGrant(overrides: Partial<Grant> = {}): Grant {
  return {
    grantId: 1,
    fundingAgencyId: 10,
    fundingAgencyName: "National Science Foundation",
    fundingAgencyAbbr: "NSF",
    grantNumber: "NSF-12345",
    piName: "Ada Lovelace",
    title: "A Supporting Grant",
    beginDate: "2024-01-01",
    endDate: "2025-01-01",
    awardedAmount: 100000,
    awardedUnits: "Dollars",
    percentageAward: 100,
    programOfficerName: "Grace Hopper",
    programOfficerEmail: "ghopper@example.test",
    isPending: false,
    subAwardNumber: null,
    comments: "Supports the same research area.",
    primaryFosTypeId: 5,
    primaryFosType: "Computer Science",
    ...overrides,
  };
}

function makeRequest(overrides: Partial<RequestType> = {}): RequestType {
  return {
    actions: [],
    allocationType: "Explore",
    allowedActions: {},
    endDate: "2026-12-31",
    entryDate: "2026-01-01",
    exchangeActionId: null,
    exchangeActionEditable: false,
    exchangeErrors: [],
    exchangeStatus: null,
    grantNumber: GRANT_NUMBER,
    grants: [],
    editGrantId: null,
    grantsStatus: null,
    isMaximize: false,
    requestId: REQUEST_ID,
    resources: [],
    resourcesReason: "",
    returnedForCorrections: false,
    returnedForCorrectionsNotes: "",
    showActionsModal: false,
    showConfirmModal: false,
    showResourcesModal: false,
    startDate: "2025-01-01",
    status: "Active",
    timeStatus: "current",
    type: "New",
    usageDetail: null,
    usageDetailStatus: null,
    usesCredits: true,
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    currentRequestId: REQUEST_ID,
    grantNumber: GRANT_NUMBER,
    isManager: true,
    requestsList: [],
    selectedRequestId: REQUEST_ID,
    status: "Active",
    tab: "grants",
    title: "Test Project",
    users: [],
    usersNewRowIndex: -1,
    usersStatus: null,
    ...overrides,
  };
}

function renderGrants({
  grants,
  role = "pi",
  requestId = REQUEST_ID,
  currentRequestId = REQUEST_ID,
  requestOverrides = {},
}: {
  grants?: Grant[];
  role?: string;
  requestId?: number;
  currentRequestId?: number | null;
  requestOverrides?: Partial<RequestType>;
} = {}) {
  const store = createStore();
  store.set(routesAtom, { ...defaultRoutes, projects_save_grants_path: () => SAVE_URL });
  const currentUser = {
    eligibility: "yes",
    firstName: "Test",
    initialResourceIds: [],
    initialRole: role,
    lastName: "User",
    resourceAccountPendingIds: [],
    resourceAccountInactiveIds: [],
    resourceIds: [],
    resourceUsernames: {},
    role,
    username: "testuser",
  };
  store.set(apiStateAtom, {
    error: null,
    projectsList: [],
    projectListLoading: false,
    projects: {
      [GRANT_NUMBER]: {
        ...makeProject({ currentRequestId, users: [currentUser] }),
        currentUser,
      },
    },
    requests: {
      [requestId]: makeRequest({ requestId, grants, ...requestOverrides }),
    },
    username: "testuser",
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <Grants grantNumber={GRANT_NUMBER} requestId={requestId} />
      </Provider>,
    ),
  };
}

const editButton = () => screen.getByRole("button", { name: "Edit supporting grant" });

async function openEditModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(editButton());
  await screen.findByRole("dialog");
}

describe("Grants (compact listing)", () => {
  it("shows the empty state when there are no grants", () => {
    renderGrants({ grants: [] });
    expect(
      screen.getByText("No supporting grants were submitted with this request."),
    ).toBeInTheDocument();
  });

  it("renders nothing when the request's grants key is undefined (older host API)", () => {
    const { container } = renderGrants({ grants: undefined });
    expect(container).toBeEmptyDOMElement();
  });

  it("summarizes each grant for a non-manager", () => {
    renderGrants({ grants: [makeGrant()], role: "user" });

    expect(screen.getByText("A Supporting Grant")).toBeInTheDocument();
    expect(screen.getByText(/NSF\s+NSF-12345/)).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Jan 1, 2024 – Jan 1, 2025")).toBeInTheDocument();
    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Grace Hopper" })).toHaveAttribute(
      "href",
      "mailto:ghopper@example.test",
    );
  });

  it("shows a pending grant as pending instead of showing its dates", () => {
    renderGrants({ grants: [makeGrant({ isPending: true })], role: "user" });

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.queryByText("Jan 1, 2024 – Jan 1, 2025")).not.toBeInTheDocument();
  });

  it("does not offer an edit button to a non-manager", () => {
    renderGrants({ grants: [makeGrant()], role: "user" });

    expect(screen.queryByRole("button", { name: "Edit supporting grant" })).not.toBeInTheDocument();
  });

  it.each(["pi", "co_pi", "allocation_manager"])(
    "offers an edit button to role %s on the current request",
    (role) => {
      renderGrants({ grants: [makeGrant()], role });

      expect(editButton()).toBeInTheDocument();
    },
  );

  // The server is the actual authority (save_grants checks the caller's role
  // against the request directly); this only pins the UI affordance, per the
  // plan's "requestId == project.currentRequestId" gate.
  it("hides the edit button for a manager viewing a superseded (non-current) request", () => {
    renderGrants({ grants: [makeGrant()], role: "pi", requestId: 556, currentRequestId: 555 });

    expect(screen.queryByRole("button", { name: "Edit supporting grant" })).not.toBeInTheDocument();
  });

  it("shows the saved confirmation after a successful save", () => {
    renderGrants({ grants: [makeGrant()], requestOverrides: { grantsStatus: "success" } });

    expect(screen.getByText("Your changes have been saved.")).toBeInTheDocument();
  });
});

describe("Grants (edit modal)", () => {
  it("opens the supporting grants form with only the editable fields enabled", async () => {
    const user = userEvent.setup();
    renderGrants({ grants: [makeGrant()] });

    await openEditModal(user);

    for (const label of ["Start Date", "End Date", "Program Officer Name", "Program Officer Email"]) {
      expect(screen.getByLabelText(label, { exact: false })).toBeEnabled();
    }
    expect(screen.getByRole("radio", { name: "Yes" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "No" })).toBeEnabled();
    for (const label of ["Grant Number", "Grant Title", "PI Name", "Awarded Amount", "Explanation"]) {
      expect(screen.getByLabelText(label, { exact: false })).toBeDisabled();
    }
  });

  it("saves a changed pending answer", async () => {
    const user = userEvent.setup();
    let body: any = null;
    server.use(
      http.post(SAVE_URL, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 200 });
      }),
    );
    const { store } = renderGrants({ grants: [makeGrant({ isPending: false })] });

    await openEditModal(user);
    await user.click(screen.getByRole("radio", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body.grants).toEqual([{ grantId: 1, isPending: true }]);
    expect(store.get(apiStateAtom).requests[REQUEST_ID].grants![0].isPending).toBe(true);
  });

  it("prefills the form from the grant and offers no add or remove controls", async () => {
    const user = userEvent.setup();
    renderGrants({ grants: [makeGrant()] });

    await openEditModal(user);

    expect(screen.getByLabelText("Grant Number", { exact: false })).toHaveValue("NSF-12345");
    expect(screen.getByLabelText("Awarded Amount", { exact: false })).toHaveValue("$100,000.00");
    expect(screen.getByLabelText("Program Officer Name", { exact: false })).toHaveValue("Grace Hopper");
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add another supporting grant" }),
    ).not.toBeInTheDocument();
  });

  // A grant submitted while still pending has no dates yet, and filling them
  // in is exactly what a manager comes here to do - so the pending answer
  // must not make the date fields unreachable.
  it("still shows the date fields for a pending grant", async () => {
    const user = userEvent.setup();
    renderGrants({ grants: [makeGrant({ isPending: true, beginDate: null, endDate: null })] });

    await openEditModal(user);

    expect(screen.getByLabelText("Start Date", { exact: false })).toBeEnabled();
    expect(screen.getByLabelText("End Date", { exact: false })).toBeEnabled();
  });

  it("saves only the fields that changed", async () => {
    const user = userEvent.setup();
    let body: any = null;
    server.use(
      http.post(SAVE_URL, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 200 });
      }),
    );
    const { store } = renderGrants({ grants: [makeGrant()] });

    await openEditModal(user);
    const poName = screen.getByLabelText("Program Officer Name", { exact: false });
    await user.clear(poName);
    await user.type(poName, "New PO");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body.requestId).toBe(REQUEST_ID);
    expect(body.grants).toEqual([{ grantId: 1, programOfficerName: "New PO" }]);
    // A successful save closes the modal and commits the new value.
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(store.get(apiStateAtom).requests[REQUEST_ID].grants![0].programOfficerName).toBe("New PO");
  });

  it("blocks the save and reports an end date that precedes the start date", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post(SAVE_URL, () => {
        called = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );
    renderGrants({ grants: [makeGrant()] });

    await openEditModal(user);
    const endDate = screen.getByLabelText("End Date", { exact: false });
    await user.clear(endDate);
    await user.type(endDate, "2023-01-01");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("End date must be on or after the start date"),
    ).toBeInTheDocument();
    expect(called).toBe(false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("warns (without blocking the save) when the grant's dates don't overlap the allocation period", async () => {
    const user = userEvent.setup();
    renderGrants({
      grants: [makeGrant({ beginDate: "2024-01-01", endDate: "2024-06-01" })],
      requestOverrides: { startDate: "2025-01-01", endDate: "2026-12-31" },
    });

    await openEditModal(user);

    expect(screen.getByText(/do not overlap the project's allocation period/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });

  it("reports a rejected save and keeps the modal open", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(SAVE_URL, () =>
        HttpResponse.json({ errors: ["Grant dates must overlap the allocation period"] }, { status: 422 }),
      ),
    );
    renderGrants({ grants: [makeGrant()] });

    await openEditModal(user);
    const endDate = screen.getByLabelText("End Date", { exact: false });
    await user.clear(endDate);
    await user.type(endDate, "2025-06-01");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Grant dates must overlap the allocation period"),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Cancel closes the modal without saving", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post(SAVE_URL, () => {
        called = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );
    renderGrants({ grants: [makeGrant()] });

    await openEditModal(user);
    const poName = screen.getByLabelText("Program Officer Name", { exact: false });
    await user.clear(poName);
    await user.type(poName, "New PO");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(called).toBe(false);
  });
});
