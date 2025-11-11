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
        If auto-approval is enabled, then any Exchange request for your resource,
        where the project has already had an approved exchange in the past,
        will be automatically approved if it is less than or equal to the resource limit specified.
      </small>
      <div>
        <label className="checkbox">
          <input type="checkbox"
                 id="auto-approve-exchange"
                 name="auto-approve-exchange"
                 checked={resourceDetails.auto_approve_exchanges === true}
                 onChange={(e) =>
                   dispatch(updateResourceField("auto_approve_exchanges", e.target.checked))
                 }
          />
          Auto-approve subsequent exchanges
        </label>
        <TextInput
            label="Limit auto-approval to exchanges less than or equal to:"
            value={resourceDetails.auto_approve_exchange_limit}
            onChange={(e) =>
                dispatch(updateResourceField("auto_approve_exchange_limit", e.target.value))
            }
            type="number"
            inputClassName="span4"
            disabled={!resourceDetails.auto_approve_exchanges}
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
