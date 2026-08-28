import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { AllocationTypesSection } from "./AllocationTypesGrid";
import { isAllocationEditingAtom, resourceDataAtom } from "./atoms";
import type { ResourceData } from "./types";

// The division of labour between the two controls is the thing worth pinning
// down, because it is easy to misread the modal as a bulk per-type editor:
//
//   - "Add Required Resource" decides which resources have a *column* in the
//     grid. `requiredResourceNamesAtom` derives that column set from the union
//     of `required_resources` across the allocation types, so a checked box in
//     the modal means exactly "this resource has a column", nothing finer.
//   - The grid's own per-row checkboxes decide which allocation types actually
//     require it.
//
// The fixture is asymmetric on purpose - GPU has a column because Research
// requires it, while Startup does not - so that "has a column" and "is required
// by this type" cannot be confused for one another.
function fixture(): ResourceData {
  return {
    required_resources_available: [
      { resource_id: 1, resource_name: "CPU" },
      { resource_id: 2, resource_name: "GPU" },
    ],
    resource_state_types_available: [
      { resource_state_type_id: 1, display_resource_state_type: "Active", action_types: [] },
    ],
    resource_details: {
      resource_name: "Bridges-3",
      description: "A resource",
      resource_type_id: 1,
      unit_type_id: 1,
      min_exchange: 1,
      dollar_value: 1,
      allocation_types: [
        {
          allocation_type_id: 1,
          display_name: "Startup",
          allowed_action: { resource_state_type_id: 1 },
          comment: "",
          required_resources: [],
        },
        {
          allocation_type_id: 2,
          display_name: "Research",
          allowed_action: { resource_state_type_id: 1 },
          comment: "",
          required_resources: [{ resource_name: "GPU", required_resource_id: 2 }],
        },
      ],
    },
  };
}

function renderSection() {
  const store = createStore();
  store.set(resourceDataAtom, fixture());
  // The grid and both buttons are inert until the section is in edit mode.
  store.set(isAllocationEditingAtom, true);

  render(
    <Provider store={store}>
      <AllocationTypesSection />
    </Provider>,
  );
}

async function openModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Add Required Resource/ }));
  return screen.findByRole("dialog");
}

async function saveModal(user: ReturnType<typeof userEvent.setup>, modal: HTMLElement) {
  await user.click(within(modal).getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

// The grid's checkboxes come from `Grid`'s generic `checkbox` cell, which
// renders a bare input with no label - the resource name is in the column
// header. So a cell is addressed positionally: find the type's row, then take
// the checkbox at the offset of its "Require <name>" header. Columns are
// display_name, allowed_actions, comment, then one per required resource name
// sorted alphabetically, so the checkbox index is the header index minus 3.
function requiredCheckbox(typeName: string, resourceName: string) {
  const headers = screen.getAllByRole("columnheader").map((th) => th.textContent);
  const headerIndex = headers.indexOf(`Require ${resourceName}`);
  expect(headerIndex, `no "Require ${resourceName}" column`).toBeGreaterThan(-1);

  const row = screen
    .getAllByRole("row")
    .find((r) => within(r).queryByText(typeName) !== null)!;

  return within(row).getAllByRole("checkbox")[headerIndex - 3];
}

function columnNames() {
  return screen
    .getAllByRole("columnheader")
    .map((th) => th.textContent)
    .filter((name): name is string => !!name?.startsWith("Require "));
}

describe("AllocationTypesSection - required resource columns", () => {
  it("shows a column only for resources some allocation type requires", () => {
    renderSection();

    // CPU is in `required_resources_available` but no type requires it, so it
    // has no column. Availability is what the modal offers, not what the grid
    // shows.
    expect(columnNames()).toEqual(["Require GPU"]);
    expect(requiredCheckbox("Research", "GPU")).toBeChecked();
    expect(requiredCheckbox("Startup", "GPU")).not.toBeChecked();
  });

  it("checks a resource in the modal when it has a column, however many types require it", async () => {
    const user = userEvent.setup();
    renderSection();
    const modal = await openModal(user);

    // GPU is checked because it has a column - not because every type requires
    // it. Only Research does. This is the distinction the modal deliberately
    // does not draw, since a column either exists or it does not.
    expect(within(modal).getByLabelText("GPU")).toBeChecked();
    expect(within(modal).getByLabelText("CPU")).not.toBeChecked();
  });

  it("adds a column required by every allocation type when a resource is checked", async () => {
    const user = userEvent.setup();
    renderSection();
    const modal = await openModal(user);

    await user.click(within(modal).getByLabelText("CPU"));
    await saveModal(user, modal);

    // The column set is derived, so a new column can only appear by some type
    // requiring it. Every type is the useful starting point: the admin narrows
    // it down from the grid, which is the control that works per type.
    expect(columnNames()).toEqual(["Require CPU", "Require GPU"]);
    expect(requiredCheckbox("Startup", "CPU")).toBeChecked();
    expect(requiredCheckbox("Research", "CPU")).toBeChecked();
  });

  it("removes the column from every allocation type when a resource is unchecked", async () => {
    const user = userEvent.setup();
    renderSection();
    const modal = await openModal(user);

    await user.click(within(modal).getByLabelText("GPU"));
    expect(within(modal).getByLabelText("GPU")).not.toBeChecked();
    await saveModal(user, modal);

    expect(columnNames()).toEqual([]);
  });

  it("leaves per-type choices alone when the modal is saved untouched", async () => {
    const user = userEvent.setup();
    renderSection();
    const modal = await openModal(user);
    await saveModal(user, modal);

    // The guard that matters. GPU comes up checked, so a modal that treated its
    // checkboxes as per-type state would read an untouched save as "require GPU
    // everywhere" and silently overwrite a choice made with the grid's own
    // checkboxes. Adding and removing columns has to be the only thing it does.
    expect(columnNames()).toEqual(["Require GPU"]);
    expect(requiredCheckbox("Research", "GPU")).toBeChecked();
    expect(requiredCheckbox("Startup", "GPU")).not.toBeChecked();
  });

  it("sets a single allocation type from the grid without touching the others", async () => {
    const user = userEvent.setup();
    renderSection();

    // The per-type control, for contrast with the modal above.
    await user.click(requiredCheckbox("Startup", "GPU"));

    expect(requiredCheckbox("Startup", "GPU")).toBeChecked();
    expect(requiredCheckbox("Research", "GPU")).toBeChecked();

    await user.click(requiredCheckbox("Research", "GPU"));
    expect(requiredCheckbox("Research", "GPU")).not.toBeChecked();
    expect(requiredCheckbox("Startup", "GPU")).toBeChecked();
  });
});
