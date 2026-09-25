import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { mergeRoutes, routesAtom } from "@/shared/routes";
import ActionTitle from "./ActionTitle";
import type { Action, Request } from "./types";

function Wrapper({ store, ...props }: { store: ReturnType<typeof createStore> } & React.ComponentProps<typeof ActionTitle>) {
  useHydrateAtoms([[routesAtom, mergeRoutes()]], { store });
  return (
    <Provider store={store}>
      <ActionTitle {...props} />
    </Provider>
  );
}

function makeAction(overrides: Partial<Action> = {}): Action {
  return {
    actionId: 1,
    allowedOperations: [],
    detailAvailable: true,
    date: "2024-03-15",
    deleteStatus: null,
    isRequest: false,
    resources: [],
    showDeleteModal: false,
    status: "Approved",
    type: "Renewal",
    ...overrides,
  };
}

function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    actions: [],
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

// ActionTitle (src/projects/ActionTitle.tsx) formats "<type>: <date>" and
// conditionally wraps it as a link, then appends Edit/Delete InlineButtons
// gated on `allowedOperations`, and unconditionally suppresses both when the
// action is an Exchange/Transfer regardless of what allowedOperations says.
describe("ActionTitle", () => {
  it("links the title to the action detail page when detailAvailable", () => {
    const store = createStore();
    const action = makeAction();
    const request = makeRequest();
    render(<Wrapper store={store} action={action} request={request} toggleDeleteModal={() => {}} />);

    const link = screen.getByText("Renewal: Mar 15, 2024");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "https://allocations.access-ci.org/requests/42/actions/1");
  });

  it("renders plain text (no link) when detail is unavailable", () => {
    const store = createStore();
    const action = makeAction({ detailAvailable: false });
    const request = makeRequest();
    render(<Wrapper store={store} action={action} request={request} toggleDeleteModal={() => {}} />);

    const text = screen.getByText("Renewal: Mar 15, 2024");
    expect(text.tagName).not.toBe("A");
  });

  // Both buttons are icon-only (InlineButton renders just the Lucide icon),
  // so `title` is their entire accessible name - which is why each one having
  // its own is worth asserting. Edit renders as a link, Delete as a button.
  it("shows Edit and Delete buttons when allowed, and Delete calls toggleDeleteModal with the action id", async () => {
    const user = userEvent.setup();
    const store = createStore();
    const action = makeAction({ allowedOperations: ["Edit", "Delete"], actionId: 7, isRequest: true });
    const request = makeRequest({ requestId: 99 });
    const toggleDeleteModal = vi.fn();
    render(<Wrapper store={store} action={action} request={request} toggleDeleteModal={toggleDeleteModal} />);

    const editLink = screen.getByTitle("Edit action");
    expect(editLink.tagName).toBe("A");
    expect(editLink).toHaveAttribute("href", "/requests/99/edit");

    const deleteButton = screen.getByTitle("Delete action");
    expect(deleteButton.tagName).toBe("BUTTON");

    await user.click(deleteButton);
    expect(toggleDeleteModal).toHaveBeenCalledWith(7);
  });

  it("suppresses Edit/Delete buttons for Exchange and Transfer actions even when allowedOperations includes them", () => {
    const store = createStore();
    const action = makeAction({ type: "Exchange", allowedOperations: ["Edit", "Delete"] });
    const request = makeRequest();
    render(<Wrapper store={store} action={action} request={request} toggleDeleteModal={() => {}} />);

    expect(screen.queryByTitle("Edit action")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Delete action")).not.toBeInTheDocument();
  });
});
