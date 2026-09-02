import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { ExchangeAutoApproval } from "./ExchangeAutoApproval";
import { resourceDataAtom } from "./atoms";
import type { ResourceData } from "./types";

function fixture(overrides: Partial<ResourceData["resource_details"]> = {}): ResourceData {
  return {
    unit_types_available: [
      { unit_type_id: 1, display_unit_type: "Service Units" },
      { unit_type_id: 2, display_unit_type: "GPU Hours" },
    ],
    resource_details: {
      resource_name: "Bridges-3",
      description: "A resource",
      resource_type_id: 1,
      unit_type_id: 2,
      min_exchange: 1,
      dollar_value: 1,
      allocation_types: [],
      auto_approve_exchange_limit: 500,
      ...overrides,
    },
  };
}

function renderSection(data: ResourceData = fixture()) {
  const store = createStore();
  store.set(resourceDataAtom, data);

  render(
    <Provider store={store}>
      <ExchangeAutoApproval />
    </Provider>,
  );

  return store;
}

describe("ExchangeAutoApproval", () => {
  it("renders the current limit, labelled with the resource's own unit type", () => {
    renderSection();

    expect(screen.getByRole("spinbutton")).toHaveValue(500);
    // The add-on names the units the limit is counted in, so it has to follow
    // `unit_type_id` rather than the first available unit type.
    expect(screen.getByText("GPU Hours")).toBeInTheDocument();
  });

  it("writes edits to resource_details.auto_approve_exchange_limit", async () => {
    const user = userEvent.setup();
    const store = renderSection();

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "25");

    expect(store.get(resourceDataAtom)?.resource_details.auto_approve_exchange_limit).toBe("25");
  });

  it("renders an empty field when the resource has no limit set", () => {
    renderSection(fixture({ auto_approve_exchange_limit: undefined }));

    expect(screen.getByRole("spinbutton")).toHaveValue(null);
  });
});
