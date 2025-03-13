import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import LoadingSpinner from "../shared/LoadingSpinner";
import { SelectInput } from "../shared/SelectInput/SelectInput";
import { ResourceForm } from "./ResourceForm";
import { AllocationGridHeader, AllocationGrid } from "./AllocationTypesGrid";
import { AddNewModal } from "./AddNewModal";
import { ExchangeRates } from "./ExchangeRates";
import Alert from "../shared/Alert";
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

  const [isDollarValueEditing, setIsDollarValueEditing] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (errors.length > 0) {
    return (
      <div>
        {errors.map((error, index) => (
          <Alert key={index} color="danger" dismissable={true}>
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
        <Alert color={successMessage.color} dismissable={true}>
          {successMessage.message}
        </Alert>
      )}
      <div>
        <h2>Resource Propeties</h2>
        <div
          style={{
            marginBottom: "0.75rem",
          }}
        >
          <p
            style={{
              margin: "0",
              fontStyle: "italic",
              fontWeight: "bold",
            }}
          >
            Any modifications to these resource properties will be applied
            globally and impact resources on other all allocations process
          </p>
        </div>
        <ResourceForm
          resourceDetails={resourceDetails}
          resourceTypesOptions={resourceTypesOptions}
          unitTypesOptions={unitTypesOptions}
          dispatch={dispatch}
          isDollarValueEditing={isDollarValueEditing}
          onDollarValueEditingChange={setIsDollarValueEditing}
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
      <AdvancedSettingsSection
        headerText={<h2>Allocation Types</h2>}
        header={
          <AllocationGridHeader
            onAddAllocationType={() =>
              isEditingAdvanced && setShowAddAllocationTypeModal(true)
            }
            onAddRequiredResource={() =>
              isEditingAdvanced && setShowAddResourceModal(true)
            }
          />
        }
        isEditing={isEditingAdvanced}
        onEditingChange={handleAdvancedEditingChange}
        warningMessage="Incorrect allocations
            process settings can make a resource unavailable for allocation.
            Please proceed with caution."
      >
        <AllocationGrid columns={allocationColumns} rows={allocationRows} />
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
