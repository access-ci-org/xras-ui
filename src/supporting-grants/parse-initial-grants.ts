import { FIELD_NAMES } from "./field-names";
import type { SupportingGrant, SupportingGrantAttributes } from "./types";

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
    (Object.keys(FIELD_NAMES) as (keyof SupportingGrant)[]).forEach(
      (field) => {
        const snakeKey = FIELD_NAMES[field];
        if (snakeKey in record) {
          result[field] = record[snakeKey];
        }
      },
    );
    return result as unknown as SupportingGrant;
  });
}
