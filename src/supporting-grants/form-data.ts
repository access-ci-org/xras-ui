import { FIELD_NAMES } from "./field-names";
import type { SupportingGrant } from "./types";

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
