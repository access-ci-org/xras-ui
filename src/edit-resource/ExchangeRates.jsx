import React from "react";
import PropTypes from "prop-types";
import Grid from "../shared/Grid";
import style from "./ExchangeRatesGrid.module.scss";
import { updateResourceField } from "./helpers/actions";
import TextInput from "../shared/Form/TextInput.jsx";

export const ExchangeRates = React.memo(function ExchangeRatesGrid({
  columns,
  rows,
  onAddDiscountRate,
  resourceDetails,
  unitTypesOptions,
  dispatch,
  dateErrors = [],
}) {
  return (
  <>
    <div className={style["exchange-rates-grid"]}>
      <div className={style["header-container"]}>
        <h2 className={style["header-title"]}>Exchange Rates</h2>
        <div className={style["header-buttons"]}>
          <button className="btn btn-primary" onClick={onAddDiscountRate}>
            <i className="fa fa-plus"></i> Add Discount Rate
          </button>
        </div>
      </div>
      <Grid
        columns={columns}
        rows={rows}
        rowClasses={Array(rows.length).fill(style["vertical-align-center"])}
        scroll={false}
      />
      {/* Error Summary */}
      {dateErrors.length > 0 && (
        <div className={style["error-summary"]}>
          <ul>
            {dateErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
    <div>
      <h2>Auto-approve Exchanges</h2>
      <div>
        <div className="form-check">
          <input type="checkbox"
                 id="auto-approve-exchange"
                 name="auto-approve-exchange"
                 className="form-check-input"
                 checked={resourceDetails.auto_approve_exchanges === true}
                 onChange={function(e) {
                   return dispatch(updateResourceField("auto_approve_exchanges", e.target.checked))
                 }}
          />
          <label htmlFor="auto-approve-exchange"
                 className={["form-check-label", style["auto-approve-exchange-label"]].join(' ')}
          >
            Auto-approve subsequent exchanges
          </label>
        </div>
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
        <small className="form-text help-block">
          If auto-approval is enabled, then any Exchange request for your resource,
          where the project has already had an approved exchange in the past,
          will be automatically approved if it is less than or equal to the resourc limit specified.
        </small>
      </div>
    </div>
  </>
  );
});

ExchangeRates.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  onAddDiscountRate: PropTypes.func.isRequired,
  dateErrors: PropTypes.array,
  resourceDetails: PropTypes.object.isRequired,
};
