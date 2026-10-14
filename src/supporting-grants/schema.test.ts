import { describe, expect, it } from "vitest";
import {
  createSupportingGrantSchema,
  createSupportingGrantsFormSchema,
} from "./schema";
import type { FundingAgency, SupportingGrant } from "./types";

// The schema is what decides whether the surrounding <form> can submit at all
// (element.tsx turns its verdict into ElementInternals.setValidity), so the
// conditional rules are the ones worth pinning: which fields stop being
// required while a grant is pending, and why answering "No" to the section's
// own question must not fail on fields the user can no longer see.

const fundingAgencies: FundingAgency[] = [
  { id: 3, name: "National Science Foundation", abbr: "NSF" },
  { id: 7, name: "Department of Energy", abbr: "DOE" },
];

const supportingGrantSchema = createSupportingGrantSchema(fundingAgencies);
const supportingGrantsFormSchema =
  createSupportingGrantsFormSchema(fundingAgencies);

function grant(overrides: Partial<SupportingGrant> = {}): SupportingGrant {
  return {
    fundingAgencyId: 3,
    grantNumber: "1234567",
    isPending: false,
    title: "A Study of Studies",
    piName: "Ada Lovelace",
    beginDate: "2024-03-01",
    endDate: "2027-02-28",
    primaryFosTypeId: 12,
    awardedAmount: "$500,000.00",
    awardedUnits: "Dollars",
    programOfficerName: "Grace Hopper",
    programOfficerEmail: "ghopper@nsf.gov",
    comments: "Related work",
    ...overrides,
  };
}

// Structural, so that both schemas can be passed in: they have different
// output types, and inferring the parameter from the default would pin it to
// the grant schema alone.
interface Parser {
  safeParse(value: unknown):
    | { success: true }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
}

// Issue paths are what the form uses to attach an error to a field, so
// assertions are on (path, message) pairs rather than just on success.
function issues(value: unknown, schema: Parser = supportingGrantSchema) {
  const result = schema.safeParse(value);
  if (result.success) return [];
  return result.error.issues.map((issue) => [issue.path.join("."), issue.message]);
}

describe("supportingGrantSchema", () => {
  it("accepts a fully filled-in awarded grant", () => {
    expect(supportingGrantSchema.safeParse(grant()).success).toBe(true);
  });

  describe("always-required fields", () => {
    it("rejects a blank or whitespace-only text field", () => {
      expect(issues(grant({ title: "" }))).toContainEqual(["title", "This field is required"]);
      expect(issues(grant({ piName: "   " }))).toContainEqual([
        "piName",
        "This field is required",
      ]);
    });

    it("rejects an unselected dropdown, whether null or an empty string", () => {
      // Both spellings occur: null from parseInitialGrants and emptyGrant(),
      // "" from a Radix select that has been cleared.
      expect(issues(grant({ fundingAgencyId: null }))).toContainEqual([
        "fundingAgencyId",
        "This field is required",
      ]);
      expect(issues(grant({ primaryFosTypeId: "" }))).toContainEqual([
        "primaryFosTypeId",
        "This field is required",
      ]);
    });

    it("accepts an id of 0, which is falsy but selected", () => {
      expect(supportingGrantSchema.safeParse(grant({ fundingAgencyId: 0 })).success).toBe(true);
    });

    it("requires the pending question to be answered", () => {
      expect(issues(grant({ isPending: null }))).toContainEqual([
        "isPending",
        "This field is required",
      ]);
    });

    it("requires the explanation", () => {
      expect(issues(grant({ comments: "" }))).toContainEqual([
        "comments",
        "This field is required",
      ]);
    });

    it("caps the grant number at 40 characters regardless of pending status", () => {
      const tooLong = "1".repeat(41);
      expect(issues(grant({ fundingAgencyId: 7, isPending: true, grantNumber: tooLong }))).toContainEqual([
        "grantNumber",
        "Grant number must be 40 characters or fewer",
      ]);
      expect(issues(grant({ fundingAgencyId: 7, grantNumber: tooLong }))).toContainEqual([
        "grantNumber",
        "Grant number must be 40 characters or fewer",
      ]);
    });
  });

  describe("fields required only once the grant is no longer pending", () => {
    it("accepts a pending grant with no dates, amount, grant number, or program officer info", () => {
      const result = supportingGrantSchema.safeParse(
        grant({
          isPending: true,
          beginDate: "",
          endDate: "",
          awardedAmount: "",
          grantNumber: "",
          programOfficerName: "",
          programOfficerEmail: "",
        }),
      );

      expect(result.success).toBe(true);
    });

    it("requires start date, end date and amount once the grant is awarded", () => {
      const found = issues(
        grant({ isPending: false, beginDate: "", endDate: "", awardedAmount: "" }),
      );

      expect(found).toContainEqual(["beginDate", "This field is required"]);
      expect(found).toContainEqual(["endDate", "This field is required"]);
      expect(found).toContainEqual(["awardedAmount", "This field is required"]);
    });

    it("requires the grant number and program officer info once the grant is awarded", () => {
      const found = issues(
        grant({ isPending: false, grantNumber: "", programOfficerName: "", programOfficerEmail: "" }),
      );

      expect(found).toContainEqual(["grantNumber", "This field is required"]);
      expect(found).toContainEqual(["programOfficerName", "This field is required"]);
      expect(found).toContainEqual(["programOfficerEmail", "This field is required"]);
    });

    it("does not require them while the question is still unanswered", () => {
      // isPending null produces exactly one issue - the unanswered question -
      // rather than burying it under more the user cannot act on yet.
      expect(
        issues(
          grant({
            isPending: null,
            beginDate: "",
            endDate: "",
            awardedAmount: "",
            grantNumber: "",
            programOfficerName: "",
            programOfficerEmail: "",
          }),
        ),
      ).toEqual([["isPending", "This field is required"]]);
    });

    it("rejects an awarded amount with no number in it", () => {
      expect(issues(grant({ awardedAmount: "half a million" }))).toContainEqual([
        "awardedAmount",
        "Enter a valid amount",
      ]);
    });

    it.each(["$999.99", "$999,999,999.01", "$1,000,000,000.00", "-5000"])(
      "rejects an awarded amount of %s, outside $1,000 to $999,999,999",
      (awardedAmount) => {
        expect(issues(grant({ awardedAmount }))).toContainEqual([
          "awardedAmount",
          "Enter an amount between $1,000 and $999,999,999",
        ]);
      },
    );

    it.each(["$1,000.00", "$999,999,999.00"])(
      "accepts an awarded amount of %s, at the ends of the range",
      (awardedAmount) => {
        expect(supportingGrantSchema.safeParse(grant({ awardedAmount })).success).toBe(true);
      },
    );

    it("accepts an amount still in its display formatting", () => {
      // Form state holds the formatted string, so this is the normal case,
      // not an edge one.
      expect(supportingGrantSchema.safeParse(grant({ awardedAmount: "$500,000.00" })).success).toBe(
        true,
      );
    });

    it("rejects a program officer email that is not an email", () => {
      expect(issues(grant({ programOfficerEmail: "ghopper" }))).toContainEqual([
        "programOfficerEmail",
        "Enter a valid email",
      ]);
    });

    it("reports a blank program officer email as missing rather than malformed", () => {
      // The email check runs only once the field isn't blank, so a blank
      // field gets the message that tells the user what to do.
      expect(issues(grant({ programOfficerEmail: "" }))).toContainEqual([
        "programOfficerEmail",
        "This field is required",
      ]);
    });
  });

  describe("NSF grant number format", () => {
    it("requires exactly 7 digits for an awarded NSF grant", () => {
      expect(
        issues(grant({ fundingAgencyId: 3, isPending: false, grantNumber: "12345" })),
      ).toContainEqual(["grantNumber", "NSF grant number must be exactly 7 digits"]);
    });

    it("accepts a 7-digit number for an awarded NSF grant", () => {
      expect(
        supportingGrantSchema.safeParse(
          grant({ fundingAgencyId: 3, isPending: false, grantNumber: "1234567" }),
        ).success,
      ).toBe(true);
    });

    it("does not apply the NSF format check to other agencies", () => {
      expect(
        supportingGrantSchema.safeParse(
          grant({ fundingAgencyId: 7, isPending: false, grantNumber: "DOE-12345" }),
        ).success,
      ).toBe(true);
    });

    it("does not apply the NSF format check while the grant is still pending", () => {
      expect(
        supportingGrantSchema.safeParse(
          grant({ fundingAgencyId: 3, isPending: true, grantNumber: "abc" }),
        ).success,
      ).toBe(true);
    });
  });

  describe("date ordering", () => {
    it("rejects an end date before the start date", () => {
      expect(issues(grant({ beginDate: "2027-02-28", endDate: "2024-03-01" }))).toContainEqual([
        "endDate",
        "End date must be on or after the start date",
      ]);
    });

    it("accepts an end date equal to the start date", () => {
      expect(
        supportingGrantSchema.safeParse(
          grant({ beginDate: "2024-03-01", endDate: "2024-03-01" }),
        ).success,
      ).toBe(true);
    });

    it("still checks the order on a pending grant that has both dates anyway", () => {
      // The dates are optional while pending, but they're not unchecked.
      expect(
        issues(grant({ isPending: true, beginDate: "2027-02-28", endDate: "2024-03-01" })),
      ).toContainEqual(["endDate", "End date must be on or after the start date"]);
    });

    it("does not complain about order when only one date is filled in", () => {
      expect(
        supportingGrantSchema.safeParse(grant({ isPending: true, endDate: "" })).success,
      ).toBe(true);
    });
  });
});

describe("supportingGrantsFormSchema", () => {
  it("requires the section's own question to be answered", () => {
    expect(
      issues({ includeSupportingGrants: null, grants: [] }, supportingGrantsFormSchema),
    ).toContainEqual(["includeSupportingGrants", "This field is required"]);
  });

  it("accepts a No answer with no grants", () => {
    expect(
      supportingGrantsFormSchema.safeParse({ includeSupportingGrants: false, grants: [] })
        .success,
    ).toBe(true);
  });

  it("ignores incomplete grants entirely once the answer is No", () => {
    // Switching to "No" keeps the grants in form state so switching back
    // doesn't lose them, but their fields are unmounted. Validating them
    // would block submission with errors the user cannot see or fix.
    expect(
      supportingGrantsFormSchema.safeParse({
        includeSupportingGrants: false,
        grants: [grant({ title: "", programOfficerEmail: "nope" })],
      }).success,
    ).toBe(true);
  });

  it("validates each grant once the answer is Yes", () => {
    expect(
      supportingGrantsFormSchema.safeParse({
        includeSupportingGrants: true,
        grants: [grant()],
      }).success,
    ).toBe(true);
  });

  it("re-paths a grant's issues under its index so they land on the right field", () => {
    const found = issues(
      {
        includeSupportingGrants: true,
        grants: [grant(), grant({ title: "", programOfficerEmail: "nope" })],
      },
      supportingGrantsFormSchema,
    );

    expect(found).toContainEqual(["grants.1.title", "This field is required"]);
    expect(found).toContainEqual(["grants.1.programOfficerEmail", "Enter a valid email"]);
    // The first grant is fine, so nothing should be attached to index 0.
    expect(found.filter(([path]) => path.startsWith("grants.0"))).toEqual([]);
  });

  it("requires at least one live grant once the answer is Yes", () => {
    expect(
      issues({ includeSupportingGrants: true, grants: [] }, supportingGrantsFormSchema),
    ).toContainEqual([
      "includeSupportingGrants",
      "Add at least one supporting grant, or answer No above.",
    ]);
  });

  it("excludes grants marked for deletion from both the live-grant count and validation", () => {
    // A soft-deleted grant is still posted back (carrying _destroy) so the
    // server issues the delete, but it's neither counted toward "at least
    // one grant" nor validated - its fields are gone from the form.
    const found = issues(
      {
        includeSupportingGrants: true,
        grants: [grant({ title: "", _destroy: true })],
      },
      supportingGrantsFormSchema,
    );

    expect(found).toContainEqual([
      "includeSupportingGrants",
      "Add at least one supporting grant, or answer No above.",
    ]);
    expect(found.filter(([path]) => path.startsWith("grants.0"))).toEqual([]);
  });

  it("does not require a second grant when a live one already exists alongside a deleted one", () => {
    expect(
      supportingGrantsFormSchema.safeParse({
        includeSupportingGrants: true,
        grants: [grant({ title: "", _destroy: true }), grant()],
      }).success,
    ).toBe(true);
  });
});
