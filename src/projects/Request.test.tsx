import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { mergeRoutes, routesAtom } from "@/shared/routes";
import Request from "./Request";
import { apiStateAtom } from "./atoms";
import type { InternationalUserRequestSummary, Project, Request as RequestType } from "./types";

const GRANT = "TEST000001";
const REQUEST_ID = 555;

function makeRequest(overrides: Partial<RequestType> = {}): RequestType {
  return {
    actions: [],
    allocationType: "Explore",
    allowedActions: {},
    endDate: null,
    entryDate: "2026-01-01",
    exchangeActionId: null,
    exchangeActionEditable: false,
    exchangeErrors: [],
    exchangeStatus: null,
    grantNumber: GRANT,
    isMaximize: false,
    requestId: REQUEST_ID,
    resources: [],
    resourcesReason: "",
    returnedForCorrections: false,
    returnedForCorrectionsNotes: "",
    showActionsModal: false,
    showConfirmModal: false,
    showResourcesModal: false,
    startDate: null,
    status: "Active",
    // "current" keeps the past/future-request warning out of the way, and stops
    // Request.tsx reading `actions[0].status` for its display status.
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
    grantNumber: GRANT,
    isManager: true,
    requestsList: [],
    selectedRequestId: REQUEST_ID,
    status: "Active",
    tab: "overview",
    title: "Test Project",
    users: [],
    usersNewRowIndex: -1,
    usersStatus: null,
    ...overrides,
  };
}

/*
 * Renders the real component tree - no child is stubbed, matching the rest of
 * this suite. That works because the project and request are hydrated up front,
 * so `useProject`/`useRequest`'s mount effects find them and never fetch, and
 * because Radix `Tabs` mounts only the active panel: the `tab` field on the
 * project decides which of Overview/Resources/Users/Publications/History is
 * actually exercised. Every modal returns null while its `show*Modal` flag is
 * false.
 */
function renderRequest({
  internationalUserRequests,
  tab,
}: {
  internationalUserRequests?: InternationalUserRequestSummary[] | null;
  tab?: string;
} = {}) {
  const store = createStore();
  store.set(routesAtom, mergeRoutes());
  store.set(apiStateAtom, {
    error: null,
    projectsList: [],
    projectListLoading: false,
    projects: { [GRANT]: makeProject({ internationalUserRequests, tab: tab || "overview" }) },
    requests: { [REQUEST_ID]: makeRequest() },
    username: "ada",
  });
  return render(
    <Provider store={store}>
      <Request requestId={REQUEST_ID} grantNumber={GRANT} />
    </Provider>,
  );
}

const intlTab = () => screen.queryByRole("tab", { name: "Intl. Users" });
const incompleteAlert = () =>
  screen.queryByText(/incomplete International User Justification form/i);

describe("Request (International User Justifications, ported from main)", () => {
  it("omits the Intl. Users tab when the project has no justifications key", () => {
    renderRequest();
    expect(intlTab()).not.toBeInTheDocument();
  });

  it("omits the tab when the key is explicitly null", () => {
    renderRequest({ internationalUserRequests: null });
    expect(intlTab()).not.toBeInTheDocument();
  });

  // The gate is on the key being *present*, not on it being non-empty: the API
  // omits it entirely for allocations that need no justifications, and sends an
  // empty list for one that needs them but has none yet. The second case still
  // gets the tab, which is the whole reason the flag is `!!project...` rather
  // than a length check.
  it("shows the tab when the key is present but the list is empty", () => {
    renderRequest({ internationalUserRequests: [] });
    expect(intlTab()).toBeInTheDocument();
  });

  it("shows the tab when there are justifications", () => {
    renderRequest({
      internationalUserRequests: [{ id: 9, requestId: REQUEST_ID, status: "Submitted" }],
    });
    expect(intlTab()).toBeInTheDocument();
  });

  it("renders the justifications panel when its tab is the selected one", () => {
    renderRequest({
      internationalUserRequests: [{ id: 9, requestId: REQUEST_ID, status: "Submitted" }],
      tab: "international",
    });
    expect(screen.getByRole("heading", { name: "International User Justifications" })).toBeInTheDocument();
  });

  /*
   * Selecting the panel with no justifications key renders nothing. Note this
   * cannot distinguish the `hasInternationalUserRequests &&` guard on the
   * `TabsContent` from its absence: `InternationalUserRequest` opens with
   * `if (!requests) return null`, so removing the guard changes no output and
   * survives mutation. The guard is defensive duplication, and the child's own
   * "renders nothing when the project has no international user requests" test
   * is what actually pins this behavior.
   */
  it("renders no panel for the international tab when there is no justifications key", () => {
    renderRequest({ tab: "international" });
    expect(
      screen.queryByRole("heading", { name: "International User Justifications" }),
    ).not.toBeInTheDocument();
  });

  it("warns when any justification is Incomplete", () => {
    renderRequest({
      internationalUserRequests: [
        { id: 9, requestId: REQUEST_ID, status: "Submitted" },
        { id: 10, requestId: REQUEST_ID, status: "Incomplete" },
      ],
    });
    expect(incompleteAlert()).toBeInTheDocument();
  });

  it("does not warn when every justification has been submitted", () => {
    renderRequest({
      internationalUserRequests: [
        { id: 9, requestId: REQUEST_ID, status: "Submitted" },
        { id: 10, requestId: REQUEST_ID, status: "Approved" },
      ],
    });
    expect(incompleteAlert()).not.toBeInTheDocument();
  });

  it("does not warn when there are no justifications at all", () => {
    renderRequest({ internationalUserRequests: [] });
    expect(incompleteAlert()).not.toBeInTheDocument();
  });
});
