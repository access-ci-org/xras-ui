import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import OrgInfo from "./OrgInfo";
import type { ActiveOrg } from "./types";

// `properties` arrives off a Mapbox feature, so every value is a string and the
// credits maps are JSON - hence the stringified nested objects.
function activeOrg(userCredits: number): ActiveOrg {
  return {
    id: 1,
    type: "Feature",
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: {
      name: "Example University",
      abbr: "EU",
      userCredits: String(userCredits),
      userCreditsMap: JSON.stringify({ "2": userCredits }),
      rpCredits: "0",
      rpCreditsMap: "{}",
    },
  };
}

const organizationMap = { "1": "Example University", "2": "Example Center" };

function renderPanel(userCredits: number) {
  render(
    <OrgInfo
      activeOrg={activeOrg(userCredits)}
      creditType="used"
      organizationMap={organizationMap}
      organizationType="user"
    />,
  );
}

describe("OrgInfo", () => {
  it("abbreviates the credit total", () => {
    // The panel is a fixed-width 24rem paragraph, which is why the total is
    // abbreviated rather than spelled out. This asserts the call still asks
    // for it: the local formatNumber it used to call abbreviated
    // unconditionally, so the shared one needs `abbreviate` passed explicitly
    // or the total silently becomes "1,234,499".
    renderPanel(1_234_499);
    expect(screen.getByText("1.23M ACCESS Credits")).toBeInTheDocument();
  });

  it("does not abbreviate a total below the first tier", () => {
    renderPanel(750);
    expect(screen.getByText("750 ACCESS Credits")).toBeInTheDocument();
  });

  it("renders nothing until an organization is active", () => {
    const { container } = render(
      <OrgInfo
        activeOrg={null}
        creditType="used"
        organizationMap={organizationMap}
        organizationType="user"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
