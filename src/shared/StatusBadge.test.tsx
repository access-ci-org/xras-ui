import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

// statusColors (StatusBadge.tsx) only names five statuses; everything else
// falls through to "dark". This is the only component in the package that
// exercises that fallback branch of badgeColorClasses (src/shared/helpers/badgeColors.ts).
describe("StatusBadge", () => {
  it("maps a known status to its color class", () => {
    render(<StatusBadge status="Active" />);
    const badge = screen.getByText("Active");
    expect(badge.className).toContain("bg-primary");
  });

  it("falls back to the dark color for an unmapped status", () => {
    render(<StatusBadge status="Completed" />);
    const badge = screen.getByText("Completed");
    expect(badge.className).toContain("bg-[#212529]");
  });

  it("renders the title attribute when provided", () => {
    render(<StatusBadge status="Pending" title="Awaiting review" />);
    expect(screen.getByText("Pending")).toHaveAttribute("title", "Awaiting review");
  });
});
