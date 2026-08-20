import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppForm } from "@/components/form";
import Authors from "./Authors";
import type { PublicationFormValues } from "./PublicationForm";
import type { PublicationAuthor } from "./types";

function makeAuthor(overrides: Partial<PublicationAuthor> = {}): PublicationAuthor {
  return {
    portal_username: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    prefix: "",
    suffix: "",
    initials: "",
    affiliation: "",
    hash: {},
    ...overrides,
  };
}

function Wrapper({ authors }: { authors: PublicationAuthor[] }) {
  const form = useAppForm({
    defaultValues: {
      publication_type: "",
      title: "",
      publication_year: "",
      publication_month: "",
      doi: "",
      fields: [],
      authors,
      tags: [],
      resourceIds: [],
      resourcesNoneSelected: false,
      extraFields: {},
    } as PublicationFormValues,
    onSubmit: async () => {},
  });

  return <Authors form={form} />;
}

// Authors (src/publications/Authors.tsx) is a thin wrapper around a
// form.Field array: it derives a validity banner from the current field
// values (not from TanStack Form validation), hides the remove button on
// the first row only, and lets Add/Remove mutate the array via
// pushValue/removeValue.
describe("Authors", () => {
  it("shows the missing-author warning when the only row has no name yet", () => {
    render(<Wrapper authors={[makeAuthor()]} />);
    expect(
      screen.getByText(/You must add at least one author and each author must have a first and last name/),
    ).toBeInTheDocument();
  });

  it("hides the warning once every author row has both names filled in", () => {
    render(<Wrapper authors={[makeAuthor({ first_name: "Ada", last_name: "Lovelace" })]} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not show a remove button on the first (only) author row", () => {
    render(<Wrapper authors={[makeAuthor({ first_name: "Ada", last_name: "Lovelace" })]} />);
    expect(screen.queryByRole("button", { name: "" })).not.toBeInTheDocument();
    // Only the "Add Author" button should exist - no destructive/remove button.
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Add Author" })).toBeInTheDocument();
  });

  it("adds a new empty author row when Add Author is clicked", async () => {
    const user = userEvent.setup();
    render(<Wrapper authors={[makeAuthor({ first_name: "Ada", last_name: "Lovelace" })]} />);

    expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 author
    await user.click(screen.getByRole("button", { name: "Add Author" }));
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 authors

    // The new row is incomplete, so the warning reappears.
    expect(
      screen.getByText(/You must add at least one author and each author must have a first and last name/),
    ).toBeInTheDocument();
  });

  it("removes a non-first author row when its remove button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper
        authors={[
          makeAuthor({ first_name: "Ada", last_name: "Lovelace" }),
          makeAuthor({ first_name: "Grace", last_name: "Hopper" }),
        ]}
      />,
    );

    expect(screen.getAllByRole("row")).toHaveLength(3);
    const removeButtons = screen.getAllByRole("button", { name: "" });
    expect(removeButtons).toHaveLength(1); // only the second row gets one

    await user.click(removeButtons[0]);
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.queryByDisplayValue("Grace")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
  });
});
