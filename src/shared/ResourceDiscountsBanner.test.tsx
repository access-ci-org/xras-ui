import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ResourceDiscountsBanner from "./ResourceDiscountsBanner";
import type { Resource } from "./types";

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    name: "Anvil",
    icon: "compute",
    unit: "SUs",
    exchangeRates: { base: { unitCost: 1 }, current: { unitCost: 1 } },
    ...overrides,
  };
}

// The banner filters for resources whose current unit cost undercuts the
// base rate, then de-dupes by provider name to build the favicon strip and
// count. singularize() (src/shared/helpers/utils.tsx) also gets exercised
// here: "resource(s)"/"resource provider(s)" both pluralize on count.
describe("ResourceDiscountsBanner", () => {
  it("renders nothing when no resource is discounted", () => {
    const { container } = render(
      <ResourceDiscountsBanner
        resources={[makeResource({ exchangeRates: { base: { unitCost: 1 }, current: { unitCost: 1 } } })]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("singularizes resource and provider when exactly one discounted resource from one provider", () => {
    render(
      <ResourceDiscountsBanner
        resources={[
          makeResource({
            exchangeRates: { base: { unitCost: 2 }, current: { unitCost: 1 } },
            resourceProvider: { name: "PSC" },
          }),
        ]}
      />,
    );
    expect(
      screen.getByText("Browse the list below to see discounts on 1 resource from 1 resource provider!"),
    ).toBeInTheDocument();
  });

  it("pluralizes and dedupes provider names across multiple discounted resources", () => {
    render(
      <ResourceDiscountsBanner
        resources={[
          makeResource({
            name: "Anvil",
            exchangeRates: { base: { unitCost: 2 }, current: { unitCost: 1 } },
            resourceProvider: { name: "PSC", favicon: "https://example.com/psc.ico" },
          }),
          makeResource({
            name: "Bridges-2",
            exchangeRates: { base: { unitCost: 2 }, current: { unitCost: 1 } },
            resourceProvider: { name: "PSC", favicon: "https://example.com/psc.ico" },
          }),
          makeResource({
            name: "Expanse",
            exchangeRates: { base: { unitCost: 2 }, current: { unitCost: 1 } },
            resourceProvider: { name: "SDSC" },
          }),
        ]}
      />,
    );
    expect(
      screen.getByText("Browse the list below to see discounts on 3 resources from 2 resource providers!"),
    ).toBeInTheDocument();
    // One favicon swatch per unique provider, titled with the provider name.
    expect(screen.getByTitle("PSC")).toBeInTheDocument();
    expect(screen.getByTitle("SDSC")).toBeInTheDocument();
  });
});
