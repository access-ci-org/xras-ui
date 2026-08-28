import { parseResourceName, roundNumber } from "../../shared/helpers/utils";
import type { Resource } from "../types";

// The arithmetic and ordering that the resources tab used to keep inline in the
// view. None of it touches React, so it lives here where it can be tested
// directly; `Resources.tsx` keeps the JSX and the atom wiring.

export const getBalance = (row: Resource) => row.requested - row.used;

// A newly added resource has to clear its own minimum on the first request.
// Zero is always allowed - that is how a resource added by mistake is backed
// out before the exchange is submitted.
export const belowMinimum = (row: Resource) =>
  row.isNew && 0 < row.requested && row.requested < row.minimumExchange;

// Clamps a balance the user typed into the range the project can actually
// afford. `credit` is the request's credit resource, which is what pays for an
// increase; it is `undefined` on requests that have none, in which case there
// are no credits to spend and only a reduction can succeed. It is declared
// required-but-nullable rather than optional so that forgetting to thread it
// through is a compile error instead of a silently zero credit balance.
export const cleanBalance = (
  balanceString: string,
  row: Resource,
  credit: Resource | undefined,
) => {
  const allocatedBalance = row.allocated - row.used;
  const desiredBalance = roundNumber(
    Number(balanceString.replace(/[^0-9-.]/g, "")),
    row.decimalPlaces,
  );

  // The sanitizer strips characters, not shapes, so "1.2.3" and "1-2" reach
  // `Number` intact and come back NaN. Every comparison against NaN is false,
  // which means NaN used to fail *both* clamps below and be returned as-is -
  // the caller stringifies the result, so the field ended up reading "NaN".
  // Treat input we cannot parse as no change at all.
  if (!Number.isFinite(desiredBalance)) return getBalance(row);

  const minBalance = Math.min(0, allocatedBalance);
  if (desiredBalance < minBalance) return minBalance;

  // We use the base exchange rate when the allocation is being reduced below the
  // current allocation, and the current exchange rate when the allocations is
  // being increased above the current allocation. To handle cases where the user
  // reduces the allocation and then later increases it before submitting, we need
  // to split the increase at the current allocation and apply the base exchange rate
  // to the lower portion and the current exchange rate to the upper portion.
  let availableCredits = (credit?.requested ?? 0) * (credit?.exchangeRates.base.unitCost ?? 0);
  const costToAllocated = (row.allocated - row.requested) * row.exchangeRates.base.unitCost;
  const baseCost = Math.min(availableCredits, costToAllocated);

  availableCredits -= baseCost;
  let maxBalance = row.requested - row.used + baseCost / row.exchangeRates.base.unitCost;
  if (availableCredits > 0) maxBalance += availableCredits / row.exchangeRates.current.unitCost;

  if (desiredBalance > maxBalance) return roundNumber(maxBalance, row.decimalPlaces, "floor");
  return desiredBalance;
};

export type ResourceOptionGroup = {
  label: string;
  options: { value: number; label: string }[];
};

// Cheapest first, then alphabetical. Written in the tiered form rather than the
// OR-ed `? -1 : 1` this replaced, which never returned 0 and so claimed a
// resource sorts after itself. Unlike `sortResources` (#1), that flaw was not
// reachable here: with only two tiers the OR-ed form does return +1 when `b`
// wins, and V8 happens to leave all-equal elements alone either way, so no
// input distinguishes them. Kept because the comparator contract is a contract
// - an engine is free to produce anything given an inconsistent one - not
// because a test can tell the difference.
const byCostThenName = (a: Resource, b: Resource) => {
  const byCost = a.exchangeRates.current.unitCost - b.exchangeRates.current.unitCost;
  if (byCost) return byCost;
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
};

// Turns the resources an exchange could add into react-select option groups,
// dropping the ones already on the request. The option label puts the
// abbreviation first - "Bridges2 (Pittsburgh Supercomputing Center)" from
// "Pittsburgh Supercomputing Center (Bridges2)" - because that is the part a
// user scanning the list recognises.
export function groupAvailableResources(
  available: Resource[],
  excludeIds: number[],
): ResourceOptionGroup[] {
  const grouped: Record<string, Resource[]> = {};
  for (const res of available) {
    if (excludeIds.includes(res.resourceId)) continue;
    const groupLabel = `${res.type} Resources (${res.unit})`;
    grouped[groupLabel] = grouped[groupLabel] || [];
    grouped[groupLabel].push(res);
  }

  return Object.entries(grouped)
    .map(([label, options]) => ({
      label,
      options: options.sort(byCostThenName).map((res) => {
        const parsed = parseResourceName(res.name);
        return {
          value: res.resourceId,
          label: parsed.short
            ? `${parsed.short} (${parsed.full.replace(/ \([^(]+\)/, "")})`
            : parsed.full,
        };
      }),
    }))
    // The inline version sorted the group list again on every iteration of the
    // loop that built it. Same result, once.
    .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
}

export type ResourceAlertKind =
  | "submitted"
  | "pi-status-unknown"
  | "error"
  | "pending-exchange"
  | "not-manager"
  | "unmet-dependencies"
  | "below-minimum"
  | null;

// Which of the seven mutually exclusive banners the resources tab shows, if
// any. Only the choice lives here; `Resources.tsx` still owns the wording,
// because the copy needs `routes`, the PI's name and rendered resource names.
// Extracting the choice is what makes the precedence testable - it is a
// seven-way if/else chain where "you have an exchange under review" outranks
// "you cannot manage this project", and nothing said so before.
export function resourceAlertKind({
  saved,
  error,
  errorMessages,
  previous,
  timeStatus,
  isManager,
  hasUnmetDeps,
  anyBelowMinimum,
}: {
  saved: boolean;
  error: boolean;
  errorMessages: string[];
  previous: boolean;
  timeStatus: string;
  isManager: boolean;
  hasUnmetDeps: boolean;
  anyBelowMinimum: boolean;
}): ResourceAlertKind {
  if (saved) return "submitted";

  // Sniffing the server's prose is fragile - a reword upstream silently demotes
  // this to the generic error below - but there is no error code to key off
  // yet, and the specific message is worth a lot more to the user: it tells the
  // PI exactly which profile field to fix.
  if (
    error &&
    errorMessages.length > 0 &&
    errorMessages[0].includes("PI") &&
    errorMessages[0].includes("person status Unknown")
  )
    return "pi-status-unknown";

  if (error) return "error";
  if (previous) return "pending-exchange";
  if (timeStatus == "current" && !isManager) return "not-manager";
  if (hasUnmetDeps) return "unmet-dependencies";
  if (anyBelowMinimum) return "below-minimum";
  return null;
}
