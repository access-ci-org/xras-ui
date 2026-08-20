import { useEffect, useState, type ReactNode, type RefObject } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Info, X } from "lucide-react";
import { usePortalContainer } from "@/lib/portal-container";
import { cn } from "@/lib/utils";

type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

function parsePlacement(placement?: Placement) {
  if (!placement) return { side: "top" as const, align: "center" as const };
  const [side, alignPart] = placement.split("-") as [
    "top" | "bottom" | "left" | "right",
    "start" | "end" | undefined,
  ];
  return { side, align: alignPart ?? ("center" as const) };
}

const variantClasses = {
  dark: "border-[#212529] bg-[#212529] text-white",
  secondary: "border-secondary bg-secondary text-secondary-foreground",
};

type InfoTipProps = {
  children: ReactNode;
  initial?: boolean | string;
  maxWidth?: string;
  placement?: Placement;
  target?: RefObject<HTMLElement | null>;
  variant?: keyof typeof variantClasses;
  visible?: boolean;
};

export default function InfoTip({
  children,
  initial = false,
  maxWidth = "200px",
  placement,
  target,
  variant = "dark",
  visible = true,
}: InfoTipProps) {
  const hasKey = typeof initial === "string";
  const [show, setShow] = useState(
    hasKey ? localStorage.getItem(initial as string) != "true" : Boolean(initial),
  );
  const [ready, setReady] = useState(false);
  const container = usePortalContainer();

  useEffect(() => {
    // Hack to allow time for target to be rendered so that the tooltip is
    // positioned correctly.
    const timeout = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  const recordSeen = () => {
    if (hasKey) localStorage.setItem(initial as string, "true");
  };

  const { side, align } = parsePlacement(placement);
  const open = show && visible && ready;

  const content = (
    <PopoverPrimitive.Portal container={container ?? undefined}>
      <PopoverPrimitive.Content
        side={side}
        align={align}
        style={{ maxWidth }}
        className={cn(
          "z-[1080] rounded-md border p-2.5 text-sm font-bold",
          variantClasses[variant],
        )}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            recordSeen();
            setShow(false);
          }}
          className="float-right border-0 bg-transparent text-current"
        >
          <X className="size-4" />
        </button>
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );

  if (target)
    return (
      <PopoverPrimitive.Root open={open}>
        <PopoverPrimitive.Anchor virtualRef={target as RefObject<{ getBoundingClientRect(): DOMRect }>} />
        {content}
      </PopoverPrimitive.Root>
    );

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        recordSeen();
        setShow(nextOpen);
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        {/* Bootstrap's `.btn` box: the padding around the icon is what spaces
            it from whatever it annotates, and its 1.5 line box is what sets
            the height. */}
        <button
          type="button"
          className="inline-block border-0 bg-transparent px-3 py-1.5 leading-normal text-current"
        >
          <Info className="inline size-4 align-text-bottom" aria-label="Info" />
        </button>
      </PopoverPrimitive.Trigger>
      {content}
    </PopoverPrimitive.Root>
  );
}
