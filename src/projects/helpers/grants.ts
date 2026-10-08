import { formatRequestName } from "../../shared/helpers/utils";
import type { Project, Request } from "../types";

/**
 * Whether a request's supporting grants are edited on its Grants tab here in
 * My Projects: the current request, and an approved one that hasn't started
 * yet. A past request's grants describe a period that has already been
 * reviewed. Only approved requests come with a timeStatus at all, so one
 * that's still Incomplete or Submitted is never edited here.
 */
export const grantsEditableInProjects = (request: Request) =>
  request.timeStatus == "current" || request.timeStatus == "future";

/**
 * Whether a request's supporting grants are edited in the request form - the
 * same test as the request's Edit button in RequestActionButtons.tsx: the
 * request action allows the Edit operation. In practice an Incomplete or
 * Submitted renewal.
 */
const grantsEditableInForm = (request: Request) =>
  request.actions.some((action) => action.isRequest && action.allowedOperations?.includes("Edit"));

export type OtherGrantRequest = {
  request: Request;
  /** As the request menu above the tabs names it. */
  name: string;
  /** Where the user goes to edit this request's grants. */
  editIn: "projects" | "form";
};

/**
 * The project's requests, other than `requestId`, whose supporting grants the
 * user can still edit, and where. Each request carries its own copy of its
 * grants (a renewal copies them once, when it's created), so an edit on one
 * isn't reflected on the others.
 *
 * @param project the project `requestId` belongs to
 * @param requests every loaded request, keyed by requestId
 * @param requestId the request whose grants were just changed
 */
export const otherGrantEditableRequests = (
  project: Project,
  requests: Record<string, Request>,
  requestId: number,
): OtherGrantRequest[] =>
  project.requestsList.flatMap((item): OtherGrantRequest[] => {
    const request = requests[item.requestId];
    if (item.requestId == requestId || !request || request.error || request.grants === undefined) return [];
    const name = formatRequestName(item);
    if (grantsEditableInProjects(request)) return [{ request, name, editIn: "projects" }];
    if (grantsEditableInForm(request)) return [{ request, name, editIn: "form" }];
    return [];
  });
