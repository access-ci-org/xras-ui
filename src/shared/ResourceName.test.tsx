import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ResourceName from "./ResourceName";
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

// parseResourceName (src/shared/helpers/utils.tsx) extracts a parenthesized
// abbreviation as the "short" name; ResourceName renders that as an <abbr>
// with the full name as its tooltip, and otherwise falls back to the plain
// full name text node.
describe("ResourceName", () => {
  it("renders the plain name when there is no parenthesized abbreviation", () => {
    render(<ResourceName resource={makeResource({ name: "Anvil" })} />);
    expect(screen.getByText(/Anvil/)).toBeInTheDocument();
    expect(screen.getByText(/Anvil/).closest("abbr")).toBeNull();
  });

  it("renders an abbreviation with the full name as its title", () => {
    render(<ResourceName resource={makeResource({ name: "Bridges-2 (Bridges2)" })} />);
    const abbr = screen.getByText("Bridges2");
    expect(abbr.tagName).toBe("ABBR");
    expect(abbr).toHaveAttribute("title", "Bridges-2 (Bridges2)");
  });

  it("shows a user guide link when a non-credit resource has a userGuideUrl", () => {
    render(
      <ResourceName
        resource={makeResource({ userGuideUrl: "https://docs.example.com/anvil" })}
      />,
    );
    const link = screen.getByTitle("Anvil User Guide");
    expect(link).toHaveAttribute("href", "https://docs.example.com/anvil");
  });

  it("hides the user guide link for credit resources even when a URL is present", () => {
    render(
      <ResourceName
        resource={makeResource({ isCredit: true, userGuideUrl: "https://docs.example.com/credits" })}
      />,
    );
    expect(screen.queryByTitle("Anvil User Guide")).not.toBeInTheDocument();
  });

  it("hides the user guide link when userGuide is explicitly disabled", () => {
    render(
      <ResourceName
        resource={makeResource({ userGuideUrl: "https://docs.example.com/anvil" })}
        userGuide={false}
      />,
    );
    expect(screen.queryByTitle("Anvil User Guide")).not.toBeInTheDocument();
  });
});
