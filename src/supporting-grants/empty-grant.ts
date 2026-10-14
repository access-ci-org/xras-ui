import { AWARDED_UNITS } from "./currency";
import type { SupportingGrant } from "./types";

/**
 * A blank grant in the form's own shape, for a freshly-added row in the
 * submission form (SupportingGrantsSection.tsx) or a brand-new grant in My
 * Projects (AddGrantModal.tsx).
 */
export function emptyGrant(): SupportingGrant {
  return {
    fundingAgencyId: null,
    grantNumber: "",
    isPending: null,
    title: "",
    piName: "",
    beginDate: "",
    endDate: "",
    primaryFosTypeId: null,
    awardedAmount: "",
    awardedUnits: AWARDED_UNITS,
    programOfficerName: "",
    programOfficerEmail: "",
    comments: "",
  };
}
