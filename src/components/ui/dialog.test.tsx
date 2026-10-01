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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // While the Select is open the dialog has `pointer-events: none`, so in a
  // browser a click anywhere but the listbox lands on the overlay. Radix's
  // Dialog only acts on an outside press once its click arrives, by which
  // time the Select has closed and the dialog is the top layer again - so it
  // used to close as well (see useCoveredPointerDown in dialog.tsx).
  // pointerEventsCheck is off because user-event otherwise refuses to click
  // an element under `pointer-events: none`, which is the whole situation.
  it("closes only an open Select, not the dialog, when the overlay is clicked", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Example dialog</DialogTitle>
          <DialogBody>
            <Select>
              <SelectTrigger aria-label="Agency">
                <SelectValue placeholder="Pick one" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nsf">NSF</SelectItem>
              </SelectContent>
            </Select>
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    const dialog = await screen.findByRole("dialog");
    const overlay = dialog.previousElementSibling as HTMLElement;

    await user.click(screen.getByRole("combobox", { name: "Agency" }));
    await screen.findByRole("listbox");
    await user.click(overlay);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // With nothing covering it, the same click still closes the dialog.
    await user.click(overlay);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
