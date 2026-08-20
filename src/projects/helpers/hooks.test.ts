import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { apiStateAtom } from "@/projects/atoms";
import { useProject, useProjectsList, useRequest } from "@/projects/helpers/hooks";
import type { Project, Request, User } from "@/projects/types";

// hooks.ts wires ~20 jotai atoms from ../atoms together with useEffect-driven
// fetches and grantNumber/requestId guard clauses. Of those atoms, only
// fetchProjectsListAtom, fetchUsageDetailAtom, deleteActionAtom,
// saveResourcesAtom and saveUsersAtom perform a real `fetch` (verified by
// reading src/projects/atoms.ts) - those five are faked here so mounting a
// hook can never reach the network. Everything else (including
// fetchProjectDetailAtom/fetchRequestDetailAtom, which are synchronous
// placeholder-setting stubs today, not real fetches) is exercised for real,
// so these tests also incidentally prove the hooks pass the right shapes
// into the real reducers.
const mocks = vi.hoisted(() => ({
  fetchProjectsList: vi.fn(),
  fetchUsageDetail: vi.fn(),
  deleteAction: vi.fn(),
  saveResources: vi.fn(),
  saveUsers: vi.fn(),
}));

vi.mock("../atoms", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../atoms")>();
  const { atom } = await import("jotai");
  const fake = (fn: (arg: never) => unknown) => atom(null, (_get, _set, arg: never) => fn(arg));
  return {
    ...actual,
    fetchProjectsListAtom: fake(mocks.fetchProjectsList),
    fetchUsageDetailAtom: fake(mocks.fetchUsageDetail),
    deleteActionAtom: fake(mocks.deleteAction),
    saveResourcesAtom: fake(mocks.saveResources),
    saveUsersAtom: fake(mocks.saveUsers),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

function wrapperFor(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    eligibility: "eligible",
    firstName: "Ada",
    lastName: "Lovelace",
    initialResourceIds: [],
    initialRole: "pi",
    resourceAccountPendingIds: [],
    resourceAccountInactiveIds: [],
    resourceIds: [],
    resourceUsernames: {},
    role: "pi",
    username: "ada",
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    currentRequestId: 1,
    grantNumber: "TEST000001",
    isManager: true,
    requestsList: [],
    selectedRequestId: 1,
    status: "Active",
    tab: "overview",
    title: "Test Project",
    users: [makeUser()],
    usersNewRowIndex: -1,
    usersStatus: null,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<Request> = {}): Request {
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
    grantNumber: "TEST000001",
    isMaximize: false,
    requestId: 1,
    resources: [],
    resourcesReason: "",
    returnedForCorrections: false,
    returnedForCorrectionsNotes: "",
    showActionsModal: false,
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
  };
}

describe("useProjectsList", () => {
  it("fetches the list for the given username exactly once on mount", () => {
    const store = createStore();
    const { rerender } = renderHook(({ username }) => useProjectsList(username), {
      wrapper: wrapperFor(store),
      initialProps: { username: "alice" },
    });
    expect(mocks.fetchProjectsList).toHaveBeenCalledTimes(1);
    expect(mocks.fetchProjectsList).toHaveBeenCalledWith("alice");

    // The effect's dependency array is `[]` (deliberately, per the
    // eslint-disable comment in hooks.ts), so a rerender with a different
    // username does NOT trigger a second fetch.
    rerender({ username: "bob" });
    expect(mocks.fetchProjectsList).toHaveBeenCalledTimes(1);
  });

  it("reflects error/loading/projects straight out of the store", () => {
    const store = createStore();
    store.set(apiStateAtom, {
      error: "Something broke",
      projectsList: [{ grantNumber: "G1", status: "Active", title: "Proj" }],
      projectListLoading: true,
      projects: {},
      requests: {},
      username: "alice",
    });
    const { result } = renderHook(() => useProjectsList("alice"), { wrapper: wrapperFor(store) });
    expect(result.current.error).toBe("Something broke");
    expect(result.current.loading).toBe(true);
    expect(result.current.projects).toEqual([{ grantNumber: "G1", status: "Active", title: "Proj" }]);
  });
});

describe("useProject", () => {
  it("returns no project and performs no fetch when grantNumber is nullish", () => {
    const store = createStore();
    const { result } = renderHook(() => useProject(null), { wrapper: wrapperFor(store) });
    expect(result.current.project).toBeUndefined();
    expect(store.get(apiStateAtom).projects).toEqual({});
  });

  it("every action callback is a no-op when grantNumber is nullish", () => {
    const store = createStore();
    const { result } = renderHook(() => useProject(undefined), { wrapper: wrapperFor(store) });
    act(() => {
      expect(result.current.addUser({ eligibility: "eligible", firstName: "A", lastName: "B", username: "ab" })).toBeFalsy();
      expect(result.current.resetUsers()).toBeFalsy();
      expect(result.current.saveUsers()).toBeFalsy();
      expect(result.current.setRequest(1)).toBeFalsy();
      expect(result.current.setTab("users")).toBeFalsy();
      expect(result.current.setUserRole("ab", "pi")).toBeFalsy();
      expect(result.current.toggleUsersResources(true)).toBeFalsy();
    });
    // None of the guarded calls should have reached the network-backed atom.
    expect(mocks.saveUsers).not.toHaveBeenCalled();
  });

  it("triggers fetchProjectDetail's placeholder when the project isn't already loaded", () => {
    const store = createStore();
    renderHook(() => useProject("TEST000001"), { wrapper: wrapperFor(store) });
    // fetchProjectDetailAtom is a real (synchronous, no-network) stub today -
    // it just seats an error placeholder, which is enough to prove the
    // effect actually ran.
    expect(store.get(apiStateAtom).projects["TEST000001"]).toEqual({
      error: "Failed to load project data.",
    });
  });

  it("does not fetch when skipFetch is true", () => {
    const store = createStore();
    renderHook(() => useProject("TEST000001", true), { wrapper: wrapperFor(store) });
    expect(store.get(apiStateAtom).projects["TEST000001"]).toBeUndefined();
  });

  it("does not re-fetch (or clobber) a project that's already in the store", () => {
    const store = createStore();
    const project = makeProject();
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: { TEST000001: project },
      requests: { 1: makeRequest() },
      username: null,
    });
    const { result } = renderHook(() => useProject("TEST000001"), { wrapper: wrapperFor(store) });
    expect(result.current.project).toEqual(project);
  });

  it("setTab forwards grantNumber and tab into the real reducer", () => {
    const store = createStore();
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: { TEST000001: makeProject() },
      requests: { 1: makeRequest() },
      username: null,
    });
    const { result } = renderHook(() => useProject("TEST000001"), { wrapper: wrapperFor(store) });
    act(() => result.current.setTab("users"));
    expect(store.get(apiStateAtom).projects["TEST000001"].tab).toBe("users");
  });

  it("addUser appends a new user shaped as a fresh, unsaved row", () => {
    const store = createStore();
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: { TEST000001: makeProject() },
      requests: { 1: makeRequest() },
      username: null,
    });
    const { result } = renderHook(() => useProject("TEST000001"), { wrapper: wrapperFor(store) });
    act(() =>
      result.current.addUser({
        eligibility: "eligible",
        firstName: "Grace",
        lastName: "Hopper",
        username: "grace",
      }),
    );
    const users = store.get(apiStateAtom).projects["TEST000001"].users;
    expect(users).toHaveLength(2);
    expect(users[1]).toMatchObject({ username: "grace", role: "user", isNew: true, hasChanges: true });
  });

  it("saveUsers is guarded by grantNumber and forwards it to the (faked) network atom", () => {
    const store = createStore();
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: { TEST000001: makeProject() },
      requests: { 1: makeRequest() },
      username: null,
    });
    const { result } = renderHook(() => useProject("TEST000001"), { wrapper: wrapperFor(store) });
    act(() => result.current.saveUsers());
    expect(mocks.saveUsers).toHaveBeenCalledWith({ grantNumber: "TEST000001" });
  });
});

describe("useRequest", () => {
  it("returns no request and performs no fetch when requestId is nullish", () => {
    const store = createStore();
    const { result } = renderHook(() => useRequest(null), { wrapper: wrapperFor(store) });
    expect(result.current.request).toBeUndefined();
    expect(store.get(apiStateAtom).requests).toEqual({});
  });

  it("every action callback is a no-op when requestId is nullish", () => {
    const store = createStore();
    const { result } = renderHook(() => useRequest(undefined), { wrapper: wrapperFor(store) });
    act(() => {
      expect(result.current.addResource(1)).toBeFalsy();
      expect(result.current.closeUsageDetailModal()).toBeFalsy();
      expect(result.current.deleteAction(1)).toBeFalsy();
      expect(result.current.openUsageDetailModal("key")).toBeFalsy();
      expect(result.current.resetResources()).toBeFalsy();
      expect(result.current.saveResources()).toBeFalsy();
      expect(result.current.setResourcesReason("why")).toBeFalsy();
      expect(result.current.toggleConfirmModal()).toBeFalsy();
      expect(result.current.toggleDeleteModal(1)).toBeFalsy();
    });
    expect(mocks.deleteAction).not.toHaveBeenCalled();
    expect(mocks.saveResources).not.toHaveBeenCalled();
    expect(mocks.fetchUsageDetail).not.toHaveBeenCalled();
  });

  // The guard is `requestId != null`, not a truthiness check, so a falsy but
  // real id (0) is still treated as present - worth pinning down since it'd
  // be an easy regression to introduce by "simplifying" to `if (requestId)`.
  it("treats a requestId of 0 as present, not nullish", () => {
    const store = createStore();
    renderHook(() => useRequest(0), { wrapper: wrapperFor(store) });
    expect(store.get(apiStateAtom).requests[0]).toEqual({ error: "Failed to load request data." });
  });

  it("triggers fetchRequestDetail's placeholder when the request isn't already loaded", () => {
    const store = createStore();
    renderHook(() => useRequest(1), { wrapper: wrapperFor(store) });
    expect(store.get(apiStateAtom).requests[1]).toEqual({ error: "Failed to load request data." });
  });

  it("does not re-fetch a request that's already in the store", () => {
    const store = createStore();
    const request = makeRequest();
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: {},
      requests: { 1: request },
      username: null,
    });
    const { result } = renderHook(() => useRequest(1), { wrapper: wrapperFor(store) });
    expect(result.current.request).toEqual(request);
  });

  it("re-fetches when requestId changes across a rerender (unlike useProjectsList's mount-only effect)", () => {
    const store = createStore();
    const { rerender } = renderHook(({ id }) => useRequest(id), {
      wrapper: wrapperFor(store),
      initialProps: { id: 1 },
    });
    expect(store.get(apiStateAtom).requests[1]).toEqual({ error: "Failed to load request data." });
    rerender({ id: 2 });
    expect(store.get(apiStateAtom).requests[2]).toEqual({ error: "Failed to load request data." });
  });

  it("openUsageDetailModal only fires once a real request object is loaded, and forwards its grantNumber", () => {
    const store = createStore();
    const request = makeRequest({ grantNumber: "TEST000001" });
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: {},
      requests: { 1: request },
      username: null,
    });
    const { result } = renderHook(() => useRequest(1), { wrapper: wrapperFor(store) });
    act(() => result.current.openUsageDetailModal("compute.hours"));
    expect(mocks.fetchUsageDetail).toHaveBeenCalledWith({
      grantNumber: "TEST000001",
      requestId: 1,
      resourceRepositoryKey: "compute.hours",
    });
  });

  it("deleteAction and saveResources forward requestId into the faked network atoms", () => {
    const store = createStore();
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: {},
      requests: { 1: makeRequest() },
      username: null,
    });
    const { result } = renderHook(() => useRequest(1), { wrapper: wrapperFor(store) });
    act(() => {
      result.current.deleteAction(9);
      result.current.saveResources();
    });
    expect(mocks.deleteAction).toHaveBeenCalledWith({ actionId: 9, requestId: 1 });
    expect(mocks.saveResources).toHaveBeenCalledWith({ requestId: 1 });
  });

  it("toggleDeleteModal toggles the real per-action flag", () => {
    const store = createStore();
    store.set(apiStateAtom, {
      error: null,
      projectsList: [],
      projectListLoading: false,
      projects: {},
      requests: {
        1: makeRequest({
          actions: [
            {
              actionId: 9,
              allowedOperations: ["Delete"],
              detailAvailable: false,
              date: "2026-01-01",
              deleteStatus: null,
              isRequest: false,
              resources: [],
              showDeleteModal: false,
              status: "Approved",
              type: "Award",
            },
          ],
        }),
      },
      username: null,
    });
    const { result } = renderHook(() => useRequest(1), { wrapper: wrapperFor(store) });
    act(() => result.current.toggleDeleteModal(9));
    expect(store.get(apiStateAtom).requests[1].actions[0].showDeleteModal).toBe(true);
  });
});
