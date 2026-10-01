import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";
import { usePortalContainer } from "@/lib/portal-container";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

const DialogPortal = ({
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>) => {
  const container = usePortalContainer();
  return <DialogPrimitive.Portal container={container} {...props} />;
};

/*
 * Bootstrap's stacking order (backdrop 1050, modal 1055) rather than shadcn's
 * `z-50`, which the grid's sticky header sits above. Menus, popovers and
 * tooltips portal alongside the dialog instead of inside it, so they carry
 * higher values still.
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-[1050] bg-black/50", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/*
 * react-remove-scroll, which Radix wraps around the overlay, decides whether a
 * wheel or a touch drag belongs to the dialog by asking whether one of its
 * "shards" — here the content element — contains `event.target`, from a
 * listener on `document`. Inside a shadow root the target it sees there has
 * been retargeted to the host, which no shard contains, so it reads every
 * scroll over the dialog as an outside scroll and cancels it: the body could
 * still be dragged by its scrollbar, but not scrolled by a wheel or a swipe.
 * Keeping those events inside the shadow tree settles it. Nothing is lost —
 * the page behind is held still by the `overflow: hidden` the same library
 * puts on `<body>`, and `overscroll-contain` on the body stops the scroll
 * chaining this would otherwise let through.
 */
const keepScrollInside = (event: React.SyntheticEvent) => event.stopPropagation();

/*
 * Radix's FocusScope autofocuses the dialog by focusing each tabbable element
 * in turn until `document.activeElement` changes. Inside a shadow root that
 * is always the host, so once focus is already in the shadow tree (the button
 * that opened the dialog, typically) it never changes: every tabbable gets
 * focused and blurred in sequence, and every form field in the dialog is
 * marked touched before the user has done anything - so the first change,
 * which runs the form's validation, shows "required" on all of them at once.
 * This is the same search, checking focus against the dialog's own root node
 * instead. The candidates are the ones Radix picks: tabIndex >= 0, not
 * disabled, not a hidden input, and not a link.
 */
function focusFirstTabbable(event: Event) {
  event.preventDefault();
  const content = event.currentTarget as HTMLElement;
  const root = content.getRootNode() as Document | ShadowRoot;
  for (const el of content.querySelectorAll<HTMLElement>("*")) {
    if (el.tabIndex < 0 || el.tagName === "A") continue;
    if ((el as HTMLInputElement).disabled) continue;
    if (el instanceof HTMLInputElement && el.type === "hidden") continue;
    el.focus({ preventScroll: true });
    if (root.activeElement === el) {
      if (el instanceof HTMLInputElement) el.select();
      return;
    }
  }
  content.focus({ preventScroll: true });
}

/*
 * A press that only closes a Select (or any other layer that disables outside
 * pointer events) open over the dialog must not close the dialog as well.
 * While such a layer is open, Radix gives the dialog `pointer-events: none`,
 * so the press lands on the overlay behind it. The Select closes on
 * pointerdown, but the dialog waits for the click (`deferPointerDownOutside`)
 * before deciding the press was outside it - and by then it's the top layer
 * again, so it closes too. Whether it does depends on where the pointer comes
 * back up, since that decides whether a click is fired at all, hence
 * "sometimes". Remembering, before any layer reacts, whether the dialog was
 * covered at pointerdown is enough to ignore that press.
 */
function useCoveredPointerDown() {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const coveredPointerDownRef = React.useRef<Event | null>(null);
  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      coveredPointerDownRef.current =
        contentRef.current?.style.pointerEvents === "none" ? event : null;
    };
    // Capture phase, so this runs before the covering layer's own listener
    // closes it and gives the dialog its pointer events back.
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, []);
  return {
    contentRef,
    isCoveredPointerDown: (event: Event) => event === coveredPointerDownRef.current,
  };
}

/*
 * Bootstrap's modal: 1.75rem below the top of the viewport rather than
 * centered in it, never taller than the viewport less that margin, and with
 * `DialogBody` as the only part that scrolls. Paragraphs inside it are
 * Bootstrap's (1rem / 1.5) rather than the larger ACCESS body copy — see the
 * `[role="dialog"] p` rule in `tailwind.css`.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Classes for the backdrop, whose opacity differs between the themes. */
    overlayClassName?: string;
  }
>(({ className, overlayClassName, children, ...props }, ref) => {
  const { contentRef, isCoveredPointerDown } = useCoveredPointerDown();
  const composedRef = (node: HTMLDivElement | null) => {
    contentRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        ref={composedRef}
        className={cn(
          // `mx-auto` rather than a translate: Tailwind's transform utilities
          // read `@property`-registered variables, which a Shadow Root ignores.
          "fixed inset-x-0 top-7 z-[1055] mx-auto flex max-h-[calc(100%-3.5rem)] w-[calc(100%-1rem)] max-w-[500px] flex-col overflow-hidden border border-border-translucent bg-background bg-clip-padding",
          className,
        )}
        {...props}
        onOpenAutoFocus={(event) => {
          props.onOpenAutoFocus?.(event);
          if (!event.defaultPrevented) focusFirstTabbable(event);
        }}
        onPointerDownOutside={(event) => {
          props.onPointerDownOutside?.(event);
          if (isCoveredPointerDown(event.detail.originalEvent)) event.preventDefault();
        }}
        onWheel={keepScrollInside}
        onTouchMove={keepScrollInside}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

/* The close button lives in the header, as Bootstrap's `closeButton` does. */
const DialogHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex shrink-0 items-center justify-between gap-4 border-b p-4", className)}
    {...props}
  >
    {children}
    <DialogPrimitive.Close className="close-button ml-auto size-4 shrink-0 border-0 p-0 outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:opacity-100">
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  </div>
);

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("min-h-0 grow overflow-y-auto overscroll-contain p-4", className)} {...props} />
);

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t p-4",
      className,
    )}
    {...props}
  />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("mb-0 text-lg font-bold uppercase leading-[1.2] text-primary", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
};
