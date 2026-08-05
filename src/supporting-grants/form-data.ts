import type { SupportingGrant } from "./types";

// Maps SupportingGrant's camelCase fields to the snake_case keys Rails'
// accepts_nested_attributes_for expects.
const FIELD_NAMES: Record<keyof SupportingGrant, string> = {
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

/**
 * Serializes supporting grants into Rails-style bracketed FormData entries,
 * e.g. `name[0][grant_number]`, matching the accepts_nested_attributes_for
 * convention the Rails backend expects.
 */
export function buildGrantsFormData(
  name: string,
  grants: SupportingGrant[],
  includeSupportingGrants: boolean | null,
  includeFieldName?: string,
): FormData {
  const formData = new FormData();

  if (includeFieldName && includeSupportingGrants !== null) {
    formData.append(includeFieldName, String(includeSupportingGrants));
  }

  grants.forEach((grant, index) => {
    (Object.keys(FIELD_NAMES) as (keyof SupportingGrant)[]).forEach(
      (field) => {
        const value = grant[field];
        if (value === undefined) return;
        formData.append(`${name}[${index}][${FIELD_NAMES[field]}]`, String(value));
      },
    );
  });

  return formData;
}
