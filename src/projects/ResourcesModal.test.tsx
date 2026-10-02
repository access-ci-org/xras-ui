import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { mergeRoutes, routesAtom } from "@/shared/routes";
import ResourcesModal from "./ResourcesModal";
import { apiStateAtom } from "./atoms";
import type { Project, Request as RequestType, Resource } from "./types";

const GRANT = "TEST000001";
const REQUEST_ID = 555;
const ACTIONS_URL = "https://example.test/requests/555/actions";

const resource: Resource = {
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
  isNew: false,
  minimumExchange: 0,
  name: "Compute Resource",
  negativeOnly: false,
  questions: [],
  requires: [],
  resourceProvider: { name: "Example Org" },
  requested: 150,
  resourceId: 101,
  resourceRepositoryKey: "compute.example",
  startDate: null,
  type: "Compute",
  unit: "Core Hours",
  used: 0,
  userGuideUrl: null,
};

const request: RequestType = {
  actions: [],
  allocationType: "Explore",
  allowedActions: { Exchange: { name: "Exchange", resources: [resource] } },
  endDate: null,
  entryDate: "2026-01-01",
  exchangeActionId: null,
  exchangeActionEditable: true,
  exchangeErrors: [],
  exchangeStatus: null,
  grantNumber: GRANT,
  isMaximize: false,
  requestId: REQUEST_ID,
  resources: [resource],
  resourcesReason: "Because science.",
  returnedForCorrections: false,
  returnedForCorrectionsNotes: "",
  showActionsModal: false,
  showConfirmModal: false,
  showResourcesModal: true,
  startDate: null,
  status: "Active",
  timeStatus: "current",
  type: "New",
  usageDetail: null,
  usageDetailStatus: null,
  usesCredits: true,
};

function renderModal() {
  const store = createStore();
  store.set(routesAtom, { ...mergeRoutes(), request_actions_path: () => ACTIONS_URL });
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
      } satisfies Project,
    },
    requests: { [REQUEST_ID]: request },
    username: "ada",
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <ResourcesModal requestId={REQUEST_ID} grantNumber={GRANT} />
      </Provider>,
    ),
  };
}

describe("ResourcesModal submission", () => {
  // The duplicate-exchange bug: the Submit button stayed live for the whole
  // round trip, so a second click POSTed a second exchange action.
  it("stays open with a disabled, busy Submit button until the save completes", async () => {
    let posts = 0;
    let respond!: () => void;
    const responded = new Promise<void>((resolve) => (respond = resolve));
    server.use(
      http.post(`${ACTIONS_URL}.json`, async () => {
        posts++;
        await responded;
        return HttpResponse.json({ actionId: 777, errors: [] });
      }),
    );

    const user = userEvent.setup();
    const { store } = renderModal();
    await user.click(screen.getByRole("button", { name: "Submit" }));

    const busy = screen.getByRole("button", { name: "Submitting..." });
    expect(busy).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continue Editing" })).toBeDisabled();

    // Neither a second click nor Escape gets through while the save is in flight.
    await user.click(busy);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(store.get(apiStateAtom).requests[REQUEST_ID].showResourcesModal).toBe(true);

    respond();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(posts).toBe(1);
    expect(store.get(apiStateAtom).requests[REQUEST_ID].exchangeStatus).toBe("success");
  });
});
