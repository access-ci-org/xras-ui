import * as React from "react";

import { cn } from "@/lib/utils";

/*
 * Bootstrap's `.card`, with the ACCESS theme's overrides folded in: square
 * corners, a translucent black border, and a light teal header whose heading is
 * drawn small, heavy and teal rather than at its usual size. The parts are
 * named after the Bootstrap classes they stand in for, since the Rails views
 * these components sit alongside still use those names.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex min-w-0 flex-col break-words border border-border-translucent bg-background",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/* `flex`, because every card header in these components puts an `InfoTip`
   beside its title the way Bootstrap's `.card-header.d-flex` did. */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center border-b border-border-translucent bg-teal-200 px-4 py-2",
        className,
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("my-2 text-lg font-extrabold leading-[1.2] text-primary", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grow p-4", className)} {...props} />
  ),
);
CardBody.displayName = "CardBody";

export { Card, CardHeader, CardTitle, CardBody };
