import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";
import { usePortalContainer } from "@/lib/portal-container";

const TooltipProvider = TooltipPrimitive.Provider;

// Radix requires a `Provider` above every `Root`; carry our own so call sites
// (and shared components like `Grid`) don't each have to remember one. Nesting
// inside an explicit `TooltipProvider` is still fine — the inner one wins.
const Tooltip = ({
  delayDuration,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration}>
    <TooltipPrimitive.Root delayDuration={delayDuration} {...props} />
  </TooltipPrimitive.Provider>
);

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const container = usePortalContainer();
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-[1080] overflow-hidden border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
