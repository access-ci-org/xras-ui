import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Grid from "@/shared/Grid";

// Grid.tsx imports "./Grid.module.scss" (one of the four *.module.scss files
// in this package). With `test.css: false` (vitest.config.ts), Vitest never
// runs sass on it - it hands back a proxy where `styles.grid` etc. resolve to
// plain strings - so this only proves jsdom + RTL + that proxy behavior, not
// real Grid styling.
describe("Grid", () => {
  it("renders rows and columns, importing a CSS module without invoking sass", () => {
    render(
      <Grid
        columns={[{ key: "name", name: "Name" }]}
        rows={[{ name: "Alpha" }, { name: "Bravo" }]}
      />,
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Bravo")).toBeInTheDocument();
  });
});
