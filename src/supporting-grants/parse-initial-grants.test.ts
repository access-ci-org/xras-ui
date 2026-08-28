import { describe, expect, it } from "vitest";
import { parseInitialGrants } from "./parse-initial-grants";
import type { SupportingGrantAttributes } from "./types";

// parseInitialGrants is the boundary between Rails and this form: it takes a
// model's `#to_json` output (snake_case, and freely null on columns the form
// treats as always-present strings) and produces the internal camelCase
// SupportingGrant. The interesting behaviour is all in what it does with
// absent and null values, since getting that wrong puts a literal `null` into
// a text input or posts an empty foreign key back.

/** A record whose serializer left one key out entirely. */
function without(
  key: string,
  overrides: Partial<SupportingGrantAttributes> = {},
): SupportingGrantAttributes {
  const copy = { ...attributes(overrides) } as Record<string, unknown>;
  delete copy[key];
  return copy as unknown as SupportingGrantAttributes;
}

function attributes(
  overrides: Partial<SupportingGrantAttributes> = {},
): SupportingGrantAttributes {
  return {
    id: 7,
    funding_agency_id: 3,
    grant_number: "1234567",
    is_pending: false,
    title: "A Study of Studies",
    pi_name: "Ada Lovelace",
    begin_date: "2024-03-01",
    end_date: "2027-02-28",
    primary_fos_type_id: 12,
    awarded_amount: "500000",
    awarded_units: "Dollars",
    program_officer_name: "Grace Hopper",
    program_officer_email: "ghopper@nsf.gov",
    comments: "Related work",
    ...overrides,
  };
}

describe("parseInitialGrants", () => {
  it("returns an empty list for null and undefined", () => {
    // `initialGrants` is optional on the props and is assigned as a plain JS
    // property on the custom element, so both spellings of "not provided"
    // reach here.
    expect(parseInitialGrants(null)).toEqual([]);
    expect(parseInitialGrants(undefined)).toEqual([]);
  });

  it("converts every snake_case key to its camelCase field", () => {
    expect(parseInitialGrants([attributes()])).toEqual([
      {
        id: 7,
        fundingAgencyId: 3,
        grantNumber: "1234567",
        isPending: false,
        title: "A Study of Studies",
        piName: "Ada Lovelace",
        beginDate: "2024-03-01",
        endDate: "2027-02-28",
        primaryFosTypeId: 12,
        awardedAmount: "500000",
        awardedUnits: "Dollars",
        programOfficerName: "Grace Hopper",
        programOfficerEmail: "ghopper@nsf.gov",
        comments: "Related work",
      },
    ]);
  });

  it("converts each grant in a list independently", () => {
    const parsed = parseInitialGrants([
      attributes({ id: 1, grant_number: "111" }),
      attributes({ id: 2, grant_number: "222" }),
    ]);

    expect(parsed.map((grant) => [grant.id, grant.grantNumber])).toEqual([
      [1, "111"],
      [2, "222"],
    ]);
  });

  describe("the primary key", () => {
    it("accepts `grant_id` when `id` is absent", () => {
      const [grant] = parseInitialGrants([{ ...without("id"), grant_id: 42 }]);

      expect(grant.id).toBe(42);
    });

    it("prefers `id` when both are present", () => {
      const [grant] = parseInitialGrants([
        attributes({ id: 7, grant_id: 42 }),
      ]);

      expect(grant.id).toBe(7);
    });

    it("leaves `id` unset for a record that has no key yet", () => {
      // Not `id: null` - buildGrantsFormData skips undefined values, so an
      // unset key is what keeps it from posting a literal "null" that
      // accepts_nested_attributes_for would try to match an existing record
      // against.
      const [grant] = parseInitialGrants([attributes({ id: null, grant_id: null })]);

      expect("id" in grant).toBe(false);
    });
  });

  describe("null handling", () => {
    it("keeps null on the three fields whose type allows it", () => {
      const [grant] = parseInitialGrants([
        attributes({
          funding_agency_id: null,
          primary_fos_type_id: null,
          is_pending: null,
        }),
      ]);

      // An unanswered radio and an unselected dropdown have to stay null:
      // "" would make the radio look answered to the schema's null check.
      expect(grant.fundingAgencyId).toBeNull();
      expect(grant.primaryFosTypeId).toBeNull();
      expect(grant.isPending).toBeNull();
    });

    it("substitutes an empty string for null on every other field", () => {
      // These are typed as plain `string`, and a null reaching a controlled
      // <input value> renders as an uncontrolled field.
      const [grant] = parseInitialGrants([
        attributes({
          title: null as unknown as string,
          program_officer_email: null as unknown as string,
          awarded_amount: null,
        }),
      ]);

      expect(grant.title).toBe("");
      expect(grant.programOfficerEmail).toBe("");
    });
  });

  it("omits a field whose snake_case key is absent entirely", () => {
    // Absent and null are treated differently on purpose: an absent key means
    // the endpoint doesn't serialize that column, and buildGrantsFormData
    // then leaves it out of the payload rather than blanking it.
    const [grant] = parseInitialGrants([without("comments")]);

    expect("comments" in grant).toBe(false);
  });

  describe("awardedUnits", () => {
    it("defaults to Dollars when the attribute is absent", () => {
      const [grant] = parseInitialGrants([without("awarded_units")]);

      expect(grant.awardedUnits).toBe("Dollars");
    });

    it("defaults to Dollars when the attribute is null or empty", () => {
      // No control sets this field, so an empty value would otherwise be
      // posted straight back and blank the column.
      expect(
        parseInitialGrants([attributes({ awarded_units: null as unknown as string })])[0]
          .awardedUnits,
      ).toBe("Dollars");
      expect(
        parseInitialGrants([attributes({ awarded_units: "" })])[0].awardedUnits,
      ).toBe("Dollars");
    });

    it("preserves a unit the record already has", () => {
      expect(
        parseInitialGrants([attributes({ awarded_units: "Euros" })])[0].awardedUnits,
      ).toBe("Euros");
    });
  });
});
