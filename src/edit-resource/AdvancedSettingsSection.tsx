import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ADMIN_BLURRED,
  ADMIN_BTN_DANGER,
  ADMIN_WARNING_BANNER,
  ADMIN_WARNING_BANNER_COMPACT,
  ADMIN_WARNING_BANNER_OVERLAY,
} from "../shared/adminTheme";

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
            <div className={cn(!isEditing && ADMIN_BLURRED)}>{header}</div>
          )}
        </div>
      )}
      <div className="w-full">
        {!isEditing && (
          <div
            className={cn(
              ADMIN_WARNING_BANNER,
              compactWarning ? ADMIN_WARNING_BANNER_COMPACT : ADMIN_WARNING_BANNER_OVERLAY,
            )}
          >
            <span>
              <strong>CAUTION! </strong> {warningMessage}
            </span>
            <button
              type="button"
              className={ADMIN_BTN_DANGER}
              onClick={() => onEditingChange(true)}
            >
              I understand the risks
            </button>
          </div>
        )}
        <div
          className={cn(
            "rounded-sm transition-[filter] duration-300",
            !isEditing && ADMIN_BLURRED,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
