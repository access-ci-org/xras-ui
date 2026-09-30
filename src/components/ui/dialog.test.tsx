import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShadowRootProvider } from "@/lib/shadow-root";

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

  // Radix's own autofocus decides it has succeeded when document.activeElement
  // changes, which inside a shadow root it never does once focus is already in
  // the shadow tree - so it focused every tabbable in turn (see
  // focusFirstTabbable in dialog.tsx).
  it("focuses only the first tabbable element when opened inside a shadow root", async () => {
    const user = userEvent.setup();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadowRoot = host.attachShadow({ mode: "open" });
    const target = document.createElement("div");
    shadowRoot.appendChild(target);
    const focused: string[] = [];
    shadowRoot.addEventListener("focusin", (event) => {
      const id = (event.target as HTMLElement).id;
      if (id) focused.push(id);
    });

    render(
      <ShadowRootProvider target={target}>
        <Dialog>
          <DialogTrigger>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Example dialog</DialogTitle>
            <DialogBody>
              <input id="first" aria-label="First" />
              <input id="second" aria-label="Second" />
              <input id="third" aria-label="Third" />
            </DialogBody>
          </DialogContent>
        </Dialog>
      </ShadowRootProvider>,
      { container: target },
    );
    const shadow = within(shadowRoot as unknown as HTMLElement);

    await user.click(shadow.getByText("Open dialog"));
    await shadow.findByRole("dialog");

    expect(focused).toEqual(["first"]);
    expect(shadowRoot.activeElement).toBe(shadow.getByLabelText("First"));
  });
});
