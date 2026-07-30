import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const colorClasses: Record<string, string> = {
  primary: "border-primary/50 bg-primary/10 text-primary",
  secondary: "border-muted-foreground/30 bg-muted text-muted-foreground",
  success: "border-emerald-600/50 bg-emerald-50 text-emerald-800",
  danger: "border-destructive/50 bg-destructive/10 text-destructive",
  warning: "border-amber-400/60 bg-amber-50 text-amber-900",
  info: "border-sky-500/50 bg-sky-50 text-sky-900",
  light: "border-muted-foreground/20 bg-muted/50 text-foreground",
  dark: "border-foreground/30 bg-foreground/5 text-foreground",
};

type AlertProps = {
  children: React.ReactNode;
  color: string;
  dismissable?: boolean;
  /** Called when the dismiss button is clicked, in addition to hiding the alert locally. */
  onDismiss?: () => void;
};

export default function Alert({ children, color, dismissable = false, onDismiss }: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      role="alert"
      className={cn(
        "relative mt-3 border p-3",
        dismissable && "pr-9",
        colorClasses[color] ?? colorClasses.secondary,
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
