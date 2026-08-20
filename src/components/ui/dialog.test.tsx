import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Radix's Dialog is one of twelve Radix primitives in use across the package
// (select, dialog, popover, dropdown-menu, tooltip, tabs, accordion,
// checkbox, radio-group, label, calendar/date-picker). Opening it exercises
// the jsdom polyfills registered in src/test/setup.ts (ResizeObserver,
// PointerEvent, {has,set,release}PointerCapture, scrollIntoView) - without
// them Radix throws instead of opening.
//
// No PortalContainerContext is needed: DialogPortal falls back to
// document.body when the context is unset (the default in a plain render),
// same as ShadowRootProvider passing children through when there's no shadow
// root target.
describe("Dialog (Radix interaction)", () => {
  it("opens on trigger click and shows its content", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Example dialog</DialogTitle>
          <DialogBody>Dialog body content</DialogBody>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText("Example dialog")).not.toBeInTheDocument();

    await user.click(screen.getByText("Open dialog"));

    expect(await screen.findByText("Example dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog body content")).toBeInTheDocument();
  });
});
