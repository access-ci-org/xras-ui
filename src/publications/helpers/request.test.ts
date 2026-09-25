import { describe, expect, it } from "vitest";
import { defaultRoutes } from "@/shared/routes";
import { buildPublicationRequest } from "./request";
import type { PublicationFormValues } from "../PublicationForm";
import type { EditableProject } from "../types";

// Everything asserted here was previously only observable through the request
// body of a network mock, because it was built inline in `PublicationForm`'s
// `onSubmit` closure. The payload is the contract with the Rails controller, so
// it is worth pinning field by field.
function formValues(overrides: Partial<PublicationFormValues> = {}): PublicationFormValues {
  return {
    publication_type: "Journal Article",
    title: "A paper",
    publication_year: "2024",
    publication_month: "6",
    doi: "10.1234/abcd",
    peer_reviewed: true,
    fields: [{ csl_field_name: "container-title", name: "Journal", field_value: "Nature" }],
    authors: [{ first_name: "Ada", last_name: "Lovelace" }],
    tags: [],
    resourceIds: [],
    resourcesNoneSelected: false,
    extraFields: {},
    ...overrides,
  };
}

const projects: EditableProject[] = [
  { grant_number: "PHY123456", title: "A project", selected: true },
];

const build = (overrides: Partial<PublicationFormValues> = {}, token = "csrf-abc") =>
  buildPublicationRequest(formValues(overrides), token, projects, defaultRoutes);

describe("buildPublicationRequest - url and method", () => {
  it("creates a new publication when the form has no publication_id", () => {
    const { url, method } = build();

    expect(method).toBe("POST");
    expect(url).toBe(defaultRoutes.publications_path());
  });

  it("updates in place when the form has a publication_id", () => {
    const { url, method, payload } = build({ publication_id: 42 });

    expect(method).toBe("PATCH");
    expect(url).toBe(defaultRoutes.publication_path(42));
    // The id is sent in the body as well as in the path. Redundant, but the
    // controller has been reading it from the body, so it stays.
    expect(payload.publication.publication_id).toBe(42);
  });

  it("accepts a string id, since the form's value type allows one", () => {
    const { url, method } = build({ publication_id: "42" });

    expect(method).toBe("PATCH");
    expect(url).toBe(defaultRoutes.publication_path("42"));
  });
});

describe("buildPublicationRequest - payload", () => {
  it("carries the publication fields the form owns", () => {
    const { payload } = build();

    // Exhaustive on purpose (`toEqual`, not `toMatchObject`): a key that goes
    // missing here is a 500 on create, not a degraded save. That is exactly how
    // `peer_reviewed` was lost.
    expect(payload.publication).toEqual({
      publication_id: undefined,
      publication_type: "Journal Article",
      title: "A paper",
      publication_year: "2024",
      publication_month: "6",
      doi: "10.1234/abcd",
      peer_reviewed: true,
      fields: [{ csl_field_name: "container-title", name: "Journal", field_value: "Nature" }],
      access_staff_publication: false,
    });
  });

  // `publications.peer_reviewed` is `boolean NOT NULL` with no database
  // default, and `PublicationsController#publication_params` permits it, so an
  // omitted key is an unrescued `ActiveRecord::NotNullViolation` - a 500, which
  // the form reports as "There was an error saving this publication." The form
  // has no peer-review control, so all this has to do is hand back what the
  // server sent.
  it.each([true, false])("round-trips peer_reviewed = %s rather than assuming it", (flag) => {
    expect(build({ peer_reviewed: flag }).payload.publication.peer_reviewed).toBe(flag);
  });

  it("passes the resolved CSRF token straight through", () => {
    // Resolution stays in the component (atom, then the `<meta>` tag); this
    // function only has to not lose it.
    expect(build({}, "token-from-meta").payload.authenticity_token).toBe("token-from-meta");
  });

  it("passes the selected projects through unchanged", () => {
    // Project selection lives in `selectedProjectsAtom` rather than the form,
    // which is why it is a separate argument.
    expect(build().payload.projects).toEqual(projects);
  });

  it("wraps each selected resource id in an object", () => {
    expect(build({ resourceIds: [7, 9] }).payload.resources).toEqual([
      { resource_id: 7 },
      { resource_id: 9 },
    ]);
  });

  it("sends an empty resources array when nothing is selected", () => {
    expect(build().payload.resources).toEqual([]);
  });

  it("reports 'no resources' as an ACCESS staff publication", () => {
    // The "None of the above" checkbox is not a resource, it is a claim that
    // the publication belongs to ACCESS staff. Two different fields on the
    // wire, one control in the UI.
    const { payload } = build({ resourcesNoneSelected: true });

    expect(payload.publication.access_staff_publication).toBe(true);
    expect(payload.resources).toEqual([]);
  });

  it("stamps every author with order 0 and keeps their own fields", () => {
    const { payload } = build({
      authors: [
        { first_name: "Ada", last_name: "Lovelace", affiliation: "AC" },
        { first_name: "Grace", last_name: "Hopper" },
      ],
    });

    // Every author gets 0, so author order is not really transmitted - the
    // server has only the array order to go on. Pinned as-is; changing what the
    // payload means is a server-side conversation, not a refactor.
    expect(payload.authors).toEqual([
      { first_name: "Ada", last_name: "Lovelace", affiliation: "AC", order: 0 },
      { first_name: "Grace", last_name: "Hopper", order: 0 },
    ]);
  });

  it("always sends an empty tags array, even when the form carries tags", () => {
    // `Tags.tsx` exists but is mounted nowhere, so `value.tags` is populated
    // from the loaded publication and then dropped on save. Worth knowing
    // before anyone wires the tag editor up and wonders why nothing persists.
    const { payload } = build({
      tags: [{ label: "Domain", options: [{ value: 1, label: "Physics" }] }],
    });

    expect(payload.tags).toEqual([]);
  });
});

describe("buildPublicationRequest - extraFields", () => {
  it("merges unmapped DOI-lookup fields into the publication", () => {
    // `DoiSearch` collects everything the DOI response returned that it could
    // not map to a known field or a form input, and the payload forwards it so
    // the server can keep it.
    const { payload } = build({ extraFields: { issn: "0028-0836", volume: 615 } });

    expect(payload.publication.issn).toBe("0028-0836");
    expect(payload.publication.volume).toBe(615);
    expect(payload.publication.title).toBe("A paper");
  });

  it("lets the form win when an extra field collides with one of its own", () => {
    // The guard the spread ordering provides: `extraFields` is spread first, so
    // a DOI response carrying its own "title" cannot overwrite what the user
    // sees in the form.
    const { payload } = build({ extraFields: { title: "Title from the DOI lookup" } });

    expect(payload.publication.title).toBe("A paper");
  });
});
