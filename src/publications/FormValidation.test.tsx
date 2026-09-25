import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { camelCaseToTitleCase, invalidFormAlert, validateForm } from "./FormValidation";

// `validateForm` is the publication form's submit-time gate: `PublicationForm`
// calls it with the publication fields ["title", "publication_year",
// "publication_month"] and the per-author fields ["first_name", "last_name"],
// and turns a false verdict into the alert `invalidFormAlert` builds. It never
// had a test, so what counts as "missing" and how the two loops interact were
// only discoverable by reading it.
const PUB_FIELDS = ["title", "publication_year", "publication_month"];
const AUTH_FIELDS = ["first_name", "last_name"];

const complete = () => ({
  title: "A paper",
  publication_year: "2024",
  publication_month: "6",
  authors: [{ first_name: "Ada", last_name: "Lovelace" }],
});

describe("validateForm", () => {
  it("passes a publication with every required field filled in", () => {
    expect(validateForm(complete(), PUB_FIELDS, AUTH_FIELDS)).toEqual({
      formValid: true,
      missingFields: [],
    });
  });

  it("names the missing publication fields in the order they were asked for", () => {
    const { formValid, missingFields } = validateForm(
      { ...complete(), publication_month: "", title: "" },
      PUB_FIELDS,
      AUTH_FIELDS,
    );

    // Order follows `requiredPubFields`, not the order of the keys on the
    // object, which is what the alert's bullet list ends up showing.
    expect(formValid).toBe(false);
    expect(missingFields).toEqual(["title", "publication_month"]);
  });

  // The test is falsiness, not presence, so anything the form can leave empty
  // counts as missing. `0` matters because the form stores year and month as
  // strings ("6", not 6) - a numeric month of 0 is not a real month, but a
  // caller passing numbers would find 0 rejected and 6 accepted.
  it.each([
    ["an empty string", ""],
    ["null", null],
    ["undefined", undefined],
    ["zero", 0],
    ["false", false],
  ])("treats %s as missing", (_label, value) => {
    expect(validateForm({ ...complete(), title: value }, PUB_FIELDS, AUTH_FIELDS)).toEqual({
      formValid: false,
      missingFields: ["title"],
    });
  });

  it("names a missing author field once however many authors are missing it", () => {
    const { missingFields } = validateForm(
      {
        ...complete(),
        authors: [
          { first_name: "", last_name: "Lovelace" },
          { first_name: "", last_name: "Babbage" },
          { first_name: "", last_name: "Hopper" },
        ],
      },
      PUB_FIELDS,
      AUTH_FIELDS,
    );

    // The author loop de-duplicates, so the alert reads "First Name" once
    // rather than three times. The trade-off is that it cannot say *which*
    // author is incomplete - by design, since the field names are all it has.
    expect(missingFields).toEqual(["first_name"]);
  });

  it("looks at every author, not just the first", () => {
    const { missingFields } = validateForm(
      {
        ...complete(),
        authors: [
          { first_name: "Ada", last_name: "Lovelace" },
          { first_name: "Grace", last_name: "" },
        ],
      },
      PUB_FIELDS,
      AUTH_FIELDS,
    );

    expect(missingFields).toEqual(["last_name"]);
  });

  it("reports publication fields before author fields", () => {
    const { missingFields } = validateForm(
      { ...complete(), title: "", authors: [{ first_name: "", last_name: "" }] },
      PUB_FIELDS,
      AUTH_FIELDS,
    );

    expect(missingFields).toEqual(["title", "first_name", "last_name"]);
  });

  it.each([
    ["an empty list", []],
    ["no authors key at all", undefined],
    ["a null authors key", null],
  ])("passes a publication with %s", (_label, authors) => {
    // `(publication.authors ?? [])` means zero authors is vacuously valid: the
    // author loop has nothing to iterate. That is not the whole story for the
    // user, because `PublicationForm` seeds the form with one empty author and
    // its Save button separately requires `authors.length > 0`, but this
    // function on its own would let an author-less publication through.
    expect(validateForm({ ...complete(), authors }, PUB_FIELDS, AUTH_FIELDS)).toEqual({
      formValid: true,
      missingFields: [],
    });
  });

  it("passes anything when nothing is required", () => {
    expect(validateForm({}, [], [])).toEqual({ formValid: true, missingFields: [] });
  });
});

describe("invalidFormAlert", () => {
  it("renders nothing when no fields are missing", () => {
    // The caller does not check first - `onSubmit` only reaches this on
    // `!formValid` - but a `null` return is what keeps a stray empty alert off
    // the screen if that ever changes.
    expect(invalidFormAlert([])).toBeNull();
  });

  it("lists each missing field as a title-cased bullet", () => {
    render(<>{invalidFormAlert(["title", "first_name"])}</>);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Please provide the following information before submitting:");
    expect(
      screen.getAllByRole("listitem").map((li) => li.textContent),
    ).toEqual(["Title", "First Name"]);
  });
});

describe("camelCaseToTitleCase", () => {
  // Despite the name, this splits on "_" and never on a case boundary. Every
  // caller passes snake_case field names, so the behaviour is right and the
  // name is wrong; the tests below pin the behaviour either way.
  it.each([
    ["title", "Title"],
    ["first_name", "First Name"],
    ["publication_month", "Publication Month"],
    ["Already Titled", "Already Titled"],
    ["", ""],
  ])("turns %o into %o", (input, expected) => {
    expect(camelCaseToTitleCase(input)).toBe(expected);
  });

  it("leaves a genuine camelCase word as one word", () => {
    expect(camelCaseToTitleCase("publicationYear")).toBe("PublicationYear");
  });
});
