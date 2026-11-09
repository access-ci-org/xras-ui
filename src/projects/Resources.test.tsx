import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { mergeRoutes, routesAtom } from "@/shared/routes";
import Resources from "./Resources";
import { apiStateAtom, setResourceRequestAtom, statuses, useCreditsAtom } from "./atoms";
import type { Project, Request as RequestType, Resource } from "./types";

const GRANT = "TEST000001";
const REQUEST_ID = 555;
const COMPUTE_ID = 101;
const CREDIT_ID = 900;

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    allocated: 100,
    decimalPlaces: 0,
    endDate: null,
    exchangeRates: {
      base: { type: "base", unitCost: 1 },
      current: { type: "base", unitCost: 1 },
    },
    icon: "cpu",
    isActive: true,
    isBoolean: false,
    isCredit: false,
    isFake: false,
    isUnderReview: false,
    // `belowMinimum` only fires on new resources, so an existing one keeps the
    // below-minimum alert (and its own disable clause) out of these tests.
    isNew: false,
    minimumExchange: 0,
    name: "Compute Resource",
    negativeOnly: false,
    questions: [],
    requires: [],
    resourceProvider: { name: "Example Org" },
    requested: 100,
    resourceId: COMPUTE_ID,
    resourceRepositoryKey: "compute.example",
    startDate: null,
    type: "Compute",
    unit: "Core Hours",
    used: 0,
    userGuideUrl: null,
    ...overrides,
  };
}

const makeCredit = (overrides: Partial<Resource> = {}) =>
  makeResource({
    allocated: 1000,
    isCredit: true,
    name: "ACCESS Credits",
    requested: 1000,
    resourceId: CREDIT_ID,
    unit: "Credits",
    ...overrides,
  });

/*
 * A request in the state the Submit button needs: an editable Exchange action
 * (so the whole form block renders at all), a resource whose requested balance
 * differs from its allocation (`hasRequested`), and a justification
 * (`hasReason`). With those satisfied the button's remaining clauses are the
 * ones under test.
 *
 * The Exchange action's own resource list is derived from the request's
 * non-credit resources rather than set independently. That mirrors the real
 * payload - the action lists what is exchangeable, and `Resources.tsx` only
 * makes those rows editable - and it is load-bearing here: `setResourceRequest`
 * reaches `addResourceAndDeps`, which indexes that list by resource id with no
 * guard, so a resource missing from it throws rather than being ignored.
 */
function makeRequest(overrides: Partial<RequestType> = {}): RequestType {
  const resources = overrides.resources || [makeCredit(), makeResource({ requested: 150 })];
  return {
    actions: [],
    allocationType: "Explore",
    allowedActions: {
      Exchange: {
        name: "Exchange",
        resources: resources.filter((res) => !res.isCredit),
      },
    },
    endDate: null,
    entryDate: "2026-01-01",
    exchangeActionId: null,
    exchangeActionEditable: true,
    exchangeErrors: [],
    exchangeStatus: null,
    grantNumber: GRANT,
    isMaximize: false,
    requestId: REQUEST_ID,
    resourcesReason: "Because science.",
    returnedForCorrections: false,
    returnedForCorrectionsNotes: "",
    showActionsModal: false,
    showAddGrantModal: false,
    showConfirmModal: false,
    showResourcesModal: false,
    startDate: null,
    status: "Active",
    timeStatus: "current",
    type: "New",
    usageDetail: null,
    usageDetailStatus: null,
    usesCredits: true,
    ...overrides,
    resources,
  };
}

function renderResources(
  requestOverrides: Partial<RequestType> = {},
  projectOverrides: Partial<Project> = {},
  { useCredits = true }: { useCredits?: boolean } = {},
) {
  const store = createStore();
  store.set(routesAtom, mergeRoutes());
  store.set(useCreditsAtom, useCredits);
  store.set(apiStateAtom, {
    error: null,
    projectsList: [],
    projectListLoading: false,
    projects: {
      [GRANT]: {
        currentRequestId: REQUEST_ID,
        grantNumber: GRANT,
        isManager: true,
        requestsList: [],
        selectedRequestId: REQUEST_ID,
        status: "Active",
        tab: "resources",
        title: "Test Project",
        users: [],
        usersNewRowIndex: -1,
        usersStatus: null,
        ...projectOverrides,
      } satisfies Project,
    },
    requests: { [REQUEST_ID]: makeRequest(requestOverrides) },
    username: "ada",
    fundingAgencies: [],
    fosTypes: [],
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <Resources requestId={REQUEST_ID} grantNumber={GRANT} />
      </Provider>,
    ),
  };
}

const submitButton = () => screen.getByRole("button", { name: "Submit for Approval" });

describe("Resources submit guard (exchangeErrors, ported from main)", () => {
  it("enables Submit when the form is complete and there are no exchange errors", () => {
    renderResources();
    expect(submitButton()).toBeEnabled();
  });

  it("disables Submit while an exchange error stands", () => {
    renderResources({
      exchangeErrors: ["Compute Resource is decommissioned. Its balance can only be decreased"],
      exchangeStatus: statuses.error,
    });
    expect(submitButton()).toBeDisabled();
  });

  // The guard reads the error *array*, not the status, so a populated array
  // blocks submission even without the error status that normally accompanies
  // it. Pinned because the two are set together today and it would be easy to
  // "simplify" the button to test `error` instead.
  it("disables Submit on a populated error array alone, without the error status", () => {
    renderResources({
      exchangeErrors: ["Compute Resource is decommissioned. Its balance can only be decreased"],
    });
    expect(submitButton()).toBeDisabled();
  });

  /*
   * Characterizing, not endorsing: a client-side validation failure is reported
   * through the same alert as a failed save, so the user is told to open a help
   * ticket about their own over-entry. This is deferred issue #14 in
   * scratch/xras-ui-bugs.md - `main` behaves identically. When it is fixed this
   * test should assert the message *without* the ticket copy.
   */
  it("renders a decommissioned-resource error through the generic API-failure alert", () => {
    renderResources({
      exchangeErrors: ["Compute Resource is decommissioned. Its balance can only be decreased"],
      exchangeStatus: statuses.error,
    });
    expect(
      screen.getByText(/Compute Resource is decommissioned\. Its balance can only be decreased/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "open a help ticket" })).toBeInTheDocument();
  });

  // End to end across the seam the merge created: the atom detects the invalid
  // balance and the component disables submission off the back of it. Both
  // halves are unit-tested elsewhere; this is the wiring between them.
  it("disables Submit after the atom rejects an increase on a decommissioned resource", () => {
    const { store } = renderResources({
      resources: [makeCredit(), makeResource({ negativeOnly: true, allocated: 100, requested: 100 })],
    });
    expect(submitButton()).toBeDisabled(); // nothing requested yet

    act(() => {
      store.set(setResourceRequestAtom, {
        requestId: REQUEST_ID,
        resourceId: COMPUTE_ID,
        requested: 150,
      });
    });

    expect(store.get(apiStateAtom).requests[REQUEST_ID].exchangeErrors).toEqual([
      "Compute Resource is decommissioned. Its balance can only be decreased",
    ]);
    expect(submitButton()).toBeDisabled();
  });

  it("re-enables Submit once the decommissioned resource is brought back down", () => {
    const { store } = renderResources({
      resources: [makeCredit(), makeResource({ negativeOnly: true, allocated: 100, requested: 100 })],
    });

    act(() => {
      store.set(setResourceRequestAtom, { requestId: REQUEST_ID, resourceId: COMPUTE_ID, requested: 150 });
    });
    expect(submitButton()).toBeDisabled();

    act(() => {
      store.set(setResourceRequestAtom, { requestId: REQUEST_ID, resourceId: COMPUTE_ID, requested: 50 });
    });
    expect(store.get(apiStateAtom).requests[REQUEST_ID].exchangeErrors).toEqual([]);
    expect(submitButton()).toBeEnabled();
  });
});

// A host marks resources that don't report usage (`reportsUsage: false`, which
// makeResource turns into `used: null`). Without credits there's no exchange
// path, which is the shape such a request takes on xras_submit_nairr.
describe("Resources with a resource that doesn't report usage", () => {
  const currentUser = {
    eligibility: "Eligible",
    firstName: "Ada",
    initialResourceIds: [COMPUTE_ID],
    initialRole: "pi",
    lastName: "Lovelace",
    resourceAccountPendingIds: [],
    resourceAccountInactiveIds: [],
    resourceIds: [COMPUTE_ID],
    resourceUsernames: { [COMPUTE_ID]: "ada" },
    role: "pi",
    username: "ada",
  };

  const renderWithUsage = (used: number | null) =>
    renderResources(
      {
        allocationType: "Pilot",
        allowedActions: {},
        resources: [makeResource({ allocated: 1000, requested: 1000, used })],
        usesCredits: false,
      },
      { currentUser, users: [currentUser] },
    );

  it("shows the usage-details button and remaining balance for a reporting resource", () => {
    renderWithUsage(250);
    expect(screen.getByRole("button", { name: "Compute Resource Usage Details" })).toBeInTheDocument();
    // The diagram's legend - its only list item, with one resource.
    expect(screen.getByRole("listitem")).toHaveTextContent("750 of 1.00K Core Hours remaining (75%)");
  });

  it("hides the usage-details button and makes no balance claim when used is null", () => {
    renderWithUsage(null);
    expect(
      screen.queryByRole("button", { name: "Compute Resource Usage Details" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("1.00K Core Hours allocated");
    expect(screen.getByRole("listitem")).not.toHaveTextContent("not reported");
    expect(screen.getByRole("listitem")).not.toHaveTextContent("remaining");
  });
});

// NAIRR's rule books allow supplements and renewals but never exchanges, so
// the low-usage "consider an exchange instead" step and the "available to
// exchange" heading would both point at something that isn't there.
describe("Resources Request More without an Exchange action", () => {
  const lowUsage = (allowedActions: RequestType["allowedActions"]) =>
    renderResources({
      allowedActions,
      resources: [makeCredit(), makeResource({ allocated: 1000, requested: 1000, used: 100 })],
      usesCredits: false,
    });
  const supplement = { name: "Supplement", resources: [] };
  const requestMore = () => screen.getByRole("button", { name: /Request More Units/ });

  it("goes straight to the actions modal when no exchange is allowed", () => {
    const { store } = lowUsage({ Supplement: supplement });
    act(() => requestMore().click());
    const request = store.get(apiStateAtom).requests[REQUEST_ID];
    expect(request.showActionsModal).toBe(true);
    expect(request.showConfirmModal).toBe(false);
    expect(screen.queryByText(/available to exchange/)).not.toBeInTheDocument();
  });

  it("still suggests an exchange first when one is allowed", () => {
    const { store } = lowUsage({
      Exchange: { name: "Exchange", resources: [makeResource()] },
      Supplement: supplement,
    });
    act(() => requestMore().click());
    const request = store.get(apiStateAtom).requests[REQUEST_ID];
    expect(request.showConfirmModal).toBe(true);
    expect(request.showActionsModal).toBe(false);
    expect(screen.getByText(/available to exchange/)).toBeInTheDocument();
  });
});

// NAIRR has no credits and no exchanges: the table shows the current
// allocation, how much of it has been used and what is left, and a Transfer is
// a link to its own form rather than an in-page exchange.
describe("Resources without credits", () => {
  const supplement = { name: "Supplement", resources: [] };
  const renderWithoutCredits = (
    requestOverrides: Partial<RequestType> = {},
    resource: Partial<Resource> = {},
  ) =>
    renderResources(
      {
        allocationType: "Pilot",
        allowedActions: { Supplement: supplement },
        resources: [makeResource({ allocated: 1000, requested: 1000, used: 250, ...resource })],
        usesCredits: false,
        ...requestOverrides,
      },
      {},
      { useCredits: false },
    );
  const transferLink = () => screen.queryByRole("link", { name: "Request a Transfer" });

  it("shows no credit wording, unit cost column or diagram", () => {
    renderWithoutCredits();
    expect(screen.queryByText(/credit/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/credit|exchange/i);
    expect(screen.queryByRole("columnheader", { name: "Unit Cost" })).not.toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request More Units" })).toBeInTheDocument();
  });

  it("shows the allocated, used and remaining amounts", () => {
    renderWithoutCredits();
    expect(screen.getByRole("columnheader", { name: "Allocated" })).toBeInTheDocument();
    expect(screen.getByText("1,000 Core Hours")).toBeInTheDocument();
    expect(screen.getByText("250 Core Hours")).toBeInTheDocument();
    expect(screen.getByText("750 Core Hours (75%)")).toBeInTheDocument();
  });

  it("shows dashes, and claims no remaining balance, when used is null", () => {
    renderWithoutCredits({}, { used: null });
    expect(screen.getAllByText("\u2014")).toHaveLength(2);
    expect(screen.queryByText(/not reported/)).not.toBeInTheDocument();
    expect(screen.queryByText(/remaining|%/)).not.toBeInTheDocument();
    expect(screen.getByText("1,000 Core Hours")).toBeInTheDocument();
  });

  it("doesn't gray out the resource rows", () => {
    renderWithoutCredits();
    const row = screen.getByText("1,000 Core Hours").closest("tr");
    expect(row).not.toHaveClass("disabled");
  });

  it("links to a new Transfer action when one is allowed", () => {
    renderWithoutCredits({
      allowedActions: { Supplement: supplement, Transfer: { name: "Transfer", resources: [] } },
    });
    expect(transferLink()).toHaveAttribute(
      "href",
      `${mergeRoutes().request_action_path(REQUEST_ID, "new")}?action_type=Transfer`,
    );
  });

  it("offers no Transfer link without a Transfer action", () => {
    renderWithoutCredits();
    expect(transferLink()).not.toBeInTheDocument();
  });

  it("mentions a pending transfer without changing the table", () => {
    renderWithoutCredits({ pendingTransfer: { actionId: 7, status: "Under Review" } });
    expect(screen.getByText("A transfer request is under review.")).toBeInTheDocument();
    expect(screen.getByText("1,000 Core Hours")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/exchange/i);
  });
});
