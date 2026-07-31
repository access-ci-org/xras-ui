import type { AllowedAction, Request } from "../types";

const upgradeMap: Record<string, string> = {
  Explore: "Discover",
  Discover: "Accelerate",
  Accelerate: "Maximize",
};

export type Upgrade = {
  isEnabled: boolean;
  isRenewalEnabled?: boolean;
  allocationType?: string;
  opportunityId?: number;
};

/**
 * This function will return an object containing properties to be used for the
 * action options in ActionsModal.  It will have the following properties set:
 *
 *   - "isEnabled" (boolean) whether or not an upgrade is allowed
 *   - "isRenewalEnabled":  (boolean) since upgrades affect whether or not to
 *     show the normal "Renewal" option
 *
 * It may have these additional properties:
 *
 *   - "allocationType":  (string) the allocation type that this request would
 *     be upgraded into
 *   - "opportunityId":  (number) if an upgrade is available, the opportunityId
 *
 * Note:  +request+ isn't exactly the object as returned from GET /v1/projects;
 * it's modified in atoms.ts.
 */
export function getUpgrade(request: Request, renewalActions: AllowedAction[]): Upgrade {
  const upgrade: Upgrade = { isEnabled: false };

  if (!(request.allocationType in upgradeMap)) {
    // This isn't a credits-based allocation type.  Normal renewal rules apply.
    upgrade.isRenewalEnabled = "Renewal" in request.allowedActions;
    return upgrade;
  }

  upgrade.allocationType = upgradeMap[request.allocationType];

  // Since an "upgrade" is really just a renewal, if a renewal is not allowed,
  // then neither is an "upgrade."
  if (!("Renewal" in request.allowedActions)) {
    upgrade.isRenewalEnabled = false;
    return upgrade;
  }

  // Renewals are not normally allowed until 30 days before the allocation
  // end date.  If they can renew normally, then don't offer an "upgrade."
  if ((upgrade.isRenewalEnabled = canRenewNormally(request))) {
    return upgrade;
  }

  const credits = calculateCredits(request);

  // Normally, half of credits are awarded with the initial request, and the
  // other half must be requested as a supplement.  Until they have received
  // that supplement, they are not eligible to upgrade.
  if (!receivedAllCredits(request, credits)) {
    return upgrade;
  }

  // An upgrade should not be offered until the project is running low on
  // credits.
  if (!needsMoreCredits(request, credits)) {
    return upgrade;
  }

  for (const renewal of renewalActions) {
    // The allowedAction object doesn't include the allocation type of the
    // opportunity, so we have to assume that the allocation type is a
    // substring of the opportunity name (e.g., "Accelerate ACCESS" or
    // "Maximize ACCESS – March 2026").
    if (renewal.opportunityName?.includes(upgrade.allocationType)) {
      upgrade.opportunityId = renewal.opportunityId;
      upgrade.isEnabled = true;
      break;
    }
  }

  return upgrade;
}

/**
 * Renewals are normally allowed 30 days before the end of an allocation.
 * However, credit-based allocations have been set to 365 days before the end
 * of the allocation to permit upgrades before then.  The UI should hide the
 * normal "Renewal" option until 30 days before the allocation end date.
 */
function canRenewNormally(request: Request) {
  return daysUntilEndDate(request) < 31;
}

function daysUntilEndDate(request: Request) {
  const endDate = new Date(request.endDate ?? "");
  const currentDate = new Date();
  return Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Whether or not this request has received its full amount of credits.
 * Normally, half of credits are awarded with the initial request, and the
 * other half must be requested as a supplement.
 *
 * Note that this does not always happen.  Sometimes the admins award the full
 * amount up front.  Other times they don't award the full amount even with
 * supplements.
 */
function receivedAllCredits(request: Request, credits: ReturnType<typeof calculateCredits>) {
  if (credits.allocated >= fullAward(request)) return true;

  return request.actions.some(
    (action) =>
      action.type == "Supplement" &&
      action.status == "Approved" &&
      action.resources.some((r) => r.isCredit && r.allocated > 0),
  );
}

function fullAward(request: Request) {
  switch (request.allocationType) {
    case "Explore":
      return 400000.0;
    case "Discover":
      return 1500000.0;
    case "Accelerate":
      return 3000000.0;
  }

  return 0;
}

/**
 * Whether or not this project needs more credits.
 *
 * Currently this is based on a threshold of credits remaining, but this may be
 * revised to also be based on remaining (compute) resources, so that a project
 * isn't immediately offered an upgrade if they exchange all of their credits
 * but haven't used the resources.
 */
function needsMoreCredits(request: Request, credits: ReturnType<typeof calculateCredits>) {
  switch (request.allocationType) {
    case "Explore":
      return credits.usage >= 0.9;
    case "Discover":
      return credits.usage >= 0.75;
    case "Accelerate":
      return credits.exchanged >= 0.75 * fullAward(request);
  }

  return false;
}

/**
 * Calculate credit allocation and usage (correctly).
 *
 * The accounting service treats "ACCESS Credits" no differently than any other
 * resource, and so it doesn't correctly compute the "allocated" amount.  Any
 * transfer away from "ACCESS Credits" is treated as if those credits had never
 * been allocated, but ACCESS Credits are "used" by exchanging them (via
 * transfer) for other resources.
 *
 * The getResourceUsagePercent() function from src/shared/helpers/utils.tsx
 * tries to do the same thing by adding up the allocation multiplied by the
 * exchange rate, but that doesn't always return the correct answer either
 * because it always uses the current exchange rate, and if the project
 * received a resource at a different rate from the current rate, the
 * calculation won't return the number of originally allocated credits.
 *
 * This function uses request.actions to determine the total credits allocated
 * and exchanged.
 *
 * Note that this will include credits from actions which have been approved
 * but not sent to the accounting service.
 */
function calculateCredits(request: Request) {
  let allocated = 0.0;
  let remaining = 0.0;

  for (const action of request.actions) {
    if (action.status != "Approved") continue;
    const exchange = action.type == "Exchange" || action.type == "Transfer";

    for (const resource of action.resources) {
      if (!resource.isCredit) continue;
      if (!exchange) allocated += resource.allocated;
      remaining += resource.allocated;
    }
  }

  return {
    allocated: allocated,
    exchanged: allocated - remaining,
    usage: allocated > 0 ? (allocated - remaining) / allocated : 0,
  };
}
