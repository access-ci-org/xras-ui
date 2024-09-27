import React, { useEffect, useReducer, useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { SelectInput } from '../shared/SelectInput/SelectInput';
import { ResourceForm } from './ResourceForm';
import { AllocationGrid } from './AllocationTypesGrid';
import { AddRequiredResourceModal } from './AddRequiredResourceModal';
import Alert from '../shared/Alert';
import { resources } from './helpers/reducers';
import { setLoading, setResourceData, setSuccessMessage, updateResourceField, updateAllocation } from './helpers/actions';
import { fetchResourceData, updateResourceData } from './helpers/utils';
export default function EditResource({ resourceId }) {
  const [state, dispatch] = useReducer(resources, {
    resourceData: null,
    loading: true,
    error: null,
    successMessage: { message: '', color: '' },
  });

  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [selectedNewResource, setSelectedNewResource] = useState('');

  const handleError = useCallback(async (response, defaultMessage) => {
    let errorMessage = defaultMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || defaultMessage;
    } catch (parseError) {
      console.error('Error parsing error response:', parseError);
    }
    dispatch(setSuccessMessage(errorMessage, 'danger'));
  }, []);

  const fetchData = useCallback(async () => {
    // Fetche resource data based and set loading state
    dispatch(setLoading(true));
    try {
      const data = await fetchResourceData(resourceId);
      dispatch(setResourceData(data));
    } catch (error) {
      console.error('Failed to fetch resource data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch resource data. Please try again later.' });
    }
  }, [resourceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { resourceData, loading, error, successMessage } = state;
  const resourceDetails = resourceData?.resource_details;

  const allowedActionsOptions = useMemo(() => 
    resourceData?.allowed_actions_available?.map(action => ({
      value: action.resource_state_type_id,
      label: action.display_resource_state_type,
    })) || [],
  [resourceData]);

  const resourceTypesOptions = useMemo(() => 
    resourceData?.resource_types_available?.map(type => ({
      value: type.resource_type_id,
      label: type.display_resource_type,
    })) || [],
  [resourceData]);

  const unitTypesOptions = useMemo(() => 
    resourceData?.unit_types_available?.map(type => ({
      value: type.unit_type_id,
      label: type.display_unit_type,
    })) || [],
  [resourceData]);

  const availableResources = useMemo(() => 
    resourceData?.required_resources_available || [],
  [resourceData]);

  const requiredResourcesColumns = useMemo(() => {
    const requiredResources = new Set();
    resourceDetails?.allocation_types?.forEach(type => {
      type.required_resources?.forEach(resource => {
        requiredResources.add(resource.resource_name);
      });
    });

    if (selectedNewResource) {
      const newResource = availableResources.find(r => r.resource_id.toString() === selectedNewResource);
      if (newResource) {
        requiredResources.add(newResource.resource_name);
      }
    }

    return Array.from(requiredResources)
      .sort((a, b) => a.localeCompare(b)) // sorting alphabetically to prevent required resources columns moving around during re-render
      .map(resourceName => ({
        key: resourceName,
        name: resourceName,
        width: 150,
        type: 'checkbox',
      }));
  }, [resourceDetails, availableResources, selectedNewResource]);

  const ALLOCATION_COLUMNS = useMemo(() => [
    { key: 'display_name', name: 'Allocation Type', width: 200 },
    { key: 'allowed_actions', name: 'Allowed Actions', width: 200, type: 'select' },
    { key: 'comment', name: 'Comment', width: 300, type: 'input' },
    ...requiredResourcesColumns
  ], [requiredResourcesColumns]);

  const allocationRows = useMemo(() => 
    resourceDetails?.allocation_types?.map(type => ({
      display_name: type.display_name,
      allocation_type_id: type.allocation_type_id,
      allowed_actions: {
        options: allowedActionsOptions,
        value: type.allowed_action?.resource_state_type_id || '',
        onChange: newValue => dispatch(updateAllocation(type, {
          allowed_action: {
            ...type.allowed_action,
            resource_state_type_id: newValue,
          },
        })),
      },
      comment: {
        value: type.comment || '', 
        onChange: newValue => dispatch(updateAllocation(type, { comment: newValue })),
      },
      ...Object.fromEntries(requiredResourcesColumns.map(column => [
        column.key,
        {
          checked: selectedNewResource === column.key || type.required_resources?.some(resource => resource.resource_name === column.key) || false,
          onChange: (newValue) => {
            const updatedRequiredResources = newValue
              ? [...(type.required_resources || []), { 
                  resource_name: column.key, 
                  required_resource_id: resourceData.required_resources_available.find(r => r.resource_name === column.key).resource_id 
                }]
              : (type.required_resources || []).filter(resource => resource.resource_name !== column.key);
            dispatch(updateAllocation(type, { required_resources: updatedRequiredResources }));
          },
        },
      ])),
    })) || [],
  [resourceDetails, allowedActionsOptions, requiredResourcesColumns, resourceData, selectedNewResource, dispatch]);

  const handleAddRequiredResource = useCallback(() => {
    setShowAddResourceModal(true);
  }, []);

  const handleSelectNewResource = useCallback((e) => {
    const newResourceValue = e.target.value;
    setSelectedNewResource(newResourceValue);

    const newResource = availableResources.find(r => r.resource_id.toString() === newResourceValue);
    if (newResource) {
      const updatedAllocationTypes = resourceDetails.allocation_types.map(type => ({
        ...type,
        required_resources: [
          ...(type.required_resources || []),
          { 
            resource_name: newResource.resource_name, 
            required_resource_id: newResource.resource_id 
          }
        ]
      }));

      dispatch(setResourceData({
        ...resourceData,
        resource_details: {
          ...resourceDetails,
          allocation_types: updatedAllocationTypes,
        },
      }));
    }

    // setShowAddResourceModal(false);
  }, [availableResources, resourceDetails, resourceData, dispatch]);

  const handleSubmit = useCallback(async () => {
    if (!resourceDetails) return;

    const updatedResource = {
      resource_name: resourceDetails.resource_name,
      description: resourceDetails.description,
      resource_type_id: resourceDetails.resource_type_id,
      unit_type_id: resourceDetails.unit_type_id,
      allocation_types: resourceDetails.allocation_types.map(type => ({
        allocation_type_id: type.allocation_type_id,
        allowed_action: {
          resource_state_type_id: type.allowed_action.resource_state_type_id,
        },
        comment: type.comment,
      })),
    };

    const requiredResources = {};
    resourceDetails.allocation_types.forEach(type => {
      type.required_resources.forEach(resource => {
        if (!requiredResources[resource.required_resource_id]) {
          requiredResources[resource.required_resource_id] = [];
        }
        requiredResources[resource.required_resource_id].push(type.allocation_type_id);
      });
    });

    try {
      const response = await updateResourceData(resourceId, updatedResource, requiredResources);
      if (response.ok) {
        const result = await response.json();
        dispatch(setSuccessMessage(result.message || 'Resource updated successfully!', 'success'));
        console.log(result.message);
        fetchData();
      } else {
        await handleError(response, 'Failed to update resource');
      }
    } catch (error) {
      console.error('Error updating resource:', error);
      dispatch(setSuccessMessage('Error updating resource. Please try again later.', 'danger'));
    }
  }, [resourceDetails, resourceId, fetchData, handleError]);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert color="danger">{error}</Alert>;
  if (!resourceData) return <div>No resource data available.</div>;

  return (
    <div className="edit-resource">
      {successMessage.message && <Alert color={successMessage.color}>{successMessage.message}</Alert>}
      <div>
        <h2>Edit Resource</h2>
        <ResourceForm
          resourceDetails={resourceDetails}
          resourceTypesOptions={resourceTypesOptions}
          unitTypesOptions={unitTypesOptions}
          dispatch={dispatch}
        />
      </div>

      <AllocationGrid
        columns={ALLOCATION_COLUMNS}
        rows={allocationRows}
        onAddRequiredResource={handleAddRequiredResource}
      />

      <button className="btn btn-success" data-toggle="modal-backdrop" onClick={handleSubmit}>Save Resource</button>

      <AddRequiredResourceModal show={showAddResourceModal} onClose={() => setShowAddResourceModal(false)}>
        <SelectInput
            label="Select Resource"
            options={[{ value: '', label: 'Select a resource to add', disabled: true }, ...availableResources.map(r => ({ value: r.resource_id, label: r.resource_name }))]}
            value={selectedNewResource}
            onChange={handleSelectNewResource}
          />
      </AddRequiredResourceModal>
    </div>
  );
}

EditResource.propTypes = {
  resourceId: PropTypes.number.isRequired,
};