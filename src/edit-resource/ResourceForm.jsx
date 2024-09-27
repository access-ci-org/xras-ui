import React from "react";
import PropTypes from 'prop-types';
import FormField from '../shared/Form/FormField';
import { SelectInput } from '../shared/SelectInput/SelectInput';

export const ResourceForm = React.memo(({ resourceDetails, resourceTypesOptions, unitTypesOptions, dispatch }) => (
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
        type="number"
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
  ));
  
  ResourceForm.propTypes = {
    resourceDetails: PropTypes.object.isRequired,
    resourceTypesOptions: PropTypes.array.isRequired,
    unitTypesOptions: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
  };