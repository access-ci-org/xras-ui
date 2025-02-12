import { useEffect } from "react";
import PropTypes from "prop-types";
import LoadingSpinner from "../shared/LoadingSpinner";
import { SelectInput } from "../shared/SelectInput/SelectInput";
import { ResourceForm } from "./ResourceForm";
import { AllocationGrid } from "./AllocationTypesGrid";
import { AddNewModal } from "./AddNewModal";
import { ExchangeRates } from "./ExchangeRates";
import Alert from "../shared/Alert";
import TextInput from "../shared/Form/TextInput";
import { AdvancedSettingsSection } from "./AdvancedSettingsSection";
import {
  useResourceData,
  useResourceOptions,
  useAllocationGrid,
  useResourceSubmit,
  useAllocationRowsAndColumns,
  useAdvancedSettings,
} from "./helpers/hooks";
import { useExchangeRates } from "./helpers/useExchangeRates";
import { updateResourceField } from "./helpers/actions";
export default function EditResource({
  resourceId,
  relativeUrlRoot,
  setExternalSubmit,
}) {
  const { state, dispatch, handleError, fetchData } = useResourceData(
    resourceId,
    relativeUrlRoot
  );

  const {
    isEditing: isEditingAdvanced,
    handleEditingChange: handleAdvancedEditingChange,
  } = useAdvancedSettings();

  const { resourceData, loading, errors, successMessage } = state;
  const resourceDetails = resourceData?.resource_details;
  const usesExchangeRates = resourceData?.uses_exchange_rates;

  const {
    allowedActionsOptions,
    resourceTypesOptions,
    unitTypesOptions,
    availableResources,
    availableAllocationTypes,
  } = useResourceOptions(resourceData);

  const {
    showAddResourceModal,
    setShowAddResourceModal,
    showAddAllocationTypeModal,
    setShowAddAllocationTypeModal,
    selectedNewResource,
    handleSelectNewResource,
    handleSaveResources,
    selectedNewAllocationType,
    handleSelectNewAllocationType,
    handleSaveAllocationType,
    handleAllowedActionChange,
    handleCommentChange,
    handleRequiredResourceChange,
  } = useAllocationGrid(resourceData, resourceDetails, dispatch);

  const {
    exchangeRateColumns,
    exchangeRateRows,
    handleAddDiscountRate,
    dateErrors,
  } = useExchangeRates(resourceData, dispatch);

  const handleSubmit = useResourceSubmit(
    resourceDetails,
    resourceId,
    relativeUrlRoot,
    fetchData,
    handleError,
    dispatch
  );

  // Expose handleSubmit to external Rails template script
  useEffect(() => {
    if (setExternalSubmit && dateErrors.length == 0) {
      setExternalSubmit(handleSubmit);
    } else {
      setExternalSubmit(null);
    }
  }, [handleSubmit, setExternalSubmit, dateErrors]);

  const { allocationColumns, allocationRows } = useAllocationRowsAndColumns(
    resourceDetails,
    availableResources,
    selectedNewResource,
    allowedActionsOptions,
    handleAllowedActionChange,
    handleCommentChange,
    handleRequiredResourceChange
  );

  if (loading) return <LoadingSpinner />;
  if (errors.length > 0) {
    return (
      <div>
        {errors.map((error, index) => (
          <Alert key={index} color="danger">
            {error}
          </Alert>
        ))}
      </div>
    );
  }
  if (!resourceData) return <div>No resource data available.</div>;

  return (
    <div className="edit-resource">
      {successMessage.message && (
        <Alert color={successMessage.color}>{successMessage.message}</Alert>
      )}
      <div>
        <h2>Edit Resource</h2>
        {/* Basic Settings */}
        <ResourceForm
          resourceDetails={resourceDetails}
          resourceTypesOptions={resourceTypesOptions}
          unitTypesOptions={unitTypesOptions}
          dispatch={dispatch}
        />
      </div>
      {usesExchangeRates && (
        <ExchangeRates
          columns={exchangeRateColumns}
          rows={exchangeRateRows}
          onAddDiscountRate={handleAddDiscountRate}
          dateErrors={dateErrors}
        />
      )}
      {/* Advanced Settings */}
      <AdvancedSettingsSection
        title="Advanced Settings"
        isEditing={isEditingAdvanced}
        onEditingChange={handleAdvancedEditingChange}
      >
        <div className="p-4 bg-gray-50 rounded">
          <h2>Dollar Value per SUs</h2>
          <TextInput
            label=""
            value={resourceDetails.dollar_value}
            onChange={(e) =>
              dispatch(updateResourceField("dollar_value", e.target.value))
            }
            type="number"
            inputAddon={"$"}
            inputClassName="span4"
          />
        </div>
        <AllocationGrid
          columns={allocationColumns}
          rows={allocationRows}
          onAddRequiredResource={() =>
            isEditingAdvanced && setShowAddResourceModal(true)
          }
          onAddAllocationType={() =>
            isEditingAdvanced && setShowAddAllocationTypeModal(true)
          }
        />
      </AdvancedSettingsSection>
      <AddNewModal
        show={showAddResourceModal}
        onClose={() => setShowAddResourceModal(false)}
        title="Add Required Resource"
        onSave={handleSaveResources}
        buttonText={"Save"}
      >
        <div>
          {availableResources.map((resource) => (
            <label
              key={resource.resource_id}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                style={{ margin: 0 }}
                checked={selectedNewResource.includes(resource.resource_id)}
                onChange={(e) =>
                  handleSelectNewResource(
                    resource.resource_id,
                    e.target.checked
                  )
                }
              />
              {resource.resource_name}
            </label>
          ))}
        </div>
      </AddNewModal>
      <AddNewModal
        show={showAddAllocationTypeModal}
        onClose={() => setShowAddAllocationTypeModal(false)}
        title="Add Allocation Type"
        onSave={handleSaveAllocationType}
        buttonText={"Save"}
      >
        <SelectInput
          label="Select Allocation Type"
          options={[
            {
              value: "",
              label: "Select an allocation type to add",
              disabled: true,
            },
            ...availableAllocationTypes.map((at) => ({
              value: at.allocation_type_id,
              label: at.display_name,
            })),
          ]}
          value={selectedNewAllocationType}
          onChange={handleSelectNewAllocationType}
        />
      </AddNewModal>
    </div>
  );
}

EditResource.propTypes = {
  resourceId: PropTypes.number.isRequired,
  relativeUrlRoot: PropTypes.string.isRequired,
  setExternalSubmit: PropTypes.func,
};
