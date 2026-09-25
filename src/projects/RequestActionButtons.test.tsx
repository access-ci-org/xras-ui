import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { mergeRoutes, routesAtom } from "@/shared/routes";
import RequestActionButtons from "./RequestActionButtons";
import { apiStateAtom } from "./atoms";
import type { Action, AllowedActionsMap, Request } from "./types";

function makeAction(overrides: Partial<Action> = {}): Action {
  return {
    actionId: 1,
    allowedOperations: [],
    detailAvailable: true,
    date: "2024-03-15",
    deleteStatus: null,
    isRequest: true,
    resources: [],
    showDeleteModal: false,
    status: "Approved",
    type: "Renewal",
    ...overrides,
  };
}

function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    actions: [makeAction()],
    allocationType: "Research",
    allowedActions: {},
    entryDate: "2024-01-01",
    exchangeActionId: null,
    exchangeActionEditable: true,
    exchangeErrors: [],
    exchangeStatus: null,
    grantNumber: "TG-001",
    isMaximize: false,
    requestId: 42,
    resources: [],
    resourcesReason: "",
    returnedForCorrections: false,
    returnedForCorrectionsNotes: "",
    showActionsModal: false,
    showConfirmModal: false,
    showResourcesModal: false,
    status: "Approved",
    timeStatus: "current",
    type: "Renewal",
    usageDetail: null,
    usageDetailStatus: null,
    usesCredits: false,
    ...overrides,
  };
}

// Pre-populates apiStateAtom.requests[requestId] before render, so
// useRequest's `if (requestId != null && !request) fetchRequestDetail(...)`
// effect (src/projects/helpers/hooks.ts) never fires - fetchRequestDetailAtom
// only ever writes an `{ error }` stub, and RequestActionButtons would throw
// destructuring `actions`/`allowedActions` off of that. This is the same
// technique the request already has to satisfy: `useRequest` reads out of a
// single shared `apiStateAtom` (src/projects/atoms.ts) rather than being fed
// props directly.
function renderButtons(request: Request, requestId = request.requestId) {
  const store = createStore();
  store.set(apiStateAtom, { error: null, projectsList: [], projectListLoading: false, projects: {}, requests: { [requestId]: request }, username: null });

  function Wrapper() {
    useHydrateAtoms([[routesAtom, mergeRoutes()]], { store });
    return <RequestActionButtons requestId={requestId} grantNumber={request.grantNumber} />;
  }

  return render(
    <Provider store={store}>
      <Wrapper />
    </Provider>,
  );
}

describe("RequestActionButtons", () => {
  it("shows an Extend End Date button when Extension is an allowed action, and toggles the actions modal on click", async () => {
    const user = userEvent.setup();
    const request = makeRequest({
      allowedActions: { Extension: { name: "Extension", resources: [] } } as AllowedActionsMap,
      actions: [makeAction({ allowedOperations: [] })],
    });
    const store = createStore();
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: {},
      requests: { [request.requestId]: request },
      username: null,
    });

    function Wrapper() {
      useHydrateAtoms([[routesAtom, mergeRoutes()]], { store });
      return <RequestActionButtons requestId={request.requestId} grantNumber={request.grantNumber} />;
    }
    render(
      <Provider store={store}>
        <Wrapper />
      </Provider>,
    );

    const button = screen.getByRole("button", { name: /Extend End Date/ });
    await user.click(button);

    expect(store.get(apiStateAtom).requests[request.requestId].showActionsModal).toBe(true);
  });

  it("links Submit Final Report to the new-action route with the Final Report action type", () => {
    const request = makeRequest({
      allowedActions: { "Final Report": { name: "Final Report", resources: [] } } as AllowedActionsMap,
      actions: [makeAction({ allowedOperations: [] })],
    });
    renderButtons(request);

    const link = screen.getByRole("link", { name: /Submit Final Report/ });
    expect(link).toHaveAttribute(
      "href",
      "https://allocations.access-ci.org/requests/42/actions/new?action_type=Final+Report",
    );
  });

  it("shows Edit and Delete for the request-level action when allowed, and Delete toggles that action's delete modal", async () => {
    const user = userEvent.setup();
    const request = makeRequest({
      actions: [makeAction({ actionId: 5, isRequest: true, allowedOperations: ["Edit", "Delete"] })],
    });
    const store = createStore();
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: {},
      requests: { [request.requestId]: request },
      username: null,
    });

    function Wrapper() {
      useHydrateAtoms([[routesAtom, mergeRoutes()]], { store });
      return <RequestActionButtons requestId={request.requestId} grantNumber={request.grantNumber} />;
    }
    render(
      <Provider store={store}>
        <Wrapper />
      </Provider>,
    );

    const editLink = screen.getByRole("link", { name: /^Edit$/ });
    expect(editLink).toHaveAttribute("href", "/requests/42/edit");

    const deleteButton = screen.getByRole("button", { name: /Delete/ });
    await user.click(deleteButton);

    expect(
      store.get(apiStateAtom).requests[request.requestId].actions[0].showDeleteModal,
    ).toBe(true);
  });

  it("renders nothing when there is no request-level action and no allowed actions", () => {
    const request = makeRequest({ actions: [makeAction({ isRequest: false, allowedOperations: [] })] });
    const { container } = renderButtons(request);
    expect(container).toBeEmptyDOMElement();
  });
});
