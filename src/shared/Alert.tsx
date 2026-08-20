import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Bootstrap builds `.alert-*` from each theme color: text is a 60% shade, the
 * background an 80% tint and the border a 60% tint. These are those values for
 * the ACCESS palette.
 */
const colorClasses: Record<string, string> = {
  primary: "border-[#a3bdc5] bg-[#d1dee2] text-[#0a242c]",
  secondary: "border-[#ffe7ab] bg-[#fff3d5] text-[#664e12]",
  success: "border-[#a3cfbb] bg-[#d1e7dd] text-[#0a3622]",
  danger: "border-[#dc9999] bg-[#edcccc] text-[#430000]",
  warning: "border-[#ffe7ab] bg-[#fff3d5] text-[#664e12]",
  info: "border-[#99dced] bg-[#cceef6] text-[#004354]",
  light: "border-[#fdfdfe] bg-[#fefefe] text-[#636464]",
  dark: "border-[#a6a8a9] bg-[#d3d3d4] text-[#0d0e0f]",
};

type AlertProps = {
  children: React.ReactNode;
  className?: string;
  color: string;
  dismissable?: boolean;
  /** Called when the dismiss button is clicked, in addition to hiding the alert locally. */
  onDismiss?: () => void;
};

export default function Alert({
  children,
  className,
  color,
  dismissable = false,
  onDismiss,
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      role="alert"
      className={cn(
        "relative mb-4 mt-4 rounded-md border p-4",
        dismissable && "pr-9",
        colorClasses[color] ?? colorClasses.secondary,
        className,
      )}
    >
      {children}
      {dismissable && (
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="absolute right-2 top-2 text-current opacity-70 hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
