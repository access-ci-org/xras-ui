import React from "react";
import PropTypes from "prop-types";
import { updateResourceField } from "./helpers/actions";
import TextInput from "../shared/Form/TextInput.jsx";

export const ExchangeAutoApproval = React.memo(function ExchangeRatesGrid({
  resourceDetails,
  unitTypesOptions,
  dispatch,
}) {
  return (
    <div>
      <h2>Auto-approve Exchanges</h2>
      <small className="form-text help-block">
        If auto-approval is enabled, by setting this value to any number greater than 0, then any Exchange request for your resource,
        where the project has already had an approved exchange in the past,
        will be automatically approved if it is less than or equal to the resource limit specified.
      </small>
      <div>
        <TextInput
            label="Auto-approve exchanges less than or equal to:"
            value={resourceDetails.auto_approve_exchange_limit}
            onChange={(e) =>
                dispatch(updateResourceField("auto_approve_exchange_limit", e.target.value))
            }
            type="number"
            inputClassName="span4"
            inputAddon={unitTypesOptions.find(opt => opt.value == [resourceDetails.unit_type_id])?.label}

         />
      </div>
    </div>
  );
});

ExchangeAutoApproval.propTypes = {
  resourceDetails: PropTypes.object.isRequired,
  unitTypesOptions: PropTypes.array.isRequired,
};
