import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import style from "./AdvancedSettingsSection.module.scss";

type AdvancedSettingsSectionProps = {
  headerText?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  isEditing?: boolean;
  onEditingChange: (editing: boolean) => void;
  warningMessage?: string;
};

export const AdvancedSettingsSection = ({
  headerText,
  header,
  children,
  isEditing = false,
  onEditingChange,
  warningMessage = "",
}: AdvancedSettingsSectionProps) => {
  const altWarningBanner = (headerText as any)?.type === "label";
  return (
    <div className={style["advanced-settings"]}>
      {(headerText || header) && (
        <div className={style["header-wrapper"]}>
          {headerText}
          {header && (
            <div
              className={cn(style["header-buttons-container"], !isEditing && style["blurred"])}
            >
              {header}
            </div>
          )}
        </div>
      )}
      <div style={{ width: "100%" }}>
        {!isEditing && (
          <div
            className={altWarningBanner ? style["alt-warning-banner"] : style["warning-banner"]}
          >
            <span className={style["warning-text"]}>
              <strong>CAUTION! </strong> {warningMessage}
            </span>
            <Button variant="destructive" onClick={() => onEditingChange(true)}>
              I understand the risks
            </Button>
          </div>
        )}
        <div className={cn(style["content-container"], !isEditing && style["blurred"])}>
          {children}
        </div>
      </div>
    </div>
  );
};
