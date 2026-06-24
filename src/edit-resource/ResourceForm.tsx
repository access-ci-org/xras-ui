import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdvancedSettingsSection } from "./AdvancedSettingsSection";
import { updateResourceField } from "./helpers/actions";

type Option = { value: string | number; label: string };

type ResourceFormProps = {
  resourceDetails: any;
  resourceTypesOptions: Option[];
  unitTypesOptions: Option[];
  dispatch: (action: any) => void;
  isDollarValueEditing?: boolean;
  onDollarValueEditingChange?: (editing: boolean) => void;
  showDollarValue?: boolean;
  showResourceId?: boolean;
  useAdvancedSettings?: boolean;
};

export const ResourceForm = memo(function ResourceForm({
  resourceDetails,
  resourceTypesOptions,
  unitTypesOptions,
  dispatch,
  isDollarValueEditing,
  onDollarValueEditingChange,
  showDollarValue = true,
  showResourceId = true,
  useAdvancedSettings = true,
}: ResourceFormProps) {
  const dollarValueLabel = "Dollar Value per SUs";
  const dollarValueInput = showDollarValue ? (
    <div className="mb-3">
      {!useAdvancedSettings && <Label>{dollarValueLabel}</Label>}
      <div className="flex items-center gap-2">
        <span>$</span>
        <Input
          type="number"
          value={resourceDetails.dollar_value}
          onChange={(e) => dispatch(updateResourceField("dollar_value", e.target.value))}
          className="max-w-xs"
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="mb-3">
        <Label>Resource Name</Label>
        <Input
          value={resourceDetails.resource_name}
          onChange={(e) => dispatch(updateResourceField("resource_name", e.target.value))}
          className="max-w-xl"
        />
      </div>

      {showResourceId && (
        <div className="mb-3">
          <Label>Resource Repository Key</Label>
          <Input value={resourceDetails.resource_repository_key} disabled className="max-w-xl" />
        </div>
      )}
      {useAdvancedSettings && showDollarValue ? (
        <AdvancedSettingsSection
          headerText={<Label>{dollarValueLabel}</Label>}
          isEditing={isDollarValueEditing}
          onEditingChange={onDollarValueEditingChange}
          warningMessage="Dollar value is for reporting and should only be modified if the SU rate changes."
        >
          {dollarValueInput}
        </AdvancedSettingsSection>
      ) : (
        dollarValueInput
      )}
      <div className="mb-3">
        <Label>Allocations Description</Label>
        <p className="text-sm text-muted-foreground">
          Appears below the resource name in the form when making a new request, as well as under
          the header Allocations Description in resource catalogs
        </p>
        <Textarea
          value={resourceDetails.description}
          onChange={(e) => dispatch(updateResourceField("description", e.target.value))}
          rows={6}
          className="max-w-xl"
        />
      </div>
      <div className="mb-3 max-w-xl">
        <Label>Resource Type</Label>
        <Select
          value={resourceDetails.resource_type_id?.toString()}
          onValueChange={(value) => dispatch(updateResourceField("resource_type_id", value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resourceTypesOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-3 max-w-xl">
        <Label>Unit Type</Label>
        <Select
          value={resourceDetails.unit_type_id?.toString()}
          onValueChange={(value) => dispatch(updateResourceField("unit_type_id", value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unitTypesOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-3">
        <Label>
          Minimum exchange amount, in{" "}
          {
            unitTypesOptions.find(
              (option) => option.value.toString() === resourceDetails.unit_type_id.toString(),
            )?.label
          }
        </Label>
        <Input
          value={resourceDetails.min_exchange}
          onChange={(e) => dispatch(updateResourceField("min_exchange", e.target.value))}
          className="max-w-xl"
        />
      </div>
    </>
  );
});
