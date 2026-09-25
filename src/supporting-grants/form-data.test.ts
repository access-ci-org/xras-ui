import { describe, expect, it } from "vitest";
import { buildGrantsFormData } from "./form-data";
import type { SupportingGrant } from "./types";

// buildGrantsFormData produces what the form-associated custom element hands
// to ElementInternals.setFormValue, so its output *is* the request body Rails
// receives. Two details are load-bearing and neither is visible from the call
// site: the bracketed key shape accepts_nested_attributes_for matches on, and
// the fact that null and undefined mean different things on the way out.

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

function entries(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value)]),
  );
}

describe("buildGrantsFormData", () => {
  it("writes Rails-style bracketed keys under the given name", () => {
    const data = entries(buildGrantsFormData("supporting_grants", [grant()], true));

    expect(data["supporting_grants[0][grant_number]"]).toBe("1234567");
    expect(data["supporting_grants[0][program_officer_email]"]).toBe("ghopper@nsf.gov");
    expect(data["supporting_grants[0][pi_name]"]).toBe("Ada Lovelace");
  });

  it("indexes each grant separately", () => {
    const data = entries(
      buildGrantsFormData(
        "req[grants]",
        [grant({ grantNumber: "111" }), grant({ grantNumber: "222" })],
        true,
      ),
    );

    expect(data["req[grants][0][grant_number]"]).toBe("111");
    expect(data["req[grants][1][grant_number]"]).toBe("222");
  });

  it("produces no grant entries for an empty list", () => {
    expect(entries(buildGrantsFormData("supporting_grants", [], null))).toEqual({});
  });

  it("strips the awarded amount back to a plain number", () => {
    // The value is held formatted for display. Rails' `to_d` reads
    // "$500,000.00" as 0, so the formatted string can never go over the wire.
    const data = entries(buildGrantsFormData("supporting_grants", [grant()], true));

    expect(data["supporting_grants[0][awarded_amount]"]).toBe("500000");
  });

  it("sends an empty string rather than the literal \"null\" for an unset id or radio", () => {
    // String(null) is "null", which Rails' `to_i` reads as 0 - an invalid
    // foreign key rather than nil.
    const data = entries(
      buildGrantsFormData(
        "supporting_grants",
        [grant({ fundingAgencyId: null, primaryFosTypeId: null, isPending: null })],
        true,
      ),
    );

    expect(data["supporting_grants[0][funding_agency_id]"]).toBe("");
    expect(data["supporting_grants[0][primary_fos_type_id]"]).toBe("");
    expect(data["supporting_grants[0][is_pending]"]).toBe("");
  });

  it("omits a field the grant does not have at all", () => {
    // A new record has no `id`; posting an empty one would stop
    // accepts_nested_attributes_for from creating it.
    const data = buildGrantsFormData("supporting_grants", [grant()], true);

    expect(data.has("supporting_grants[0][id]")).toBe(false);
  });

  it("includes an id the grant does have, so the record is updated rather than recreated", () => {
    const data = entries(
      buildGrantsFormData("supporting_grants", [grant({ id: 7 })], true),
    );

    expect(data["supporting_grants[0][id]"]).toBe("7");
  });

  it("serializes a false boolean rather than dropping it", () => {
    // `false` is falsy but not undefined; "is this grant pending? No" has to
    // survive as "false".
    const data = entries(
      buildGrantsFormData("supporting_grants", [grant({ isPending: false })], true),
    );

    expect(data["supporting_grants[0][is_pending]"]).toBe("false");
  });

  it("marks a removed grant with _destroy", () => {
    const data = entries(
      buildGrantsFormData("supporting_grants", [grant({ id: 7, _destroy: true })], true),
    );

    expect(data["supporting_grants[0][_destroy]"]).toBe("true");
  });

  describe("the include-supporting-grants answer", () => {
    it("is appended under its own field name when one is given", () => {
      const data = entries(
        buildGrantsFormData("supporting_grants", [], true, "request[has_grants]"),
      );

      expect(data["request[has_grants]"]).toBe("true");
    });

    it("appends \"false\" for a No answer", () => {
      const data = entries(
        buildGrantsFormData("supporting_grants", [], false, "request[has_grants]"),
      );

      expect(data["request[has_grants]"]).toBe("false");
    });

    it("is omitted while the question is still unanswered", () => {
      const data = buildGrantsFormData("supporting_grants", [], null, "request[has_grants]");

      expect(data.has("request[has_grants]")).toBe(false);
    });

    it("is omitted entirely when no field name is configured", () => {
      // The element's `include-grants-field-name` attribute is optional; a
      // page that doesn't set it wants only the grants themselves.
      const data = buildGrantsFormData("supporting_grants", [], true);

      expect([...data.keys()]).toEqual([]);
    });
  });
});
