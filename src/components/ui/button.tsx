import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* Every `.btn` in the ACCESS theme resolves to one hover/focus/active
   treatment regardless of color: a white fill with the body text color for
   both the border and the label. Spelled out per variant rather than in the
   base, because Tailwind's output order — not the order of the class string —
   decides which of two conflicting `hover:bg-*` utilities wins. */
const btnHover =
  "hover:border-foreground hover:bg-white hover:text-foreground focus-visible:border-foreground focus-visible:bg-white focus-visible:text-foreground active:border-foreground active:bg-white active:text-foreground";

/* The focus glow, `0 0 0 .25rem rgba(…, .5)`, into which Bootstrap mixes the
   button's own color — hence per variant rather than in the base. `outline` and
   `ghost` get none: they set no `--bs-btn-focus-shadow-rgb` in the original, so
   its shadow declaration is invalid there and nothing is painted. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-none border border-transparent font-semibold uppercase leading-normal no-underline transition-colors disabled:pointer-events-none disabled:opacity-65 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground focus-visible:ring-4 focus-visible:ring-[rgba(60,116,132,0.5)] ${btnHover}`,
        secondary: `bg-secondary text-secondary-foreground focus-visible:ring-4 focus-visible:ring-[rgba(216,167,38,0.5)] ${btnHover}`,
        destructive: `bg-destructive text-destructive-foreground focus-visible:ring-4 focus-visible:ring-[rgba(180,38,38,0.5)] ${btnHover}`,
        outline: `border-input bg-background ${btnHover}`,
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "px-4 py-[9px]",
        /* `text-[14px] leading-[21px]` rather than `text-sm`: that pairs a
           line-height of its own, and an arbitrary font size resets the
           inherited one, so both halves of Bootstrap's `.btn-sm` metrics
           (14px / 1.5) have to be spelled out. */
        sm: "px-3 py-[7px] text-[14px] leading-[21px]",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
