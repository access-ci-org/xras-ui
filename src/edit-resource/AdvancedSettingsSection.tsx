import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdvancedSettingsSectionProps = {
  headerText?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  isEditing?: boolean;
  onEditingChange: (editing: boolean) => void;
  warningMessage?: string;
  /** Renders the warning banner inline instead of overlaid, for compact single-field sections. */
  compactWarning?: boolean;
};

export const AdvancedSettingsSection = ({
  headerText,
  header,
  children,
  isEditing = false,
  onEditingChange,
  warningMessage = "",
  compactWarning = false,
}: AdvancedSettingsSectionProps) => {
  return (
    <div className="relative">
      {(headerText || header) && (
        <div className="flex items-center justify-between">
          {headerText}
          {header && (
            <div className={cn(!isEditing && "pointer-events-none blur-sm brightness-95")}>
              {header}
            </div>
          )}
        </div>
      )}
      <div className="w-full">
        {!isEditing && (
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded border border-amber-300 bg-amber-50 p-3 text-amber-900 shadow-sm",
              compactWarning
                ? "relative mb-4 max-w-3xl"
                : "absolute inset-x-4 top-1/2 z-10 -translate-y-1/2",
            )}
          >
            <span>
              <strong>CAUTION! </strong> {warningMessage}
            </span>
            <Button variant="destructive" onClick={() => onEditingChange(true)}>
              I understand the risks
            </Button>
          </div>
        )}
        <div
          className={cn(
            "transition-[filter] duration-300",
            !isEditing && "pointer-events-none blur-sm brightness-95",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
