import { describe, expect, it } from "vitest";
import { resourceTallies, selectableRoles } from "./users";
import type { User } from "../types";

const withResources = (resourceIds: number[]) => ({ resourceIds }) as Pick<User, "resourceIds">;

describe("selectableRoles", () => {
  it("offers PI and Co-PI only to the row that already holds them", () => {
    // Those two roles come from the allocation request, not this grid, so the
    // dropdown must never be a way to grant one. It still has to *show* the
    // current value, or a PI's row would render blank.
    expect(selectableRoles("user").map(({ role }) => role)).toEqual([
      "allocation_manager",
      "user",
    ]);
    expect(selectableRoles("pi").map(({ role }) => role)).toEqual([
      "pi",
      "allocation_manager",
      "user",
    ]);
    expect(selectableRoles("co_pi").map(({ role }) => role)).toEqual([
      "co_pi",
      "allocation_manager",
      "user",
    ]);
  });

  it("keeps the canonical order rather than moving the current role to the front", () => {
    // The list is filtered, never reordered, so the dropdown reads the same way
    // on every row.
    expect(selectableRoles("allocation_manager").map(({ role }) => role)).toEqual([
      "allocation_manager",
      "user",
    ]);
  });
});

describe("resourceTallies", () => {
  const users = [withResources([1, 2]), withResources([1]), withResources([])];

  it("tallies the whole grid for the all-resources column", () => {
    // 3 of a possible 6 assignments: the header checkbox has to read
    // indeterminate, which it can only do if both numbers span every cell.
    expect(resourceTallies(users, 2, "all")).toEqual({ selectedLength: 3, totalLength: 6 });
  });

  it("tallies one column against the users, not against the assignments", () => {
    // Two of three users have resource 1; the denominator is the user count,
    // because a user can appear in this column at most once.
    expect(resourceTallies(users, 2, "1")).toEqual({ selectedLength: 2, totalLength: 3 });
    expect(resourceTallies(users, 2, "2")).toEqual({ selectedLength: 1, totalLength: 3 });
  });

  it("reports nothing selected for a resource no one has", () => {
    expect(resourceTallies(users, 2, "7")).toEqual({ selectedLength: 0, totalLength: 3 });
  });

  it("reports a clean pair of zeros when there are no users", () => {
    // `MultiStateCheckbox` derives its state from the ratio, so a project with
    // no users has to come back as 0 of 0 in both column shapes rather than
    // something that reads as partially selected.
    expect(resourceTallies([], 2, "all")).toEqual({ selectedLength: 0, totalLength: 0 });
    expect(resourceTallies([], 2, "1")).toEqual({ selectedLength: 0, totalLength: 0 });
  });

  it("trusts the caller for the resource count", () => {
    // Passing 0 resources alongside users who hold some yields 3 of 0, which is
    // not a sensible ratio - it is also unreachable, because `Users.tsx` only
    // adds the "all" column when `resources.length` is truthy. Recorded so the
    // next reader knows the guard lives at the call site by design and not by
    // oversight.
    expect(resourceTallies(users, 0, "all")).toEqual({ selectedLength: 3, totalLength: 0 });
  });
});
