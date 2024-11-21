import React from "react";
import PropTypes from "prop-types";
import Grid from "../shared/Grid";
import style from "./ExchangeRatesGrid.module.scss";

export const ExchangeRates = React.memo(function ExchangeRatesGrid({
  columns,
  rows,
  onAddDiscountRate,
}) {
  return (
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
        classes={style["no-scroll-grid"]}
        columns={columns}
        rows={rows}
        rowClasses={Array(rows.length).fill(style["vertical-align-center"])}
      />
    </div>
  );
});

ExchangeRates.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  onAddDiscountRate: PropTypes.func.isRequired,
};
