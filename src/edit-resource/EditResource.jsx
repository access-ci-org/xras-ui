import React, { useEffect, useReducer, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from '../shared/LoadingSpinner';
import FormField from '../shared/Form/FormField';
import { SelectInput } from '../shared/SelectInput/SelectInput';
import Grid from '../shared/Grid';
import Alert from '../shared/Alert';
import style from './EditResource.module.scss';
import { resources } from './helpers/reducers';
import { setLoading, setResourceData, setSuccessMessage, updateResourceField, updateAllocation } from './helpers/actions';
import { fetchResourceData, updateResourceData } from './helpers/utils';

const ResourceForm = ({ resourceDetails, resourceTypesOptions, unitTypesOptions, dispatch }) => (
  <>
    <FormField
      label="Resource Name"
      value={resourceDetails.resource_name}
      onChange={(e) => dispatch(updateResourceField('resource_name', e.target.value))}
      className="w-100"
    />
    <FormField
      label="Resource ID"
      value={resourceDetails.resource_id}
      disabled
    />
    <FormField
      label="Dollar Value"
      value={resourceDetails.dollar_value}
      onChange={(e) => dispatch(updateResourceField('dollar_value', e.target.value))}
    />
    <FormField
      label="Description"
      type="textarea"
      value={resourceDetails.description}
      onChange={(e) => dispatch(updateResourceField('description', e.target.value))}
    />
    <SelectInput
      label="Resource Type"
      options={resourceTypesOptions}
      value={resourceDetails.resource_type_id}
      onChange={(e) => dispatch(updateResourceField('resource_type_id', e.target.value))}
    />
    <SelectInput
      label="Unit Type"
      options={unitTypesOptions}
      value={resourceDetails.unit_type_id}
      onChange={(e) => dispatch(updateResourceField('unit_type_id', e.target.value))}
    />
  </>
);

ResourceForm.propTypes = {
  resourceDetails: PropTypes.object.isRequired,
  resourceTypesOptions: PropTypes.array.isRequired,
  unitTypesOptions: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
};

const ALLOCATION_COLUMNS = [
  { key: 'display_name', name: 'Allocation Type', width: 200 },
  { key: 'allowed_actions', name: 'Allowed Actions', width: 200, type: 'select' },
  { key: 'resource_order', name: 'Resource Order', width: 100, type: 'text' },
  { key: 'comment', name: 'Comment', width: 300, type: 'input' },
];

export default function EditResource({ resourceId }) {
  const [state, dispatch] = useReducer(resources, {
    resourceData: null,
    loading: true,
    error: null,
    successMessage: { message: '', color: '' },
  });

  const handleError = async (dispatch, response, defaultMessage) => {
    let errorMessage = defaultMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || defaultMessage;
    } catch (parseError) {
      console.error('Error parsing error response:', parseError);
    }
    dispatch(setSuccessMessage(errorMessage, 'danger'));
  };

  const fetchData = useCallback(async () => {
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

  const allocationRows = useMemo(() => 
    resourceDetails?.allocation_types?.map(type => ({
      display_name: type.display_name,
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
      resource_order: type.resource_order,
      comment: {
        value: type.comment || '', 
        onChange: newValue => dispatch(updateAllocation(type, { comment: newValue })),
      },
    })) || [],
  [resourceDetails, allowedActionsOptions]);

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
        resource_order: type.resource_order,
      })),
    };

    try {
      const response = await updateResourceData(resourceId, updatedResource);
      if (response.ok) {
        const result = await response.json();
        dispatch(setSuccessMessage('Resource updated successfully!', 'success'));
        console.log(result.message);
      } else {
        await handleError(dispatch, response, 'Failed to update resource');
      }
    } catch (error) {
      console.error('Error updating resource:', error);
      dispatch(setSuccessMessage('Error updating resource. Please try again later.', 'danger'));
    }
  }, [resourceDetails, resourceId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert color="danger">{error}</Alert>;
  if (!resourceData) return <div>No resource data available.</div>;

  return (
    <div className="edit-resource">
      <h2>Edit Resource</h2>

      {successMessage.message && <Alert color={successMessage.color}>{successMessage.message}</Alert>}

      <ResourceForm
        resourceDetails={resourceDetails}
        resourceTypesOptions={resourceTypesOptions}
        unitTypesOptions={unitTypesOptions}
        dispatch={dispatch}
      />

      <h2>Allocation Types</h2>
      <Grid
        classes={style["no-scroll-grid"]}
        columns={ALLOCATION_COLUMNS}
        rows={allocationRows}
      />

      <button className="btn btn-primary" onClick={handleSubmit}>Save Resource</button>
    </div>
  );
}

EditResource.propTypes = {
  resourceId: PropTypes.number.isRequired,
};