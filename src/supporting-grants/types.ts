export interface FundingAgency {
  id: number | string;
  name: string;
  abbr: string;
}

export interface FosType {
  id: number | string;
  name: string;
}

export type GrantFieldName =
  | "fundingAgencyId"
  | "grantNumber"
  | "title"
  | "piName"
  | "beginDate"
  | "endDate"
  | "primaryFosTypeId"
  | "awardedAmount"
  | "programOfficerName"
  | "programOfficerEmail"
  | "comments";

export interface SupportingGrant {
  id?: number | string;
  fundingAgencyId: number | string | null;
  grantNumber: string;
  isPending: boolean | null;
  title: string;
  piName: string;
  beginDate: string;
  endDate: string;
  primaryFosTypeId: number | string | null;
  awardedAmount: string;
  awardedUnits: string;
  programOfficerName: string;
  programOfficerEmail: string;
  comments: string;
  _destroy?: boolean;
}

export interface SupportingGrantsState {
  grants: SupportingGrant[];
  includeSupportingGrants: boolean | null;
}

/**
 * Shape of a supporting grant as returned by Rails' `#to_json` (snake_case
 * keys, with the grant's primary key exposed as `grant_id`). Passed in via
 * `initialGrants` and converted to the internal camelCase `SupportingGrant`
 * shape by parseInitialGrants().
 */
export interface SupportingGrantAttributes {
  grant_id?: number | string;
  funding_agency_id: number | string | null;
  grant_number: string;
  is_pending: boolean | null;
  title: string;
  pi_name: string;
  begin_date: string;
  end_date: string;
  primary_fos_type_id: number | string | null;
  awarded_amount: string | number | null;
  awarded_units: string;
  program_officer_name: string;
  program_officer_email: string;
  comments: string;
}

export interface SupportingGrantsProps {
  target: HTMLElement;
  fundingAgencies: FundingAgency[];
  fosTypes: FosType[];
  initialGrants?: SupportingGrantAttributes[];
  initialIncludeSupportingGrants?: boolean | null;
  onSubmit?: (grants: SupportingGrant[]) => void;
  /**
   * Called with the current grants and include-supporting-grants state on
   * every change (not just on submit), so an embedding wrapper can keep an
   * external representation of the data continuously in sync.
   */
  onChange?: (state: SupportingGrantsState) => void;
  /**
   * Called whenever the form's validity changes, so an embedding page can
   * gate its own submit action on the current state.
   */
  onValidityChange?: (isValid: boolean) => void;
  /**
   * Called with a submit function whenever the form is valid, or null when
   * it isn't. An embedding page should call the provided function (instead
   * of rendering its own submit button inside this form) to validate and
   * submit; it's null whenever submission isn't currently allowed.
   */
  setExternalSubmit?: (fn: (() => Promise<void>) | null) => void;
}
