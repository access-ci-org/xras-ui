import { useState } from "react";
import { cn } from "@/lib/utils";
import { ADMIN_ALERT, ADMIN_ALERT_SUCCESS } from "./adminTheme";

type AdminAlertProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * Bootstrap 2 only defines `.alert-success`, `.alert-info` and `.alert-error`.
   * Every other color — `danger`, in these components — fell through to the
   * bare `.alert`, which is the theme's warning style.
   */
  color?: string;
  dismissable?: boolean;
};

/**
 * xras_admin's `.alert`. The shared `Alert` is built from the ACCESS palette on
 * Bootstrap 5's metrics; this is the same markup in the Bootstrap 2 theme the
 * three admin subprojects render against — see `adminTheme`.
 */
export default function AdminAlert({
  children,
  className,
  color,
  dismissable = false,
}: AdminAlertProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      role="alert"
      className={cn(color === "success" ? ADMIN_ALERT_SUCCESS : ADMIN_ALERT, className)}
    >
      {children}
      {dismissable && (
        <button
          type="button"
          aria-label="Close"
          onClick={() => setDismissed(true)}
          /*
           * `.alert .close`: floated into the 35px of right padding the alert
           * reserves for it, and 2px above the first line of the message.
           */
          className="relative -top-[2px] -right-[21px] float-right cursor-pointer text-[20px]/[20px] font-bold text-black opacity-20 [text-shadow:0_1px_0_#fff] hover:opacity-40"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
