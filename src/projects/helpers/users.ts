import { roles } from "../../shared/helpers/utils";
import type { User } from "../types";

// PI and Co-PI are assigned through the allocation request, not this grid, so
// the dropdown offers them only as the value already selected: a PI's row shows
// "PI" rather than a blank, and no other row can become one. The select itself
// is disabled in that case - this keeps the option list honest either way.
export const selectableRoles = (currentRole: string) =>
  roles.filter(({ role }) => role === currentRole || !["pi", "co_pi"].includes(role));

// The counts behind a column header's tri-state checkbox. The "all" column
// tallies every user against every resource; a resource column tallies the
// users who have that one. `MultiStateCheckbox` reads unchecked / indeterminate
// / checked off the ratio, so both numbers have to come from the same set of
// users the grid is showing.
export function resourceTallies(
  users: Pick<User, "resourceIds">[],
  resourceCount: number,
  columnKey: string,
) {
  if (columnKey == "all")
    return {
      selectedLength: users.reduce((total, user) => total + user.resourceIds.length, 0),
      totalLength: users.length * resourceCount,
    };

  const resourceId = Number(columnKey);
  return {
    selectedLength: users.filter(({ resourceIds }) => resourceIds.includes(resourceId)).length,
    totalLength: users.length,
  };
}
