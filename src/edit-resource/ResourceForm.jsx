import React from "react";
import PropTypes from "prop-types";
import TextInput from "../shared/Form/TextInput";
import { SelectInput } from "../shared/SelectInput/SelectInput";
import { AdvancedSettingsSection } from "./AdvancedSettingsSection";
import { updateResourceField } from "./helpers/actions";

export const ResourceForm = React.memo(function ResourceForm({
  resourceDetails,
  resourceTypesOptions,
  unitTypesOptions,
  dispatch,
  isDollarValueEditing,
  onDollarValueEditingChange,
}) {
  return (
    <>
      <TextInput
        label="Resource Name"
        value={resourceDetails.resource_name}
        onChange={(e) =>
          dispatch(updateResourceField("resource_name", e.target.value))
        }
        inputClassName="span8"
      />
      <TextInput
        label="Resource ID"
        value={resourceDetails.resource_id}
        disabled
        inputClassName="span8"
      />
      <AdvancedSettingsSection
        headerText={<label>Dollar Value per SUs</label>}
        isEditing={isDollarValueEditing}
        onEditingChange={onDollarValueEditingChange}
        warningMessage="Dollar value is for reporting and should only be modified if the SU rate changes."
      >
        <TextInput
          value={resourceDetails.dollar_value}
          onChange={(e) =>
            dispatch(updateResourceField("dollar_value", e.target.value))
          }
          type="number"
          inputAddon={"$"}
          inputClassName="span4"
        />
      </AdvancedSettingsSection>
      <TextInput
        label="Allocations Description"
        type="textarea"
        value={resourceDetails.description}
        infoText={
          "Appears below the resource name in the form when making a new request, as well as under the header Allocations Description in resource catalogs"
        }
        onChange={(e) =>
          dispatch(updateResourceField("description", e.target.value))
        }
        inputClassName="span8"
      />
      <SelectInput
        label="Resource Type"
        options={resourceTypesOptions}
        value={resourceDetails.resource_type_id}
        onChange={(e) =>
          dispatch(updateResourceField("resource_type_id", e.target.value))
        }
        className="span8"
      />
      <SelectInput
        label="Unit Type"
        options={unitTypesOptions}
        value={resourceDetails.unit_type_id}
        onChange={(e) =>
          dispatch(updateResourceField("unit_type_id", e.target.value))
        }
        className="span8"
      />
    </>
  );
});

ResourceForm.propTypes = {
  resourceDetails: PropTypes.object.isRequired,
  resourceTypesOptions: PropTypes.array.isRequired,
  unitTypesOptions: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
};
