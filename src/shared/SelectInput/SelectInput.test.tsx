import type { ChangeEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectInput } from "./SelectInput";

// This is the plain native-<select> SelectInput (src/shared/SelectInput/SelectInput.tsx),
// not react-select - it forwards arbitrary <select> props and renders one
// <option> per entry, appending "additionalInfo" to the label when present
// and disabling options flagged `disabled`.
describe("SelectInput", () => {
  const options = [
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B", additionalInfo: "recommended" },
    { value: "c", label: "Option C", disabled: true },
  ];

  it("renders a label and one option per entry, appending additionalInfo", () => {
    render(<SelectInput label="Pick one" options={options} value="a" onChange={() => {}} />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option B - recommended" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option C" })).toBeDisabled();
  });

  it("fires onChange with the newly selected value", async () => {
    // The select stays controlled at value="a" (this test's harness doesn't
    // feed a selection back in), so React resets the DOM value back to "a"
    // right after the change event - reading `event.target.value` from a
    // captured event only reflects the live value at the moment of dispatch,
    // hence capturing it eagerly inside the handler rather than off the
    // (mutable, non-pooled) event object after the fact.
    const user = userEvent.setup();
    const selectedValues: string[] = [];
    const onChange = vi.fn((e: ChangeEvent<HTMLSelectElement>) => selectedValues.push(e.target.value));
    render(<SelectInput options={options} value="a" onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "b");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(selectedValues).toEqual(["b"]);
  });
});
