import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SupportingGrantsSection } from "./SupportingGrantsSection";
import type { SupportingGrant, SupportingGrantAttributes, SupportingGrantsProps } from "./types";

const AGENCIES = [
  { id: 1, name: "National Science Foundation", abbr: "NSF" },
  { id: 2, name: "Department of Energy", abbr: "DOE" },
];
const FOS_TYPES = [{ id: 12, name: "Computer Science" }];

const QUESTION = "Does this request include supporting grants?";

function attributes(
  overrides: Partial<SupportingGrantAttributes> = {},
): SupportingGrantAttributes {
  return {
    id: 7,
    funding_agency_id: 1,
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

function renderSection(props: Partial<Omit<SupportingGrantsProps, "target">> = {}) {
  render(
    <SupportingGrantsSection
      fundingAgencies={AGENCIES}
      fosTypes={FOS_TYPES}
      {...props}
    />,
  );
}

// The section's own Yes/No question and each grant's "Is this grant pending?"
// render identical Yes/No labels, so address the section's by id rather than
// by accessible name.
function includeRadio(answer: "true" | "false") {
  return document.getElementById(`includeSupportingGrants-${answer}`)!;
}

function field(index: number, name: string) {
  return document.getElementById(`grants[${index}].${name}`) as HTMLInputElement | null;
}

function grantCount() {
  return document.querySelectorAll(".supporting-grant").length;
}

describe("SupportingGrantsSection", () => {
  it("asks the include question and nothing else until it is answered", () => {
    renderSection();

    expect(screen.getByText(QUESTION)).toBeInTheDocument();
    expect(grantCount()).toBe(0);
    expect(
      screen.queryByRole("button", { name: "Add another supporting grant" }),
    ).not.toBeInTheDocument();
  });

  it("opens a first grant's fields as soon as the answer is Yes", async () => {
    // Answering Yes with nothing to fill in would otherwise leave the user
    // looking at a lone "Add another supporting grant" button.
    const user = userEvent.setup();
    renderSection();

    await user.click(includeRadio("true"));

    await waitFor(() => expect(grantCount()).toBe(1));
    expect(field(0, "grantNumber")).toHaveValue("");
  });

  it("adds and removes grants", async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(includeRadio("true"));
    await waitFor(() => expect(grantCount()).toBe(1));

    await user.click(screen.getByRole("button", { name: "Add another supporting grant" }));
    await waitFor(() => expect(grantCount()).toBe(2));

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    await waitFor(() => expect(grantCount()).toBe(1));
  });

  it("keeps what was entered when the answer is switched to No and back", async () => {
    // This is the reason the form schema skips grant validation for a No
    // answer: the grants are still in form state, just unmounted, so
    // validating them would block submission with errors nobody can see.
    const user = userEvent.setup();
    renderSection();

    await user.click(includeRadio("true"));
    await waitFor(() => expect(grantCount()).toBe(1));
    await user.type(field(0, "title")!, "A Study of Studies");

    await user.click(includeRadio("false"));
    await waitFor(() => expect(grantCount()).toBe(0));

    await user.click(includeRadio("true"));
    await waitFor(() => expect(grantCount()).toBe(1));
    expect(field(0, "title")).toHaveValue("A Study of Studies");
  });

  describe("initial values", () => {
    it("renders grants passed in as Rails attributes", () => {
      renderSection({
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });

      expect(grantCount()).toBe(1);
      expect(field(0, "grantNumber")).toHaveValue("1234567");
      expect(field(0, "programOfficerEmail")).toHaveValue("ghopper@nsf.gov");
    });

    it("formats the awarded amount for display", () => {
      renderSection({
        initialGrants: [attributes({ awarded_amount: "500000" })],
        initialIncludeSupportingGrants: true,
      });

      expect(field(0, "awardedAmount")).toHaveValue("$500,000.00");
    });

    it("hydrates the funding agency and field-of-science lists into the fields", () => {
      // The lists reach GrantFields through jotai atoms hydrated by the
      // section, not as props, so a selected id resolving to its label is
      // what shows the wiring works end to end.
      renderSection({
        initialGrants: [attributes({ funding_agency_id: 2, primary_fos_type_id: 12 })],
        initialIncludeSupportingGrants: true,
      });

      expect(screen.getByText("Department of Energy")).toBeInTheDocument();
      expect(screen.getByText("Computer Science")).toBeInTheDocument();
    });

    it("keeps the question unanswered when nothing is passed in", () => {
      renderSection({ initialIncludeSupportingGrants: null });

      expect(includeRadio("true")).not.toBeChecked();
      expect(includeRadio("false")).not.toBeChecked();
    });
  });

  describe("onChange", () => {
    it("reports the current state on mount and on every edit", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderSection({ onChange });

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      expect(onChange).toHaveBeenLastCalledWith({
        grants: [],
        includeSupportingGrants: null,
      });

      await user.click(includeRadio("false"));

      await waitFor(() =>
        expect(onChange).toHaveBeenLastCalledWith({
          grants: [],
          includeSupportingGrants: false,
        }),
      );
    });

    it("reports edits to a grant's fields, not just to the answer", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderSection({
        onChange,
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });

      await user.clear(field(0, "piName")!);
      await user.type(field(0, "piName")!, "Grace Hopper");

      await waitFor(() => {
        const state = onChange.mock.lastCall![0] as { grants: SupportingGrant[] };
        expect(state.grants[0].piName).toBe("Grace Hopper");
      });
    });
  });

  describe("onValidityChange", () => {
    it("reports invalid before the question has been answered", async () => {
      // Validation runs onMount precisely so the embedding page can gate its
      // submit from the very first render, without waiting for an edit.
      const onValidityChange = vi.fn();
      renderSection({ onValidityChange });

      await waitFor(() => expect(onValidityChange).toHaveBeenLastCalledWith(false));
    });

    it("reports valid once a complete grant is present", async () => {
      const onValidityChange = vi.fn();
      renderSection({
        onValidityChange,
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });

      await waitFor(() => expect(onValidityChange).toHaveBeenLastCalledWith(true));
    });

    it("reports invalid again when a required field is emptied", async () => {
      const user = userEvent.setup();
      const onValidityChange = vi.fn();
      renderSection({
        onValidityChange,
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });
      await waitFor(() => expect(onValidityChange).toHaveBeenLastCalledWith(true));

      await user.clear(field(0, "title")!);

      await waitFor(() => expect(onValidityChange).toHaveBeenLastCalledWith(false));
    });

    it("reports valid for a No answer even with an incomplete grant behind it", async () => {
      const onValidityChange = vi.fn();
      renderSection({
        onValidityChange,
        initialGrants: [attributes({ title: "" })],
        initialIncludeSupportingGrants: false,
      });

      await waitFor(() => expect(onValidityChange).toHaveBeenLastCalledWith(true));
    });
  });

  describe("setExternalSubmit", () => {
    it("hands back null while the form is invalid", async () => {
      const setExternalSubmit = vi.fn();
      renderSection({ setExternalSubmit });

      await waitFor(() => expect(setExternalSubmit).toHaveBeenCalledWith(null));
      expect(setExternalSubmit.mock.lastCall![0]).toBeNull();
    });

    it("hands back a submit function once the form is valid, and calling it submits", async () => {
      const setExternalSubmit = vi.fn();
      const onSubmit = vi.fn();
      renderSection({
        setExternalSubmit,
        onSubmit,
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });

      await waitFor(() => expect(setExternalSubmit.mock.lastCall![0]).toBeInstanceOf(Function));

      const submit = setExternalSubmit.mock.lastCall![0] as () => Promise<void>;
      await act(async () => {
        await submit();
      });

      expect(onSubmit).toHaveBeenCalledOnce();
      expect((onSubmit.mock.lastCall![0] as SupportingGrant[])[0]).toMatchObject({
        id: 7,
        grantNumber: "1234567",
        piName: "Ada Lovelace",
      });
    });

    it("withdraws the submit function when the form goes invalid again", async () => {
      const user = userEvent.setup();
      const setExternalSubmit = vi.fn();
      renderSection({
        setExternalSubmit,
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });
      await waitFor(() => expect(setExternalSubmit.mock.lastCall![0]).toBeInstanceOf(Function));

      await user.clear(field(0, "programOfficerEmail")!);

      await waitFor(() => expect(setExternalSubmit.mock.lastCall![0]).toBeNull());
    });
  });

  it("renders no submit button of its own", () => {
    // Submission is the embedding page's job, via setExternalSubmit or the
    // form-associated custom element - a button here would submit an
    // unrelated ancestor <form>.
    renderSection({
      initialGrants: [attributes()],
      initialIncludeSupportingGrants: true,
    });

    expect(screen.queryByRole("button", { name: /^Submit$/i })).not.toBeInTheDocument();
    expect(document.querySelector('button[type="submit"]')).toBeNull();
  });
});
