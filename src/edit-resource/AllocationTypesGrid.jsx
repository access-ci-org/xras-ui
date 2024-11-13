import React from "react";
import PropTypes from "prop-types";
import Grid from "../shared/Grid";
import style from "./AllocationTypesGrid.module.scss";

export const AllocationGrid = React.memo(function AllocationGrid({
  columns,
  rows,
  onAddRequiredResource,
  onAddAllocationType,
}) {
  return (
    <div className={style["allocation-types-grid"]}>
      <div className={style["header-container"]}>
        <h2 className={style["header-title"]}>Allocation Types</h2>
        <div className={style["header-buttons"]}>
          <button className="btn btn-primary" onClick={onAddAllocationType}>
            <i className="fa fa-plus"></i> Add Allocation Type
          </button>
          <button className="btn btn-primary" onClick={onAddRequiredResource}>
            <i className="fa fa-plus"></i> Add Required Resource
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

AllocationGrid.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  onAddRequiredResource: PropTypes.func.isRequired,
  onAddAllocationType: PropTypes.func.isRequired,
};
