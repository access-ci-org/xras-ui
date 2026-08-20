import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InfoTip from "./InfoTip";

// InfoTip (src/shared/InfoTip.tsx) wraps a Radix Popover with a delayed
// "ready" flag (a 100ms setTimeout, "to allow time for target to render") and
// an optional localStorage-backed "seen it once" key. Waiting it out with
// real timers rather than vi.useFakeTimers(): Radix's positioning logic
// schedules its own timers/rAF-driven work once the popover opens, and
// fake timers deadlock against Testing Library's findBy* polling (which
// relies on real time advancing) instead of flushing it.
const past100ms = () => new Promise((resolve) => setTimeout(resolve, 110));

describe("InfoTip", () => {
  it("opens on click after the initial render delay, and closes via its own close button", async () => {
    const user = userEvent.setup();
    render(<InfoTip>Helpful hint</InfoTip>);

    expect(screen.queryByText("Helpful hint")).not.toBeInTheDocument();

    await past100ms();
    await user.click(screen.getByLabelText("Info"));
    expect(await screen.findByText("Helpful hint")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Close"));
    expect(screen.queryByText("Helpful hint")).not.toBeInTheDocument();
  });

  it("starts open when initial is true, and records the storage key once dismissed", async () => {
    const user = userEvent.setup();
    localStorage.removeItem("infotip-example");

    render(<InfoTip initial="infotip-example">Seen-once hint</InfoTip>);
    await past100ms();
    expect(await screen.findByText("Seen-once hint")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Close"));
    expect(localStorage.getItem("infotip-example")).toBe("true");
  });

  it("does not auto-open a second time once its storage key marks it seen", async () => {
    localStorage.setItem("infotip-example-2", "true");
    render(<InfoTip initial="infotip-example-2">Should stay closed</InfoTip>);
    await past100ms();
    expect(screen.queryByText("Should stay closed")).not.toBeInTheDocument();
  });

  it("renders nothing (stays closed) when visible is false regardless of initial", async () => {
    render(
      <InfoTip initial visible={false}>
        Never shown
      </InfoTip>,
    );
    await past100ms();
    expect(screen.queryByText("Never shown")).not.toBeInTheDocument();
  });
});
