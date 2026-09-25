import { AWARDED_UNITS } from "./currency";
import { FIELD_NAMES } from "./field-names";
import type { SupportingGrant, SupportingGrantAttributes } from "./types";

// The only SupportingGrant fields typed as nullable; every other field is a
// plain `string` and must not be handed a `null` from Rails (whose DB
// columns allow null even though the field is otherwise always filled in).
const NULLABLE_FIELDS = new Set<keyof SupportingGrant>([
  "fundingAgencyId",
  "primaryFosTypeId",
  "isPending",
]);

/**
 * Converts snake_case grant attributes (as produced by Rails' `#to_json`)
 * into the camelCase SupportingGrant shape used internally, so callers can
 * pass a model's attributes straight through without hand-converting keys.
 */
export function parseInitialGrants(
  grants: SupportingGrantAttributes[] | null | undefined,
): SupportingGrant[] {
  if (!grants) return [];

  return grants.map((grant) => {
    const record = grant as unknown as Record<string, unknown>;
    const result = {} as Record<string, unknown>;
    // The primary key is the one field that can't go through the shared
    // FIELD_NAMES lookup: Rails has serialized it as both `id` and
    // `grant_id` depending on the endpoint, so accept either. It's always
    // written back as `id`, which is what accepts_nested_attributes_for
    // matches on to update an existing record rather than create a new
    // one. Left unset for a grant that has no key yet (a new record), so
    // buildGrantsFormData omits it instead of posting a literal "null".
    const primaryKey = record.id ?? record.grant_id;
    if (primaryKey != null) {
      result.id = primaryKey;
    }
    (Object.keys(FIELD_NAMES) as (keyof SupportingGrant)[]).forEach(
      (field) => {
        if (field === "id") return;
        const snakeKey = FIELD_NAMES[field];
        if (snakeKey in record) {
          const value = record[snakeKey];
          result[field] =
            value === null && !NULLABLE_FIELDS.has(field) ? "" : value;
        }
      },
    );
    // No control sets this, so a record that has it null (or omits it)
    // would otherwise post back an empty value.
    if (!result.awardedUnits) {
      result.awardedUnits = AWARDED_UNITS;
    }
    return result as unknown as SupportingGrant;
  });
}
