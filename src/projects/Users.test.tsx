import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { mergeRoutes, routesAtom } from "@/shared/routes";
import Users from "./Users";
import { apiStateAtom } from "./atoms";
import type { Project, Request as RequestType, User } from "./types";

const GRANT = "TEST000001";
const REQUEST_ID = 555;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    eligibility: "yes",
    email: "user@example.test",
    firstName: "Ada",
    initialResourceIds: [],
    initialRole: "user",
    lastName: "Lovelace",
    organization: "Example Org",
    resourceAccountPendingIds: [],
    resourceAccountInactiveIds: [],
    resourceIds: [],
    resourceUsernames: {},
    role: "user",
    username: "ada",
    ...overrides,
  };
}

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
    timeStatus: "current",
    type: "New",
    usageDetail: null,
    usageDetailStatus: null,
    usesCredits: true,
    ...overrides,
  };
}

function renderUsers(users: User[], { isManager = true }: { isManager?: boolean } = {}) {
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
        isManager,
        requestsList: [],
        selectedRequestId: REQUEST_ID,
        status: "Active",
        tab: "users",
        title: "Test Project",
        users,
        usersNewRowIndex: -1,
        usersStatus: null,
      } satisfies Project,
    },
    requests: { [REQUEST_ID]: makeRequest() },
    username: "ada",
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <Users grantNumber={GRANT} />
      </Provider>,
    ),
  };
}

// The grid's role control is a plain `<select>` inside the row whose Name cell
// holds the user. Scoped to the row rather than fetched by accessible name
// because the selects have none - and the page also holds react-select's
// "Add another user" combobox, so an unscoped role query would be ambiguous.
function roleSelectFor(username: string): HTMLSelectElement {
  const cell = screen.getByText(username);
  const row = cell.closest("tr");
  if (!row) throw new Error(`no row for ${username}`);
  const select = row.querySelector("select");
  if (!select) throw new Error(`no role select for ${username}`);
  return select as HTMLSelectElement;
}

describe("Users role select (canChangeRoles, ported from main)", () => {
  it("enables the select for a user the API says may change roles", () => {
    renderUsers([makeUser({ username: "ada", canChangeRoles: true })]);
    expect(roleSelectFor("ada")).toBeEnabled();
  });

  it("disables the select when the API says the role is locked", () => {
    renderUsers([makeUser({ username: "grace", canChangeRoles: false })]);
    expect(roleSelectFor("grace")).toBeDisabled();
  });

  /*
   * The flag is optional on `User` and read as a bare truthiness test, so an
   * absent or null value locks the row exactly as `false` does. This matters
   * because it is reachable: `canChangeRoles` comes from xacct_api's
   * `pi_eligible`, a SQL expression over two LEFT-JOINed country tables, so a
   * person or organization with no country yields JSON `null` rather than
   * `false`. Characterizing current behavior, not endorsing it - this is
   * deferred issue #15 in scratch/xras-ui-bugs.md, and if that is resolved by
   * defaulting the flag, this test is the one to change.
   */
  it("disables the select when the flag is absent altogether", () => {
    renderUsers([makeUser({ username: "alan" })]);
    expect(roleSelectFor("alan")).toBeDisabled();
  });

  it("disables the select for a PI even when the flag allows changes", () => {
    renderUsers([makeUser({ username: "pi-user", role: "pi", canChangeRoles: true })]);
    expect(roleSelectFor("pi-user")).toBeDisabled();
  });

  it("disables the select for a co-PI even when the flag allows changes", () => {
    renderUsers([makeUser({ username: "copi-user", role: "co_pi", canChangeRoles: true })]);
    expect(roleSelectFor("copi-user")).toBeDisabled();
  });

  it("disables every select for a non-manager, flag notwithstanding", () => {
    renderUsers([makeUser({ username: "ada", canChangeRoles: true })], { isManager: false });
    expect(roleSelectFor("ada")).toBeDisabled();
  });

  it("decides per user, not per grid", () => {
    renderUsers([
      makeUser({ username: "ada", canChangeRoles: true }),
      makeUser({ username: "grace", canChangeRoles: false }),
    ]);
    expect(roleSelectFor("ada")).toBeEnabled();
    expect(roleSelectFor("grace")).toBeDisabled();
  });

  // The enabled select is not merely enabled: it still writes through to the
  // store, so the flag gates the control without breaking the control.
  it("writes a role change through for an unlocked user", async () => {
    const user = userEvent.setup();
    const { store } = renderUsers([makeUser({ username: "ada", canChangeRoles: true })]);
    await user.selectOptions(roleSelectFor("ada"), "allocation_manager");
    expect(store.get(apiStateAtom).projects[GRANT].users[0].role).toBe("allocation_manager");
  });
});
