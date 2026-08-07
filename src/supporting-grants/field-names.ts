import type { SupportingGrant } from "./types";

// Single source of truth mapping SupportingGrant's camelCase fields to the
// snake_case keys Rails uses, both when reading initialGrants (from a
// model's #to_json) and when writing back nested attributes on submit
// (accepts_nested_attributes_for).
export const FIELD_NAMES: Record<keyof SupportingGrant, string> = {
  id: "id",
  fundingAgencyId: "funding_agency_id",
  grantNumber: "grant_number",
  isPending: "is_pending",
  title: "title",
  piName: "pi_name",
  beginDate: "begin_date",
  endDate: "end_date",
  primaryFosTypeId: "primary_fos_type_id",
  awardedAmount: "awarded_amount",
  awardedUnits: "awarded_units",
  programOfficerName: "program_officer_name",
  programOfficerEmail: "program_officer_email",
  comments: "comments",
  _destroy: "_destroy",
};
