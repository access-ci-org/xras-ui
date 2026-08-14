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
 * Bootstrap's modal: 1.75rem below the top of the viewport rather than
 * centered in it, never taller than the viewport less that margin, and with
 * `DialogBody` as the only part that scrolls. Its paragraphs are Bootstrap's
 * (1rem / 1.5) — the ACCESS body-copy rule reproduced in `tailwind.css` styles
 * page content, and a modal is not page content.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // `mx-auto` rather than a translate: Tailwind's transform utilities
        // read `@property`-registered variables, which a Shadow Root ignores.
        "fixed inset-x-0 top-7 z-[1055] mx-auto flex max-h-[calc(100%-3.5rem)] w-[calc(100%-1rem)] max-w-[500px] flex-col overflow-hidden border border-border-translucent bg-background bg-clip-padding [&_p]:mb-4 [&_p]:text-base [&_p]:leading-normal",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
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
    <DialogPrimitive.Close className="close-button ml-auto size-4 shrink-0 border-0 p-0 outline-none focus-visible:ring-1 focus-visible:ring-ring">
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  </div>
);

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("overflow-y-auto p-4", className)} {...props} />
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
    className={cn("text-lg font-bold uppercase leading-[1.2] text-primary", className)}
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
