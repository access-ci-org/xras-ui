import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { mergeRoutes, routesAtom } from "@/shared/routes";
import OverviewResources from "./OverviewResources";
import { apiStateAtom } from "./atoms";
import type { Project, Request as RequestType, Resource } from "./types";

const GRANT = "TEST000001";
const REQUEST_ID = 555;
const COMPUTE_ID = 101;

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    allocated: 1000,
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
    requested: 1000,
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

function renderOverview(resource: Resource) {
  const store = createStore();
  store.set(routesAtom, mergeRoutes());
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
        tab: "overview",
        title: "Test Project",
        users: [],
        usersNewRowIndex: -1,
        usersStatus: null,
      } satisfies Project,
    },
    requests: {
      [REQUEST_ID]: {
        actions: [],
        allocationType: "Pilot",
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
        resources: [resource],
        resourcesReason: "",
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
        usesCredits: false,
      } satisfies RequestType,
    },
    username: "ada",
    fundingAgencies: [],
    fosTypes: [],
  });
  return render(
    <Provider store={store}>
      <OverviewResources requestId={REQUEST_ID} grantNumber={GRANT} />
    </Provider>,
  );
}

// The Balance column is the one place on the default tab that states how much
// of an allocation is left, so a resource that doesn't report usage
// (`used: null`, from `reportsUsage: false`) mustn't read as untouched.
describe("OverviewResources Balance column", () => {
  it("shows the remaining balance for a resource that reports usage", () => {
    renderOverview(makeResource({ used: 250 }));
    expect(screen.getByRole("cell", { name: /remaining/ })).toHaveTextContent(
      "750 of 1.00K Core Hours remaining (75%)",
    );
  });

  it("shows only the allocation when the resource doesn't report usage", () => {
    renderOverview(makeResource({ used: null }));
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /allocated/ })).toHaveTextContent(
      "1.00K Core Hours allocated",
    );
    expect(screen.getByRole("cell", { name: /allocated/ })).not.toHaveTextContent("not reported");
  });
});
