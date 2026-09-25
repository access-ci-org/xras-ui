import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils";
import {
  ADMIN_ADDON,
  ADMIN_ADDON_INPUT,
  ADMIN_HELP,
  ADMIN_INPUT,
  ADMIN_INPUT_PREPEND,
  ADMIN_LABEL,
  ADMIN_SELECT,
  ADMIN_SPAN4,
  ADMIN_SPAN8,
  ADMIN_TEXTAREA,
} from "../shared/adminTheme";
import { AdvancedSettingsSection } from "./AdvancedSettingsSection";
import {
  resourceDetailsAtom,
  resourceTypesOptionsAtom,
  unitTypesOptionsAtom,
  updateResourceFieldAtom,
} from "./atoms";

type ResourceFormProps = {
  showDollarValue?: boolean;
  showResourceId?: boolean;
  useAdvancedSettings?: boolean;
};

export const ResourceForm = ({
  showDollarValue = true,
  showResourceId = true,
  useAdvancedSettings = true,
}: ResourceFormProps) => {
  const resourceDetails = useAtomValue(resourceDetailsAtom);
  const resourceTypesOptions = useAtomValue(resourceTypesOptionsAtom);
  const unitTypesOptions = useAtomValue(unitTypesOptionsAtom);
  const updateResourceField = useSetAtom(updateResourceFieldAtom);
  const [isDollarValueEditing, setIsDollarValueEditing] = useState(false);

  if (!resourceDetails) return null;

  const dollarValueLabel = "Dollar Value per SUs";
  const dollarValueInput = showDollarValue ? (
    <>
      {!useAdvancedSettings && <label className={ADMIN_LABEL}>{dollarValueLabel}</label>}
      <div className={ADMIN_INPUT_PREPEND}>
        <span className={ADMIN_ADDON}>$</span>
        <input
          type="number"
          className={cn(ADMIN_INPUT, ADMIN_SPAN4, ADMIN_ADDON_INPUT)}
          value={resourceDetails.dollar_value}
          onChange={(e) => updateResourceField({ field: "dollar_value", value: e.target.value })}
        />
      </div>
    </>
  ) : null;

  return (
    <>
      <label className={ADMIN_LABEL}>Resource Name</label>
      <input
        className={cn(ADMIN_INPUT, ADMIN_SPAN8)}
        value={resourceDetails.resource_name}
        onChange={(e) => updateResourceField({ field: "resource_name", value: e.target.value })}
      />

      {showResourceId && (
        <>
          <label className={ADMIN_LABEL}>Resource Repository Key</label>
          <input
            className={cn(ADMIN_INPUT, ADMIN_SPAN8)}
            value={resourceDetails.resource_repository_key}
            disabled
          />
        </>
      )}
      {useAdvancedSettings && showDollarValue ? (
        <AdvancedSettingsSection
          headerText={<label className={ADMIN_LABEL}>{dollarValueLabel}</label>}
          compactWarning
          isEditing={isDollarValueEditing}
          onEditingChange={setIsDollarValueEditing}
          warningMessage="Dollar value is for reporting and should only be modified if the SU rate changes."
        >
          {dollarValueInput}
        </AdvancedSettingsSection>
      ) : (
        dollarValueInput
      )}
      <label className={ADMIN_LABEL}>Allocations Description</label>
      <small className={ADMIN_HELP}>
        Appears below the resource name in the form when making a new request, as well as under the
        header Allocations Description in resource catalogs
      </small>
      <textarea
        className={cn(ADMIN_TEXTAREA, ADMIN_SPAN8)}
        value={resourceDetails.description}
        rows={6}
        onChange={(e) => updateResourceField({ field: "description", value: e.target.value })}
      />
      <div>
        <label className={ADMIN_LABEL}>Resource Type</label>
        <select
          className={cn(ADMIN_SELECT, ADMIN_SPAN8)}
          value={resourceDetails.resource_type_id ?? ""}
          onChange={(e) => updateResourceField({ field: "resource_type_id", value: e.target.value })}
        >
          {resourceTypesOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={ADMIN_LABEL}>Unit Type</label>
        <select
          className={cn(ADMIN_SELECT, ADMIN_SPAN8)}
          value={resourceDetails.unit_type_id ?? ""}
          onChange={(e) => updateResourceField({ field: "unit_type_id", value: e.target.value })}
        >
          {unitTypesOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <label className={ADMIN_LABEL}>
        Minimum exchange amount, in{" "}
        {
          unitTypesOptions.find(
            (option) => option.value.toString() === resourceDetails.unit_type_id.toString(),
          )?.label
        }
      </label>
      <input
        className={cn(ADMIN_INPUT, ADMIN_SPAN8)}
        value={resourceDetails.min_exchange}
        onChange={(e) => updateResourceField({ field: "min_exchange", value: e.target.value })}
      />
    </>
  );
};
