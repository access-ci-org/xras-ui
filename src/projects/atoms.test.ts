import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import {
  addResourceAtom,
  addUserAtom,
  apiStateAtom,
  closeGrantModalAtom,
  closeUsageDetailModalAtom,
  deleteActionAtom,
  editGrantAtom,
  errorAtom,
  fetchProjectDetailAtom,
  fetchProjectsListAtom,
  fetchRequestDetailAtom,
  fetchUsageDetailAtom,
  projectListLoadingAtom,
  projectsListAtom,
  resetResourcesAtom,
  resetUsersAtom,
  saveGrantAtom,
  saveResourcesAtom,
  saveUsersAtom,
  searchUsersAtom,
  setRequestAtom,
  setResourceQuestionValuesAtom,
  setResourceRequestAtom,
  setResourcesReasonAtom,
  setTabAtom,
  setUserRoleAtom,
  statuses,
  toggleActionsModalAtom,
  toggleConfirmModalAtom,
  toggleDeleteModalAtom,
  toggleResourcesModalAtom,
  toggleUsersResourcesAtom,
  usernameAtom,
  type GrantEdits,
} from "@/projects/atoms";
import type { Action, Grant, Project, Request, Resource, User } from "@/projects/types";

// ---------------------------------------------------------------------------
// Fixture builders for the already-transformed shapes stored in
// `apiStateAtom` (as opposed to the raw XRAS API shapes `addProject`/
// `addRequest`/`makeResource` consume - see the "fetchProjectsListAtom" describe
// block below for a raw-shape fixture that exercises that transform
// end-to-end). Each returns a complete object satisfying its type so tests
// only need to override the one or two fields the behavior under test
// actually cares about.
// ---------------------------------------------------------------------------

function makeResourceFixture(overrides: Partial<Resource> = {}): Resource {
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
    isNew: false,
    minimumExchange: 0,
    name: "Compute Resource",
    negativeOnly: false,
    questions: [],
    requires: [],
    resourceProvider: { name: "Example Org" },
    requested: 100,
    resourceId: 101,
    resourceRepositoryKey: "compute.example",
    startDate: null,
    type: "Compute",
    unit: "Core Hours",
    used: 0,
    userGuideUrl: null,
    ...overrides,
  };
}

function makeUserFixture(overrides: Partial<User> = {}): User {
  return {
    // types.ts declares `eligibility: string`, but every real producer of a
    // User (addProject below, searchUsersAtom) actually assigns the raw
    // `isEligible`/`is_eligible` *boolean* - see the bug noted in this file's
    // final report. Using a string here just satisfies the declared type for
    // fixtures that don't exercise that field.
    eligibility: "true",
    email: "user@example.test",
    firstName: "Test",
    initialResourceIds: [],
    initialRole: "user",
    lastName: "User",
    organization: "Example Org",
    resourceAccountPendingIds: [],
    resourceAccountInactiveIds: [],
    resourceIds: [],
    resourceUsernames: {},
    role: "user",
    username: "testuser",
    hasChanges: false,
    isNew: false,
    ...overrides,
  };
}

function makeActionFixture(overrides: Partial<Action> = {}): Action {
  return {
    actionId: 1,
    allowedOperations: [],
    detailAvailable: true,
    date: "2025-01-01",
    deleteStatus: null,
    isRequest: true,
    resources: [],
    showDeleteModal: false,
    status: "Approved",
    type: "Maximize",
    ...overrides,
  };
}

function makeGrantFixture(overrides: Partial<Grant> = {}): Grant {
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
    comments: null,
    primaryFosTypeId: 5,
    primaryFosType: "Computer Science",
    ...overrides,
  };
}

function makeRequestFixture(overrides: Partial<Request> = {}): Request {
  return {
    actions: [],
    allocationType: "Maximize",
    allowedActions: {},
    endDate: "2026-12-31",
    entryDate: "2025-01-01",
    exchangeActionId: null,
    exchangeActionEditable: true,
    exchangeErrors: [],
    exchangeStatus: null,
    grantNumber: "ABC123",
    isMaximize: true,
    requestId: 555,
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
    type: "Maximize",
    usageDetail: null,
    usageDetailStatus: null,
    usesCredits: false,
    ...overrides,
  };
}

function makeProjectFixture(overrides: Partial<Project> = {}): Project {
  return {
    currentRequestId: 555,
    grantNumber: "ABC123",
    isManager: true,
    requestsList: [],
    selectedRequestId: 555,
    status: "Active",
    tab: "overview",
    title: "Test Project",
    users: [],
    usersNewRowIndex: 0,
    usersStatus: null,
    ...overrides,
  };
}

function seedState(overrides: {
  projects?: Record<string, Project>;
  requests?: Record<string, Request>;
  username?: string | null;
}) {
  return {
    error: null,
    projectsList: [],
    projectListLoading: false,
    projects: {},
    requests: {},
    username: null,
    ...overrides,
  };
}

// `searchUsersAtom` and `fetchProjectsListAtom` (src/projects/atoms.ts) are
// plain jotai write atoms that read their URLs from `get(routesAtom)`, so -
// like src/resource-catalog/atoms.test.ts and src/publications/atoms.test.ts
// - they can be driven with a bare `createStore()` and no React involved.
// This is task #2 of the routes-injection refactor: the projects feature's
// atoms used to read the `config.routes` singleton (mutated in place by
// `addRoutes()`, called from the `projects` mount function in src/main.jsx),
// which meant two mounted widgets on the same page could clobber each
// other's routes. Hydrating `routesAtom` per store (see src/shared/routes.ts)
// fixes that; these tests are the regression coverage for it.
describe("routesAtom hydration (projects)", () => {
  it("a route hydrated onto the store wins over the default route table", async () => {
    server.use(
      http.get("https://example.test/hydrated/people", () =>
        HttpResponse.json([
          {
            eligible_reason: null,
            email: "ada@example.test",
            first_name: "Ada",
            is_eligible: true,
            last_name: "Lovelace",
            username: "ada",
            organization: "Example University",
          },
        ]),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      search_people_path: () => "https://example.test/hydrated/people",
    });

    const found = await store.set(searchUsersAtom, "ada");

    expect(found).toEqual([
      {
        eligibility: true,
        eligibilityReason: null,
        email: "ada@example.test",
        firstName: "Ada",
        lastName: "Lovelace",
        username: "ada",
        organization: "Example University",
      },
    ]);
  });

  // This is the regression test for the actual bug the atom fixes: with the
  // old `config.routes` singleton, whichever mount called `addRoutes()` last
  // won for every mount on the page, because there was exactly one
  // `config.routes` object. `routesAtom`'s value lives in whichever jotai
  // store reads/writes it, so two independent stores hydrated with different
  // routes must each fetch their own URL, with no bleed between them.
  it("isolates routes between two independent stores", async () => {
    server.use(
      http.get("https://example.test/store-a/people", () =>
        HttpResponse.json([
          {
            eligible_reason: null,
            email: "a@example.test",
            first_name: "Store",
            is_eligible: true,
            last_name: "A",
            username: "store-a",
            organization: "A University",
          },
        ]),
      ),
      http.get("https://example.test/store-b/people", () =>
        HttpResponse.json([
          {
            eligible_reason: null,
            email: "b@example.test",
            first_name: "Store",
            is_eligible: true,
            last_name: "B",
            username: "store-b",
            organization: "B University",
          },
        ]),
      ),
    );

    const storeA = createStore();
    storeA.set(routesAtom, {
      ...defaultRoutes,
      search_people_path: () => "https://example.test/store-a/people",
    });

    const storeB = createStore();
    storeB.set(routesAtom, {
      ...defaultRoutes,
      search_people_path: () => "https://example.test/store-b/people",
    });

    const [foundA, foundB] = await Promise.all([
      storeA.set(searchUsersAtom, "x"),
      storeB.set(searchUsersAtom, "x"),
    ]);

    expect(foundA.map((user) => user.username)).toEqual(["store-a"]);
    expect(foundB.map((user) => user.username)).toEqual(["store-b"]);

    // Order shouldn't matter either: re-run storeA after storeB has already
    // set its own route, to rule out one store's `set` mutating the other's.
    const foundAAgain = await storeA.set(searchUsersAtom, "x");
    expect(foundAAgain.map((user) => user.username)).toEqual(["store-a"]);
  });

  // `projects_path` is one of the routes that already ships in
  // `defaultRoutes` (src/shared/routes.ts), unlike `search_people_path`'s
  // override above. An un-hydrated store's `routesAtom` should still resolve
  // it to that default, not throw or hit a stale route.
  it("falls back to the default route table when nothing is hydrated", async () => {
    server.use(
      http.get(`${defaultRoutes.projects_path()}.json`, () => HttpResponse.json({ result: [] })),
    );

    const store = createStore();
    await store.set(fetchProjectsListAtom, "ada");

    expect(store.get(errorAtom)).toBeNull();
    expect(store.get(projectsListAtom)).toEqual([]);
  });

  it("records an error and clears loading when the projects list request fails", async () => {
    server.use(
      http.get(`${defaultRoutes.projects_path()}.json`, () => new HttpResponse(null, { status: 500 })),
    );

    const store = createStore();
    await store.set(fetchProjectsListAtom, "ada");

    expect(store.get(errorAtom)).toBe("Failed to load project list.");
    expect(store.get(projectListLoadingAtom)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fetchProjectsListAtom: the raw-API-shape transform (addProject/addRequest/
// makeResource/makeAllowedActionsMap). This is the highest-value untested
// logic in the module - it's a substantial, hand-rolled reshape of the XRAS
// API's response into the UI's `Project`/`Request`/`Resource` shapes, with no
// other coverage anywhere in the test suite.
// ---------------------------------------------------------------------------
describe("fetchProjectsListAtom (raw API shape transform)", () => {
  function rawResource(overrides: Record<string, unknown> = {}) {
    return {
      allocationState: "active",
      amountAllocated: 1000,
      amountApproved: 1000,
      amountRequested: 1000,
      amountUsed: 200,
      attributeSets: [],
      baseExchangeRate: 1,
      currentExchangeRate: 1,
      currentExchangeRateEndDate: null,
      currentExchangeRateType: null,
      dependentResourceXrasIds: [],
      displayResourceName: "Compute Resource ",
      endDate: "2026-12-31",
      exchangeRate: 1,
      minimumExchange: 1,
      organizationId: 1,
      organizationFaviconUrl: null,
      organizationName: "Example Org",
      resourceRepositoryKey: "compute.example",
      resourceType: "Compute",
      startDate: "2025-01-01",
      unitType: "Core Hours",
      userGuideUrl: null,
      xrasResourceId: 101,
      ...overrides,
    };
  }

  function rawCreditResource(overrides: Record<string, unknown> = {}) {
    return rawResource({
      amountAllocated: 500,
      amountRequested: 500,
      displayResourceName: "Credit Equivalents",
      resourceRepositoryKey: undefined,
      unitType: "ACCESS Credits",
      xrasResourceId: 999,
      ...overrides,
    });
  }

  function rawProject(overrides: Record<string, unknown> = {}) {
    return {
      grantNumber: "ABC123",
      projectManager: true,
      requestMasterId: "RM-1",
      title: "Test Project",
      requests: [
        {
          actions: [
            {
              actionId: 1,
              actionStatusType: "Approved",
              actionType: "Maximize",
              allowedOperations: ["Delete"],
              approvedStartDate: null,
              detailAvailable: true,
              entryDate: "2025-01-02T00:00:00Z",
              isRequest: true,
              requestedStartDate: null,
              resources: [rawResource(), rawCreditResource()],
            },
          ],
          allocationType: "Maximize",
          allowedActions: [],
          endDate: "2026-12-31",
          requestId: 555,
          requestType: "Maximize",
          resources: [rawResource(), rawCreditResource()],
          startDate: "2025-01-01",
          status: "Active",
          timeStatus: "current",
        },
      ],
      users: [
        {
          eligibleReason: null,
          email: "ghopper@example.test",
          firstName: "Grace",
          isEligible: true,
          lastName: "Hopper",
          organization: "Example Org",
          resources: [
            {
              userAccountState: "active",
              unitType: "Core Hours",
              resourceProviderState: "active",
              xrasResourceId: 101,
              resourceUsername: "ghopper",
            },
          ],
          role: "pi",
          username: "ghopper",
        },
      ],
      ...overrides,
    };
  }

  it("transforms a full raw project/request/resource payload into apiStateAtom", async () => {
    server.use(
      http.get(`${defaultRoutes.projects_path()}.json`, () =>
        HttpResponse.json({ result: [rawProject()] }),
      ),
    );

    const store = createStore();
    await store.set(fetchProjectsListAtom, "ghopper");

    expect(store.get(usernameAtom)).toBe("ghopper");
    expect(store.get(projectsListAtom)).toEqual([
      { grantNumber: "ABC123", status: "Active", title: "Test Project" },
    ]);

    const project = store.get(apiStateAtom).projects["ABC123"];
    expect(project.currentRequestId).toBe(555);
    expect(project.selectedRequestId).toBe(555);
    expect(project.isManager).toBe(true);
    expect(project.tab).toBe("overview");
    expect(project.currentUser?.username).toBe("ghopper");

    const user = project.users.find((u) => u.username === "ghopper")!;
    expect(user.resourceIds).toEqual([101]);
    expect(user.initialResourceIds).toEqual([101]);
    expect(user.initialRole).toBe("pi");

    const request = store.get(apiStateAtom).requests[555];
    expect(request.grantNumber).toBe("ABC123");
    expect(request.usesCredits).toBe(false); // "Maximize" isn't Explore/Discover/Accelerate
    expect(request.exchangeActionId).toBeNull(); // no Submitted/Under Review/Incomplete Exchange action
    expect(request.returnedForCorrections).toBe(false);
    expect(request.resources.map((r) => r.resourceId).sort()).toEqual([101, 999]);

    const compute = request.resources.find((r) => r.resourceId === 101)!;
    expect(compute.allocated).toBe(1000);
    expect(compute.used).toBe(200);
    expect(compute.isCredit).toBe(false);
    expect(compute.name).toBe("Compute Resource"); // trimmed

    const credit = request.resources.find((r) => r.resourceId === 999)!;
    expect(credit.isCredit).toBe(true);
    expect(credit.isBoolean).toBe(false);

    const action = request.actions[0];
    expect(action.date).toBe("2025-01-02"); // entryDate's date portion
    expect(action.resources.map((r) => r.resourceId).sort()).toEqual([101, 999]);
  });

  it("defaults negativeOnly to false and leaves the optional API flags unset when omitted", async () => {
    server.use(
      http.get(`${defaultRoutes.projects_path()}.json`, () =>
        HttpResponse.json({ result: [rawProject()] }),
      ),
    );

    const store = createStore();
    await store.set(fetchProjectsListAtom, "ghopper");

    const state = store.get(apiStateAtom);
    // `negativeOnly` is defaulted rather than left undefined, so every consumer
    // can treat it as a boolean (see `makeResource`).
    expect(state.requests[555].resources.every((r) => r.negativeOnly === false)).toBe(true);
    expect(state.projects["ABC123"].internationalUserRequests).toBeNull();
    expect(state.projects["ABC123"].users[0].canChangeRoles).toBeUndefined();
  });

  it("carries negativeOnly, canChangeRoles and internationalUserRequests through the transform", async () => {
    const project = rawProject({
      grantNumber: "DEF456",
      internationalUserRequests: [
        { id: 9, requestId: 555, status: "Incomplete", submittedAt: null },
      ],
      requests: [
        {
          actions: [
            {
              actionId: 1,
              actionStatusType: "Approved",
              actionType: "Maximize",
              allowedOperations: [],
              approvedStartDate: null,
              detailAvailable: true,
              entryDate: "2025-01-02T00:00:00Z",
              isRequest: true,
              requestedStartDate: null,
              resources: [rawResource({ negativeOnly: true }), rawCreditResource()],
            },
          ],
          allocationType: "Maximize",
          allowedActions: [],
          endDate: "2026-12-31",
          requestId: 557,
          requestType: "Maximize",
          resources: [rawResource({ negativeOnly: true }), rawCreditResource()],
          startDate: "2025-01-01",
          status: "Active",
          timeStatus: "current",
        },
      ],
      users: [
        {
          canChangeRoles: false,
          eligibleReason: null,
          email: "ada@example.test",
          firstName: "Ada",
          isEligible: true,
          lastName: "Lovelace",
          organization: "Example Org",
          resources: [],
          role: "pi",
          username: "alovelace",
        },
      ],
    });

    server.use(
      http.get(`${defaultRoutes.projects_path()}.json`, () =>
        HttpResponse.json({ result: [project] }),
      ),
    );

    const store = createStore();
    await store.set(fetchProjectsListAtom, "alovelace");

    const state = store.get(apiStateAtom);
    expect(state.requests[557].resources.find((r) => r.resourceId === 101)!.negativeOnly).toBe(true);
    expect(state.projects["DEF456"].users[0].canChangeRoles).toBe(false);
    expect(state.projects["DEF456"].internationalUserRequests).toEqual([
      { id: 9, requestId: 555, status: "Incomplete", submittedAt: null },
    ]);
  });

  // The request's own resource list doesn't carry `negativeOnly`; only the
  // Exchange action's resource list does, and `addRequest` copies it across
  // (alongside `questions` and `requires`).
  it("copies negativeOnly from the Exchange allowedAction onto a resource already in the request", async () => {
    const project = rawProject({
      grantNumber: "GHI789",
      requests: [
        {
          actions: [
            {
              actionId: 1,
              actionStatusType: "Approved",
              actionType: "Maximize",
              allowedOperations: [],
              approvedStartDate: null,
              detailAvailable: true,
              entryDate: "2025-01-02T00:00:00Z",
              isRequest: true,
              requestedStartDate: null,
              resources: [rawResource(), rawCreditResource()],
            },
          ],
          allocationType: "Maximize",
          allowedActions: [
            {
              actionType: "Exchange",
              allowedResources: [rawResource({ negativeOnly: true }), rawCreditResource()],
            },
          ],
          endDate: "2026-12-31",
          requestId: 558,
          requestType: "Maximize",
          resources: [rawResource(), rawCreditResource()],
          startDate: "2025-01-01",
          status: "Active",
          timeStatus: "current",
        },
      ],
    });

    server.use(
      http.get(`${defaultRoutes.projects_path()}.json`, () =>
        HttpResponse.json({ result: [project] }),
      ),
    );

    const store = createStore();
    await store.set(fetchProjectsListAtom, "ghopper");

    const request = store.get(apiStateAtom).requests[558];
    expect(request.resources.find((r) => r.resourceId === 101)!.negativeOnly).toBe(true);
    expect(request.resources.find((r) => r.resourceId === 999)!.negativeOnly).toBe(false);
  });

  it("computes projectStatus from requests, and detects an in-flight exchange action", async () => {
    const exchangeProject = rawProject({
      grantNumber: "XYZ789",
      requests: [
        {
          actions: [
            {
              actionId: 2,
              actionStatusType: "Under Review",
              actionType: "Exchange",
              allowedOperations: [],
              approvedStartDate: null,
              detailAvailable: true,
              entryDate: "2025-02-01T00:00:00Z",
              isRequest: false,
              requestedStartDate: null,
              resources: [rawResource({ xrasResourceId: 202, amountAllocated: 50, amountRequested: 80 })],
            },
          ],
          allocationType: "Maximize",
          allowedActions: [],
          endDate: "2026-12-31",
          requestId: 556,
          requestType: "Maximize",
          resources: [rawResource(), rawCreditResource()],
          startDate: "2025-01-01",
          status: "Active",
          timeStatus: "current",
        },
      ],
    });

    server.use(
      http.get(`${defaultRoutes.projects_path()}.json`, () =>
        HttpResponse.json({ result: [exchangeProject] }),
      ),
    );

    const store = createStore();
    await store.set(fetchProjectsListAtom, "ghopper");

    const request = store.get(apiStateAtom).requests[556];
    // The pending Exchange action (status "Under Review") should be detected
    // and its resource merged/added into request.resources.
    expect(request.exchangeActionId).toBe(2);
    expect(request.exchangeActionEditable).toBe(false); // only "Incomplete" is editable
    expect(request.resources.some((r) => r.resourceId === 202)).toBe(true);
  });
});

describe("fetchProjectDetailAtom / fetchRequestDetailAtom", () => {
  it("records a load failure on the given project without touching others", () => {
    const store = createStore();
    const otherProject = makeProjectFixture({ grantNumber: "OTHER" });
    store.set(apiStateAtom, seedState({ projects: { OTHER: otherProject } }));

    store.set(fetchProjectDetailAtom, "ABC123");

    const state = store.get(apiStateAtom);
    expect(state.projects["ABC123"].error).toBe("Failed to load project data.");
    expect(state.projects["OTHER"]).toBe(otherProject); // untouched, same reference
  });

  it("records a load failure on the given request without touching others", () => {
    const store = createStore();
    const otherRequest = makeRequestFixture({ requestId: 999 });
    store.set(apiStateAtom, seedState({ requests: { 999: otherRequest } }));

    store.set(fetchRequestDetailAtom, 555);

    const state = store.get(apiStateAtom);
    expect(state.requests[555].error).toBe("Failed to load request data.");
    expect(state.requests[999]).toBe(otherRequest); // untouched, same reference
  });
});

describe("fetchUsageDetailAtom", () => {
  function seedWithRequest(store: ReturnType<typeof createStore>) {
    const request = makeRequestFixture();
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));
    return request;
  }

  it("transitions pending -> success and stores the fetched usage detail", async () => {
    server.use(
      http.get("https://example.test/usage/ABC123/compute.example.json", () =>
        HttpResponse.json({ usage: { projectTitle: "Test Project", users: [] } }),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      usage_detail_path: () => "https://example.test/usage/ABC123/compute.example",
    });
    seedWithRequest(store);

    const pending = store.set(fetchUsageDetailAtom, {
      grantNumber: "ABC123",
      requestId: 555,
      resourceRepositoryKey: "compute.example",
    });
    // The synchronous part of the write atom (setting the pending status)
    // runs before the first `await`, so it's already visible without
    // awaiting the returned promise.
    expect(store.get(apiStateAtom).requests[555].usageDetailStatus).toBe("pending");

    await pending;

    const request = store.get(apiStateAtom).requests[555];
    expect(request.usageDetailStatus).toBe("success");
    expect(request.usageDetail).toEqual({ projectTitle: "Test Project", users: [] });
  });

  it("records an error status and leaves usageDetail alone on a failed response", async () => {
    server.use(
      http.get("https://example.test/usage/ABC123/compute.example.json", () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      usage_detail_path: () => "https://example.test/usage/ABC123/compute.example",
    });
    seedWithRequest(store);

    await store.set(fetchUsageDetailAtom, {
      grantNumber: "ABC123",
      requestId: 555,
      resourceRepositoryKey: "compute.example",
    });

    const request = store.get(apiStateAtom).requests[555];
    expect(request.usageDetailStatus).toBe("error");
    expect(request.usageDetail).toBeNull();
  });
});

describe("deleteActionAtom", () => {
  it("does nothing (not even an update) when the action doesn't allow Delete", async () => {
    const store = createStore();
    const action = makeActionFixture({ actionId: 1, allowedOperations: [] });
    const request = makeRequestFixture({ actions: [action] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    const before = store.get(apiStateAtom);
    await store.set(deleteActionAtom, { actionId: 1, requestId: 555 });

    // No fetch was even attempted (no MSW handler registered, and the
    // catch-all in src/test/msw.ts would fail the test if one were
    // attempted), and the state object is the exact same reference: the
    // guard returns before `update()` ever runs.
    expect(store.get(apiStateAtom)).toBe(before);
  });

  it("marks a deleted request action as deleted in place, without mutating the previous state", async () => {
    server.use(
      http.post("https://example.test/requests/555/actions/1", () => HttpResponse.json({})),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      request_action_path: () => "https://example.test/requests/555/actions/1",
    });
    const action = makeActionFixture({
      actionId: 1,
      allowedOperations: ["Delete"],
      isRequest: true,
      showDeleteModal: true,
    });
    const request = makeRequestFixture({ actions: [action] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));
    const previousActions = request.actions;

    await store.set(deleteActionAtom, { actionId: 1, requestId: 555 });

    const updatedRequest = store.get(apiStateAtom).requests[555];
    expect(updatedRequest.error).toBe("This request has been deleted.");
    expect(updatedRequest.actions[0].allowedOperations).toEqual([]);
    expect(updatedRequest.actions[0].deleteStatus).toBe("success");
    expect(updatedRequest.actions[0].showDeleteModal).toBe(false);
    // The old action object/array must be untouched by the immer update.
    expect(previousActions[0].allowedOperations).toEqual(["Delete"]);
    expect(previousActions[0].deleteStatus).toBeNull();
  });

  it("removes a deleted non-request action from the actions list, leaving others alone", async () => {
    server.use(
      http.post("https://example.test/requests/555/actions/2", () => HttpResponse.json({})),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      request_action_path: () => "https://example.test/requests/555/actions/2",
    });
    const keptAction = makeActionFixture({ actionId: 1, allowedOperations: [] });
    const deletedAction = makeActionFixture({
      actionId: 2,
      allowedOperations: ["Delete"],
      isRequest: false,
    });
    const request = makeRequestFixture({ actions: [keptAction, deletedAction] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    await store.set(deleteActionAtom, { actionId: 2, requestId: 555 });

    const updatedRequest = store.get(apiStateAtom).requests[555];
    expect(updatedRequest.actions.map((a) => a.actionId)).toEqual([1]);
    expect(request.actions.map((a) => a.actionId)).toEqual([1, 2]); // previous state untouched
  });

  it("sets deleteStatus to error on a failed delete request", async () => {
    server.use(
      http.post("https://example.test/requests/555/actions/1", () => new HttpResponse(null, { status: 500 })),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      request_action_path: () => "https://example.test/requests/555/actions/1",
    });
    const action = makeActionFixture({ actionId: 1, allowedOperations: ["Delete"] });
    const request = makeRequestFixture({ actions: [action] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    await store.set(deleteActionAtom, { actionId: 1, requestId: 555 });

    const updatedRequest = store.get(apiStateAtom).requests[555];
    expect(updatedRequest.actions[0].deleteStatus).toBe("error");
    expect(updatedRequest.actions[0].allowedOperations).toEqual(["Delete"]); // unchanged
  });
});

describe("saveResourcesAtom", () => {
  function makeExchangeRequest(overrides: Partial<Request> = {}) {
    const changed = makeResourceFixture({
      resourceId: 101,
      allocated: 100,
      requested: 150,
      isFake: false,
      questions: [
        {
          attributeSetId: 1,
          attributes: [{ resourceAttributeId: 10, required: false, label: "Choice" }],
          fieldType: "single_sel",
          label: "Choice",
          resourceId: 101,
          values: [5],
        },
      ],
    });
    const unchangedCredit = makeResourceFixture({
      resourceId: 999,
      isCredit: true,
      allocated: 500,
      requested: 500,
    });
    return makeRequestFixture({
      resources: [changed, unchangedCredit],
      allowedActions: {
        Exchange: { name: "Exchange", resources: [], opportunityId: 1, opportunityName: "Opportunity" },
      },
      showResourcesModal: true,
      ...overrides,
    });
  }

  it("creates a new exchange action and records success", async () => {
    server.use(
      http.post("https://example.test/requests/555/actions.json", async ({ request }) => {
        const body = (await request.json()) as any;
        // The changed resource's amount and its answered question should be
        // in the outgoing payload.
        expect(body.requested_resources[101]).toEqual({ resource_id: 101, requested: 1, amount: 50 });
        expect(body.requested_resources[999]).toBeUndefined(); // unchanged, not sent
        expect(body.request_action.resource_attributes[10]).toEqual({ resource_attribute_id: 5 });
        return HttpResponse.json({ actionId: 777, errors: [] });
      }),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      request_actions_path: () => "https://example.test/requests/555/actions",
    });
    store.set(apiStateAtom, seedState({ requests: { 555: makeExchangeRequest() } }));

    await store.set(saveResourcesAtom, { requestId: 555 });

    const request = store.get(apiStateAtom).requests[555];
    expect(request.exchangeActionId).toBe(777);
    expect(request.exchangeActionEditable).toBe(false);
    expect(request.exchangeErrors).toEqual([]);
    expect(request.exchangeStatus).toBe("success");
    expect(request.showResourcesModal).toBe(false);
  });

  it("records an edit failure with the server's errors, using PUT for an existing exchange action", async () => {
    server.use(
      http.put("https://example.test/requests/555/actions/100.json", () =>
        HttpResponse.json({ errors: ["Insufficient allocation"], actionId: null }, { status: 422 }),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      request_action_path: () => "https://example.test/requests/555/actions/100",
    });
    store.set(
      apiStateAtom,
      seedState({
        requests: { 555: makeExchangeRequest({ exchangeActionId: 100, exchangeActionEditable: false }) },
      }),
    );

    await store.set(saveResourcesAtom, { requestId: 555 });

    const request = store.get(apiStateAtom).requests[555];
    expect(request.exchangeStatus).toBe("error");
    expect(request.exchangeErrors).toEqual(["Insufficient allocation"]);
    expect(request.exchangeActionEditable).toBe(true);
    expect(request.showResourcesModal).toBe(false);
    // The failed save must not discard the id of the action being edited:
    // it's what makes the retry a PUT rather than a second POST, and what
    // the views read as "there is a previous exchange".
    expect(request.exchangeActionId).toBe(100);
  });

  // The `catch` around `res.json()`: a response body that isn't JSON at all
  // (a proxy error page, say). It substitutes its own error message, and must
  // likewise leave the known action id alone.
  it("keeps the existing exchange action id when the response body can't be parsed", async () => {
    server.use(
      http.put("https://example.test/requests/555/actions/100.json", () =>
        HttpResponse.text("<html>502 Bad Gateway</html>", { status: 502 }),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      request_action_path: () => "https://example.test/requests/555/actions/100",
    });
    store.set(
      apiStateAtom,
      seedState({
        requests: { 555: makeExchangeRequest({ exchangeActionId: 100, exchangeActionEditable: false }) },
      }),
    );

    await store.set(saveResourcesAtom, { requestId: 555 });

    const request = store.get(apiStateAtom).requests[555];
    expect(request.exchangeStatus).toBe("error");
    expect(request.exchangeErrors).toEqual(["Unable to save exchange"]);
    expect(request.exchangeActionId).toBe(100);
  });
});

describe("saveUsersAtom", () => {
  function makeUsersProject() {
    const roleChangedUser = makeUserFixture({
      username: "promoted",
      role: "pi",
      initialRole: "user",
      resourceIds: [101],
      initialResourceIds: [101],
    });
    const resourceChangedUser = makeUserFixture({
      username: "regranted",
      role: "user",
      initialRole: "user",
      resourceIds: [101, 202],
      initialResourceIds: [101],
      hasChanges: true,
    });
    return makeProjectFixture({ users: [roleChangedUser, resourceChangedUser] });
  }

  it("commits users as the new baseline on success", async () => {
    server.use(
      http.post("https://example.test/save-users", async ({ request }) => {
        const body = (await request.json()) as any;
        expect(body.roleChanges).toEqual([{ username: "promoted", role: "PI", initialRole: "User" }]);
        expect(body.resourceChanges).toEqual([
          { username: "promoted", resources: [101] },
          { username: "regranted", resources: [101, 202] },
        ]);
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      projects_save_users_path: () => "https://example.test/save-users",
    });
    store.set(apiStateAtom, seedState({ projects: { ABC123: makeUsersProject() } }));

    await store.set(saveUsersAtom, { grantNumber: "ABC123" });

    const project = store.get(apiStateAtom).projects["ABC123"];
    expect(project.usersStatus).toBe("success");
    for (const user of project.users) {
      expect(user.hasChanges).toBe(false);
      expect(user.isNew).toBe(false);
      expect(user.initialResourceIds).toEqual(user.resourceIds);
      expect(user.initialRole).toBe(user.role);
    }
  });

  it("records server-provided errors on a rejected save", async () => {
    server.use(
      http.post("https://example.test/save-users", () =>
        HttpResponse.json({ errors: ["Role change not permitted"] }, { status: 422 }),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      projects_save_users_path: () => "https://example.test/save-users",
    });
    store.set(apiStateAtom, seedState({ projects: { ABC123: makeUsersProject() } }));

    await store.set(saveUsersAtom, { grantNumber: "ABC123" });

    const project = store.get(apiStateAtom).projects["ABC123"];
    expect(project.usersStatus).toBe("error");
    expect(project.usersErrors).toEqual(["Role change not permitted"]);
  });

  it("falls back to a generic error when the failure response body isn't JSON", async () => {
    server.use(
      http.post("https://example.test/save-users", () => new HttpResponse("not json", { status: 500 })),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      projects_save_users_path: () => "https://example.test/save-users",
    });
    store.set(apiStateAtom, seedState({ projects: { ABC123: makeUsersProject() } }));

    await store.set(saveUsersAtom, { grantNumber: "ABC123" });

    const project = store.get(apiStateAtom).projects["ABC123"];
    expect(project.usersStatus).toBe("error");
    expect(project.usersErrors).toEqual(["Unable to save changes"]);
  });
});

describe("saveGrantAtom", () => {
  function makeGrantsRequest() {
    return makeRequestFixture({
      grants: [
        makeGrantFixture({ grantId: 1 }),
        makeGrantFixture({ grantId: 2, programOfficerName: "Someone Else" }),
      ],
    });
  }

  function makeGrantsStore() {
    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      projects_save_grants_path: () => "https://example.test/save-grants",
    });
    store.set(apiStateAtom, seedState({ requests: { 555: makeGrantsRequest() } }));
    // The modal is open on grant 1; a successful save is what closes it.
    store.set(editGrantAtom, { requestId: 555, grantId: 1 });
    return store;
  }

  // The modal always submits every editable field; the diff is what narrows
  // it down. These match makeGrantFixture, so only the overrides differ.
  const editedValues = (overrides: GrantEdits = {}): GrantEdits => ({
    beginDate: "2024-01-01",
    endDate: "2025-01-01",
    isPending: false,
    programOfficerName: "Grace Hopper",
    programOfficerEmail: "ghopper@example.test",
    ...overrides,
  });

  it("sends only the fields that actually differ, writes them into state, and closes the modal", async () => {
    server.use(
      http.post("https://example.test/save-grants", async ({ request }) => {
        const body = (await request.json()) as any;
        expect(body.requestId).toBe(555);
        expect(body.grants).toEqual([
          { grantId: 1, endDate: "2025-06-01", programOfficerName: "New PO" },
        ]);
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const store = makeGrantsStore();

    await store.set(saveGrantAtom, {
      requestId: 555,
      grantId: 1,
      values: editedValues({ endDate: "2025-06-01", programOfficerName: "New PO" }),
    });

    const request = store.get(apiStateAtom).requests[555];
    const grant = request.grants!.find((g) => g.grantId === 1)!;
    expect(grant.endDate).toBe("2025-06-01");
    expect(grant.programOfficerName).toBe("New PO");
    expect(grant.beginDate).toBe("2024-01-01"); // unchanged fields left alone
    // The other grant on the request is untouched by a single-grant save.
    expect(request.grants!.find((g) => g.grantId === 2)!.programOfficerName).toBe("Someone Else");
    expect(request.editGrantId).toBeNull();
    expect(request.grantsStatus).toBe("success");
    expect(request.grantsErrors).toBeUndefined();
  });

  it("treats a null stored value and an emptied input as the same value", async () => {
    let requestBody: any = null;
    server.use(
      http.post("https://example.test/save-grants", async ({ request }) => {
        requestBody = await request.json();
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      projects_save_grants_path: () => "https://example.test/save-grants",
    });
    store.set(
      apiStateAtom,
      seedState({
        requests: {
          555: makeRequestFixture({
            grants: [makeGrantFixture({ grantId: 1, programOfficerName: null })],
          }),
        },
      }),
    );
    store.set(editGrantAtom, { requestId: 555, grantId: 1 });

    await store.set(saveGrantAtom, {
      requestId: 555,
      grantId: 1,
      values: editedValues({ programOfficerName: "" }),
    });

    // Nothing differed, so no request went out at all...
    expect(requestBody).toBeNull();
    // ...and the modal still closed, rather than sitting there looking stuck.
    const request = store.get(apiStateAtom).requests[555];
    expect(request.editGrantId).toBeNull();
    expect(request.grantsStatus).toBeNull();
  });

  it("sends a changed pending answer as a boolean, and tells null apart from false", async () => {
    let body: any = null;
    server.use(
      http.post("https://example.test/save-grants", async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      projects_save_grants_path: () => "https://example.test/save-grants",
    });
    store.set(
      apiStateAtom,
      seedState({
        requests: {
          // An unanswered pending question, which is not the same as "no".
          555: makeRequestFixture({ grants: [makeGrantFixture({ grantId: 1, isPending: null })] }),
        },
      }),
    );
    store.set(editGrantAtom, { requestId: 555, grantId: 1 });

    await store.set(saveGrantAtom, {
      requestId: 555,
      grantId: 1,
      values: editedValues({ isPending: false }),
    });

    expect(body.grants).toEqual([{ grantId: 1, isPending: false }]);
    expect(store.get(apiStateAtom).requests[555].grants![0].isPending).toBe(false);
  });

  it("is a no-op for a grantId that isn't on the request", async () => {
    const store = makeGrantsStore();

    await store.set(saveGrantAtom, { requestId: 555, grantId: 999, values: editedValues() });

    const request = store.get(apiStateAtom).requests[555];
    expect(request.grantsStatus).toBeNull();
    expect(request.editGrantId).toBe(1);
  });

  it("records server-provided errors on a rejected save and leaves the modal open", async () => {
    server.use(
      http.post("https://example.test/save-grants", () =>
        HttpResponse.json({ errors: ["End date must be on or after the start date"] }, { status: 422 }),
      ),
    );

    const store = makeGrantsStore();

    await store.set(saveGrantAtom, {
      requestId: 555,
      grantId: 1,
      values: editedValues({ endDate: "2023-01-01" }),
    });

    const request = store.get(apiStateAtom).requests[555];
    expect(request.grantsStatus).toBe("error");
    expect(request.grantsErrors).toEqual(["End date must be on or after the start date"]);
    expect(request.editGrantId).toBe(1);
    // The rejected value was not written into state.
    expect(request.grants!.find((g) => g.grantId === 1)!.endDate).toBe("2025-01-01");
  });

  it("falls back to a generic error when the failure response body isn't JSON", async () => {
    server.use(
      http.post("https://example.test/save-grants", () => new HttpResponse("not json", { status: 500 })),
    );

    const store = makeGrantsStore();

    await store.set(saveGrantAtom, {
      requestId: 555,
      grantId: 1,
      values: editedValues({ programOfficerName: "New PO" }),
    });

    const request = store.get(apiStateAtom).requests[555];
    expect(request.grantsStatus).toBe("error");
    expect(request.grantsErrors).toEqual(["Unable to save changes"]);
  });
});

// ---------------------------------------------------------------------------
// Synchronous (non-fetch) actions. These all go through the same `update()` /
// immer `produce()` wrapper, so each test seeds `apiStateAtom` directly and
// checks both the new value and that the previous state object (or a nested
// object/array within it) was left untouched - the point of using immer at
// all is that a previous render/consumer holding a reference to the old
// state can't observe the mutation.
// ---------------------------------------------------------------------------

describe("addResourceAtom (addResourceAndDeps)", () => {
  function makeRequestWithExchangeOptions() {
    const dependency = makeResourceFixture({ resourceId: 300, name: "Dependency Resource" });
    const primary = makeResourceFixture({ resourceId: 301, name: "Primary Resource", requires: [300] });
    const request = makeRequestFixture({
      resources: [makeResourceFixture({ resourceId: 999, isCredit: true })],
      allowedActions: {
        Exchange: { name: "Exchange", resources: [primary, dependency], opportunityId: 1, opportunityName: "x" },
      },
    });
    return request;
  }

  it("adds a resource and its required dependency, both new and zeroed out", () => {
    const store = createStore();
    const request = makeRequestWithExchangeOptions();
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));
    const previousResources = request.resources;

    store.set(addResourceAtom, { requestId: 555, resourceId: 301 });

    const updated = store.get(apiStateAtom).requests[555];
    const ids = updated.resources.map((r) => r.resourceId).sort();
    expect(ids).toEqual([300, 301, 999]);
    const added = updated.resources.find((r) => r.resourceId === 301)!;
    expect(added.isNew).toBe(true);
    expect(added.allocated).toBe(0);
    expect(added.requested).toBe(0);
    expect(added.used).toBe(0);
    expect(previousResources).toHaveLength(1); // old array untouched
  });

  it("does not re-add a dependency that's already present", () => {
    const store = createStore();
    const dependency = makeResourceFixture({ resourceId: 300, name: "Dependency Resource" });
    const primary = makeResourceFixture({ resourceId: 301, name: "Primary Resource", requires: [300] });
    const request = makeRequestFixture({
      resources: [dependency, makeResourceFixture({ resourceId: 999, isCredit: true })],
      allowedActions: {
        Exchange: { name: "Exchange", resources: [primary, dependency], opportunityId: 1, opportunityName: "x" },
      },
    });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(addResourceAtom, { requestId: 555, resourceId: 301 });

    const updated = store.get(apiStateAtom).requests[555];
    expect(updated.resources.map((r) => r.resourceId).sort()).toEqual([300, 301, 999]);
    expect(updated.resources.filter((r) => r.resourceId === 300)).toHaveLength(1); // no duplicate
  });

  it("is a no-op when the request has no Exchange allowedAction", () => {
    const store = createStore();
    const request = makeRequestFixture({ resources: [makeResourceFixture({ resourceId: 101 })] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(addResourceAtom, { requestId: 555, resourceId: 999 });

    expect(store.get(apiStateAtom).requests[555].resources).toHaveLength(1);
  });
});

describe("setResourceRequestAtom", () => {
  it("recalculates the credit resource's requested amount when a resource's request changes", () => {
    const store = createStore();
    const credit = makeResourceFixture({
      resourceId: 999,
      isCredit: true,
      allocated: 100,
      requested: 100,
      decimalPlaces: 0,
      exchangeRates: { base: { type: "base", unitCost: 1 }, current: { type: "base", unitCost: 1 } },
    });
    const compute = makeResourceFixture({
      resourceId: 101,
      isCredit: false,
      allocated: 10,
      requested: 10,
      exchangeRates: { base: { type: "base", unitCost: 5 }, current: { type: "discount", unitCost: 8 } },
    });
    const request = makeRequestFixture({ resources: [credit, compute] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    // Requesting more than allocated uses the "current" exchange rate for
    // the difference (see getCost, src/shared/helpers/utils.tsx).
    store.set(setResourceRequestAtom, { requestId: 555, resourceId: 101, requested: 20 });

    const updated = store.get(apiStateAtom).requests[555];
    const updatedCompute = updated.resources.find((r) => r.resourceId === 101)!;
    expect(updatedCompute.requested).toBe(20);
    const updatedCredit = updated.resources.find((r) => r.resourceId === 999)!;
    // availableCredits = 100*1 (credit's own base cost) - (20-10)*8 (compute's difference cost) = 20
    expect(updatedCredit.requested).toBe(20);
    // Previous resource objects weren't mutated.
    expect(compute.requested).toBe(10);
    expect(credit.requested).toBe(100);
  });

  // A decommissioned resource's balance can only be exchanged downwards. The
  // check runs on every quantity change rather than at save time, so the
  // Resources view can disable submission while it holds (see Resources.tsx).
  it("reports an error when a decommissioned resource is requested above its allocation", () => {
    const store = createStore();
    const decommissioned = makeResourceFixture({
      resourceId: 101,
      name: "Retired Cluster",
      negativeOnly: true,
      allocated: 10,
      requested: 10,
    });
    const request = makeRequestFixture({ resources: [decommissioned] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(setResourceRequestAtom, { requestId: 555, resourceId: 101, requested: 11 });

    const updated = store.get(apiStateAtom).requests[555];
    expect(updated.exchangeErrors).toEqual([
      "Retired Cluster is decommissioned. Its balance can only be decreased",
    ]);
    expect(updated.exchangeStatus).toBe(statuses.error);
  });

  // The boundary, and the state a decommissioned resource sits in until it is
  // touched: requesting exactly the allocation is not an increase, so it must
  // not error. Without this case `>` and `>=` are indistinguishable to the
  // suite, and `>=` would flag every untouched decommissioned resource the
  // moment any resource on the request was edited.
  it("accepts a decommissioned resource requested at exactly its allocation", () => {
    const store = createStore();
    const decommissioned = makeResourceFixture({
      resourceId: 101,
      name: "Retired Cluster",
      negativeOnly: true,
      allocated: 10,
      requested: 10,
    });
    const request = makeRequestFixture({ resources: [decommissioned] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(setResourceRequestAtom, { requestId: 555, resourceId: 101, requested: 10 });

    const updated = store.get(apiStateAtom).requests[555];
    expect(updated.exchangeErrors).toEqual([]);
    expect(updated.exchangeStatus).toBeNull();
  });

  it("allows a decommissioned resource to be decreased, and clears the error it had set", () => {
    const store = createStore();
    const decommissioned = makeResourceFixture({
      resourceId: 101,
      name: "Retired Cluster",
      negativeOnly: true,
      allocated: 10,
      requested: 10,
    });
    const request = makeRequestFixture({ resources: [decommissioned] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(setResourceRequestAtom, { requestId: 555, resourceId: 101, requested: 11 });
    expect(store.get(apiStateAtom).requests[555].exchangeStatus).toBe(statuses.error);

    store.set(setResourceRequestAtom, { requestId: 555, resourceId: 101, requested: 5 });

    const updated = store.get(apiStateAtom).requests[555];
    expect(updated.exchangeErrors).toEqual([]);
    expect(updated.exchangeStatus).toBeNull();
  });

  // Only an error status is this validation's to clear: a `success` status
  // belongs to a save that already happened (see saveResourcesAtom).
  it("leaves a non-error exchange status alone", () => {
    const store = createStore();
    const request = makeRequestFixture({
      resources: [makeResourceFixture({ resourceId: 101, allocated: 10, requested: 10 })],
      exchangeStatus: statuses.success,
    });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(setResourceRequestAtom, { requestId: 555, resourceId: 101, requested: 20 });

    expect(store.get(apiStateAtom).requests[555].exchangeStatus).toBe(statuses.success);
  });
});

describe("toggleUsersResourcesAtom", () => {
  function makeProjectWithUsers() {
    const qualifying = makeResourceFixture({ resourceId: 101, isCredit: false, isActive: true, allocated: 10 });
    const nonQualifying = makeResourceFixture({ resourceId: 999, isCredit: true, allocated: 10 });
    const request = makeRequestFixture({ resources: [qualifying, nonQualifying] });
    const userA = makeUserFixture({ username: "a", resourceIds: [] });
    const userB = makeUserFixture({ username: "b", resourceIds: [] });
    const project = makeProjectFixture({ users: [userA, userB] });
    return { project, request };
  }

  it("checking with no resourceId grants every qualifying resource to every user", () => {
    const store = createStore();
    const { project, request } = makeProjectWithUsers();
    store.set(apiStateAtom, seedState({ projects: { ABC123: project }, requests: { 555: request } }));

    store.set(toggleUsersResourcesAtom, { grantNumber: "ABC123", checked: true });

    const users = store.get(apiStateAtom).projects["ABC123"].users;
    for (const user of users) {
      expect(user.resourceIds).toEqual([101]); // credit (999) excluded by filterResource
      expect(user.hasChanges).toBe(true);
    }
  });

  it("unchecking with no resourceId clears every user's resources", () => {
    const store = createStore();
    const { project, request } = makeProjectWithUsers();
    project.users = project.users.map((u) => ({ ...u, resourceIds: [101] }));
    store.set(apiStateAtom, seedState({ projects: { ABC123: project }, requests: { 555: request } }));

    store.set(toggleUsersResourcesAtom, { grantNumber: "ABC123", checked: false });

    for (const user of store.get(apiStateAtom).projects["ABC123"].users) {
      expect(user.resourceIds).toEqual([]);
    }
  });

  it("toggling a single resource for a single named user leaves the other user alone", () => {
    const store = createStore();
    const { project, request } = makeProjectWithUsers();
    store.set(apiStateAtom, seedState({ projects: { ABC123: project }, requests: { 555: request } }));

    store.set(toggleUsersResourcesAtom, {
      grantNumber: "ABC123",
      username: "a",
      resourceId: 101,
      checked: true,
    });

    const users = store.get(apiStateAtom).projects["ABC123"].users;
    expect(users.find((u) => u.username === "a")!.resourceIds).toEqual([101]);
    expect(users.find((u) => u.username === "b")!.resourceIds).toEqual([]);

    // Toggling the same resource off again removes it.
    store.set(toggleUsersResourcesAtom, {
      grantNumber: "ABC123",
      username: "a",
      resourceId: 101,
      checked: false,
    });
    expect(
      store.get(apiStateAtom).projects["ABC123"].users.find((u) => u.username === "a")!.resourceIds,
    ).toEqual([]);
  });
});

describe("setUserRoleAtom", () => {
  it("changes the role and recomputes hasChanges, without mutating the previous user object", () => {
    const store = createStore();
    const user = makeUserFixture({ username: "u1", role: "user", initialRole: "user", hasChanges: false });
    const project = makeProjectFixture({ users: [user] });
    store.set(apiStateAtom, seedState({ projects: { ABC123: project } }));

    store.set(setUserRoleAtom, { grantNumber: "ABC123", username: "u1", role: "pi" });

    const updatedUser = store.get(apiStateAtom).projects["ABC123"].users[0];
    expect(updatedUser.role).toBe("pi");
    expect(updatedUser.hasChanges).toBe(true);
    expect(user.role).toBe("user"); // previous object untouched
  });

  it("is a no-op for a username that doesn't exist on the project", () => {
    const store = createStore();
    const project = makeProjectFixture({ users: [makeUserFixture({ username: "u1" })] });
    store.set(apiStateAtom, seedState({ projects: { ABC123: project } }));

    store.set(setUserRoleAtom, { grantNumber: "ABC123", username: "ghost", role: "pi" });

    expect(store.get(apiStateAtom).projects["ABC123"].users[0].role).toBe("user");
  });
});

describe("editGrantAtom / closeGrantModalAtom", () => {
  it("editGrantAtom opens the modal on a grant and clears any leftover save status", () => {
    const store = createStore();
    const request = makeRequestFixture({
      grants: [makeGrantFixture({ grantId: 1 })],
      grantsStatus: "error",
      grantsErrors: ["End date must be on or after the start date"],
    });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(editGrantAtom, { requestId: 555, grantId: 1 });

    const updated = store.get(apiStateAtom).requests[555];
    expect(updated.editGrantId).toBe(1);
    expect(updated.grantsStatus).toBeNull();
    expect(updated.grantsErrors).toBeUndefined();
    expect(request.editGrantId).toBeUndefined(); // previous object untouched
  });

  it("closeGrantModalAtom closes the modal but leaves the errors in place", () => {
    const store = createStore();
    store.set(
      apiStateAtom,
      seedState({
        requests: {
          555: makeRequestFixture({
            grants: [makeGrantFixture({ grantId: 1 })],
            editGrantId: 1,
            grantsStatus: "error",
            grantsErrors: ["Unable to save changes"],
          }),
        },
      }),
    );

    store.set(closeGrantModalAtom, { requestId: 555 });

    const updated = store.get(apiStateAtom).requests[555];
    expect(updated.editGrantId).toBeNull();
    // Reopening is what clears these, so a subsequent editGrantAtom call is
    // the only thing that has to know about them.
    expect(updated.grantsErrors).toEqual(["Unable to save changes"]);
  });
});

describe("resetUsersAtom / resetResourcesAtom", () => {
  it("resetUsersAtom drops new users and reverts changed ones to their initial values", () => {
    const store = createStore();
    const newUser = makeUserFixture({ username: "brandnew", isNew: true });
    const changedUser = makeUserFixture({
      username: "changed",
      role: "pi",
      initialRole: "user",
      resourceIds: [101],
      initialResourceIds: [],
      hasChanges: true,
    });
    const project = makeProjectFixture({ users: [newUser, changedUser] });
    store.set(apiStateAtom, seedState({ projects: { ABC123: project } }));

    store.set(resetUsersAtom, { grantNumber: "ABC123" });

    const users = store.get(apiStateAtom).projects["ABC123"].users;
    expect(users.map((u) => u.username)).toEqual(["changed"]);
    expect(users[0].role).toBe("user");
    expect(users[0].resourceIds).toEqual([]);
    expect(users[0].hasChanges).toBe(false);
  });

  it("resetResourcesAtom drops zero-allocation non-credit resources and reverts requested amounts", () => {
    const store = createStore();
    const unallocatedExtra = makeResourceFixture({ resourceId: 1, isCredit: false, allocated: 0, requested: 5 });
    const changedCompute = makeResourceFixture({ resourceId: 2, isCredit: false, allocated: 10, requested: 20 });
    const credit = makeResourceFixture({ resourceId: 999, isCredit: true, allocated: 50, requested: 80 });
    const request = makeRequestFixture({
      resources: [unallocatedExtra, changedCompute, credit],
      resourcesReason: "because",
    });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(resetResourcesAtom, { requestId: 555 });

    const updated = store.get(apiStateAtom).requests[555];
    expect(updated.resourcesReason).toBe("");
    expect(updated.resources.map((r) => r.resourceId).sort()).toEqual([2, 999]); // resource 1 dropped
    expect(updated.resources.find((r) => r.resourceId === 2)!.requested).toBe(10);
    expect(updated.resources.find((r) => r.resourceId === 999)!.requested).toBe(50);
  });
});

describe("setRequestAtom / setTabAtom", () => {
  it("switches the selected request and resets the tab off 'users' when it's a different request", () => {
    const store = createStore();
    const project = makeProjectFixture({ currentRequestId: 555, selectedRequestId: 555, tab: "users" });
    store.set(apiStateAtom, seedState({ projects: { ABC123: project } }));

    store.set(setRequestAtom, { grantNumber: "ABC123", requestId: 556 });

    const updated = store.get(apiStateAtom).projects["ABC123"];
    expect(updated.selectedRequestId).toBe(556);
    expect(updated.tab).toBe("overview");
  });

  it("keeps the 'users' tab when re-selecting the current request", () => {
    const store = createStore();
    const project = makeProjectFixture({ currentRequestId: 555, selectedRequestId: 555, tab: "users" });
    store.set(apiStateAtom, seedState({ projects: { ABC123: project } }));

    store.set(setRequestAtom, { grantNumber: "ABC123", requestId: 555 });

    expect(store.get(apiStateAtom).projects["ABC123"].tab).toBe("users");
  });

  it("setTabAtom sets the tab directly and no-ops for an unknown project", () => {
    const store = createStore();
    const project = makeProjectFixture({ tab: "overview" });
    store.set(apiStateAtom, seedState({ projects: { ABC123: project } }));

    store.set(setTabAtom, { grantNumber: "ABC123", tab: "usage" });
    expect(store.get(apiStateAtom).projects["ABC123"].tab).toBe("usage");

    // No project with this grant number - should not throw.
    expect(() => store.set(setTabAtom, { grantNumber: "NOPE", tab: "usage" })).not.toThrow();
  });
});

describe("setResourceQuestionValuesAtom", () => {
  it("updates only the targeted question on the targeted resource", () => {
    const store = createStore();
    const targetQuestion = {
      attributeSetId: 1,
      attributes: [{ resourceAttributeId: 10, required: false, label: "Choice" }],
      fieldType: "single_sel",
      label: "Choice",
      resourceId: 101,
      values: [] as (number | string)[],
    };
    const otherQuestion = { ...targetQuestion, attributeSetId: 2, values: ["untouched"] };
    const resource = makeResourceFixture({ resourceId: 101, questions: [targetQuestion, otherQuestion] });
    const otherResource = makeResourceFixture({ resourceId: 102, questions: [{ ...targetQuestion }] });
    const request = makeRequestFixture({ resources: [resource, otherResource] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(setResourceQuestionValuesAtom, {
      requestId: 555,
      resourceId: 101,
      attributeSetId: 1,
      values: [42],
    });

    const updated = store.get(apiStateAtom).requests[555];
    const updatedResource = updated.resources.find((r) => r.resourceId === 101)!;
    expect(updatedResource.questions!.find((q) => q.attributeSetId === 1)!.values).toEqual([42]);
    expect(updatedResource.questions!.find((q) => q.attributeSetId === 2)!.values).toEqual(["untouched"]);
    expect(updated.resources.find((r) => r.resourceId === 102)!.questions![0].values).toEqual([]); // untouched
  });
});

describe("setResourcesReasonAtom", () => {
  it("sets the reason text on the targeted request", () => {
    const store = createStore();
    const request = makeRequestFixture({ resourcesReason: "" });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(setResourcesReasonAtom, { requestId: 555, reason: "Need more compute" });

    expect(store.get(apiStateAtom).requests[555].resourcesReason).toBe("Need more compute");
  });
});

// `canChangeRoles` decides whether the Users grid lets a role be edited (see
// Users.tsx), so it has to survive both routes into a project's user list: the
// project payload (covered in the raw-shape transform block above) and a
// people-search result added to the grid.
describe("searchUsersAtom (canChangeRoles)", () => {
  it("maps the API's can_change_roles onto the searched user", async () => {
    server.use(
      http.get(defaultRoutes.search_people_path(), () =>
        HttpResponse.json([
          {
            can_change_roles: false,
            eligible_reason: null,
            email: "ada@example.test",
            first_name: "Ada",
            is_eligible: true,
            last_name: "Lovelace",
            username: "ada",
            organization: "Example University",
          },
        ]),
      ),
    );

    const store = createStore();
    const found = await store.set(searchUsersAtom, "ada");

    expect(found[0].canChangeRoles).toBe(false);
  });
});

describe("addUserAtom", () => {
  it("adds a new user with resourceIds computed from the current request's qualifying resources", () => {
    const store = createStore();
    const qualifying = makeResourceFixture({ resourceId: 101, isCredit: false, isActive: true, allocated: 10 });
    const credit = makeResourceFixture({ resourceId: 999, isCredit: true, allocated: 10 });
    const request = makeRequestFixture({ resources: [qualifying, credit] });
    const project = makeProjectFixture({ currentRequestId: 555, users: [] });
    store.set(apiStateAtom, seedState({ projects: { ABC123: project }, requests: { 555: request } }));

    store.set(addUserAtom, {
      grantNumber: "ABC123",
      user: {
        eligibility: "true",
        firstName: "New",
        lastName: "User",
        username: "newuser",
        organization: "Example Org",
      },
    });

    const updated = store.get(apiStateAtom).projects["ABC123"];
    expect(updated.users).toHaveLength(1);
    expect(updated.users[0].username).toBe("newuser");
    expect(updated.users[0].resourceIds).toEqual([101]); // credit filtered out
    expect(updated.users[0].isNew).toBe(true);
    expect(updated.usersNewRowIndex).toBe(0);
  });

  it("keeps the searched user's canChangeRoles flag", () => {
    const store = createStore();
    const request = makeRequestFixture({ resources: [] });
    const project = makeProjectFixture({ currentRequestId: 555, users: [] });
    store.set(apiStateAtom, seedState({ projects: { ABC123: project }, requests: { 555: request } }));

    store.set(addUserAtom, {
      grantNumber: "ABC123",
      user: {
        canChangeRoles: false,
        eligibility: "true",
        firstName: "New",
        lastName: "User",
        username: "newuser",
      },
    });

    expect(store.get(apiStateAtom).projects["ABC123"].users[0].canChangeRoles).toBe(false);
  });

  it("does not add a user whose username is already on the project (immer no-op)", () => {
    const store = createStore();
    const existing = makeUserFixture({ username: "dup" });
    const request = makeRequestFixture();
    const project = makeProjectFixture({ currentRequestId: 555, users: [existing] });
    store.set(apiStateAtom, seedState({ projects: { ABC123: project }, requests: { 555: request } }));
    const before = store.get(apiStateAtom);

    store.set(addUserAtom, {
      grantNumber: "ABC123",
      user: { eligibility: "true", firstName: "Dup", lastName: "User", username: "dup" },
    });

    // Nothing was mutated at all - immer's produce() returns the identical
    // object when the recipe returns without touching the draft.
    expect(store.get(apiStateAtom)).toBe(before);
  });
});

describe("closeUsageDetailModalAtom", () => {
  it("clears the usage detail and its status", () => {
    const store = createStore();
    const request = makeRequestFixture({
      usageDetail: { projectTitle: "x", resourceDisplayName: "y", resourceRepositoryKey: "z", users: [] },
      usageDetailStatus: "success",
    });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(closeUsageDetailModalAtom, { requestId: 555 });

    const updated = store.get(apiStateAtom).requests[555];
    expect(updated.usageDetail).toBeNull();
    expect(updated.usageDetailStatus).toBeNull();
  });
});

describe("modal toggle atoms", () => {
  it("toggleActionsModalAtom / toggleConfirmModalAtom / toggleResourcesModalAtom each flip their own boolean", () => {
    const store = createStore();
    const request = makeRequestFixture({
      showActionsModal: false,
      showConfirmModal: false,
      showResourcesModal: false,
    });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(toggleActionsModalAtom, { requestId: 555 });
    expect(store.get(apiStateAtom).requests[555].showActionsModal).toBe(true);
    store.set(toggleActionsModalAtom, { requestId: 555 });
    expect(store.get(apiStateAtom).requests[555].showActionsModal).toBe(false);

    store.set(toggleConfirmModalAtom, { requestId: 555 });
    expect(store.get(apiStateAtom).requests[555].showConfirmModal).toBe(true);

    store.set(toggleResourcesModalAtom, { requestId: 555 });
    expect(store.get(apiStateAtom).requests[555].showResourcesModal).toBe(true);
  });

  it("toggleDeleteModalAtom flips only the targeted action's flag", () => {
    const store = createStore();
    const actionA = makeActionFixture({ actionId: 1, showDeleteModal: false });
    const actionB = makeActionFixture({ actionId: 2, showDeleteModal: false });
    const request = makeRequestFixture({ actions: [actionA, actionB] });
    store.set(apiStateAtom, seedState({ requests: { 555: request } }));

    store.set(toggleDeleteModalAtom, { requestId: 555, actionId: 1 });

    const actions = store.get(apiStateAtom).requests[555].actions;
    expect(actions.find((a) => a.actionId === 1)!.showDeleteModal).toBe(true);
    expect(actions.find((a) => a.actionId === 2)!.showDeleteModal).toBe(false);
  });
});
