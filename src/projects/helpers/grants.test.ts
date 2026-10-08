import { describe, expect, it } from "vitest";
import type { Action, Project, Request } from "../types";
import { otherGrantEditableRequests } from "./grants";

const action = (allowedOperations: string[], isRequest = true): Action => ({
  actionId: 1,
  allowedOperations,
  date: "2026-10-01",
  deleteStatus: null,
  detailAvailable: true,
  isRequest,
  resources: [],
  showDeleteModal: false,
  status: "Incomplete",
  type: "Renewal",
});

const request = (requestId: number, actions: Action[], overrides: Partial<Request> = {}) =>
  ({ actions, grants: [], requestId, ...overrides }) as Request;

const project = (requestIds: number[]) =>
  ({
    requestsList: requestIds.map((requestId) => ({
      allocationType: "Explore",
      entryDate: "2026-01-01",
      requestId,
      status: "Active",
    })),
  }) as Project;

describe("otherGrantEditableRequests", () => {
  it("returns the project's other requests whose request action allows Edit, to edit in the form", () => {
    const requests = {
      1: request(1, [action([])]),
      2: request(2, [action(["Edit", "Delete"])]),
      3: request(3, [action(["Delete"])]),
    };

    expect(otherGrantEditableRequests(project([1, 2, 3]), requests, 1)).toEqual([
      { request: requests[2], name: "Explore: Submitted Jan 1, 2026", editIn: "form" },
    ]);
  });

  it("returns the current and future requests, to edit here, but not past ones", () => {
    const requests = {
      1: request(1, [action([])], { timeStatus: "past" }),
      2: request(2, [action([])], { timeStatus: "current" }),
      3: request(3, [action([])], { timeStatus: "future" }),
      4: request(4, [action(["Edit"])], { timeStatus: "past" }),
    };

    const others = otherGrantEditableRequests(project([1, 2, 3, 4]), requests, 1);
    expect(others.map(({ request, editIn }) => [request.requestId, editIn])).toEqual([
      [2, "projects"],
      [3, "projects"],
      [4, "form"],
    ]);
  });

  it("never returns the request that was just changed", () => {
    const requests = { 1: request(1, [action(["Edit"])]) };

    expect(otherGrantEditableRequests(project([1]), requests, 1)).toEqual([]);
  });

  it("ignores Edit on actions other than the request itself", () => {
    // e.g. an editable supplement on an otherwise-settled request - editing
    // it doesn't reach the request's grants.
    const requests = {
      1: request(1, [action([])]),
      2: request(2, [action([]), action(["Edit"], false)]),
    };

    expect(otherGrantEditableRequests(project([1, 2]), requests, 1)).toEqual([]);
  });

  it("skips requests that aren't loaded, failed to load, or have no grants support", () => {
    const requests = {
      1: request(1, [action([])]),
      3: request(3, [action(["Edit"])], { error: "Failed to load request data." }),
      4: request(4, [action(["Edit"])], { grants: undefined }),
    };

    expect(otherGrantEditableRequests(project([1, 2, 3, 4]), requests, 1)).toEqual([]);
  });
});
