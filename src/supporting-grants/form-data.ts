import { unformatCurrency } from "./currency";
import { FIELD_NAMES } from "./field-names";
import type { SupportingGrant } from "./types";

function serializeValue(
  field: keyof SupportingGrant,
  value: NonNullable<unknown> | null,
): string {
  // An unselected dropdown or unanswered radio has to go over the wire as
  // an empty string, the way a native <select> with no selection would.
  // String(null) sends the literal "null", which Rails' `to_i` reads as 0
  // — an invalid foreign key — rather than nil.
  if (value === null) return "";
  // awardedAmount is held in state formatted for display, so strip it back
  // to a plain number on the way out.
  if (field === "awardedAmount") return unformatCurrency(String(value));
  return String(value);
}

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
        formData.append(
          `${name}[${index}][${FIELD_NAMES[field]}]`,
          serializeValue(field, value),
        );
      },
    );
  });

  return formData;
}
