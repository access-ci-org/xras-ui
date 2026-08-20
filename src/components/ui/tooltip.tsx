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
>(({ className, children, sideOffset = 0, ...props }, ref) => {
  const container = usePortalContainer();
  return (
    <TooltipPrimitive.Portal container={container}>
      {/* Bootstrap's tooltip: white on black at 90% opacity, 0.25rem / 0.5rem
          of padding around a 0.875rem line, and a 0.8rem × 0.4rem arrow. The
          arrow is what leaves Bootstrap's 0.4rem gap to the trigger — Radix
          draws it outside the content box, so `sideOffset` stays at 0 rather
          than adding that distance twice. */}
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-[1080] overflow-visible rounded-md bg-black px-2 py-1 text-[14px] leading-[21px] text-white opacity-90",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow width={13} height={6} className="fill-black" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
